import pool from '../config/db.js';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toNumber = (value) => Number.parseFloat(value || 0);

const getMonthlyTrend = async () => {
  const year = new Date().getFullYear();
  const [rows] = await pool.execute(
    `SELECT MONTH(created_at) AS month_num,
            COALESCE(SUM(grand_total), 0) AS spend,
            COUNT(*) AS purchase_orders
     FROM purchase_orders
     WHERE YEAR(created_at) = ?
     GROUP BY MONTH(created_at)
     ORDER BY month_num`,
    [year]
  );

  const byMonth = new Map(rows.map((row) => [row.month_num, row]));
  return monthLabels.map((month, index) => {
    const row = byMonth.get(index + 1);
    return {
      month,
      spend: toNumber(row?.spend),
      purchase_orders: row?.purchase_orders || 0
    };
  });
};

const getRFQStatusDistribution = async () => {
  const [rows] = await pool.execute(
    `SELECT status, COUNT(*) AS count
     FROM rfqs
     GROUP BY status`
  );

  return ['draft', 'open', 'closed'].map((status) => ({
    status,
    count: rows.find((row) => row.status === status)?.count || 0
  }));
};

const getSpendingOverview = async () => {
  const [rows] = await pool.execute(
    `SELECT po.status, COALESCE(SUM(po.grand_total), 0) AS spend, COUNT(*) AS count
     FROM purchase_orders po
     GROUP BY po.status`
  );

  return ['generated', 'sent', 'completed'].map((status) => ({
    status,
    spend: toNumber(rows.find((row) => row.status === status)?.spend),
    count: rows.find((row) => row.status === status)?.count || 0
  }));
};

const getVendorActivityOverview = async () => {
  const [rows] = await pool.execute(
    `SELECT v.name AS vendor_name,
            COUNT(DISTINCT rv.rfq_id) AS assigned_rfqs,
            COUNT(DISTINCT q.id) AS submitted_quotations,
            COUNT(DISTINCT po.id) AS purchase_orders
     FROM vendors v
     LEFT JOIN rfq_vendors rv ON rv.vendor_id = v.id
     LEFT JOIN quotations q ON q.vendor_id = v.id
     LEFT JOIN purchase_orders po ON po.vendor_id = v.id
     GROUP BY v.id, v.name
     ORDER BY submitted_quotations DESC, assigned_rfqs DESC
     LIMIT 6`
  );

  return rows;
};

const getRecentActivity = async (limit = 6) => {
  const [rows] = await pool.query(
    `SELECT al.id, al.entity_type, al.entity_id, al.action_type AS action, al.created_at, COALESCE(al.user_name, u.full_name) AS user_name
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT ?`,
    [limit]
  );

  return rows;
};

const getRecentRFQs = async (limit = 5, vendorId = null) => {
  const params = [];
  let vendorJoin = '';
  let vendorWhere = '';

  if (vendorId) {
    vendorJoin = 'JOIN rfq_vendors rv ON rv.rfq_id = r.id';
    vendorWhere = 'WHERE rv.vendor_id = ?';
    params.push(vendorId);
  }

  params.push(limit);
  const [rows] = await pool.query(
    `SELECT r.id, r.title, r.status, r.submission_deadline AS deadline, r.created_at,
            u.full_name AS created_by_name,
            COUNT(DISTINCT rv_count.vendor_id) AS invited_vendors,
            COUNT(DISTINCT q.id) AS quotations_received
     FROM rfqs r
     ${vendorJoin}
     LEFT JOIN users u ON u.id = r.created_by
     LEFT JOIN rfq_vendors rv_count ON rv_count.rfq_id = r.id
     LEFT JOIN quotations q ON q.rfq_id = r.id
     ${vendorWhere}
     GROUP BY r.id, r.title, r.status, r.submission_deadline, r.created_at, u.full_name
     ORDER BY r.created_at DESC
     LIMIT ?`,
    params
  );

  return rows;
};

const getRecentPOs = async (limit = 5, vendorId = null) => {
  const params = [];
  let vendorWhere = '';

  if (vendorId) {
    vendorWhere = 'WHERE po.vendor_id = ?';
    params.push(vendorId);
  }

  params.push(limit);
  const [rows] = await pool.query(
    `SELECT po.id, po.po_number, po.status, po.grand_total, po.created_at,
            v.name AS vendor_name, r.title AS rfq_title
     FROM purchase_orders po
     JOIN vendors v ON v.id = po.vendor_id
     JOIN rfqs r ON r.id = po.rfq_id
     ${vendorWhere}
     ORDER BY po.created_at DESC
     LIMIT ?`,
    params
  );

  return rows;
};

