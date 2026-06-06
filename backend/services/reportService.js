import pool from '../config/db.js';
import puppeteer from 'puppeteer';

/**
 * Reports Service
 */

// Helper to obtain vendor id mapping from user email
async function getVendorIdByEmail(email) {
  const [rows] = await pool.execute('SELECT id FROM vendors WHERE email = ? LIMIT 1', [email]);
  return rows[0]?.id || null;
}

/**
 * GET Procurement Summary KPIs
 */
export async function getSummary(user) {
  if (user.role === 'vendor') {
    const vendorId = await getVendorIdByEmail(user.email);
    if (!vendorId) {
      return {
        total_vendors: 0, total_rfqs: 0, total_quotations: 0,
        total_purchase_orders: 0, total_invoices: 0, total_spend: 0
      };
    }

    const [
      [rfqRows],
      [quotationRows],
      [poRows],
      [invoiceRows],
      [totalSpendRows]
    ] = await Promise.all([
      pool.execute('SELECT COUNT(*) AS count FROM rfq_vendors WHERE vendor_id = ?', [vendorId]),
      pool.execute('SELECT COUNT(*) AS count FROM quotations WHERE vendor_id = ?', [vendorId]),
      pool.execute(
        `SELECT COUNT(DISTINCT po.id) AS count FROM purchase_orders po 
         JOIN approvals a ON po.approval_id = a.id 
         JOIN quotations q ON a.quotation_id = q.id 
         WHERE q.vendor_id = ?`,
        [vendorId]
      ),
      pool.execute(
        `SELECT COUNT(DISTINCT i.id) AS count FROM invoices i 
         JOIN purchase_orders po ON i.po_id = po.id 
         JOIN approvals a ON po.approval_id = a.id 
         JOIN quotations q ON a.quotation_id = q.id 
         WHERE q.vendor_id = ?`,
        [vendorId]
      ),
      pool.execute(
        `SELECT COALESCE(SUM(i.grand_total), 0) AS total FROM invoices i 
         JOIN purchase_orders po ON i.po_id = po.id 
         JOIN approvals a ON po.approval_id = a.id 
         JOIN quotations q ON a.quotation_id = q.id 
         WHERE q.vendor_id = ? AND i.status != 'generated'`,
        [vendorId]
      )
    ]);

    return {
      total_vendors: 1,
      total_rfqs: rfqRows[0].count,
      total_quotations: quotationRows[0].count,
      total_purchase_orders: poRows[0].count,
      total_invoices: invoiceRows[0].count,
      total_spend: parseFloat(totalSpendRows[0].total) || 0
    };
  }

  // Admin / Officer / Manager full stats
  const [
    [vendorRows],
    [rfqRows],
    [quotationRows],
    [poRows],
    [invoiceRows],
    [totalSpendRows]
  ] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS count FROM vendors'),
    pool.execute('SELECT COUNT(*) AS count FROM rfqs'),
    pool.execute('SELECT COUNT(*) AS count FROM quotations'),
    pool.execute('SELECT COUNT(*) AS count FROM purchase_orders'),
    pool.execute('SELECT COUNT(*) AS count FROM invoices'),
    pool.execute("SELECT COALESCE(SUM(grand_total), 0) AS total FROM invoices WHERE status != 'generated'")
  ]);

  return {
    total_vendors: vendorRows[0].count,
    total_rfqs: rfqRows[0].count,
    total_quotations: quotationRows[0].count,
    total_purchase_orders: poRows[0].count,
    total_invoices: invoiceRows[0].count,
    total_spend: parseFloat(totalSpendRows[0].total) || 0
  };
}

/**
 * GET Vendor Performance Metrics
 */
