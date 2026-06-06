import pool from '../config/db.js';

/**
 * Reports & Analytics Controller
 * Provides aggregated data endpoints for dashboards, charts, and CSV exports.
 */

// ────────────────────────────────────────────────
// Helper: Escape CSV field values
// ────────────────────────────────────────────────
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // Wrap in quotes if it contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

// ────────────────────────────────────────────────
// Helper: Format date for CSV
// ────────────────────────────────────────────────
const formatDateCSV = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * GET /api/reports/dashboard-stats
 * Returns all KPI numbers in a single response.
 * Protected: admin and officer.
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Execute all counts in parallel for performance
    const [
      [vendorRows],
      [activeVendorRows],
      [rfqRows],
      [openRfqRows],
      [quotationRows],
      [pendingApprovalRows],
      [poRows],
      [invoiceRows],
      [totalSpendRows],
      [monthSpendRows],
      [avgQuotesRows]
    ] = await Promise.all([
      pool.execute('SELECT COUNT(*) AS count FROM vendors'),
      pool.execute("SELECT COUNT(*) AS count FROM vendors WHERE status = 'active'"),
      pool.execute('SELECT COUNT(*) AS count FROM rfqs'),
      pool.execute("SELECT COUNT(*) AS count FROM rfqs WHERE status = 'open'"),
      pool.execute('SELECT COUNT(*) AS count FROM quotations'),
      pool.execute("SELECT COUNT(*) AS count FROM approvals WHERE decision = 'pending'"),
      pool.execute('SELECT COUNT(*) AS count FROM purchase_orders'),
      pool.execute('SELECT COUNT(*) AS count FROM invoices'),
      pool.execute("SELECT COALESCE(SUM(grand_total), 0) AS total FROM invoices WHERE status != 'generated'"),
      pool.execute(
        `SELECT COALESCE(SUM(grand_total), 0) AS total FROM invoices 
         WHERE MONTH(issued_at) = MONTH(CURRENT_DATE()) 
         AND YEAR(issued_at) = YEAR(CURRENT_DATE())`
      ),
      pool.execute(
        `SELECT COALESCE(AVG(q_count), 0) AS avg_quotes 
         FROM (SELECT rfq_id, COUNT(*) AS q_count FROM quotations GROUP BY rfq_id) AS sub`
      )
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        total_vendors: vendorRows[0].count,
        active_vendors: activeVendorRows[0].count,
        total_rfqs: rfqRows[0].count,
        open_rfqs: openRfqRows[0].count,
        total_quotations: quotationRows[0].count,
        pending_approvals: pendingApprovalRows[0].count,
        total_purchase_orders: poRows[0].count,
        total_invoices: invoiceRows[0].count,
        total_spend: parseFloat(totalSpendRows[0].total) || 0,
        this_month_spend: parseFloat(monthSpendRows[0].total) || 0,
        avg_quotations_per_rfq: parseFloat(parseFloat(avgQuotesRows[0].avg_quotes).toFixed(1)) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve dashboard statistics.'
    });
  }
};

/**
 * GET /api/reports/monthly-spending
 * Returns monthly procurement spend for a given year.
 * Protected: admin and officer.
 * Query: ?year=2026 (defaults to current year)
 */
export const getMonthlySpending = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const sql = `
      SELECT 
        MONTH(i.issued_at) AS month_num,
        COALESCE(SUM(i.grand_total), 0) AS total_spend,
        COUNT(DISTINCT i.po_id) AS po_count
      FROM invoices i
      WHERE YEAR(i.issued_at) = ?
      GROUP BY MONTH(i.issued_at)
    `;
    const [rows] = await pool.execute(sql, [year]);

    // Build full 12-month array, filling gaps with zeros
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataMap = {};
    rows.forEach(r => {
      dataMap[r.month_num] = {
        total_spend: parseFloat(r.total_spend) || 0,
        po_count: r.po_count
      };
    });

    const result = monthNames.map((name, idx) => ({
      month: name,
      month_num: idx + 1,
      total_spend: dataMap[idx + 1]?.total_spend || 0,
      po_count: dataMap[idx + 1]?.po_count || 0
    }));

    return res.status(200).json({
      status: 'success',
      year,
      data: result
    });
  } catch (error) {
    console.error('Error fetching monthly spending:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve monthly spending data.'
    });
  }
};