const getRecentInvoices = async (limit = 5, vendorId = null) => {
  const params = [];
  let vendorWhere = '';

  if (vendorId) {
    vendorWhere = 'WHERE po.vendor_id = ?';
    params.push(vendorId);
  }

  params.push(limit);
  const [rows] = await pool.query(
    `SELECT i.id, i.invoice_number, i.status, i.grand_total, i.issue_date AS issued_at,
            po.po_number, v.name AS vendor_name
     FROM invoices i
     JOIN purchase_orders po ON po.id = i.po_id
     JOIN vendors v ON v.id = po.vendor_id
     ${vendorWhere}
     ORDER BY i.issue_date DESC
     LIMIT ?`,
    params
  );

  return rows;
};

const getBaseCharts = async () => {
  const [monthlyTrend, rfqStatusDistribution, spendingOverview, vendorActivityOverview] = await Promise.all([
    getMonthlyTrend(),
    getRFQStatusDistribution(),
    getSpendingOverview(),
    getVendorActivityOverview()
  ]);

  return {
    monthlyTrend,
    rfqStatusDistribution,
    spendingOverview,
    vendorActivityOverview
  };
};

const getVendorIdForUser = async (user) => {
  const [rows] = await pool.execute(
    `SELECT id FROM vendors WHERE email = ? LIMIT 1`,
    [user.email]
  );

  return rows[0]?.id || null;
};

export const getAdminDashboardData = async () => {
  const [
    [[userRow]],
    [[vendorRow]],
    [[activeVendorRow]],
    [[totalRfqRow]],
    [[openRfqRow]],
    [[closedRfqRow]],
    [[spendRow]],
    recentActivity,
    recentRFQs,
    recentPOs,
    recentInvoices,
    charts,
    [systemSummaryRows]
  ] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS count FROM users'),
    pool.execute('SELECT COUNT(*) AS count FROM vendors'),
    pool.execute("SELECT COUNT(*) AS count FROM vendors WHERE status = 'active'"),
    pool.execute('SELECT COUNT(*) AS count FROM rfqs'),
    pool.execute("SELECT COUNT(*) AS count FROM rfqs WHERE status = 'open'"),
    pool.execute("SELECT COUNT(*) AS count FROM rfqs WHERE status = 'closed'"),
    pool.execute('SELECT COALESCE(SUM(grand_total), 0) AS total FROM purchase_orders'),
    getRecentActivity(),
    getRecentRFQs(),
    getRecentPOs(),
    getRecentInvoices(),
    getBaseCharts(),
    pool.execute(
      `SELECT
        (SELECT COUNT(*) FROM quotations WHERE status = 'submitted') AS submitted_quotations,
        (SELECT COUNT(*) FROM approval_requests WHERE status = 'Pending Approval') AS pending_approvals,
        (SELECT COUNT(*) FROM invoices WHERE status = 'paid') AS paid_invoices,
        (SELECT COUNT(*) FROM vendors WHERE status = 'active') AS active_vendors`
    )
  ]);

  return {
    role: 'admin',
    kpis: [
      { key: 'totalUsers', label: 'Total Users', value: userRow.count },
      { key: 'totalVendors', label: 'Total Vendors', value: vendorRow.count },
      { key: 'activeVendors', label: 'Active Vendors', value: activeVendorRow.count },
      { key: 'totalRFQs', label: 'Total RFQs', value: totalRfqRow.count },
      { key: 'openRFQs', label: 'Open RFQs', value: openRfqRow.count },
      { key: 'closedRFQs', label: 'Closed RFQs', value: closedRfqRow.count },
      { key: 'totalProcurementSpend', label: 'Total Procurement Spend', value: toNumber(spendRow.total), format: 'currency' }
    ],
    recentActivity,
    recentRFQs,
    recentPOs,
    recentInvoices,
    systemSummary: systemSummaryRows[0],
    charts
  };
};