export async function getVendors(user) {
  let conditions = '';
  const params = [];

  if (user.role === 'vendor') {
    const vendorId = await getVendorIdByEmail(user.email);
    if (!vendorId) return [];
    conditions = 'WHERE v.id = ?';
    params.push(vendorId);
  }

  const sql = `
    SELECT 
      v.id AS vendor_id,
      v.name AS vendor_name,
      COALESCE(vc.name, 'Uncategorized') AS category_name,
      (SELECT COUNT(*) FROM rfq_vendors WHERE vendor_id = v.id) AS rfqs_assigned,
      (SELECT COUNT(*) FROM quotations WHERE vendor_id = v.id) AS quotations_submitted,
      (
        SELECT COUNT(DISTINCT po.id) FROM purchase_orders po 
        JOIN approvals a ON po.approval_id = a.id 
        JOIN quotations q ON a.quotation_id = q.id 
        WHERE q.vendor_id = v.id
      ) AS pos_received,
      (
        SELECT COALESCE(SUM(i.grand_total), 0) FROM invoices i 
        JOIN purchase_orders po ON i.po_id = po.id 
        JOIN approvals a ON po.approval_id = a.id 
        JOIN quotations q ON a.quotation_id = q.id 
        WHERE q.vendor_id = v.id AND i.status != 'generated'
      ) AS total_value,
      (SELECT COUNT(*) FROM quotations WHERE vendor_id = v.id AND status = 'selected') AS quotes_selected
    FROM vendors v
    LEFT JOIN vendor_categories vc ON v.category_id = vc.id
    ${conditions}
    ORDER BY total_value DESC
  `;

  const [rows] = await pool.execute(sql, params);

  return rows.map(r => {
    const submitted = r.quotations_submitted || 0;
    const selected = r.quotes_selected || 0;
    const winRate = submitted > 0 ? parseFloat(((selected / submitted) * 100).toFixed(1)) : 0;
    
    return {
      vendor_id: r.vendor_id,
      vendor_name: r.vendor_name,
      category_name: r.category_name,
      rfqs_assigned: r.rfqs_assigned,
      quotations_submitted: submitted,
      pos_received: r.pos_received,
      total_value: parseFloat(r.total_value) || 0,
      win_rate: winRate
    };
  });
}

/**
 * GET Spending Analysis (Monthly breakdown)
 */
export async function getSpending(user, year = new Date().getFullYear()) {
  const selectedYear = parseInt(year) || new Date().getFullYear();
  let conditions = 'WHERE YEAR(i.issued_at) = ?';
  const params = [selectedYear];

  if (user.role === 'vendor') {
    const vendorId = await getVendorIdByEmail(user.email);
    if (!vendorId) return [];
    conditions += ' AND q.vendor_id = ?';
    params.push(vendorId);
  }

  // Monthly invoice spending & PO count
  const spendSql = `
    SELECT 
      MONTH(i.issued_at) AS month_num,
      COALESCE(SUM(i.grand_total), 0) AS total_spend,
      COUNT(DISTINCT po.id) AS po_count
    FROM invoices i
    JOIN purchase_orders po ON i.po_id = po.id
    JOIN approvals a ON po.approval_id = a.id
    JOIN quotations q ON a.quotation_id = q.id
    ${conditions}
    GROUP BY MONTH(i.issued_at)
  `;
  const [spendRows] = await pool.execute(spendSql, params);

  // Monthly RFQs assigned (or total created RFQs for admin/officer)
  let rfqSql = `
    SELECT MONTH(created_at) AS month_num, COUNT(*) AS rfq_count 
    FROM rfqs 
    WHERE YEAR(created_at) = ? 
    GROUP BY MONTH(created_at)
  `;
  let rfqParams = [selectedYear];

  if (user.role === 'vendor') {
    const vendorId = await getVendorIdByEmail(user.email);
    rfqSql = `
      SELECT MONTH(r.created_at) AS month_num, COUNT(DISTINCT r.id) AS rfq_count 
      FROM rfqs r
      JOIN rfq_vendors rv ON r.id = rv.rfq_id
      WHERE YEAR(r.created_at) = ? AND rv.vendor_id = ?
      GROUP BY MONTH(r.created_at)
    `;
    rfqParams = [selectedYear, vendorId];
  }
  const [rfqRows] = await pool.execute(rfqSql, rfqParams);

  // Construct 12-month array
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const spendMap = {};
  spendRows.forEach(r => {
    spendMap[r.month_num] = {
      total_spend: parseFloat(r.total_spend) || 0,
      po_count: r.po_count
    };
  });

  const rfqMap = {};
  rfqRows.forEach(r => {
    rfqMap[r.month_num] = r.rfq_count;
  });

  return months.map((name, index) => {
    const monthNum = index + 1;
    return {
      month: name,
      total_spend: spendMap[monthNum]?.total_spend || 0,
      total_purchase_orders: spendMap[monthNum]?.po_count || 0,
      total_rfqs: rfqMap[monthNum] || 0
    };
  });
}

/**
 * Helper to escape CSV text
 */
function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Generate CSV Report
 */