/**
 * GET /api/reports/vendor-performance
 * Returns performance data for each vendor who has at least 1 quotation.
 * Protected: admin and officer.
 */
export const getVendorPerformance = async (req, res) => {
  try {
    const sql = `
      SELECT 
        v.id AS vendor_id,
        v.name AS vendor_name,
        vc.name AS category_name,
        COUNT(DISTINCT rv.rfq_id) AS total_rfqs_invited,
        COUNT(DISTINCT q.id) AS total_quotes_submitted,
        SUM(CASE WHEN q.status = 'selected' THEN 1 ELSE 0 END) AS quotes_selected,
        SUM(CASE WHEN q.status = 'rejected' THEN 1 ELSE 0 END) AS quotes_rejected,
        COALESCE(AVG(q.delivery_days), 0) AS avg_delivery_days,
        COALESCE(AVG(q.unit_price), 0) AS avg_unit_price
      FROM vendors v
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      LEFT JOIN rfq_vendors rv ON v.id = rv.vendor_id
      INNER JOIN quotations q ON v.id = q.vendor_id
      GROUP BY v.id, v.name, vc.name
      ORDER BY total_quotes_submitted DESC
    `;
    const [rows] = await pool.execute(sql);

    // For each vendor, calculate business value from invoices
    const vendorIds = rows.map(r => r.vendor_id);
    let businessValues = {};

    if (vendorIds.length > 0) {
      const placeholders = vendorIds.map(() => '?').join(',');
      const bvSql = `
        SELECT 
          q.vendor_id,
          COALESCE(SUM(i.grand_total), 0) AS total_business_value
        FROM invoices i
        JOIN purchase_orders po ON i.po_id = po.id
        JOIN approvals a ON po.approval_id = a.id
        JOIN quotations q ON a.quotation_id = q.id
        WHERE q.vendor_id IN (${placeholders})
        GROUP BY q.vendor_id
      `;
      const [bvRows] = await pool.execute(bvSql, vendorIds);
      bvRows.forEach(r => {
        businessValues[r.vendor_id] = parseFloat(r.total_business_value) || 0;
      });
    }

    // Assemble final result with calculated fields
    const result = rows.map(r => {
      const submitted = r.total_quotes_submitted || 0;
      const selected = r.quotes_selected || 0;
      const winRate = submitted > 0 ? parseFloat(((selected / submitted) * 100).toFixed(1)) : 0;
      const totalBv = businessValues[r.vendor_id] || 0;

      return {
        vendor_id: r.vendor_id,
        vendor_name: r.vendor_name,
        category_name: r.category_name || 'Uncategorized',
        total_rfqs_invited: r.total_rfqs_invited,
        total_quotes_submitted: submitted,
        quotes_selected: selected,
        quotes_rejected: r.quotes_rejected || 0,
        win_rate: winRate,
        total_business_value: totalBv,
        avg_delivery_days: parseFloat(parseFloat(r.avg_delivery_days).toFixed(1)),
        avg_unit_price: parseFloat(parseFloat(r.avg_unit_price).toFixed(2))
      };
    });

    // Sort by total_business_value descending
    result.sort((a, b) => b.total_business_value - a.total_business_value);

    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error fetching vendor performance:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve vendor performance data.'
    });
  }
};

/**
 * GET /api/reports/rfq-analytics
 * Returns RFQ conversion statistics.
 * Protected: admin and officer.
 */