export const getOfficerDashboardData = async () => {
  const [
    [[totalVendorRow]],
    [[activeVendorRow]],
    [[totalRfqRow]],
    [[openRfqRow]],
    [[closedRfqRow]],
    [[pendingQuotationRow]],
    [[pendingApprovalRow]],
    [[poRow]],
    recentRFQs,
    recentPOs,
    recentInvoices,
    charts
  ] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS count FROM vendors'),
    pool.execute("SELECT COUNT(*) AS count FROM vendors WHERE status = 'active'"),
    pool.execute('SELECT COUNT(*) AS count FROM rfqs'),
    pool.execute("SELECT COUNT(*) AS count FROM rfqs WHERE status = 'open'"),
    pool.execute("SELECT COUNT(*) AS count FROM rfqs WHERE status = 'closed'"),
    pool.execute("SELECT COUNT(*) AS count FROM quotations WHERE status = 'submitted'"),
    pool.execute("SELECT COUNT(*) AS count FROM approval_requests WHERE status = 'Pending Approval'"),
    pool.execute('SELECT COUNT(*) AS count FROM purchase_orders'),
    getRecentRFQs(),
    getRecentPOs(),
    getRecentInvoices(),
    getBaseCharts()
  ]);

  return {
    role: 'officer',
    kpis: [
      { key: 'totalVendors', label: 'Total Vendors', value: totalVendorRow.count },
      { key: 'activeVendors', label: 'Active Vendors', value: activeVendorRow.count },
      { key: 'totalRFQs', label: 'Total RFQs', value: totalRfqRow.count },
      { key: 'openRFQs', label: 'Open RFQs', value: openRfqRow.count },
      { key: 'closedRFQs', label: 'Closed RFQs', value: closedRfqRow.count },
      { key: 'pendingQuotations', label: 'Pending Quotations', value: pendingQuotationRow.count },
      { key: 'pendingApprovals', label: 'Pending Approvals', value: pendingApprovalRow.count },
      { key: 'purchaseOrdersGenerated', label: 'Purchase Orders Generated', value: poRow.count }
    ],
    quickActions: [
      { label: 'Create RFQ', path: '/rfqs/create' },
      { label: 'Compare Quotations', path: '/quotations' },
      { label: 'Generate PO', path: '/approvals' },
      { label: 'Generate Invoice', path: '/invoices' }
    ],
    recentRFQs,
    recentPOs,
    recentInvoices,
    charts
  };
};

export const getManagerDashboardData = async () => {
  const [
    [[pendingRow]],
    [[approvedRow]],
    [[rejectedRow]],
    [[successRow]],
    [approvalQueue],
    [recentDecisions],
    charts
  ] = await Promise.all([
    pool.execute("SELECT COUNT(*) AS count FROM approval_requests WHERE status = 'Pending Approval'"),
    pool.execute("SELECT COUNT(*) AS count FROM approval_requests WHERE status = 'Approved'"),
    pool.execute("SELECT COUNT(*) AS count FROM approval_requests WHERE status = 'Rejected'"),
    pool.execute(
      `SELECT
        COALESCE(SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END), 0) AS approved,
        COALESCE(SUM(CASE WHEN status IN ('Approved', 'Rejected') THEN 1 ELSE 0 END), 0) AS decided
       FROM approval_requests`
    ),
    pool.execute(
      `SELECT a.id, 
              'pending' AS decision, 
              q.grand_total AS total_price, 
              q.delivery_days, 
              r.title AS rfq_title,
              v.name AS vendor_name, 
              r.submission_deadline AS rfq_deadline
       FROM approval_requests a
       JOIN quotations q ON q.id = a.quotation_id
       JOIN vendors v ON v.id = q.vendor_id
       JOIN rfqs r ON r.id = q.rfq_id
       WHERE a.status = 'Pending Approval'
       ORDER BY a.id DESC
       LIMIT 5`
    ),
    pool.execute(
      `SELECT a.id, 
              CASE WHEN a.status = 'Approved' THEN 'approved' ELSE 'rejected' END AS decision, 
              a.remarks, 
              COALESCE(a.approved_at, a.rejected_at) AS decided_at, 
              q.grand_total AS total_price,
              r.title AS rfq_title, 
              v.name AS vendor_name
       FROM approval_requests a
       JOIN quotations q ON q.id = a.quotation_id
       JOIN vendors v ON v.id = q.vendor_id
       JOIN rfqs r ON r.id = q.rfq_id
       WHERE a.status IN ('Approved', 'Rejected')
       ORDER BY COALESCE(a.approved_at, a.rejected_at) DESC
       LIMIT 5`
    ),
    getBaseCharts()
  ]);

  const successRate = successRow.decided > 0 ? Number(((successRow.approved / successRow.decided) * 100).toFixed(1)) : 0;

  return {
    role: 'manager',
    kpis: [
      { key: 'pendingApprovals', label: 'Pending Approvals', value: pendingRow.count },
      { key: 'approvedRequests', label: 'Approved Requests', value: approvedRow.count },
      { key: 'rejectedRequests', label: 'Rejected Requests', value: rejectedRow.count },
      { key: 'approvalSuccessRate', label: 'Approval Success Rate', value: successRate, suffix: '%' }
    ],
    approvalQueue,
    recentApprovalDecisions: recentDecisions,
    charts
  };
};