export async function generateCSV(user, type, year) {
  if (type === 'spending') {
    const data = await getSpending(user, year);
    const headers = ['Month', 'Total Spend (INR)', 'Total RFQs', 'Total Purchase Orders'];
    const lines = [headers.join(',')];
    data.forEach(item => {
      lines.push([
        escapeCSV(item.month),
        item.total_spend,
        item.total_rfqs,
        item.total_purchase_orders
      ].join(','));
    });
    return lines.join('\n');
  } else if (type === 'vendors') {
    const data = await getVendors(user);
    const headers = ['Vendor Name', 'Category', 'RFQs Assigned', 'Quotations Submitted', 'POs Received', 'Total Value (INR)', 'Win Rate %'];
    const lines = [headers.join(',')];
    data.forEach(item => {
      lines.push([
        escapeCSV(item.vendor_name),
        escapeCSV(item.category_name),
        item.rfqs_assigned,
        item.quotations_submitted,
        item.pos_received,
        item.total_value,
        item.win_rate
      ].join(','));
    });
    return lines.join('\n');
  } else {
    // Summary
    const data = await getSummary(user);
    const headers = ['Metric', 'Value'];
    const lines = [
      headers.join(','),
      `Total Vendors,${data.total_vendors}`,
      `Total RFQs,${data.total_rfqs}`,
      `Total Quotations,${data.total_quotations}`,
      `Total Purchase Orders,${data.total_purchase_orders}`,
      `Total Invoices,${data.total_invoices}`,
      `Total Spend (INR),${data.total_spend}`
    ];
    return lines.join('\n');
  }
}

/**
 * Generate Excel compatible TSV Report
 */
export async function generateExcel(user, type, year) {
  // We produce a Tab-Separated Values (TSV) sheet which Excel parses cleanly.
  const csvContent = await generateCSV(user, type, year);
  // Replace all commas with tabs (except those inside escaped quotes, but since we don't have nested commas in numeric/simple outputs, a quick replace is fine or split/join)
  return csvContent.split('\n').map(line => {
    // Basic CSV parser to split and join with tabs
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    return matches.map(m => m.replace(/^"|"$/g, '')).join('\t');
  }).join('\r\n');
}

/**
 * Generate PDF Report using Headless Puppeteer
 */