export const getRFQAnalytics = async (req, res) => {
  try {
    // Basic counts
    const [[totalRow]] = await pool.execute('SELECT COUNT(*) AS count FROM rfqs');
    const [[openRow]] = await pool.execute("SELECT COUNT(*) AS count FROM rfqs WHERE status = 'open'");
    const [[closedRow]] = await pool.execute("SELECT COUNT(*) AS count FROM rfqs WHERE status = 'closed'");

    // RFQs that resulted in a PO
    const [[convertedRow]] = await pool.execute(`
      SELECT COUNT(DISTINCT r.id) AS count
      FROM rfqs r
      JOIN quotations q ON r.id = q.rfq_id
      JOIN approvals a ON q.id = a.quotation_id
      JOIN purchase_orders po ON a.id = po.approval_id
    `);

    // Average quotes per RFQ
    const [[avgQuotesRow]] = await pool.execute(`
      SELECT COALESCE(AVG(q_count), 0) AS avg_quotes
      FROM (SELECT rfq_id, COUNT(*) AS q_count FROM quotations GROUP BY rfq_id) AS sub
    `);

    // Average time from RFQ creation to approval decision (in days)
    const [[avgTimeRow]] = await pool.execute(`
      SELECT COALESCE(AVG(DATEDIFF(a.decided_at, r.created_at)), 0) AS avg_days
      FROM rfqs r
      JOIN quotations q ON r.id = q.rfq_id
      JOIN approvals a ON q.id = a.quotation_id
      WHERE a.decided_at IS NOT NULL
    `);

    // Status breakdown
    const [statusRows] = await pool.execute(`
      SELECT status, COUNT(*) AS count FROM rfqs GROUP BY status
    `);

    const totalRfqs = totalRow.count;
    const convertedCount = convertedRow.count;
    const conversionRate = totalRfqs > 0
      ? parseFloat(((convertedCount / totalRfqs) * 100).toFixed(1))
      : 0;

    return res.status(200).json({
      status: 'success',
      data: {
        total_rfqs: totalRfqs,
        open_rfqs: openRow.count,
        closed_rfqs: closedRow.count,
        rfqs_converted_to_po: convertedCount,
        conversion_rate: conversionRate,
        avg_quotes_per_rfq: parseFloat(parseFloat(avgQuotesRow.avg_quotes).toFixed(1)),
        avg_time_to_close: parseFloat(parseFloat(avgTimeRow.avg_days).toFixed(1)),
        rfqs_by_status: statusRows
      }
    });
  } catch (error) {
    console.error('Error fetching RFQ analytics:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve RFQ analytics.'
    });
  }
};

/**
 * GET /api/reports/spending-by-category
 * Returns spend grouped by vendor category.
 * Protected: admin and officer.
 */
export const getSpendingByCategory = async (req, res) => {
  try {
    const sql = `
      SELECT 
        COALESCE(vc.name, 'Uncategorized') AS category_name,
        COALESCE(SUM(i.grand_total), 0) AS total_spend,
        COUNT(DISTINCT po.id) AS po_count
      FROM invoices i
      JOIN purchase_orders po ON i.po_id = po.id
      JOIN approvals a ON po.approval_id = a.id
      JOIN quotations q ON a.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      GROUP BY vc.name
      ORDER BY total_spend DESC
    `;
    const [rows] = await pool.execute(sql);

    // Calculate percentages
    const grandTotal = rows.reduce((sum, r) => sum + parseFloat(r.total_spend), 0);
    const result = rows.map(r => ({
      category_name: r.category_name,
      total_spend: parseFloat(r.total_spend) || 0,
      po_count: r.po_count,
      percentage: grandTotal > 0
        ? parseFloat(((parseFloat(r.total_spend) / grandTotal) * 100).toFixed(1))
        : 0
    }));

    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error fetching spending by category:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve category spending data.'
    });
  }
};

/**
 * GET /api/reports/top-vendors
 * Returns top 5 vendors by total business value.
 * Protected: admin and officer.
 */
export const getTopVendors = async (req, res) => {
  try {
    const sql = `
      SELECT 
        v.id AS vendor_id,
        v.name AS vendor_name,
        COALESCE(vc.name, 'Uncategorized') AS category,
        COUNT(DISTINCT po.id) AS total_orders,
        COALESCE(SUM(i.grand_total), 0) AS total_value,
        COUNT(DISTINCT q_all.id) AS total_quotes,
        SUM(CASE WHEN q_all.status = 'selected' THEN 1 ELSE 0 END) AS selected_quotes
      FROM vendors v
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      LEFT JOIN quotations q_all ON v.id = q_all.vendor_id
      LEFT JOIN quotations q ON v.id = q.vendor_id AND q.status = 'selected'
      LEFT JOIN approvals a ON q.id = a.quotation_id
      LEFT JOIN purchase_orders po ON a.id = po.approval_id
      LEFT JOIN invoices i ON po.id = i.po_id
      GROUP BY v.id, v.name, vc.name
      HAVING total_value > 0
      ORDER BY total_value DESC
      LIMIT 5
    `;
    const [rows] = await pool.execute(sql);

    const result = rows.map((r, idx) => {
      const totalQuotes = r.total_quotes || 0;
      const selected = r.selected_quotes || 0;
      const winRate = totalQuotes > 0 ? parseFloat(((selected / totalQuotes) * 100).toFixed(1)) : 0;

      return {
        rank: idx + 1,
        vendor_name: r.vendor_name,
        category: r.category,
        total_orders: r.total_orders,
        total_value: parseFloat(r.total_value) || 0,
        win_rate: winRate
      };
    });

    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error fetching top vendors:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve top vendors.'
    });
  }
};

