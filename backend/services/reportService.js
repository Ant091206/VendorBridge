import pool from '../config/db.js';
import puppeteer from 'puppeteer';

/**
 * Reports Service for Module 10 (Reports & Analytics Management)
 */

// Helper to obtain vendor id mapping from user email
async function getVendorIdByEmail(email) {
  const [rows] = await pool.execute('SELECT id FROM vendors WHERE email = ? LIMIT 1', [email]);
  return rows[0]?.id || null;
}

/**
 * Builds dynamic WHERE clause and params array based on common filters
 */
function buildWhereClause(tableAlias, dateColumn, filters, vendorId = null) {
  const conditions = [];
  const params = [];

  // Date Range
  if (filters.from) {
    conditions.push(`${tableAlias}.${dateColumn} >= ?`);
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`${tableAlias}.${dateColumn} <= ?`);
    params.push(`${filters.to} 23:59:59`);
  }

  // Month / Quarter / Year
  if (filters.month) {
    conditions.push(`MONTH(${tableAlias}.${dateColumn}) = ?`);
    params.push(parseInt(filters.month));
  }
  if (filters.quarter) {
    conditions.push(`QUARTER(${tableAlias}.${dateColumn}) = ?`);
    params.push(parseInt(filters.quarter));
  }
  if (filters.year) {
    conditions.push(`YEAR(${tableAlias}.${dateColumn}) = ?`);
    params.push(parseInt(filters.year));
  }

  // Vendor Scoping / Filter
  const selectedVendorId = vendorId || filters.vendor;
  if (selectedVendorId) {
    if (tableAlias === 'v') {
      conditions.push(`v.id = ?`);
    } else if (tableAlias === 'r') {
      conditions.push(`EXISTS (SELECT 1 FROM rfq_vendors WHERE rfq_id = r.id AND vendor_id = ?)`);
    } else {
      conditions.push(`${tableAlias}.vendor_id = ?`);
    }
    params.push(parseInt(selectedVendorId));
  }

  // Vendor Category Filter
  if (filters.category) {
    if (tableAlias === 'v') {
      conditions.push(`v.category_id = ?`);
    } else if (tableAlias === 'r') {
      conditions.push(`EXISTS (SELECT 1 FROM rfq_vendors join_rv JOIN vendors join_v ON join_rv.vendor_id = join_v.id WHERE join_rv.rfq_id = r.id AND join_v.category_id = ?)`);
    } else {
      conditions.push(`EXISTS (SELECT 1 FROM vendors WHERE id = ${tableAlias}.vendor_id AND category_id = ?)`);
    }
    params.push(parseInt(filters.category));
  }

  // RFQ Type Filter
  if (filters.rfq_type) {
    if (tableAlias === 'r') {
      conditions.push(`r.type = ?`);
    } else if (tableAlias === 'q' || tableAlias === 'ar' || tableAlias === 'po' || tableAlias === 'i') {
      conditions.push(`EXISTS (SELECT 1 FROM rfqs join_r WHERE join_r.id = ${tableAlias}.rfq_id AND join_r.type = ?)`);
    }
    params.push(filters.rfq_type);
  }

  // Approval Status Filter
  if (filters.approval_status) {
    if (tableAlias === 'ar') {
      conditions.push(`ar.status = ?`);
    } else if (tableAlias === 'po') {
      conditions.push(`EXISTS (SELECT 1 FROM approval_requests join_ar WHERE join_ar.id = po.approval_request_id AND join_ar.status = ?)`);
    } else if (tableAlias === 'i') {
      conditions.push(`EXISTS (SELECT 1 FROM purchase_orders join_po JOIN approval_requests join_ar ON join_po.approval_request_id = join_ar.id WHERE join_po.id = i.po_id AND join_ar.status = ?)`);
    }
  }

  // PO Status Filter
  if (filters.po_status) {
    if (tableAlias === 'po') {
      conditions.push(`po.status = ?`);
    } else if (tableAlias === 'i') {
      conditions.push(`EXISTS (SELECT 1 FROM purchase_orders join_po WHERE join_po.id = i.po_id AND join_po.status = ?)`);
    }
  }

  // Invoice Status Filter
  if (filters.invoice_status && tableAlias === 'i') {
    conditions.push(`i.status = ?`);
  }

  const whereStr = conditions.length > 0 ? ' AND ' + conditions.join(' AND ') : '';
  return { whereStr, params };
}