export async function generatePDF(user, type, year) {
  let contentHtml = '';
  const reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (type === 'spending') {
    const data = await getSpending(user, year);
    const totalSpend = data.reduce((sum, item) => sum + item.total_spend, 0);
    const totalPOs = data.reduce((sum, item) => sum + item.total_purchase_orders, 0);
    const totalRFQs = data.reduce((sum, item) => sum + item.total_rfqs, 0);

    contentHtml = `
      <h2>Monthly Procurement Spending - Year ${year}</h2>
      <p style="color:#6b7280; margin-bottom: 20px;">Report Generated: ${reportDate}</p>
      
      <div style="display:flex; gap: 15px; margin-bottom:30px;">
        <div style="flex:1; border:1px solid #e5e7eb; border-radius:8px; padding:15px; background:#f9fafb;">
          <div style="font-size:11px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Total Spending</div>
          <div style="font-size:20px; font-weight:bold; margin-top:5px;">₹ ${totalSpend.toLocaleString('en-IN')}</div>
        </div>
        <div style="flex:1; border:1px solid #e5e7eb; border-radius:8px; padding:15px; background:#f9fafb;">
          <div style="font-size:11px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Total RFQs</div>
          <div style="font-size:20px; font-weight:bold; margin-top:5px;">${totalRFQs}</div>
        </div>
        <div style="flex:1; border:1px solid #e5e7eb; border-radius:8px; padding:15px; background:#f9fafb;">
          <div style="font-size:11px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Total POs</div>
          <div style="font-size:20px; font-weight:bold; margin-top:5px;">${totalPOs}</div>
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background-color:#4F46E5; color:#ffffff; font-size:12px; text-align:left;">
            <th style="padding:10px; border:1px solid #e5e7eb;">Month</th>
            <th style="padding:10px; border:1px solid #e5e7eb; text-align:right;">Spend (INR)</th>
            <th style="padding:10px; border:1px solid #e5e7eb; text-align:center;">RFQs Assigned</th>
            <th style="padding:10px; border:1px solid #e5e7eb; text-align:center;">POs Issued</th>
          </tr>
        </thead>
        <tbody style="font-size:13px;">
          ${data.map(item => `
            <tr>
              <td style="padding:10px; border:1px solid #e5e7eb;">${item.month}</td>
              <td style="padding:10px; border:1px solid #e5e7eb; text-align:right; font-weight:bold;">₹ ${item.total_spend.toLocaleString('en-IN')}</td>
              <td style="padding:10px; border:1px solid #e5e7eb; text-align:center;">${item.total_rfqs}</td>
              <td style="padding:10px; border:1px solid #e5e7eb; text-align:center;">${item.total_purchase_orders}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (type === 'vendors') {
    const data = await getVendors(user);
    contentHtml = `
      <h2>Vendor Performance Analysis</h2>
      <p style="color:#6b7280; margin-bottom: 20px;">Report Generated: ${reportDate}</p>

      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background-color:#4F46E5; color:#ffffff; font-size:12px; text-align:left;">
            <th style="padding:10px; border:1px solid #e5e7eb;">Vendor Name</th>
            <th style="padding:10px; border:1px solid #e5e7eb;">Category</th>
            <th style="padding:10px; border:1px solid #e5e7eb; text-align:center;">RFQs</th>
            <th style="padding:10px; border:1px solid #e5e7eb; text-align:center;">Quotations</th>
            <th style="padding:10px; border:1px solid #e5e7eb; text-align:center;">POs</th>
            <th style="padding:10px; border:1px solid #e5e7eb; text-align:right;">Total Value</th>
            <th style="padding:10px; border:1px solid #e5e7eb; text-align:center;">Win Rate</th>
          </tr>
        </thead>
        <tbody style="font-size:13px;">
          ${data.map(item => `
            <tr>
              <td style="padding:10px; border:1px solid #e5e7eb; font-weight:bold;">${item.vendor_name}</td>
              <td style="padding:10px; border:1px solid #e5e7eb; color:#4b5563;">${item.category_name}</td>
              <td style="padding:10px; border:1px solid #e5e7eb; text-align:center;">${item.rfqs_assigned}</td>
              <td style="padding:10px; border:1px solid #e5e7eb; text-align:center;">${item.quotations_submitted}</td>
              <td style="padding:10px; border:1px solid #e5e7eb; text-align:center;">${item.pos_received}</td>
              <td style="padding:10px; border:1px solid #e5e7eb; text-align:right; font-weight:bold; color:#059669;">₹ ${item.total_value.toLocaleString('en-IN')}</td>
              <td style="padding:10px; border:1px solid #e5e7eb; text-align:center; font-weight:bold; color:#2563eb;">${item.win_rate}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    // Summary
    const data = await getSummary(user);
    contentHtml = `
      <h2>Executive Procurement Summary</h2>
      <p style="color:#6b7280; margin-bottom: 25px;">Report Generated: ${reportDate}</p>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:30px;">
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:15px; background:#f9fafb;">
          <div style="font-size:11px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Total Procurement Spend</div>
          <div style="font-size:24px; font-weight:bold; margin-top:5px; color:#059669;">₹ ${data.total_spend.toLocaleString('en-IN')}</div>
        </div>
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:15px; background:#f9fafb;">
          <div style="font-size:11px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Total Active Vendors</div>
          <div style="font-size:24px; font-weight:bold; margin-top:5px;">${data.total_vendors}</div>
        </div>
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:15px; background:#f9fafb;">
          <div style="font-size:11px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Total RFQs Drafted</div>
          <div style="font-size:24px; font-weight:bold; margin-top:5px;">${data.total_rfqs}</div>
        </div>
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:15px; background:#f9fafb;">
          <div style="font-size:11px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Quotations Submitted</div>
          <div style="font-size:24px; font-weight:bold; margin-top:5px;">${data.total_quotations}</div>
        </div>
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:15px; background:#f9fafb;">
          <div style="font-size:11px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Purchase Orders Issued</div>
          <div style="font-size:24px; font-weight:bold; margin-top:5px;">${data.total_purchase_orders}</div>
        </div>
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:15px; background:#f9fafb;">
          <div style="font-size:11px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Invoices Processed</div>
          <div style="font-size:24px; font-weight:bold; margin-top:5px;">${data.total_invoices}</div>
        </div>
      </div>
    `;
  }

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>VendorBridge Executive Report</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1f2937;
          margin: 0;
          padding: 20px;
        }
        .header {
          border-bottom: 2px solid #4F46E5;
          padding-bottom: 15px;
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-size: 20px;
          font-weight: 900;
          color: #4F46E5;
        }
        table tr:nth-child(even) {
          background-color: #f9fafb;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <span class="logo">🔷 VendorBridge ERP</span>
        <span style="font-size:12px; color:#9ca3af; font-weight:bold; text-transform:uppercase;">Procurement Reports</span>
      </div>
      ${contentHtml}
      <div style="margin-top:50px; text-align:center; font-size:11px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:15px;">
        VendorBridge ERP System. Confidential. Generated by ${user.name} (${user.role}).
      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-extensions',
      '--disable-background-networking',
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    });
    return pdfBuffer;
  } finally {
    try { await browser.close(); } catch (e) {}
  }
}