/**
 * GET /api/reports/export/vendors
 * Exports vendor list as a CSV file download.
 * Protected: admin only.
 */
export const exportVendorsCSV = async (req, res) => {
  try {
    const sql = `
      SELECT 
        v.name, v.gst_number, v.email, v.phone,
        COALESCE(vc.name, 'Uncategorized') AS category,
        v.status, v.created_at
      FROM vendors v
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      ORDER BY v.name ASC
    `;
    const [rows] = await pool.execute(sql);

    // Build CSV content
    const headers = ['Name', 'GST Number', 'Email', 'Phone', 'Category', 'Status', 'Joined Date'];
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      csvLines.push([
        escapeCSV(r.name),
        escapeCSV(r.gst_number),
        escapeCSV(r.email),
        escapeCSV(r.phone),
        escapeCSV(r.category),
        escapeCSV(r.status),
        escapeCSV(formatDateCSV(r.created_at))
      ].join(','));
    });

    const csvContent = csvLines.join('\n');
    const year = new Date().getFullYear();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="vendors-${year}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting vendors CSV:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to export vendor data.'
    });
  }
};

/**
 * GET /api/reports/export/purchase-orders
 * Exports purchase order list as a CSV file download.
 * Protected: admin and officer.
 */
export const exportPurchaseOrdersCSV = async (req, res) => {
  try {
    const sql = `
      SELECT 
        po.po_number,
        r.title AS rfq_title,
        v.name AS vendor_name,
        po.subtotal,
        po.tax_amount,
        po.grand_total,
        po.status,
        po.created_at
      FROM purchase_orders po
      JOIN approvals a ON po.approval_id = a.id
      JOIN quotations q ON a.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      JOIN rfqs r ON q.rfq_id = r.id
      ORDER BY po.created_at DESC
    `;
    const [rows] = await pool.execute(sql);

    const headers = ['PO Number', 'RFQ Title', 'Vendor Name', 'Subtotal', 'GST', 'Grand Total', 'Status', 'Date'];
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      csvLines.push([
        escapeCSV(r.po_number),
        escapeCSV(r.rfq_title),
        escapeCSV(r.vendor_name),
        escapeCSV(r.subtotal),
        escapeCSV(r.tax_amount),
        escapeCSV(r.grand_total),
        escapeCSV(r.status),
        escapeCSV(formatDateCSV(r.created_at))
      ].join(','));
    });

    const csvContent = csvLines.join('\n');
    const year = new Date().getFullYear();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="purchase-orders-${year}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting purchase orders CSV:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to export purchase order data.'
    });
  }
};

/**
 * GET /api/reports/export/invoices
 * Exports invoice list as a CSV file download.
 * Protected: admin and officer.
 */
export const exportInvoicesCSV = async (req, res) => {
  try {
    const sql = `
      SELECT 
        i.invoice_number,
        po.po_number,
        v.name AS vendor_name,
        i.grand_total,
        i.status,
        i.issued_at
      FROM invoices i
      JOIN purchase_orders po ON i.po_id = po.id
      JOIN approvals a ON po.approval_id = a.id
      JOIN quotations q ON a.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      ORDER BY i.issued_at DESC
    `;
    const [rows] = await pool.execute(sql);

    const headers = ['Invoice Number', 'PO Number', 'Vendor Name', 'Grand Total', 'Status', 'Issued Date'];
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      csvLines.push([
        escapeCSV(r.invoice_number),
        escapeCSV(r.po_number),
        escapeCSV(r.vendor_name),
        escapeCSV(r.grand_total),
        escapeCSV(r.status),
        escapeCSV(formatDateCSV(r.issued_at))
      ].join(','));
    });

    const csvContent = csvLines.join('\n');
    const year = new Date().getFullYear();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="invoices-${year}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting invoices CSV:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to export invoice data.'
    });
  }
};