/**
 * 1. Vendor Listing Report
 */
export async function getVendorsReport(user, filters = {}) {
  const vendorId = user.role === 'vendor' ? await getVendorIdByEmail(user.email) : null;
  const where = buildWhereClause('v', 'created_at', filters, vendorId);
  const sql = `
    SELECT v.id, v.vendor_code, v.name, v.company_name, v.gst_number, v.email, v.phone, v.status, vc.name AS category_name, v.created_at 
    FROM vendors v 
    LEFT JOIN vendor_categories vc ON v.category_id = vc.id 
    WHERE 1=1 ${where.whereStr}
    ORDER BY v.created_at DESC
  `;
  const [rows] = await pool.execute(sql, where.params);
  return rows;
}

/**
 * 2. RFQ Listing Report
 */
export async function getRFQsReport(user, filters = {}) {
  const vendorId = user.role === 'vendor' ? await getVendorIdByEmail(user.email) : null;
  const where = buildWhereClause('r', 'created_at', filters, vendorId);
  const sql = `
    SELECT r.id, r.rfq_number, r.title, r.type, r.priority, r.status, u.name AS created_by_name, r.submission_deadline, r.created_at 
    FROM rfqs r 
    LEFT JOIN users u ON r.created_by = u.id 
    WHERE 1=1 ${where.whereStr}
    ORDER BY r.created_at DESC
  `;
  const [rows] = await pool.execute(sql, where.params);
  return rows;
}

/**
 * 3. Quotation Listing Report
 */
export async function getQuotationsReport(user, filters = {}) {
  const vendorId = user.role === 'vendor' ? await getVendorIdByEmail(user.email) : null;
  const where = buildWhereClause('q', 'created_at', filters, vendorId);
  const sql = `
    SELECT q.id, q.quotation_number, r.rfq_number, r.title AS rfq_title, v.name AS vendor_name, q.delivery_days, q.grand_total, q.status, q.created_at 
    FROM quotations q 
    JOIN rfqs r ON q.rfq_id = r.id 
    JOIN vendors v ON q.vendor_id = v.id 
    WHERE 1=1 ${where.whereStr}
    ORDER BY q.created_at DESC
  `;
  const [rows] = await pool.execute(sql, where.params);
  return rows;
}

/**
 * 4. Approval Listing Report
 */
export async function getApprovalsReport(user, filters = {}) {
  const vendorId = user.role === 'vendor' ? await getVendorIdByEmail(user.email) : null;
  const where = buildWhereClause('ar', 'created_at', filters, vendorId);
  const sql = `
    SELECT ar.id, ar.approval_number, r.rfq_number, q.quotation_number, v.name AS vendor_name, u_req.name AS requested_by_name, u_asg.name AS assigned_to_name, ar.status, ar.request_date, ar.approved_at, ar.rejected_at 
    FROM approval_requests ar 
    JOIN rfqs r ON ar.rfq_id = r.id 
    JOIN quotations q ON ar.quotation_id = q.id 
    JOIN vendors v ON ar.vendor_id = v.id 
    JOIN users u_req ON ar.requested_by = u_req.id 
    JOIN users u_asg ON ar.assigned_to = u_asg.id 
    WHERE 1=1 ${where.whereStr}
    ORDER BY ar.created_at DESC
  `;
  const [rows] = await pool.execute(sql, where.params);
  return rows;
}

/**
 * 5. Purchase Order Listing Report
 */
export async function getPurchaseOrdersReport(user, filters = {}) {
  const vendorId = user.role === 'vendor' ? await getVendorIdByEmail(user.email) : null;
  const where = buildWhereClause('po', 'created_at', filters, vendorId);
  const sql = `
    SELECT po.id, po.po_number, ar.approval_number, r.rfq_number, v.name AS vendor_name, po.issue_date, po.expected_delivery_date, po.grand_total, po.status, po.created_at 
    FROM purchase_orders po 
    JOIN approval_requests ar ON po.approval_request_id = ar.id 
    JOIN rfqs r ON po.rfq_id = r.id 
    JOIN vendors v ON po.vendor_id = v.id 
    WHERE 1=1 ${where.whereStr}
    ORDER BY po.created_at DESC
  `;
  const [rows] = await pool.execute(sql, where.params);
  return rows;
}

/**
 * 6. Invoice Listing Report
 */