export const getVendorDashboardData = async (user) => {
  const vendorId = await getVendorIdForUser(user);

  if (!vendorId) {
    return {
      role: 'vendor',
      vendorProfileMissing: true,
      kpis: [
        { key: 'assignedRFQs', label: 'Assigned RFQs', value: 0 },
        { key: 'submittedQuotations', label: 'Submitted Quotations', value: 0 },
        { key: 'purchaseOrdersReceived', label: 'Purchase Orders Received', value: 0 },
        { key: 'invoiceStatus', label: 'Invoice Status', value: 0 }
      ],
      recentRFQs: [],
      quotationTimeline: [],
      recentPOs: [],
      recentInvoices: [],
      charts: await getBaseCharts()
    };
  }

  const [
    [[assignedRow]],
    [[quotationRow]],
    [[poRow]],
    [[invoiceRow]],
    recentRFQs,
    recentPOs,
    recentInvoices,
    [quotationTimeline],
    charts
  ] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS count FROM rfq_vendors WHERE vendor_id = ?', [vendorId]),
    pool.execute("SELECT COUNT(*) AS count FROM quotations WHERE vendor_id = ? AND status IN ('submitted', 'selected', 'rejected')", [vendorId]),
    pool.execute(
      `SELECT COUNT(*) AS count
       FROM purchase_orders po
       WHERE po.vendor_id = ?`,
      [vendorId]
    ),
    pool.execute(
      `SELECT COUNT(*) AS count
       FROM invoices i
       JOIN purchase_orders po ON po.id = i.po_id
       WHERE po.vendor_id = ? AND i.status IN ('generated', 'sent')`,
      [vendorId]
    ),
    getRecentRFQs(5, vendorId),
    getRecentPOs(5, vendorId),
    getRecentInvoices(5, vendorId),
    pool.execute(
      `SELECT status, COUNT(*) AS count
       FROM quotations
       WHERE vendor_id = ?
       GROUP BY status`,
      [vendorId]
    ),
    getBaseCharts()
  ]);

  return {
    role: 'vendor',
    vendorProfileMissing: false,
    kpis: [
      { key: 'assignedRFQs', label: 'Assigned RFQs', value: assignedRow.count },
      { key: 'submittedQuotations', label: 'Submitted Quotations', value: quotationRow.count },
      { key: 'purchaseOrdersReceived', label: 'Purchase Orders Received', value: poRow.count },
      { key: 'invoiceStatus', label: 'Invoice Status', value: invoiceRow.count }
    ],
    recentRFQs,
    quotationTimeline,
    recentPOs,
    recentInvoices,
    charts
  };
};

export const getFinanceDashboardData = async () => {
  const [
    [[totalInvoicesRow]],
    [[paidInvoicesRow]],
    [[unpaidInvoicesRow]],
    [[totalPaidAmountRow]],
    [[totalPendingAmountRow]],
    recentInvoices,
    recentPOs,
    charts
  ] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS count FROM invoices'),
    pool.execute("SELECT COUNT(*) AS count FROM invoices WHERE status = 'Paid'"),
    pool.execute("SELECT COUNT(*) AS count FROM invoices WHERE status != 'Paid' AND status != 'Cancelled'"),
    pool.execute("SELECT COALESCE(SUM(grand_total), 0) AS total FROM invoices WHERE status = 'Paid'"),
    pool.execute("SELECT COALESCE(SUM(grand_total), 0) AS total FROM invoices WHERE status != 'Paid' AND status != 'Cancelled'"),
    getRecentInvoices(6),
    getRecentPOs(6),
    getBaseCharts()
  ]);

  return {
    role: 'finance',
    kpis: [
      { key: 'totalInvoices', label: 'Total Invoices', value: totalInvoicesRow.count },
      { key: 'paidInvoices', label: 'Paid Invoices', value: paidInvoicesRow.count },
      { key: 'unpaidInvoices', label: 'Unpaid Invoices', value: unpaidInvoicesRow.count },
      { key: 'totalPaidAmount', label: 'Total Paid Amount', value: toNumber(totalPaidAmountRow.total), format: 'currency' },
      { key: 'totalPendingAmount', label: 'Total Pending Amount', value: toNumber(totalPendingAmountRow.total), format: 'currency' }
    ],
    quickActions: [
      { label: 'View Invoices', path: '/invoices' },
      { label: 'View Purchase Orders', path: '/purchase-orders' },
      { label: 'Financial Reports', path: '/reports' }
    ],
    recentInvoices,
    recentPOs,
    charts
  };
};
