import pool from '../config/db.js';
import { logAndNotify } from '../utils/activityAndNotificationHelper.js';

/**
 * Helper: Generate unique Approval Number in format APR-YYYY-XXXX
 */
const generateApprovalNumber = async (conn) => {
  const year = new Date().getFullYear();
  const [rows] = await conn.execute(
    `SELECT approval_number 
     FROM approval_requests 
     WHERE approval_number LIKE ? 
     ORDER BY id DESC 
     LIMIT 1`,
    [`APR-${year}-%`]
  );

  let next = 1;
  if (rows.length > 0 && rows[0].approval_number) {
    const last = rows[0].approval_number.split('-').pop();
    next = (parseInt(last, 10) || 0) + 1;
  }
  return `APR-${year}-${String(next).padStart(4, '0')}`;
};

/**
 * Helper: Write history record to approval_history
 */
const logHistory = async (conn, requestId, actionType, userId, remarks = null) => {
  await conn.execute(
    `INSERT INTO approval_history (approval_request_id, action_type, action_by, remarks)
     VALUES (?, ?, ?, ?)`,
    [requestId, actionType, userId, remarks]
  );
};

/**
 * Create a new Approval Request (initial state: Draft)
 */
export const createApprovalRequest = async (payload, requestedBy) => {
  const { rfq_id, quotation_id, vendor_id, assigned_to, selection_reason, remarks } = payload;

  // 1. Verify Quotation is 'selected'
  const [quoteRows] = await pool.execute(
    `SELECT id, status, rfq_id, vendor_id FROM quotations WHERE id = ?`,
    [quotation_id]
  );
  if (quoteRows.length === 0) {
    const error = new Error('Selected quotation not found.');
    error.statusCode = 404;
    throw error;
  }
  const quote = quoteRows[0];
  if (quote.status !== 'selected') {
    const error = new Error(`Approval workflow can only start for quotations with status 'selected'. Current status: ${quote.status}`);
    error.statusCode = 400;
    throw error;
  }
  if (quote.rfq_id !== parseInt(rfq_id) || quote.vendor_id !== parseInt(vendor_id)) {
    const error = new Error('Quotation mismatch with RFQ or Vendor.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Verify assigned approver is Manager or Admin
  const [userRows] = await pool.execute(
    `SELECT id, role FROM users WHERE id = ? AND role IN ('manager', 'admin')`,
    [assigned_to]
  );
  if (userRows.length === 0) {
    const error = new Error('Assigned approver must exist and have Manager/Admin role.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Verify no active approval request exists for this quotation
  const [existingRows] = await pool.execute(
    `SELECT id FROM approval_requests WHERE quotation_id = ? AND status NOT IN ('Cancelled', 'Rejected')`,
    [quotation_id]
  );
  if (existingRows.length > 0) {
    const error = new Error('An active approval request already exists for this quotation.');
    error.statusCode = 400;
    throw error;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const approvalNumber = await generateApprovalNumber(conn);

    const [result] = await conn.execute(
      `INSERT INTO approval_requests (
         approval_number, rfq_id, quotation_id, vendor_id, requested_by, assigned_to, selection_reason, remarks, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft')`,
      [approvalNumber, rfq_id, quotation_id, vendor_id, requestedBy, assigned_to, selection_reason.trim(), remarks ? remarks.trim() : null]
    );

    const requestId = result.insertId;

    // Log history
    await logHistory(conn, requestId, 'Created', requestedBy, 'Approval request initialized in Draft mode.');

    await conn.commit();
    conn.release();

    // Log activity
    await logAndNotify(requestedBy, {
      action: 'APPROVAL_CREATED',
      module: 'Approval Workflow',
      entityType: 'approval_request',
      entityId: requestId,
      description: `Approval request ${approvalNumber} created in Draft status.`,
      ipAddress: null
    });

    return { id: requestId, approval_number: approvalNumber, status: 'Draft' };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Fetch all approval requests with filtering, pagination, and sorting.
 */
export const getApprovalRequests = async (query = {}, user) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  // Scoping logic: Procurement Officers see their creations; Managers see their assignments; Admins see all.
  if (user.role === 'officer') {
    conditions.push('ar.requested_by = ?');
    params.push(user.id);
  } else if (user.role === 'manager') {
    conditions.push('ar.assigned_to = ?');
    params.push(user.id);
  }

  // Filters
  if (query.status) {
    conditions.push('ar.status = ?');
    params.push(query.status);
  }
  if (query.search) {
    conditions.push('(ar.approval_number LIKE ? OR r.title LIKE ? OR v.name LIKE ?)');
    const term = `%${query.search}%`;
    params.push(term, term, term);
  }
  if (query.start_date) {
    conditions.push('ar.request_date >= ?');
    params.push(query.start_date);
  }
  if (query.end_date) {
    conditions.push('ar.request_date <= ?');
    params.push(query.end_date);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sort
  let orderClause = 'ORDER BY ar.id DESC';
  if (query.sort === 'date_asc') orderClause = 'ORDER BY ar.request_date ASC';
  else if (query.sort === 'date_desc') orderClause = 'ORDER BY ar.request_date DESC';
  else if (query.sort === 'amount_asc') orderClause = 'ORDER BY q.grand_total ASC';
  else if (query.sort === 'amount_desc') orderClause = 'ORDER BY q.grand_total DESC';

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total 
     FROM approval_requests ar
     JOIN rfqs r ON ar.rfq_id = r.id
     JOIN vendors v ON ar.vendor_id = v.id
     JOIN quotations q ON ar.quotation_id = q.id
     ${where}`,
    params
  );

  const [statsRows] = await pool.execute(
    `SELECT 
       COALESCE(SUM(CASE WHEN ar.status = 'Pending Approval' THEN 1 ELSE 0 END), 0) AS pending,
       COALESCE(SUM(CASE WHEN ar.status = 'Approved' THEN 1 ELSE 0 END), 0) AS approved,
       COALESCE(SUM(CASE WHEN ar.status = 'Rejected' THEN 1 ELSE 0 END), 0) AS rejected,
       COUNT(*) AS total
     FROM approval_requests ar
     JOIN rfqs r ON ar.rfq_id = r.id
     JOIN vendors v ON ar.vendor_id = v.id
     JOIN quotations q ON ar.quotation_id = q.id
     ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT 
       ar.*,
       r.rfq_number,
       r.title AS rfq_title,
       r.status AS rfq_status,
       v.name AS vendor_name,
       v.status AS vendor_status,
       q.quotation_number,
       q.grand_total,
       q.delivery_days,
       req.name AS requester_name,
       appr.name AS approver_name
     FROM approval_requests ar
     JOIN rfqs r ON ar.rfq_id = r.id
     JOIN vendors v ON ar.vendor_id = v.id
     JOIN quotations q ON ar.quotation_id = q.id
     JOIN users req ON ar.requested_by = req.id
     JOIN users appr ON ar.assigned_to = appr.id
     ${where}
     ${orderClause}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const total = countRows[0].total;

  return {
    data: rows,
    stats: statsRows[0] || { pending: 0, approved: 0, rejected: 0, total: 0 },
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Fetch a single approval request details and trace "Viewed" actions.
 */
export const getApprovalRequestById = async (id, user) => {
  const [rows] = await pool.execute(
    `SELECT 
       ar.*,
       r.rfq_number,
       r.title AS rfq_title,
       r.description AS rfq_description,
       (SELECT COALESCE(SUM(quantity), 0) FROM rfq_items WHERE rfq_id = r.id) AS rfq_quantity,
       r.submission_deadline AS rfq_deadline,
       v.name AS vendor_name,
       v.email AS vendor_email,
       v.phone AS vendor_phone,
       v.address_line1 AS vendor_address,
       v.status AS vendor_status,
       q.quotation_number,
       q.subtotal,
       q.tax_amount,
       q.discount_amount,
       q.grand_total,
       q.delivery_days,
       q.notes AS vendor_notes,
       req.name AS requester_name,
       req.role AS requester_role,
       appr.name AS approver_name,
       appr.role AS approver_role
     FROM approval_requests ar
     JOIN rfqs r ON ar.rfq_id = r.id
     JOIN vendors v ON ar.vendor_id = v.id
     JOIN quotations q ON ar.quotation_id = q.id
     JOIN users req ON ar.requested_by = req.id
     JOIN users appr ON ar.assigned_to = appr.id
     WHERE ar.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error('Approval request not found.');
    error.statusCode = 404;
    throw error;
  }

  const request = rows[0];

  // Scoping check
  if (user.role === 'officer' && request.requested_by !== user.id) {
    const error = new Error('Access Denied. You cannot view this approval request.');
    error.statusCode = 403;
    throw error;
  }
  if (user.role === 'manager' && request.assigned_to !== user.id) {
    const error = new Error('Access Denied. This approval request is not assigned to you.');
    error.statusCode = 403;
    throw error;
  }

  // Insert "Viewed" history log if viewed by assigned approver for the first time
  if (user.id === request.assigned_to) {
    const [viewHistory] = await pool.execute(
      `SELECT id FROM approval_history WHERE approval_request_id = ? AND action_type = 'Viewed' AND action_by = ?`,
      [id, user.id]
    );
    if (viewHistory.length === 0) {
      await pool.execute(
        `INSERT INTO approval_history (approval_request_id, action_type, action_by, remarks) VALUES (?, 'Viewed', ?, 'Review initialized by approver.')`,
        [id, user.id]
      );
    }
  }

  return request;
};

/**
 * Update a Draft approval request
 */
export const updateApprovalRequest = async (id, payload, requesterId) => {
  const { assigned_to, selection_reason, remarks } = payload;

  const [rows] = await pool.execute(
    `SELECT * FROM approval_requests WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const error = new Error('Approval request not found.');
    error.statusCode = 404;
    throw error;
  }
  const request = rows[0];

  if (request.requested_by !== requesterId) {
    const error = new Error('Only the creator of the approval request can modify it.');
    error.statusCode = 403;
    throw error;
  }
  if (request.status !== 'Draft') {
    const error = new Error('Only approval requests in Draft status can be updated.');
    error.statusCode = 400;
    throw error;
  }

  // Verify new approver exists if changed
  if (assigned_to && assigned_to !== request.assigned_to) {
    const [userRows] = await pool.execute(
      `SELECT id FROM users WHERE id = ? AND role IN ('manager', 'admin')`,
      [assigned_to]
    );
    if (userRows.length === 0) {
      const error = new Error('Assigned approver must exist and have Manager/Admin role.');
      error.statusCode = 400;
      throw error;
    }
  }

  const updates = [];
  const params = [];

  if (assigned_to) {
    updates.push('assigned_to = ?');
    params.push(assigned_to);
  }
  if (selection_reason) {
    updates.push('selection_reason = ?');
    params.push(selection_reason.trim());
  }
  if (remarks !== undefined) {
    updates.push('remarks = ?');
    params.push(remarks ? remarks.trim() : null);
  }

  if (updates.length > 0) {
    params.push(id);
    await pool.execute(
      `UPDATE approval_requests SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }

  return { id };
};

/**
 * Submit an approval request (status transitions: Draft -> Pending Approval)
 */
export const submitApprovalRequest = async (id, requesterId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM approval_requests WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const error = new Error('Approval request not found.');
    error.statusCode = 404;
    throw error;
  }
  const request = rows[0];

  if (request.requested_by !== requesterId) {
    const error = new Error('Only the creator can submit this request.');
    error.statusCode = 403;
    throw error;
  }
  if (request.status !== 'Draft') {
    const error = new Error(`Request is already in ${request.status} status. Only Draft requests can be submitted.`);
    error.statusCode = 400;
    throw error;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE approval_requests SET status = 'Pending Approval' WHERE id = ?`,
      [id]
    );

    await logHistory(conn, id, 'Submitted', requesterId, 'Approval request submitted to manager for review.');

    await conn.commit();
    conn.release();

    // Trigger Notification
    await logAndNotify(requesterId, {
      action: 'APPROVAL_REQUESTED',
      module: 'Approval Workflow',
      entityType: 'approval_request',
      entityId: id,
      description: `Approval request ${request.approval_number} submitted to manager.`,
      ipAddress: null
    });

    return { id, status: 'Pending Approval' };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Approve a Pending Approval request (status transitions: Pending Approval -> Approved)
 */
export const approveApprovalRequest = async (id, remarks, approverId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM approval_requests WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const error = new Error('Approval request not found.');
    error.statusCode = 404;
    throw error;
  }
  const request = rows[0];

  if (request.status !== 'Pending Approval') {
    const error = new Error(`Request is in ${request.status} status. Only Pending Approval requests can be approved.`);
    error.statusCode = 400;
    throw error;
  }

  // Verify authority
  const [approverRows] = await pool.execute('SELECT id, role, name FROM users WHERE id = ?', [approverId]);
  const approver = approverRows[0];
  if (request.assigned_to !== approverId && approver?.role !== 'admin') {
    const error = new Error('Access Denied. You are not authorized to approve this request.');
    error.statusCode = 403;
    throw error;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Transition approval request
    await conn.execute(
      `UPDATE approval_requests 
       SET status = 'Approved', approved_at = CURRENT_TIMESTAMP, remarks = ? 
       WHERE id = ?`,
      [remarks ? remarks.trim() : 'Approved', id]
    );

    // 2. Keep quotation status as 'selected' (it already is, no need to revert. Selected means approved once status is Approved)
    // 3. Log history
    await logHistory(conn, id, 'Approved', approverId, remarks ? remarks.trim() : 'Approved');

    await conn.commit();
    conn.release();

    // Trigger notification
    await logAndNotify(approverId, {
      action: 'APPROVAL_APPROVED',
      module: 'Approval Workflow',
      entityType: 'approval_request',
      entityId: id,
      description: `Approval request ${request.approval_number} was approved by ${approver?.name || 'Manager'}.`,
      ipAddress: null
    });

    return { id, status: 'Approved' };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Reject a Pending Approval request (status transitions: Pending Approval -> Rejected)
 */
export const rejectApprovalRequest = async (id, remarks, approverId) => {
  if (!remarks || !remarks.trim()) {
    const error = new Error('Remarks are mandatory when rejecting approval request.');
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    `SELECT * FROM approval_requests WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const error = new Error('Approval request not found.');
    error.statusCode = 404;
    throw error;
  }
  const request = rows[0];

  if (request.status !== 'Pending Approval') {
    const error = new Error(`Request is in ${request.status} status. Only Pending Approval requests can be rejected.`);
    error.statusCode = 400;
    throw error;
  }

  // Verify authority
  const [approverRows] = await pool.execute('SELECT id, role, name FROM users WHERE id = ?', [approverId]);
  const approver = approverRows[0];
  if (request.assigned_to !== approverId && approver?.role !== 'admin') {
    const error = new Error('Access Denied. You are not authorized to reject this request.');
    error.statusCode = 403;
    throw error;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Transition approval request
    await conn.execute(
      `UPDATE approval_requests 
       SET status = 'Rejected', rejected_at = CURRENT_TIMESTAMP, remarks = ? 
       WHERE id = ?`,
      [remarks.trim(), id]
    );

    // 2. Revert quotation back to 'submitted'
    await conn.execute(
      `UPDATE quotations SET status = 'submitted' WHERE id = ?`,
      [request.quotation_id]
    );

    // 3. Revert RFQ back to 'open' (published) status to allow select re-evaluations
    await conn.execute(
      `UPDATE rfqs SET status = 'open' WHERE id = ?`,
      [request.rfq_id]
    );

    // 4. Log history
    await logHistory(conn, id, 'Rejected', approverId, remarks.trim());

    await conn.commit();
    conn.release();

    // Trigger notification
    await logAndNotify(approverId, {
      action: 'APPROVAL_REJECTED',
      module: 'Approval Workflow',
      entityType: 'approval_request',
      entityId: id,
      description: `Approval request ${request.approval_number} was rejected by ${approver?.name || 'Manager'}. Reason: ${remarks}`,
      ipAddress: null
    });

    return { id, status: 'Rejected' };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Cancel an approval request (status transitions: Draft/Pending Approval -> Cancelled)
 */
export const cancelApprovalRequest = async (id, requesterId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM approval_requests WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const error = new Error('Approval request not found.');
    error.statusCode = 404;
    throw error;
  }
  const request = rows[0];

  if (request.requested_by !== requesterId) {
    const error = new Error('Only the creator can cancel this approval request.');
    error.statusCode = 403;
    throw error;
  }

  const invalidStatuses = ['Approved', 'Rejected', 'Cancelled'];
  if (invalidStatuses.includes(request.status)) {
    const error = new Error(`Request is already in ${request.status} status and cannot be cancelled.`);
    error.statusCode = 400;
    throw error;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Transition status
    await conn.execute(
      `UPDATE approval_requests SET status = 'Cancelled' WHERE id = ?`,
      [id]
    );

    // 2. Revert quotation back to 'submitted'
    await conn.execute(
      `UPDATE quotations SET status = 'submitted' WHERE id = ?`,
      [request.quotation_id]
    );

    // 3. Revert RFQ back to 'open' status
    await conn.execute(
      `UPDATE rfqs SET status = 'open' WHERE id = ?`,
      [request.rfq_id]
    );

    // 4. Log history
    await logHistory(conn, id, 'Cancelled', requesterId, 'Approval request cancelled by creator.');

    await conn.commit();
    conn.release();

    return { id, status: 'Cancelled' };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Fetch chronological history timeline logs.
 */
export const getApprovalRequestHistory = async (requestId) => {
  const [rows] = await pool.execute(
    `SELECT 
       ah.*,
       u.name AS user_name,
       u.role AS user_role
     FROM approval_history ah
     JOIN users u ON ah.action_by = u.id
     WHERE ah.approval_request_id = ?
     ORDER BY ah.id ASC`,
    [requestId]
  );
  return rows;
};