export async function getInvoicesReport(user, filters = {}) {
  const vendorId = user.role === 'vendor' ? await getVendorIdByEmail(user.email) : null;
  const where = buildWhereClause('i', 'issue_date', filters, vendorId);
  const sql = `
    SELECT i.id, i.invoice_number, po.po_number, v.name AS vendor_name, i.issue_date, i.due_date, i.grand_total, i.payment_status, i.status, i.created_at 
    FROM invoices i 
    JOIN purchase_orders po ON i.po_id = po.id 
    JOIN vendors v ON i.vendor_id = v.id 
    WHERE 1=1 ${where.whereStr}
    ORDER BY i.created_at DESC
  `;
  const [rows] = await pool.execute(sql, where.params);
  return rows;
}

/**
 * 7. Spending Details Report
 */
export async function getSpendingReport(user, filters = {}) {
  const vendorId = user.role === 'vendor' ? await getVendorIdByEmail(user.email) : null;
  const where = buildWhereClause('i', 'issue_date', filters, vendorId);
  
  const sql = `
    SELECT 
      DATE_FORMAT(i.issue_date, '%Y-%m') AS month,
      COALESCE(SUM(i.grand_total), 0) AS total_spend,
      COUNT(DISTINCT i.po_id) AS total_purchase_orders,
      (SELECT COUNT(DISTINCT sub_i.rfq_id) FROM invoices sub_i WHERE DATE_FORMAT(sub_i.issue_date, '%Y-%m') = DATE_FORMAT(MAX(i.issue_date), '%Y-%m')) AS total_rfqs
    FROM invoices i
    WHERE i.status != 'Cancelled' ${where.whereStr}
    GROUP BY DATE_FORMAT(i.issue_date, '%Y-%m')
    ORDER BY month DESC
  `;
  const [rows] = await pool.execute(sql, where.params);
  
  // Format months to user-friendly format e.g. "Jun 2026"
  const formatted = rows.map(r => {
    const [yearStr, monthStr] = r.month.split('-');
    const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
    const monthName = dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    return {
      month: monthName,
      total_spend: parseFloat(r.total_spend) || 0,
      total_purchase_orders: r.total_purchase_orders,
      total_rfqs: r.total_rfqs
    };
  });
  return formatted;
}

/**
 * 8. Procurement Summary Report KPIs
 */
