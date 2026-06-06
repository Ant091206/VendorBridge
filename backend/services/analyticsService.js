import pool from '../config/db.js';

/**
 * Analytics Service
 */

// Helper to obtain vendor id mapping from user email
async function getVendorIdByEmail(email) {
  const [rows] = await pool.execute('SELECT id FROM vendors WHERE email = ? LIMIT 1', [email]);
  return rows[0]?.id || null;
}

/**
 * GET RFQ status distribution
 */
export async function getRFQStatus(user) {
  if (user.role === 'vendor') {
    const vendorId = await getVendorIdByEmail(user.email);
    if (!vendorId) return [];

    const sql = `
      SELECT r.status, COUNT(DISTINCT r.id) AS count 
      FROM rfqs r
      JOIN rfq_vendors rv ON r.id = rv.rfq_id
      WHERE rv.vendor_id = ?
      GROUP BY r.status
    `;
    const [rows] = await pool.execute(sql, [vendorId]);
    return rows;
  }

  // Admin / Officer / Manager full stats
  const sql = `
    SELECT status, COUNT(*) AS count 
    FROM rfqs 
    GROUP BY status
  `;
  const [rows] = await pool.execute(sql);
  return rows;
}

/**
 * GET Approvals Decision Breakdown (Donut chart data)
 */
export async function getApprovals(user) {
  if (user.role === 'vendor') {
    const vendorId = await getVendorIdByEmail(user.email);
    if (!vendorId) return [];

    const sql = `
      SELECT a.decision AS status, COUNT(*) AS count 
      FROM approvals a
      JOIN quotations q ON a.quotation_id = q.id
      WHERE q.vendor_id = ?
      GROUP BY a.decision
    `;
    const [rows] = await pool.execute(sql, [vendorId]);
    return rows;
  }

  // Admin / Officer / Manager full stats
  const sql = `
    SELECT decision AS status, COUNT(*) AS count 
    FROM approvals 
    GROUP BY decision
  `;
  const [rows] = await pool.execute(sql);
  return rows;
}

/**
 * GET Monthly Trends (Area chart: Procurement, Vendor, RFQ Growth)
 */
export async function getMonthlyTrends(user) {
  // Returns last 6 months trend of Spend, Vendors, and RFQs
  const months = [];
  const date = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    months.push({
      month_num: d.getMonth() + 1,
      year: d.getFullYear(),
      name: d.toLocaleDateString('en-IN', { month: 'short' }),
      procurement_growth: 0,
      vendor_growth: 0,
      rfq_growth: 0
    });
  }

  const vendorId = user.role === 'vendor' ? await getVendorIdByEmail(user.email) : null;

  // Let's populate growth metrics in parallel
  await Promise.all(months.map(async (m) => {
    // 1. Procurement growth (Invoice Spend)
    let spendSql = `
      SELECT COALESCE(SUM(i.grand_total), 0) AS total 
      FROM invoices i
      JOIN purchase_orders po ON i.po_id = po.id
      JOIN approvals a ON po.approval_id = a.id
      JOIN quotations q ON a.quotation_id = q.id
      WHERE MONTH(i.issued_at) = ? AND YEAR(i.issued_at) = ? AND i.status != 'generated'
    `;
    const spendParams = [m.month_num, m.year];
    if (vendorId) {
      spendSql += ' AND q.vendor_id = ?';
      spendParams.push(vendorId);
    }
    const [spendRows] = await pool.execute(spendSql, spendParams);
    m.procurement_growth = parseFloat(spendRows[0].total) || 0;

    // 2. Vendor growth (Cumulative or new vendor count per month)
    // Vendors registered in this month
    let vendorSql = `
      SELECT COUNT(*) AS count 
      FROM vendors 
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
    `;
    const vendorParams = [m.month_num, m.year];
    if (user.role === 'vendor') {
      // Vendor only sees their own growth as 1 or 0
      vendorSql += ' AND id = ?';
      vendorParams.push(vendorId);
    }
    const [vendorRows] = await pool.execute(vendorSql, vendorParams);
    m.vendor_growth = vendorRows[0].count;

    // 3. RFQ growth (Number of RFQs created/assigned in this month)
    let rfqSql = '';
    let rfqParams = [];
    if (vendorId) {
      rfqSql = `
        SELECT COUNT(DISTINCT r.id) AS count 
        FROM rfqs r
        JOIN rfq_vendors rv ON r.id = rv.rfq_id
        WHERE MONTH(r.created_at) = ? AND YEAR(r.created_at) = ? AND rv.vendor_id = ? AND r.status != 'draft'
      `;
      rfqParams = [m.month_num, m.year, vendorId];
    } else {
      rfqSql = `
        SELECT COUNT(*) AS count 
        FROM rfqs 
        WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
      `;
      rfqParams = [m.month_num, m.year];
    }
    const [rfqRows] = await pool.execute(rfqSql, rfqParams);
    m.rfq_growth = rfqRows[0].count;
  }));

  return months.map(m => ({
    month: m.name,
    procurement_growth: m.procurement_growth,
    vendor_growth: m.vendor_growth,
    rfq_growth: m.rfq_growth
  }));
}
