import pool from '../config/db.js';

/**
 * Analytics Service for Module 10 (Reports & Analytics Management)
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
    } else if (tableAlias === 'rv') {
      conditions.push(`rv.vendor_id = ?`);
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
    } else if (tableAlias === 'rv') {
      conditions.push(`EXISTS (SELECT 1 FROM vendors WHERE id = rv.vendor_id AND category_id = ?)`);
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
 * 1. Executive Dashboard Analytics
 */
export async function getDashboardAnalytics(user, filters = {}) {
  const vendorId = user.role === 'vendor' ? await getVendorIdByEmail(user.email) : null;
  const isVendor = user.role === 'vendor';

  if (isVendor) {
    if (!vendorId) {
      return {
        kpis: {
          total_rfqs: 0, total_quotations: 0, selected_quotations: 0,
          total_purchase_orders: 0, active_purchase_orders: 0,
          total_invoices: 0, paid_invoices: 0, outstanding_invoices: 0,
          total_procurement_value: 0
        },
        outstanding_approvals: [], outstanding_payments: [], recent_activities: []
      };
    }

    // Dynamic scoping filters
    const rfqFilter = buildWhereClause('rv', 'id', filters, vendorId);
    const quoteFilter = buildWhereClause('q', 'created_at', filters, vendorId);
    const poFilter = buildWhereClause('po', 'created_at', filters, vendorId);
    const invFilter = buildWhereClause('i', 'issue_date', filters, vendorId);

    const [
      [rfqRows],
      [quoteRows],
      [quoteSelRows],
      [poRows],
      [poActiveRows],
      [invRows],
      [invPaidRows],
      [invOutstandingRows],
      [valueRows]
    ] = await Promise.all([
      pool.execute(`SELECT COUNT(DISTINCT rfq_id) AS count FROM rfq_vendors rv WHERE 1=1 ${rfqFilter.whereStr}`, rfqFilter.params),
      pool.execute(`SELECT COUNT(*) AS count FROM quotations q WHERE 1=1 ${quoteFilter.whereStr}`, quoteFilter.params),
      pool.execute(`SELECT COUNT(*) AS count FROM quotations q WHERE q.status = 'selected' ${quoteFilter.whereStr}`, quoteFilter.params),
      pool.execute(`SELECT COUNT(*) AS count FROM purchase_orders po WHERE 1=1 ${poFilter.whereStr}`, poFilter.params),
      pool.execute(`SELECT COUNT(*) AS count FROM purchase_orders po WHERE po.status NOT IN ('Draft', 'Closed', 'Cancelled') ${poFilter.whereStr}`, poFilter.params),
      pool.execute(`SELECT COUNT(*) AS count FROM invoices i WHERE 1=1 ${invFilter.whereStr}`, invFilter.params),
      pool.execute(`SELECT COUNT(*) AS count FROM invoices i WHERE i.payment_status = 'Paid' ${invFilter.whereStr}`, invFilter.params),
      pool.execute(`SELECT COUNT(*) AS count FROM invoices i WHERE i.payment_status != 'Paid' AND i.status != 'Cancelled' ${invFilter.whereStr}`, invFilter.params),
      pool.execute(`SELECT COALESCE(SUM(grand_total), 0) AS total FROM invoices i WHERE i.payment_status = 'Paid' ${invFilter.whereStr}`, invFilter.params)
    ]);

    // Outstanding items for vendor
    const [outstandingApprovals] = await pool.execute(
      `SELECT ar.id, ar.approval_number, r.rfq_number, r.title, ar.status, ar.request_date 
       FROM approval_requests ar 
       JOIN rfqs r ON ar.rfq_id = r.id 
       WHERE ar.vendor_id = ? AND ar.status = 'Pending Approval' 
       ORDER BY ar.request_date DESC LIMIT 5`,
      [vendorId]
    );

    const [outstandingPayments] = await pool.execute(
      `SELECT i.id, i.invoice_number, i.grand_total, i.due_date, i.payment_status 
       FROM invoices i 
       WHERE i.vendor_id = ? AND i.payment_status != 'Paid' AND i.status != 'Cancelled' 
       ORDER BY i.due_date ASC LIMIT 5`,
      [vendorId]
    );

    const [recentActivities] = await pool.execute(
      `SELECT id, action_type, description, created_at 
       FROM activity_logs 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 5`,
      [user.id]
    );

    return {
      kpis: {
        total_rfqs: rfqRows[0].count,
        total_quotations: quoteRows[0].count,
        selected_quotations: quoteSelRows[0].count,
        total_purchase_orders: poRows[0].count,
        active_purchase_orders: poActiveRows[0].count,
        total_invoices: invRows[0].count,
        paid_invoices: invPaidRows[0].count,
        outstanding_invoices: invOutstandingRows[0].count,
        total_procurement_value: parseFloat(valueRows[0].total) || 0
      },
      outstanding_approvals: outstandingApprovals,
      outstanding_payments: outstandingPayments,
      recent_activities: recentActivities
    };
  }

  // Admin / Officer / Manager full stats
  const vendorFilter = buildWhereClause('v', 'created_at', filters);
  const rfqFilter = buildWhereClause('r', 'created_at', filters);
  const quoteFilter = buildWhereClause('q', 'created_at', filters);
  const arFilter = buildWhereClause('ar', 'created_at', filters);
  const poFilter = buildWhereClause('po', 'created_at', filters);
  const invFilter = buildWhereClause('i', 'issue_date', filters);

  const [
    [vendorRows],
    [vendorActiveRows],
    [rfqRows],
    [rfqOpenRows],
    [quoteRows],
    [quoteSelRows],
    [arRows],
    [arPendingRows],
    [poRows],
    [poActiveRows],
    [invRows],
    [invPaidRows],
    [invOutstandingRows],
    [valueRows]
  ] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS count FROM vendors v WHERE 1=1 ${vendorFilter.whereStr}`, vendorFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM vendors v WHERE v.status = 'active' ${vendorFilter.whereStr}`, vendorFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM rfqs r WHERE 1=1 ${rfqFilter.whereStr}`, rfqFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM rfqs r WHERE r.status = 'open' ${rfqFilter.whereStr}`, rfqFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM quotations q WHERE 1=1 ${quoteFilter.whereStr}`, quoteFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM quotations q WHERE q.status = 'selected' ${quoteFilter.whereStr}`, quoteFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM approval_requests ar WHERE 1=1 ${arFilter.whereStr}`, arFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM approval_requests ar WHERE ar.status = 'Pending Approval' ${arFilter.whereStr}`, arFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM purchase_orders po WHERE 1=1 ${poFilter.whereStr}`, poFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM purchase_orders po WHERE po.status NOT IN ('Draft', 'Closed', 'Cancelled') ${poFilter.whereStr}`, poFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM invoices i WHERE 1=1 ${invFilter.whereStr}`, invFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM invoices i WHERE i.payment_status = 'Paid' ${invFilter.whereStr}`, invFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM invoices i WHERE i.payment_status != 'Paid' AND i.status != 'Cancelled' ${invFilter.whereStr}`, invFilter.params),
    pool.execute(`SELECT COALESCE(SUM(grand_total), 0) AS total FROM invoices i WHERE i.payment_status = 'Paid' ${invFilter.whereStr}`, invFilter.params)
  ]);

  // Outstanding Approvals List
  const [outstandingApprovals] = await pool.execute(
    `SELECT ar.id, ar.approval_number, r.rfq_number, r.title, ar.status, ar.request_date, u.name AS requested_by_name 
     FROM approval_requests ar 
     JOIN rfqs r ON ar.rfq_id = r.id 
     JOIN users u ON ar.requested_by = u.id
     WHERE ar.status = 'Pending Approval' 
     ORDER BY ar.request_date DESC LIMIT 5`
  );

  // Outstanding Payments List
  const [outstandingPayments] = await pool.execute(
    `SELECT i.id, i.invoice_number, i.grand_total, i.due_date, i.payment_status, v.name AS vendor_name 
     FROM invoices i 
     JOIN vendors v ON i.vendor_id = v.id
     WHERE i.payment_status != 'Paid' AND i.status != 'Cancelled' 
     ORDER BY i.due_date ASC LIMIT 5`
  );

  // Top Vendors by Invoiced Spend
  const [topVendors] = await pool.execute(
    `SELECT v.id, v.name, COALESCE(SUM(i.grand_total), 0) AS total_spend, COUNT(DISTINCT i.id) AS invoices_count 
     FROM vendors v 
     LEFT JOIN invoices i ON v.id = i.vendor_id AND i.status != 'Cancelled'
     GROUP BY v.id, v.name 
     ORDER BY total_spend DESC LIMIT 5`
  );

  // System-wide Recent Activities
  const [recentActivities] = await pool.execute(
    `SELECT id, user_name, role, action_type, description, created_at 
     FROM activity_logs 
     ORDER BY created_at DESC LIMIT 5`
  );

  return {
    kpis: {
      total_vendors: vendorRows[0].count,
      active_vendors: vendorActiveRows[0].count,
      total_rfqs: rfqRows[0].count,
      published_rfqs: rfqOpenRows[0].count,
      total_quotations: quoteRows[0].count,
      selected_quotations: quoteSelRows[0].count,
      total_approvals: arRows[0].count,
      pending_approvals: arPendingRows[0].count,
      total_purchase_orders: poRows[0].count,
      active_purchase_orders: poActiveRows[0].count,
      total_invoices: invRows[0].count,
      paid_invoices: invPaidRows[0].count,
      outstanding_invoices: invOutstandingRows[0].count,
      total_procurement_value: parseFloat(valueRows[0].total) || 0
    },
    outstanding_approvals: outstandingApprovals,
    outstanding_payments: outstandingPayments,
    top_vendors: topVendors,
    recent_activities: recentActivities
  };
}

/**
 * 2. Procurement Metrics Analytics
 */
export async function getProcurementAnalytics(filters = {}) {
  const rfqFilter = buildWhereClause('r', 'created_at', filters);
  const quoteFilter = buildWhereClause('q', 'created_at', filters);
  const arFilter = buildWhereClause('ar', 'created_at', filters);
  const poFilter = buildWhereClause('po', 'created_at', filters);
  const invFilter = buildWhereClause('i', 'issue_date', filters);

  const [
    [rfqCreated],
    [rfqOpen],
    [rfqClosed],
    [rfqCancelled],
    [rfqInvitesRows],
    [submittedQuotesRows],
    [selectedQuotesRows],
    [totalApprovalsRows],
    [approvedRequestsRows],
    [totalPOsRows],
    [totalInvoicesRows]
  ] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS count FROM rfqs r WHERE 1=1 ${rfqFilter.whereStr}`, rfqFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM rfqs r WHERE r.status = 'open' ${rfqFilter.whereStr}`, rfqFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM rfqs r WHERE r.status = 'closed' ${rfqFilter.whereStr}`, rfqFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM rfqs r WHERE r.status = 'cancelled' ${rfqFilter.whereStr}`, rfqFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM rfq_vendors rv join rfqs r ON rv.rfq_id = r.id WHERE 1=1 ${rfqFilter.whereStr}`, rfqFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM quotations q WHERE 1=1 ${quoteFilter.whereStr}`, quoteFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM quotations q WHERE q.status = 'selected' ${quoteFilter.whereStr}`, quoteFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM approval_requests ar WHERE ar.status IN ('Approved', 'Rejected') ${arFilter.whereStr}`, arFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM approval_requests ar WHERE ar.status = 'Approved' ${arFilter.whereStr}`, arFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM purchase_orders po WHERE 1=1 ${poFilter.whereStr}`, poFilter.params),
    pool.execute(`SELECT COUNT(*) AS count FROM invoices i WHERE 1=1 ${invFilter.whereStr}`, invFilter.params)
  ]);

  const invites = rfqInvitesRows[0].count;
  const submissions = submittedQuotesRows[0].count;
  const selections = selectedQuotesRows[0].count;
  const approvalsDecided = totalApprovalsRows[0].count;
  const approvalsApproved = approvedRequestsRows[0].count;
  const poCreated = totalPOsRows[0].count;
  const invoicesCreated = totalInvoicesRows[0].count;

  // Rates calculations
  const participationRate = invites > 0 ? parseFloat(((submissions / invites) * 100).toFixed(1)) : 0;
  const selectionRate = submissions > 0 ? parseFloat(((selections / submissions) * 100).toFixed(1)) : 0;
  const approvalSuccessRate = approvalsDecided > 0 ? parseFloat(((approvalsApproved / approvalsDecided) * 100).toFixed(1)) : 0;
  const poGenerationRate = selections > 0 ? parseFloat(((poCreated / selections) * 100).toFixed(1)) : 0;
  const invoiceGenerationRate = poCreated > 0 ? parseFloat(((invoicesCreated / poCreated) * 100).toFixed(1)) : 0;

  return {
    rfqs_created: rfqCreated[0].count,
    rfqs_published: rfqOpen[0].count,
    rfqs_closed: rfqClosed[0].count,
    rfqs_cancelled: rfqCancelled[0].count,
    vendor_participation_rate: participationRate, // submissions / invites
    quotation_submission_rate: participationRate, // synonymous
    vendor_selection_rate: selectionRate,
    approval_success_rate: approvalSuccessRate,
    purchase_order_generation_rate: Math.min(poGenerationRate, 100),
    invoice_generation_rate: Math.min(invoiceGenerationRate, 100)
  };
}

/**
 * 3. Vendor Performance Analytics
 */
export async function getVendorAnalytics(filters = {}) {
  const vendorFilter = buildWhereClause('v', 'created_at', filters);

  const sql = `
    SELECT 
      v.id,
      v.name,
      v.company_name,
      v.status,
      (SELECT COUNT(DISTINCT rfq_id) FROM rfq_vendors WHERE vendor_id = v.id) AS rfqs_assigned,
      (SELECT COUNT(*) FROM quotations WHERE vendor_id = v.id) AS quotations_submitted,
      (SELECT COUNT(*) FROM quotations WHERE vendor_id = v.id AND status = 'selected') AS quotations_selected,
      (SELECT COALESCE(SUM(grand_total), 0) FROM purchase_orders WHERE vendor_id = v.id AND status != 'Cancelled') AS total_po_value,
      (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE vendor_id = v.id AND payment_status = 'Paid') AS total_paid_value,
      (SELECT COALESCE(AVG(delivery_days), 0) FROM quotations WHERE vendor_id = v.id AND status = 'selected') AS avg_delivery_days
    FROM vendors v
    WHERE 1=1 ${vendorFilter.whereStr}
    ORDER BY quotations_submitted DESC
  `;
  const [rows] = await pool.execute(sql, vendorFilter.params);

  const formattedRows = rows.map(r => {
    const assigned = r.rfqs_assigned || 0;
    const submitted = r.quotations_submitted || 0;
    const selected = r.quotations_selected || 0;

    const participationRate = assigned > 0 ? parseFloat(((submitted / assigned) * 100).toFixed(1)) : 0;
    const successRate = submitted > 0 ? parseFloat(((selected / submitted) * 100).toFixed(1)) : 0;

    return {
      vendor_id: r.id,
      vendor_name: r.name,
      company_name: r.company_name || r.name,
      status: r.status,
      rfqs_assigned: assigned,
      quotations_submitted: submitted,
      quotations_selected: selected,
      participation_rate: participationRate,
      success_rate: successRate,
      total_po_value: parseFloat(r.total_po_value) || 0,
      total_paid_value: parseFloat(r.total_paid_value) || 0,
      avg_delivery_days: parseFloat(parseFloat(r.avg_delivery_days).toFixed(1))
    };
  });

  return formattedRows;
}

/**
 * 4. Spending Analytics
 */
export async function getSpendingAnalytics(filters = {}) {
  const invFilter = buildWhereClause('i', 'issue_date', filters);
  const poFilter = buildWhereClause('po', 'created_at', filters);

  const [
    [totalInvoiceSpendRows],
    [totalPOSpendRows],
    [averageInvoiceValueRows],
    [averagePOValueRows],
    [vendorWiseSpend],
    [categoryWiseSpend],
    [rfqWiseSpend]
  ] = await Promise.all([
    pool.execute(`SELECT COALESCE(SUM(grand_total), 0) AS total, COUNT(*) AS count FROM invoices i WHERE i.status != 'Cancelled' ${invFilter.whereStr}`, invFilter.params),
    pool.execute(`SELECT COALESCE(SUM(grand_total), 0) AS total, COUNT(*) AS count FROM purchase_orders po WHERE po.status != 'Cancelled' ${poFilter.whereStr}`, poFilter.params),
    pool.execute(`SELECT COALESCE(AVG(grand_total), 0) AS avg FROM invoices i WHERE i.status != 'Cancelled' ${invFilter.whereStr}`, invFilter.params),
    pool.execute(`SELECT COALESCE(AVG(grand_total), 0) AS avg FROM purchase_orders po WHERE po.status != 'Cancelled' ${poFilter.whereStr}`, poFilter.params),
    pool.execute(
      `SELECT v.name AS vendor_name, COALESCE(SUM(i.grand_total), 0) AS total_spend 
       FROM vendors v 
       JOIN invoices i ON v.id = i.vendor_id 
       WHERE i.status != 'Cancelled' ${invFilter.whereStr.replace(/i\./g, 'i.')} 
       GROUP BY v.id, v.name 
       ORDER BY total_spend DESC LIMIT 10`, 
      invFilter.params
    ),
    pool.execute(
      `SELECT vc.name AS category_name, COALESCE(SUM(i.grand_total), 0) AS total_spend 
       FROM vendor_categories vc 
       JOIN vendors v ON vc.id = v.category_id 
       JOIN invoices i ON v.id = i.vendor_id 
       WHERE i.status != 'Cancelled' ${invFilter.whereStr.replace(/i\./g, 'i.')} 
       GROUP BY vc.id, vc.name 
       ORDER BY total_spend DESC`, 
      invFilter.params
    ),
    pool.execute(
      `SELECT r.rfq_number, r.title, COALESCE(SUM(i.grand_total), 0) AS total_spend 
       FROM rfqs r 
       JOIN invoices i ON r.id = i.rfq_id 
       WHERE i.status != 'Cancelled' ${invFilter.whereStr.replace(/i\./g, 'i.')} 
       GROUP BY r.id, r.rfq_number, r.title 
       ORDER BY total_spend DESC LIMIT 10`, 
      invFilter.params
    )
  ]);

  const totalInvoiceSpend = parseFloat(totalInvoiceSpendRows[0].total) || 0;
  const totalPOSpend = parseFloat(totalPOSpendRows[0].total) || 0;
  
  // Total Spend represents standard Invoice Total spend
  const totalSpend = totalInvoiceSpend;
  const invoicesCount = totalInvoiceSpendRows[0].count;
  const poCount = totalPOSpendRows[0].count;
  
  const avgInvoiceValue = parseFloat(averageInvoiceValueRows[0].avg) || 0;
  const avgPOValue = parseFloat(averagePOValueRows[0].avg) || 0;
  const averageOrderValue = avgPOValue;
  const averageProcurementCost = invoicesCount > 0 ? (totalSpend / invoicesCount) : 0;

  return {
    total_spend: totalSpend,
    purchase_order_spend: totalPOSpend,
    invoice_spend: totalInvoiceSpend,
    average_order_value: averageOrderValue, // average PO value
    average_procurement_cost: averageProcurementCost, // average invoice value
    average_invoice_value: avgInvoiceValue,
    invoices_count: invoicesCount,
    po_count: poCount,
    vendor_wise: vendorWiseSpend,
    category_wise: categoryWiseSpend,
    rfq_wise: rfqWiseSpend
  };
}

/**
 * 5. Approval Workflows Analytics
 */
export async function getApprovalAnalytics(filters = {}) {
  const arFilter = buildWhereClause('ar', 'created_at', filters);

  const [
    [statusRows],
    [timeRows],
    [approverPerformance]
  ] = await Promise.all([
    pool.execute(`SELECT status, COUNT(*) AS count FROM approval_requests ar WHERE 1=1 ${arFilter.whereStr} GROUP BY status`, arFilter.params),
    pool.execute(
      `SELECT 
         COALESCE(AVG(TIMESTAMPDIFF(MINUTE, request_date, approved_at)), 0) AS avg_approved_minutes,
         COALESCE(AVG(TIMESTAMPDIFF(MINUTE, request_date, rejected_at)), 0) AS avg_rejected_minutes,
         COALESCE(AVG(TIMESTAMPDIFF(MINUTE, request_date, COALESCE(approved_at, rejected_at))), 0) AS avg_total_minutes
       FROM approval_requests ar 
       WHERE (approved_at IS NOT NULL OR rejected_at IS NOT NULL) ${arFilter.whereStr}`, 
      arFilter.params
    ),
    pool.execute(
      `SELECT u.name AS approver_name, 
         COUNT(*) AS total_decisions,
         SUM(CASE WHEN ar.status = 'Approved' THEN 1 ELSE 0 END) AS approved_count,
         SUM(CASE WHEN ar.status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_count,
         COALESCE(AVG(TIMESTAMPDIFF(MINUTE, request_date, COALESCE(approved_at, rejected_at))), 0) AS avg_time_minutes
       FROM users u 
       JOIN approval_requests ar ON u.id = ar.assigned_to 
       WHERE ar.status IN ('Approved', 'Rejected') ${arFilter.whereStr.replace(/ar\./g, 'ar.')} 
       GROUP BY u.id, u.name 
       ORDER BY total_decisions DESC`, 
      arFilter.params
    )
  ]);

  // Aggregate stats by status
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  statusRows.forEach(r => {
    const status = r.status.toLowerCase();
    if (status.includes('pending') || status === 'assigned') pending += r.count;
    else if (status.includes('approved') || status === 'approved') approved += r.count;
    else if (status.includes('rejected') || status === 'rejected') rejected += r.count;
  });

  const totalDecisions = approved + rejected;
  const successRate = totalDecisions > 0 ? parseFloat(((approved / totalDecisions) * 100).toFixed(1)) : 0;
  
  // Convert minutes to hours for display
  const avgDecisionHours = parseFloat((parseFloat(timeRows[0].avg_total_minutes) / 60).toFixed(2));

  return {
    pending_approvals: pending,
    approved_requests: approved,
    rejected_requests: rejected,
    total_decided: totalDecisions,
    approval_success_rate: successRate,
    average_approval_time_hours: avgDecisionHours,
    approver_performance: approverPerformance.map(ap => ({
      approver_name: ap.approver_name,
      total_decisions: ap.total_decisions,
      approved_count: ap.approved_count,
      rejected_count: ap.rejected_count,
      avg_time_hours: parseFloat((parseFloat(ap.avg_time_minutes) / 60).toFixed(2))
    }))
  };
}

/**
 * 6. Purchase Order Analytics
 */
export async function getPurchaseOrderAnalytics(filters = {}) {
  const poFilter = buildWhereClause('po', 'created_at', filters);

  const [
    [statusRows],
    [avgValueRows],
    [fulfillmentRows]
  ] = await Promise.all([
    pool.execute(`SELECT status, COUNT(*) AS count FROM purchase_orders po WHERE 1=1 ${poFilter.whereStr} GROUP BY status`, poFilter.params),
    pool.execute(`SELECT COALESCE(AVG(grand_total), 0) AS avg, COALESCE(SUM(grand_total), 0) AS sum FROM purchase_orders po WHERE po.status != 'Cancelled' ${poFilter.whereStr}`, poFilter.params),
    pool.execute(
      `SELECT v.name AS vendor_name, 
         COUNT(*) AS total_pos,
         SUM(CASE WHEN po.status IN ('Shipped', 'Delivered', 'Fulfilled', 'Closed') THEN 1 ELSE 0 END) AS fulfilled_pos
       FROM vendors v
       JOIN purchase_orders po ON v.id = po.vendor_id
       WHERE po.status != 'Cancelled' ${poFilter.whereStr.replace(/po\./g, 'po.')} 
       GROUP BY v.id, v.name
       ORDER BY total_pos DESC LIMIT 10`,
      poFilter.params
    )
  ]);

  let issued = 0;
  let acknowledged = 0;
  let fulfilled = 0;
  let cancelled = 0;
  let draft = 0;

  statusRows.forEach(r => {
    const status = r.status.toLowerCase();
    if (status === 'draft') draft += r.count;
    else if (status === 'cancelled') cancelled += r.count;
    else if (status === 'sent' || status === 'generated' || status === 'issued') issued += r.count;
    else if (status === 'acknowledged' || status === 'accepted') acknowledged += r.count;
    else if (status === 'shipped' || status === 'delivered' || status === 'fulfilled' || status === 'closed') fulfilled += r.count;
    else issued += r.count; // fallback default
  });

  const totalPOWithoutCancelled = draft + issued + acknowledged + fulfilled;
  const fulfillmentRate = totalPOWithoutCancelled > 0 ? parseFloat(((fulfilled / totalPOWithoutCancelled) * 100).toFixed(1)) : 0;

  return {
    issued_pos: issued + acknowledged + fulfilled, // POs that went to vendors
    acknowledged_pos: acknowledged,
    fulfilled_pos: fulfilled,
    cancelled_pos: cancelled,
    draft_pos: draft,
    average_po_value: parseFloat(avgValueRows[0].avg) || 0,
    total_po_value: parseFloat(avgValueRows[0].sum) || 0,
    vendor_fulfillment_rate: fulfillmentRate,
    vendor_fulfillment_list: fulfillmentRows.map(f => {
      const tot = f.total_pos || 0;
      const ful = f.fulfilled_pos || 0;
      const rate = tot > 0 ? parseFloat(((ful / tot) * 100).toFixed(1)) : 0;
      return {
        vendor_name: f.vendor_name,
        total_pos: tot,
        fulfilled_pos: ful,
        fulfillment_rate: rate
      };
    })
  };
}

/**
 * 7. Invoice Analytics
 */
export async function getInvoiceAnalytics(filters = {}) {
  const invFilter = buildWhereClause('i', 'issue_date', filters);

  const [
    [statusRows],
    [payStatusRows],
    [valuesRows]
  ] = await Promise.all([
    pool.execute(`SELECT status, COUNT(*) AS count FROM invoices i WHERE 1=1 ${invFilter.whereStr} GROUP BY status`, invFilter.params),
    pool.execute(`SELECT payment_status, COUNT(*) AS count FROM invoices i WHERE i.status != 'Cancelled' ${invFilter.whereStr} GROUP BY payment_status`, invFilter.params),
    pool.execute(
      `SELECT 
         COALESCE(AVG(grand_total), 0) AS avg,
         COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN grand_total ELSE 0 END), 0) AS paid_amount,
         COALESCE(SUM(CASE WHEN payment_status != 'Paid' AND status != 'Cancelled' THEN grand_total ELSE 0 END), 0) AS outstanding_amount
       FROM invoices i
       WHERE 1=1 ${invFilter.whereStr}`,
      invFilter.params
    )
  ]);

  let draft = 0;
  let generated = 0;
  let sent = 0;
  let viewed = 0;
  let paid = 0;
  let cancelled = 0;

  statusRows.forEach(r => {
    const status = r.status.toLowerCase();
    if (status === 'draft') draft += r.count;
    else if (status === 'generated') generated += r.count;
    else if (status === 'sent') sent += r.count;
    else if (status === 'viewed') viewed += r.count;
    else if (status === 'paid') paid += r.count;
    else if (status === 'cancelled') cancelled += r.count;
  });

  return {
    draft_invoices: draft,
    generated_invoices: generated,
    sent_invoices: sent + viewed,
    paid_invoices: paid,
    cancelled_invoices: cancelled,
    outstanding_invoices: generated + sent + viewed, // unpaid active invoices
    average_invoice_value: parseFloat(valuesRows[0].avg) || 0,
    paid_amount: parseFloat(valuesRows[0].paid_amount) || 0,
    outstanding_amount: parseFloat(valuesRows[0].outstanding_amount) || 0,
    payment_status_breakdown: payStatusRows.map(p => ({
      payment_status: p.payment_status,
      count: p.count
    }))
  };
}

/**
 * 8. Procurement Trends
 */
export async function getTrendsAnalytics(filters = {}) {
  // Pull monthly counts for last 12 months
  const months = [];
  const date = new Date();

  // Load trends going back 11 months + current month (12 points)
  for (let i = 11; i >= 0; i--) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    months.push({
      month_num: d.getMonth() + 1,
      year: d.getFullYear(),
      name: d.toLocaleDateString('en-IN', { month: 'short' }),
      rfqs: 0,
      quotations: 0,
      approvals: 0,
      purchase_orders: 0,
      invoices: 0,
      spend: 0
    });
  }

  await Promise.all(months.map(async (m) => {
    // Inject filters for the month & year specifically, ignoring overall date range filters
    const filterCopy = { ...filters };
    delete filterCopy.from;
    delete filterCopy.to;
    filterCopy.month = m.month_num;
    filterCopy.year = m.year;

    const rfqFilter = buildWhereClause('r', 'created_at', filterCopy);
    const quoteFilter = buildWhereClause('q', 'created_at', filterCopy);
    const arFilter = buildWhereClause('ar', 'created_at', filterCopy);
    const poFilter = buildWhereClause('po', 'created_at', filterCopy);
    const invFilter = buildWhereClause('i', 'issue_date', filterCopy);

    const [
      [rfqRows],
      [quoteRows],
      [arRows],
      [poRows],
      [invRows]
    ] = await Promise.all([
      pool.execute(`SELECT COUNT(*) AS count FROM rfqs r WHERE r.status != 'draft' ${rfqFilter.whereStr}`, rfqFilter.params),
      pool.execute(`SELECT COUNT(*) AS count FROM quotations q WHERE q.status != 'draft' ${quoteFilter.whereStr}`, quoteFilter.params),
      pool.execute(`SELECT COUNT(*) AS count FROM approval_requests ar WHERE ar.status = 'Approved' ${arFilter.whereStr}`, arFilter.params),
      pool.execute(`SELECT COUNT(*) AS count, COALESCE(SUM(grand_total), 0) AS total FROM purchase_orders po WHERE po.status != 'Cancelled' ${poFilter.whereStr}`, poFilter.params),
      pool.execute(`SELECT COUNT(*) AS count, COALESCE(SUM(grand_total), 0) AS total FROM invoices i WHERE i.status != 'Cancelled' ${invFilter.whereStr}`, invFilter.params)
    ]);

    m.rfqs = rfqRows[0].count;
    m.quotations = quoteRows[0].count;
    m.approvals = arRows[0].count;
    m.purchase_orders = poRows[0].count;
    m.invoices = invRows[0].count;
    m.spend = parseFloat(invRows[0].total) || 0;
  }));

  return months.map(m => ({
    month: `${m.name} ${m.year.toString().slice(-2)}`,
    rfqs: m.rfqs,
    quotations: m.quotations,
    approvals: m.approvals,
    purchase_orders: m.purchase_orders,
    invoices: m.invoices,
    spend: m.spend
  }));
}