export async function getSummaryReport(user, filters = {}) {
  const vendorId = user.role === 'vendor' ? await getVendorIdByEmail(user.email) : null;
  
  const vFilter = buildWhereClause('v', 'created_at', filters, vendorId);
  const rFilter = buildWhereClause('r', 'created_at', filters, vendorId);
  const qFilter = buildWhereClause('q', 'created_at', filters, vendorId);
  const poFilter = buildWhereClause('po', 'created_at', filters, vendorId);
  const iFilter = buildWhereClause('i', 'issue_date', filters, vendorId);

  const [
    [vendorRows],
    [rfqRows],
    [quotationRows],
    [poRows],
    [invoiceRows],
    [totalSpendRows]
  ] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS count FROM vendors v WHERE 1=1 ${vFilter.whereStr}`, vFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM rfqs r WHERE 1=1 ${rFilter.whereStr}`, rFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM quotations q WHERE 1=1 ${qFilter.whereStr}`, qFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM purchase_orders po WHERE 1=1 ${poFilter.whereStr}`, poFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM invoices i WHERE 1=1 ${iFilter.whereStr}`, iFilter.params),
    pool.execute(`SELECT COALESCE(SUM(grand_total), 0) AS total FROM invoices i WHERE i.status != 'Cancelled' ${iFilter.whereStr}`, iFilter.params)
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
 * 9. Vendor Performance Report
 */
export async function getVendorPerformanceReport(user, filters = {}) {
  const vendorId = user.role === 'vendor' ? await getVendorIdByEmail(user.email) : null;
  const where = buildWhereClause('v', 'created_at', filters, vendorId);

  const sql = `
    SELECT 
      v.id AS vendor_id,
      v.name AS vendor_name,
      v.vendor_code,
      COALESCE(vc.name, 'Uncategorized') AS category_name,
      (SELECT COUNT(DISTINCT rfq_id) FROM rfq_vendors WHERE vendor_id = v.id) AS rfqs_assigned,
      (SELECT COUNT(*) FROM quotations WHERE vendor_id = v.id) AS quotations_submitted,
      (SELECT COUNT(*) FROM purchase_orders WHERE vendor_id = v.id) AS pos_received,
      (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE vendor_id = v.id AND status != 'Cancelled') AS total_value,
      (SELECT COUNT(*) FROM quotations WHERE vendor_id = v.id AND status = 'selected') AS quotes_selected
    FROM vendors v
    LEFT JOIN vendor_categories vc ON v.category_id = vc.id
    WHERE 1=1 ${where.whereStr}
    ORDER BY total_value DESC
  `;

  const [rows] = await pool.execute(sql, where.params);

  return rows.map(r => {
    const submitted = r.quotations_submitted || 0;
    const selected = r.quotes_selected || 0;
    const winRate = submitted > 0 ? parseFloat(((selected / submitted) * 100).toFixed(1)) : 0;
    
    return {
      vendor_id: r.vendor_id,
      vendor_name: r.vendor_name,
      vendor_code: r.vendor_code,
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
 * 10. Audit History Report
 */
export async function getAuditActivityReport(user, filters = {}) {
  const where = buildWhereClause('al', 'created_at', filters);
  const sql = `
    SELECT al.id, al.created_at, al.user_name, al.role, al.module_name, al.action_type, al.description, al.ip_address
    FROM activity_logs al
    WHERE 1=1 ${where.whereStr}
    ORDER BY al.created_at DESC
  `;
  const [rows] = await pool.execute(sql, where.params);
  return rows;
}

/**
 * Log a report export to report_exports table
 */
export async function logReportExport(userId, reportType, exportFormat, filters, filename) {
  const sql = `
    INSERT INTO report_exports (user_id, report_type, export_format, filters, filename)
    VALUES (?, ?, ?, ?, ?)
  `;
  await pool.execute(sql, [
    userId,
    reportType,
    exportFormat,
    filters ? JSON.stringify(filters) : null,
    filename
  ]);
}

/**
 * Fetch report download history
 */
export async function getExportHistory(userId) {
  const sql = `
    SELECT id, report_type, export_format, filters, filename, created_at 
    FROM report_exports 
    WHERE user_id = ? 
    ORDER BY created_at DESC LIMIT 20
  `;
  const [rows] = await pool.execute(sql, [userId]);
  return rows;
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
 * Generate CSV Report dynamically
 */
export async function generateCSV(user, type, filters) {
  if (type === 'vendors') {
    const data = await getVendorsReport(user, filters);
    const headers = ['Vendor Code', 'Vendor Name', 'Company Name', 'Category', 'Email', 'Phone', 'Status', 'Registered At'];
    const lines = [headers.join(',')];
    data.forEach(item => {
      lines.push([
        escapeCSV(item.vendor_code),
        escapeCSV(item.name),
        escapeCSV(item.company_name),
        escapeCSV(item.category_name),
        escapeCSV(item.email),
        escapeCSV(item.phone),
        item.status,
        item.created_at
      ].join(','));
    });
    return lines.join('\n');
  } 
  
  if (type === 'rfqs') {
    const data = await getRFQsReport(user, filters);
    const headers = ['RFQ Number', 'RFQ Title', 'Type', 'Priority', 'Status', 'Created By', 'Deadline', 'Created At'];
    const lines = [headers.join(',')];
    data.forEach(item => {
      lines.push([
        escapeCSV(item.rfq_number),
        escapeCSV(item.title),
        escapeCSV(item.type),
        item.priority,
        item.status,
        escapeCSV(item.created_by_name),
        item.submission_deadline,
        item.created_at
      ].join(','));
    });
    return lines.join('\n');
  }

  if (type === 'quotations') {
    const data = await getQuotationsReport(user, filters);
    const headers = ['Quotation Number', 'RFQ Number', 'RFQ Title', 'Vendor Name', 'Delivery (Days)', 'Grand Total (INR)', 'Status', 'Submitted At'];
    const lines = [headers.join(',')];
    data.forEach(item => {
      lines.push([
        escapeCSV(item.quotation_number),
        escapeCSV(item.rfq_number),
        escapeCSV(item.rfq_title),
        escapeCSV(item.vendor_name),
        item.delivery_days,
        item.grand_total,
        item.status,
        item.created_at
      ].join(','));
    });
    return lines.join('\n');
  }

  if (type === 'approvals') {
    const data = await getApprovalsReport(user, filters);
    const headers = ['Approval Request Code', 'RFQ Number', 'Quotation Number', 'Vendor Name', 'Requested By', 'Assigned To', 'Status', 'Request Date', 'Decision Date'];
    const lines = [headers.join(',')];
    data.forEach(item => {
      lines.push([
        escapeCSV(item.approval_number),
        escapeCSV(item.rfq_number),
        escapeCSV(item.quotation_number),
        escapeCSV(item.vendor_name),
        escapeCSV(item.requested_by_name),
        escapeCSV(item.assigned_to_name),
        item.status,
        item.request_date,
        item.approved_at || item.rejected_at || ''
      ].join(','));
    });
    return lines.join('\n');
  }

  if (type === 'purchase-orders') {
    const data = await getPurchaseOrdersReport(user, filters);
    const headers = ['PO Number', 'Approval Request Code', 'RFQ Number', 'Vendor Name', 'Issue Date', 'Expected Delivery', 'Grand Total (INR)', 'Status', 'Created At'];
    const lines = [headers.join(',')];
    data.forEach(item => {
      lines.push([
        escapeCSV(item.po_number),
        escapeCSV(item.approval_number),
        escapeCSV(item.rfq_number),
        escapeCSV(item.vendor_name),
        item.issue_date,
        item.expected_delivery_date,
        item.grand_total,
        item.status,
        item.created_at
      ].join(','));
    });
    return lines.join('\n');
  }

  if (type === 'invoices') {
    const data = await getInvoicesReport(user, filters);
    const headers = ['Invoice Number', 'PO Number', 'Vendor Name', 'Issue Date', 'Due Date', 'Grand Total (INR)', 'Payment Status', 'Status', 'Created At'];
    const lines = [headers.join(',')];
    data.forEach(item => {
      lines.push([
        escapeCSV(item.invoice_number),
        escapeCSV(item.po_number),
        escapeCSV(item.vendor_name),
        item.issue_date,
        item.due_date,
        item.grand_total,
        item.payment_status,
        item.status,
        item.created_at
      ].join(','));
    });
    return lines.join('\n');
  }

  if (type === 'spending') {
    const data = await getSpendingReport(user, filters);
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
  }

  if (type === 'vendor-performance') {
    const data = await getVendorPerformanceReport(user, filters);
    const headers = ['Vendor Code', 'Vendor Name', 'Category', 'RFQs Assigned', 'Quotes Submitted', 'POs Received', 'Total Value (INR)', 'Win Rate %'];
    const lines = [headers.join(',')];
    data.forEach(item => {
      lines.push([
        escapeCSV(item.vendor_code),
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
  }

  if (type === 'audit-activity') {
    const data = await getAuditActivityReport(user, filters);
    const headers = ['Timestamp', 'User', 'Role', 'Module Name', 'Action Type', 'Description', 'IP Address'];
    const lines = [headers.join(',')];
    data.forEach(item => {
      lines.push([
        item.created_at,
        escapeCSV(item.user_name),
        escapeCSV(item.role),
        escapeCSV(item.module_name),
        escapeCSV(item.action_type),
        escapeCSV(item.description),
        escapeCSV(item.ip_address)
      ].join(','));
    });
    return lines.join('\n');
  }

  // Summary (procurement-summary)
  const data = await getSummaryReport(user, filters);
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

/**
 * Generate Excel (TSV formatted) sheet
 */
export async function generateExcel(user, type, filters) {
  const csvContent = await generateCSV(user, type, filters);
  return csvContent.split('\n').map(line => {
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    return matches.map(m => m.replace(/^"|"$/g, '')).join('\t');
  }).join('\r\n');
}

/**
 * Generate Print PDF using Puppeteer
 */
export async function generatePDF(user, type, filters) {
  let contentHtml = '';
  const reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Format filter values to display in header
  const filtersHtml = Object.entries(filters)
    .filter(([_, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `<span style="background:#e5e7eb; border-radius:4px; padding:3px 8px; margin-right:10px; font-size:10px; font-weight:bold;">${k}: ${v}</span>`)
    .join('');

  if (type === 'vendors') {
    const data = await getVendorsReport(user, filters);
    contentHtml = `
      <h2>Vendors Directory Report</h2>
      <div style="margin-bottom:20px;">${filtersHtml || '<span style="color:#9ca3af; font-size:11px;">No filters applied</span>'}</div>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background-color:#4F46E5; color:#ffffff; font-size:11px; text-align:left;">
            <th>Code</th>
            <th>Vendor Name</th>
            <th>Company</th>
            <th>Category</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody style="font-size:11px;">
          ${data.map(item => `
            <tr>
              <td>${item.vendor_code}</td>
              <td style="font-weight:bold;">${item.name}</td>
              <td>${item.company_name || ''}</td>
              <td>${item.category_name || 'Uncategorized'}</td>
              <td>${item.email}</td>
              <td>${item.phone}</td>
              <td><span style="color:${item.status === 'active' ? '#059669' : '#d97706'}">${item.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (type === 'rfqs') {
    const data = await getRFQsReport(user, filters);
    contentHtml = `
      <h2>Request For Quotations (RFQ) Report</h2>
      <div style="margin-bottom:20px;">${filtersHtml || '<span style="color:#9ca3af; font-size:11px;">No filters applied</span>'}</div>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background-color:#4F46E5; color:#ffffff; font-size:11px; text-align:left;">
            <th>RFQ Number</th>
            <th>RFQ Title</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created By</th>
            <th>Deadline</th>
          </tr>
        </thead>
        <tbody style="font-size:11px;">
          ${data.map(item => `
            <tr>
              <td style="font-weight:bold;">${item.rfq_number}</td>
              <td>${item.title}</td>
              <td>${item.type}</td>
              <td>${item.priority}</td>
              <td>${item.status}</td>
              <td>${item.created_by_name}</td>
              <td>${item.submission_deadline ? new Date(item.submission_deadline).toLocaleDateString('en-IN') : 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (type === 'quotations') {
    const data = await getQuotationsReport(user, filters);
    contentHtml = `
      <h2>Vendor Quotations Report</h2>
      <div style="margin-bottom:20px;">${filtersHtml || '<span style="color:#9ca3af; font-size:11px;">No filters applied</span>'}</div>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background-color:#4F46E5; color:#ffffff; font-size:11px; text-align:left;">
            <th>Quotation ID</th>
            <th>RFQ Code</th>
            <th>RFQ Title</th>
            <th>Vendor</th>
            <th>Delivery (Days)</th>
            <th style="text-align:right;">Total Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody style="font-size:11px;">
          ${data.map(item => `
            <tr>
              <td style="font-weight:bold;">${item.quotation_number}</td>
              <td>${item.rfq_number}</td>
              <td>${item.rfq_title}</td>
              <td>${item.vendor_name}</td>
              <td style="text-align:center;">${item.delivery_days}</td>
              <td style="text-align:right; font-weight:bold;">₹${parseFloat(item.grand_total).toLocaleString('en-IN')}</td>
              <td>${item.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (type === 'approvals') {
    const data = await getApprovalsReport(user, filters);
    contentHtml = `
      <h2>Quotation Approval Workflow Log</h2>
      <div style="margin-bottom:20px;">${filtersHtml || '<span style="color:#9ca3af; font-size:11px;">No filters applied</span>'}</div>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background-color:#4F46E5; color:#ffffff; font-size:11px; text-align:left;">
            <th>Approval Code</th>
            <th>RFQ Number</th>
            <th>Quote Number</th>
            <th>Vendor Name</th>
            <th>Requested By</th>
            <th>Assigned To</th>
            <th>Status</th>
            <th>Request Date</th>
          </tr>
        </thead>
        <tbody style="font-size:11px;">
          ${data.map(item => `
            <tr>
              <td style="font-weight:bold;">${item.approval_number}</td>
              <td>${item.rfq_number}</td>
              <td>${item.quotation_number}</td>
              <td>${item.vendor_name}</td>
              <td>${item.requested_by_name}</td>
              <td>${item.assigned_to_name}</td>
              <td><span style="font-weight:bold; color:${item.status === 'Approved' ? '#059669' : (item.status === 'Rejected' ? '#dc2626' : '#d97706')}">${item.status}</span></td>
              <td>${new Date(item.request_date).toLocaleDateString('en-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (type === 'purchase-orders') {
    const data = await getPurchaseOrdersReport(user, filters);
    contentHtml = `
      <h2>Issued Purchase Orders (PO) Summary</h2>
      <div style="margin-bottom:20px;">${filtersHtml || '<span style="color:#9ca3af; font-size:11px;">No filters applied</span>'}</div>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background-color:#4F46E5; color:#ffffff; font-size:11px; text-align:left;">
            <th>PO Number</th>
            <th>Approval Request</th>
            <th>RFQ Number</th>
            <th>Vendor</th>
            <th>Issue Date</th>
            <th>Delivery Date</th>
            <th style="text-align:right;">Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody style="font-size:11px;">
          ${data.map(item => `
            <tr>
              <td style="font-weight:bold;">${item.po_number}</td>
              <td>${item.approval_number}</td>
              <td>${item.rfq_number}</td>
              <td>${item.vendor_name}</td>
              <td>${new Date(item.issue_date).toLocaleDateString('en-IN')}</td>
              <td>${new Date(item.expected_delivery_date).toLocaleDateString('en-IN')}</td>
              <td style="text-align:right; font-weight:bold;">₹${parseFloat(item.grand_total).toLocaleString('en-IN')}</td>
              <td>${item.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (type === 'invoices') {
    const data = await getInvoicesReport(user, filters);
    contentHtml = `
      <h2>Procurement Invoices Report</h2>
      <div style="margin-bottom:20px;">${filtersHtml || '<span style="color:#9ca3af; font-size:11px;">No filters applied</span>'}</div>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background-color:#4F46E5; color:#ffffff; font-size:11px; text-align:left;">
            <th>Invoice Number</th>
            <th>PO Number</th>
            <th>Vendor</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th style="text-align:right;">Total Amount</th>
            <th>Payment Status</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody style="font-size:11px;">
          ${data.map(item => `
            <tr>
              <td style="font-weight:bold;">${item.invoice_number}</td>
              <td>${item.po_number}</td>
              <td>${item.vendor_name}</td>
              <td>${new Date(item.issue_date).toLocaleDateString('en-IN')}</td>
              <td>${new Date(item.due_date).toLocaleDateString('en-IN')}</td>
              <td style="text-align:right; font-weight:bold;">₹${parseFloat(item.grand_total).toLocaleString('en-IN')}</td>
              <td><span style="color:${item.payment_status === 'Paid' ? '#059669' : '#dc2626'}">${item.payment_status}</span></td>
              <td>${item.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (type === 'spending') {
    const data = await getSpendingReport(user, filters);
    const totalSpend = data.reduce((sum, item) => sum + item.total_spend, 0);
    const totalPOs = data.reduce((sum, item) => sum + item.total_purchase_orders, 0);

    contentHtml = `
      <h2>Monthly Spending Breakdown</h2>
      <div style="margin-bottom:20px;">${filtersHtml || '<span style="color:#9ca3af; font-size:11px;">No filters applied</span>'}</div>
      
      <div style="display:flex; gap:15px; margin-bottom:20px;">
        <div style="flex:1; border:1px solid #e5e7eb; border-radius:8px; padding:12px; background:#f9fafb;">
          <div style="font-size:9px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Cumulative Spending</div>
          <div style="font-size:18px; font-weight:bold; margin-top:3px; color:#059669;">₹${totalSpend.toLocaleString('en-IN')}</div>
        </div>
        <div style="flex:1; border:1px solid #e5e7eb; border-radius:8px; padding:12px; background:#f9fafb;">
          <div style="font-size:9px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Total Orders Processed</div>
          <div style="font-size:18px; font-weight:bold; margin-top:3px;">${totalPOs} POs</div>
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background-color:#4F46E5; color:#ffffff; font-size:11px; text-align:left;">
            <th>Month</th>
            <th style="text-align:right;">Spend (INR)</th>
            <th style="text-align:center;">RFQs Assigned</th>
            <th style="text-align:center;">POs Issued</th>
          </tr>
        </thead>
        <tbody style="font-size:11px;">
          ${data.map(item => `
            <tr>
              <td style="font-weight:bold;">${item.month}</td>
              <td style="text-align:right; font-weight:bold;">₹${item.total_spend.toLocaleString('en-IN')}</td>
              <td style="text-align:center;">${item.total_rfqs}</td>
              <td style="text-align:center;">${item.total_purchase_orders}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (type === 'vendor-performance') {
    const data = await getVendorPerformanceReport(user, filters);
    contentHtml = `
      <h2>Vendor Performance Scorecard</h2>
      <div style="margin-bottom:20px;">${filtersHtml || '<span style="color:#9ca3af; font-size:11px;">No filters applied</span>'}</div>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background-color:#4F46E5; color:#ffffff; font-size:11px; text-align:left;">
            <th>Code</th>
            <th>Vendor Name</th>
            <th>Category</th>
            <th style="text-align:center;">RFQs</th>
            <th style="text-align:center;">Quotes</th>
            <th style="text-align:center;">POs</th>
            <th style="text-align:right;">Total Value</th>
            <th style="text-align:center;">Win Rate</th>
          </tr>
        </thead>
        <tbody style="font-size:11px;">
          ${data.map(item => `
            <tr>
              <td>${item.vendor_code}</td>
              <td style="font-weight:bold;">${item.vendor_name}</td>
              <td>${item.category_name}</td>
              <td style="text-align:center;">${item.rfqs_assigned}</td>
              <td style="text-align:center;">${item.quotations_submitted}</td>
              <td style="text-align:center;">${item.pos_received}</td>
              <td style="text-align:right; font-weight:bold; color:#059669;">₹${item.total_value.toLocaleString('en-IN')}</td>
              <td style="text-align:center; font-weight:bold; color:#2563eb;">${item.win_rate}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (type === 'audit-activity') {
    const data = await getAuditActivityReport(user, filters);
    contentHtml = `
      <h2>Audit Logs Activity Report</h2>
      <div style="margin-bottom:20px;">${filtersHtml || '<span style="color:#9ca3af; font-size:11px;">No filters applied</span>'}</div>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background-color:#4F46E5; color:#ffffff; font-size:10px; text-align:left;">
            <th>Timestamp</th>
            <th>User</th>
            <th>Role</th>
            <th>Module</th>
            <th>Action Type</th>
            <th>Description</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody style="font-size:10px;">
          ${data.map(item => `
            <tr>
              <td style="white-space:nowrap;">${new Date(item.created_at).toLocaleString('en-IN')}</td>
              <td style="font-weight:bold;">${item.user_name || 'System'}</td>
              <td>${item.role || 'SYSTEM'}</td>
              <td>${item.module_name || ''}</td>
              <td>${item.action_type}</td>
              <td>${item.description}</td>
              <td>${item.ip_address || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    // Summary
    const data = await getSummaryReport(user, filters);
    contentHtml = `
      <h2>Executive Procurement Summary</h2>
      <div style="margin-bottom:25px;">${filtersHtml || '<span style="color:#9ca3af; font-size:11px;">No filters applied</span>'}</div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:12px; background:#f9fafb;">
          <div style="font-size:9px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Total Procurement Spend</div>
          <div style="font-size:18px; font-weight:bold; margin-top:3px; color:#059669;">₹${data.total_spend.toLocaleString('en-IN')}</div>
        </div>
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:12px; background:#f9fafb;">
          <div style="font-size:9px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Total Active Vendors</div>
          <div style="font-size:18px; font-weight:bold; margin-top:3px;">${data.total_vendors}</div>
        </div>
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:12px; background:#f9fafb;">
          <div style="font-size:9px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">RFQs Created</div>
          <div style="font-size:18px; font-weight:bold; margin-top:3px;">${data.total_rfqs}</div>
        </div>
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:12px; background:#f9fafb;">
          <div style="font-size:9px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Quotations Submitted</div>
          <div style="font-size:18px; font-weight:bold; margin-top:3px;">${data.total_quotations}</div>
        </div>
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:12px; background:#f9fafb;">
          <div style="font-size:9px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Purchase Orders Issued</div>
          <div style="font-size:18px; font-weight:bold; margin-top:3px;">${data.total_purchase_orders}</div>
        </div>
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:12px; background:#f9fafb;">
          <div style="font-size:9px; text-transform:uppercase; color:#4F46E5; font-weight:bold;">Invoices Processed</div>
          <div style="font-size:18px; font-weight:bold; margin-top:3px;">${data.total_invoices}</div>
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
          padding: 10px;
        }
        .header {
          border-bottom: 2px solid #4F46E5;
          padding-bottom: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-size: 18px;
          font-weight: 900;
          color: #4F46E5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        table tr:nth-child(even) {
          background-color: #f9fafb;
        }
        th {
          border: 1px solid #e5e7eb;
          padding: 8px 10px;
          background-color: #4F46E5;
          color: #ffffff;
        }
        td {
          border: 1px solid #e5e7eb;
          padding: 8px 10px;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <span class="logo">🔷 VendorBridge ERP</span>
        <span style="font-size:11px; color:#9ca3af; font-weight:bold; text-transform:uppercase;">Procurement Intelligence</span>
      </div>
      ${contentHtml}
      <div style="margin-top:40px; text-align:center; font-size:10px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:12px;">
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
