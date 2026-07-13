import pool from '../config/db.js';
import { generatePONumber } from '../utils/poNumberGenerator.js';
import { calculateQuotationAmounts } from '../utils/priceCalculator.js';
import { logAndNotify } from '../utils/activityAndNotificationHelper.js';

/**
 * Helper: Log action to purchase_order_history
 */
const logPOHistory = async (conn, poId, actionType, userId, remarks = null) => {
  await conn.execute(
    `INSERT INTO purchase_order_history (purchase_order_id, action_type, action_by, remarks)
     VALUES (?, ?, ?, ?)`,
    [poId, actionType, userId, remarks]
  );
};

/**
 * Create a new Purchase Order from an approved quotation (Initial status: Draft)
 */
export const createPurchaseOrder = async (payload, userId) => {
  const {
    approval_request_id,
    issue_date,
    expected_delivery_date,
    delivery_method,
    delivery_address,
    notes,
    terms_conditions
  } = payload;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Fetch approval request and verify status = 'Approved'
    const [appRows] = await conn.execute(
      `SELECT ar.status, ar.rfq_id, ar.quotation_id, ar.vendor_id 
       FROM approval_requests ar
       WHERE ar.id = ?`,
      [approval_request_id]
    );

    if (appRows.length === 0) {
      const err = new Error('Approval request not found.');
      err.statusCode = 404;
      throw err;
    }

    const appReq = appRows[0];
    if (appReq.status !== 'Approved') {
      const err = new Error(`Purchase Order can only be created from Approved quotation requests. Current status: ${appReq.status}`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Check if an active (non-cancelled) PO already exists for this quotation
    const [existingPO] = await conn.execute(
      `SELECT id FROM purchase_orders WHERE quotation_id = ? AND status != 'Cancelled'`,
      [appReq.quotation_id]
    );
    if (existingPO.length > 0) {
      const err = new Error('An active Purchase Order already exists for this approved quotation.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Confirm vendor exists
    const [vendorRows] = await conn.execute(
      `SELECT id FROM vendors WHERE id = ?`,
      [appReq.vendor_id]
    );
    if (vendorRows.length === 0) {
      const err = new Error('Vendor does not exist.');
      err.statusCode = 404;
      throw err;
    }

    // 4. Populate items (either custom payload items or from quotation_items)
    let items = [];
    if (payload.items && payload.items.length > 0) {
      items = payload.items;
    } else {
      const [qItems] = await conn.execute(
        `SELECT qi.id AS quotation_item_id, ri.item_name, ri.description, qi.quantity, ri.unit, qi.unit_price, qi.tax_percentage, qi.discount_percentage
         FROM quotation_items qi
         JOIN rfq_items ri ON qi.rfq_item_id = ri.id
         WHERE qi.quotation_id = ?`,
        [appReq.quotation_id]
      );
      if (qItems.length === 0) {
        const err = new Error('Quotation items do not exist.');
        err.statusCode = 400;
        throw err;
      }
      items = qItems;
    }

    // 5. Centralized price calculation
    const calcResult = calculateQuotationAmounts(items);

    // 6. Generate PO Number
    const poNumber = await generatePONumber(conn);

    // 7. Insert Purchase Order Header
    const [poResult] = await conn.execute(
      `INSERT INTO purchase_orders (
         po_number, approval_request_id, rfq_id, quotation_id, vendor_id, 
         issue_date, expected_delivery_date, delivery_method, delivery_address, 
         notes, terms_conditions, subtotal, tax_amount, discount_amount, grand_total, 
         status, created_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)`,
      [
        poNumber, approval_request_id, appReq.rfq_id, appReq.quotation_id, appReq.vendor_id,
        issue_date, expected_delivery_date, delivery_method || null, delivery_address,
        notes || null, terms_conditions || null, calcResult.subtotal, calcResult.tax_amount,
        calcResult.discount_amount, calcResult.grand_total, userId
      ]
    );

    const poId = poResult.insertId;

    // 8. Insert Purchase Order Items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const lineCalculations = calcResult.items[i];
      await conn.execute(
        `INSERT INTO purchase_order_items (
           purchase_order_id, quotation_item_id, item_name, description, quantity, unit, 
           unit_price, tax_percentage, discount_percentage, line_total
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          poId,
          item.quotation_item_id || null,
          item.item_name,
          item.description || null,
          item.quantity,
          item.unit || 'Units',
          item.unit_price,
          item.tax_percentage || 0.00,
          item.discount_percentage || 0.00,
          lineCalculations.total_amount
        ]
      );
    }

    // 9. Log History
    await logPOHistory(conn, poId, 'Created', userId, 'Purchase Order created as Draft.');

    await conn.commit();
    conn.release();

    // 10. Log Activity & Send Notifications (failsafe log)
    try {
      const newPO = await getPurchaseOrderById(poId, { role: 'admin' });
      await logAndNotify(userId, {
        action: 'PO_GENERATED',
        module: 'Purchase Orders',
        entityType: 'purchase_order',
        entityId: poId,
        description: `Draft Purchase Order ${poNumber} created from approval request ID ${approval_request_id}`,
        oldValue: null,
        newValue: newPO
      });
    } catch (actErr) {
      console.error('Error logging PO activity:', actErr.message);
    }

    return { id: poId, po_number: poNumber, status: 'Draft' };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Get all Purchase Orders with paginations, sorting, filtering, and searching
 */
export const getPurchaseOrders = async (query, user) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const offset = (page - 1) * limit;

  const { status, search, sort = 'id_desc' } = query;

  let sql = `
    SELECT 
      po.id, 
      po.po_number, 
      po.issue_date, 
      po.expected_delivery_date, 
      po.grand_total, 
      po.status, 
      po.created_at,
      v.name AS vendor_name, 
      r.title AS rfq_title
    FROM purchase_orders po
    JOIN vendors v ON po.vendor_id = v.id
    JOIN rfqs r ON po.rfq_id = r.id
  `;

  const params = [];
  const conditions = [];

  // Enforce role-based scoping
  if (user.role === 'vendor') {
    conditions.push(`v.email = ?`);
    params.push(user.email);
  }

  if (status) {
    conditions.push(`po.status = ?`);
    params.push(status);
  }

  if (search) {
    conditions.push(`(po.po_number LIKE ? OR v.name LIKE ?)`);
    const pattern = `%${search}%`;
    params.push(pattern, pattern);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }

  // Sorting
  if (sort === 'id_asc') {
    sql += ` ORDER BY po.id ASC`;
  } else if (sort === 'date_asc') {
    sql += ` ORDER BY po.issue_date ASC`;
  } else if (sort === 'date_desc') {
    sql += ` ORDER BY po.issue_date DESC`;
  } else {
    sql += ` ORDER BY po.id DESC`;
  }

  // Count total records for pagination
  let countSql = `
    SELECT COUNT(*) AS total 
    FROM purchase_orders po
    JOIN vendors v ON po.vendor_id = v.id
  `;
  const countParams = [...params];
  if (conditions.length > 0) {
    countSql += ` WHERE ` + conditions.join(' AND ');
  }

  const [countRows] = await pool.execute(countSql, countParams);
  const total = countRows[0].total;

  // Append pagination
  sql += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);

  // Fetch KPI Counts for Statistics Panel
  let statsSql = `
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN po.status = 'Issued' THEN 1 ELSE 0 END) AS issued,
      SUM(CASE WHEN po.status = 'Issued' THEN 1 ELSE 0 END) AS pending_acknowledgement,
      SUM(CASE WHEN po.status = 'Fulfilled' THEN 1 ELSE 0 END) AS fulfilled,
      SUM(CASE WHEN po.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled
    FROM purchase_orders po
    JOIN vendors v ON po.vendor_id = v.id
  `;
  const statsParams = [];
  if (user.role === 'vendor') {
    statsSql += ` WHERE v.email = ?`;
    statsParams.push(user.email);
  }
  const [statsRows] = await pool.execute(statsSql, statsParams);
  const stats = statsRows[0];

  return {
    purchaseOrders: rows,
    stats: {
      total: stats.total || 0,
      issued: stats.issued || 0,
      pending_acknowledgement: stats.pending_acknowledgement || 0,
      fulfilled: stats.fulfilled || 0,
      cancelled: stats.cancelled || 0
    },
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get detailed Purchase Order by ID
 */
export const getPurchaseOrderById = async (id, user) => {
  const sql = `
    SELECT 
      po.*,
      v.name AS vendor_name,
      v.email AS vendor_email,
      v.phone AS vendor_phone,
      v.address AS vendor_address,
      v.gst_number AS vendor_gst,
      r.title AS rfq_title,
      r.description AS rfq_description,
      ar.approval_number,
      ar.approved_at AS approval_decided_at,
      ar.remarks AS approval_remarks,
      u.name AS approver_name,
      creator.name AS creator_name,
      inv.id AS invoice_id,
      inv.invoice_number AS invoice_number
    FROM purchase_orders po
    JOIN vendors v ON po.vendor_id = v.id
    JOIN rfqs r ON po.rfq_id = r.id
    JOIN approval_requests ar ON po.approval_request_id = ar.id
    JOIN users u ON ar.assigned_to = u.id
    JOIN users creator ON po.created_by = creator.id
    LEFT JOIN invoices inv ON inv.po_id = po.id
    WHERE po.id = ?
  `;

  const [rows] = await pool.execute(sql, [id]);
  if (rows.length === 0) {
    return null;
  }

  const po = rows[0];

  // Vendor access check
  if (user.role === 'vendor' && po.vendor_email !== user.email) {
    const err = new Error('Access Denied: You are not authorized to view this purchase order.');
    err.statusCode = 403;
    throw err;
  }

  // Fetch Items
  const [items] = await pool.execute(
    `SELECT * FROM purchase_order_items WHERE purchase_order_id = ? ORDER BY id ASC`,
    [id]
  );
  po.line_items = items;

  // Log "Viewed" action if viewed by Vendor for the first time
  if (user.role === 'vendor') {
    const [viewedRows] = await pool.execute(
      `SELECT id FROM purchase_order_history 
       WHERE purchase_order_id = ? AND action_type = 'Viewed' AND action_by = ?`,
      [id, user.id]
    );
    if (viewedRows.length === 0) {
      await pool.execute(
        `INSERT INTO purchase_order_history (purchase_order_id, action_type, action_by, remarks) 
         VALUES (?, 'Viewed', ?, 'Purchase Order viewed by Vendor.')`,
        [id, user.id]
      );
    }
  }

  // Fetch History Timeline
  const [history] = await pool.execute(
    `SELECT h.*, u.name AS action_by_name, u.role AS action_by_role
     FROM purchase_order_history h
     JOIN users u ON h.action_by = u.id
     WHERE h.purchase_order_id = ?
     ORDER BY h.action_date ASC, h.id ASC`,
    [id]
  );
  po.history = history;

  return po;
};

/**
 * Update a Draft Purchase Order
 */
export const updatePurchaseOrder = async (id, payload, userId) => {
  const oldPO = await getPurchaseOrderById(id, { role: 'admin' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Fetch current PO details and check status
    const [poRows] = await conn.execute(
      `SELECT status, po_number FROM purchase_orders WHERE id = ?`,
      [id]
    );

    if (poRows.length === 0) {
      const err = new Error('Purchase Order not found.');
      err.statusCode = 404;
      throw err;
    }

    const po = poRows[0];
    if (po.status !== 'Draft') {
      const err = new Error('Only Draft Purchase Orders can be updated.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Build update fields
    const {
      issue_date,
      expected_delivery_date,
      delivery_method,
      delivery_address,
      notes,
      terms_conditions,
      items
    } = payload;

    // 3. Centralized calculation if items are updated
    let calcResult = null;
    if (items && items.length > 0) {
      calcResult = calculateQuotationAmounts(items);
    }

    // Update Header
    let updateSql = `
      UPDATE purchase_orders SET 
        issue_date = COALESCE(?, issue_date),
        expected_delivery_date = COALESCE(?, expected_delivery_date),
        delivery_method = ?,
        delivery_address = COALESCE(?, delivery_address),
        notes = ?,
        terms_conditions = ?
    `;
    const params = [
      issue_date || null,
      expected_delivery_date || null,
      delivery_method || null,
      delivery_address || null,
      notes || null,
      terms_conditions || null
    ];

    if (calcResult) {
      updateSql += `,
        subtotal = ?,
        tax_amount = ?,
        discount_amount = ?,
        grand_total = ?
      `;
      params.push(
        calcResult.subtotal,
        calcResult.tax_amount,
        calcResult.discount_amount,
        calcResult.grand_total
      );
    }

    updateSql += ` WHERE id = ?`;
    params.push(id);

    await conn.execute(updateSql, params);

    // 4. Update items if provided
    if (items && items.length > 0) {
      // Delete old items
      await conn.execute(`DELETE FROM purchase_order_items WHERE purchase_order_id = ?`, [id]);

      // Insert new items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const lineCalculations = calcResult.items[i];
        await conn.execute(
          `INSERT INTO purchase_order_items (
             purchase_order_id, quotation_item_id, item_name, description, quantity, unit, 
             unit_price, tax_percentage, discount_percentage, line_total
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            item.quotation_item_id || null,
            item.item_name,
            item.description || null,
            item.quantity,
            item.unit || 'Units',
            item.unit_price,
            item.tax_percentage || 0.00,
            item.discount_percentage || 0.00,
            lineCalculations.total_amount
          ]
        );
      }
    }

    // 5. Log History
    await logPOHistory(conn, id, 'Updated', userId, 'Purchase Order details updated.');

    await conn.commit();
    conn.release();

    try {
      const newPO = await getPurchaseOrderById(id, { role: 'admin' });
      await logAndNotify(userId, {
        action: 'PO_UPDATED',
        module: 'Purchase Orders',
        entityType: 'purchase_order',
        entityId: id,
        description: `Purchase Order ${po.po_number} updated`,
        oldValue: oldPO,
        newValue: newPO
      });
    } catch (actErr) {
      console.error('Error logging PO update activity:', actErr.message);
    }

    return { id, po_number: po.po_number, status: 'Draft' };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Delete a Draft Purchase Order
 */
export const deletePurchaseOrder = async (id, userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [poRows] = await conn.execute(
      `SELECT status, po_number FROM purchase_orders WHERE id = ?`,
      [id]
    );

    if (poRows.length === 0) {
      const err = new Error('Purchase Order not found.');
      err.statusCode = 404;
      throw err;
    }

    if (poRows[0].status !== 'Draft') {
      const err = new Error('Only Draft Purchase Orders can be deleted.');
      err.statusCode = 400;
      throw err;
    }

    // Delete PO (cascade will handle items and history)
    await conn.execute(`DELETE FROM purchase_orders WHERE id = ?`, [id]);

    await conn.commit();
    conn.release();
    return { id, message: 'Purchase Order deleted successfully.' };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Issue a Purchase Order
 */
export const issuePurchaseOrder = async (id, userId) => {
  const oldPO = await getPurchaseOrderById(id, { role: 'admin' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [poRows] = await conn.execute(
      `SELECT status, po_number FROM purchase_orders WHERE id = ?`,
      [id]
    );

    if (poRows.length === 0) {
      const err = new Error('Purchase Order not found.');
      err.statusCode = 404;
      throw err;
    }

    const po = poRows[0];
    if (po.status !== 'Draft') {
      const err = new Error('Only Draft Purchase Orders can be issued.');
      err.statusCode = 400;
      throw err;
    }

    // Transition status to Issued
    await conn.execute(
      `UPDATE purchase_orders SET status = 'Issued' WHERE id = ?`,
      [id]
    );

    // Log History
    await logPOHistory(conn, id, 'Issued', userId, 'Purchase Order officially issued to Vendor.');

    await conn.commit();
    conn.release();

    try {
      const newPO = await getPurchaseOrderById(id, { role: 'admin' });
      await logAndNotify(userId, {
        action: 'PO_SENT', // Dispatches notifications
        module: 'Purchase Orders',
        entityType: 'purchase_order',
        entityId: id,
        description: `Purchase Order ${po.po_number} officially issued and sent to vendor.`,
        oldValue: oldPO,
        newValue: newPO
      });
    } catch (actErr) {
      console.error('Error logging PO issued activity:', actErr.message);
    }
    return { id, po_number: po.po_number, status: 'Issued' };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Cancel a Purchase Order
 */
export const cancelPurchaseOrder = async (id, remarks, userId) => {
  const oldPO = await getPurchaseOrderById(id, { role: 'admin' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [poRows] = await conn.execute(
      `SELECT status, po_number FROM purchase_orders WHERE id = ?`,
      [id]
    );

    if (poRows.length === 0) {
      const err = new Error('Purchase Order not found.');
      err.statusCode = 404;
      throw err;
    }

    const po = poRows[0];
    if (po.status === 'Cancelled' || po.status === 'Fulfilled') {
      const err = new Error(`Cannot cancel a Purchase Order that is already ${po.status}.`);
      err.statusCode = 400;
      throw err;
    }

    // Transition status to Cancelled
    await conn.execute(
      `UPDATE purchase_orders SET status = 'Cancelled' WHERE id = ?`,
      [id]
    );

    // Log History
    await logPOHistory(conn, id, 'Cancelled', userId, remarks || 'Purchase Order cancelled by procurement officer.');

    await conn.commit();
    conn.release();

    try {
      const newPO = await getPurchaseOrderById(id, { role: 'admin' });
      await logAndNotify(userId, {
        action: 'PO_CANCELLED',
        module: 'Purchase Orders',
        entityType: 'purchase_order',
        entityId: id,
        description: `Purchase Order ${po.po_number} cancelled. Remarks: ${remarks || 'None'}`,
        oldValue: oldPO,
        newValue: newPO
      });
    } catch (actErr) {
      console.error('Error logging PO cancellation activity:', actErr.message);
    }
    return { id, po_number: po.po_number, status: 'Cancelled' };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Vendor Acknowledge Purchase Order
 */
export const acknowledgePurchaseOrder = async (id, remarks, vendorEmail, userId) => {
  const oldPO = await getPurchaseOrderById(id, { role: 'admin' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [poRows] = await conn.execute(
      `SELECT po.status, po.po_number, v.email AS vendor_email 
       FROM purchase_orders po
       JOIN vendors v ON po.vendor_id = v.id
       WHERE po.id = ?`,
      [id]
    );

    if (poRows.length === 0) {
      const err = new Error('Purchase Order not found.');
      err.statusCode = 404;
      throw err;
    }

    const po = poRows[0];
    if (po.vendor_email !== vendorEmail) {
      const err = new Error('Access Denied: You are not the vendor assigned to this Purchase Order.');
      err.statusCode = 403;
      throw err;
    }

    if (po.status !== 'Issued') {
      const err = new Error(`Only Issued Purchase Orders can be acknowledged. Current status: ${po.status}`);
      err.statusCode = 400;
      throw err;
    }

    // Transition status to Acknowledged
    await conn.execute(
      `UPDATE purchase_orders SET status = 'Acknowledged' WHERE id = ?`,
      [id]
    );

    // Log History
    await logPOHistory(conn, id, 'Acknowledged', userId, remarks || 'Vendor acknowledged receipt of Purchase Order.');

    await conn.commit();
    conn.release();

    try {
      const newPO = await getPurchaseOrderById(id, { role: 'admin' });
      await logAndNotify(userId, {
        action: 'PO_ACKNOWLEDGED',
        module: 'Purchase Orders',
        entityType: 'purchase_order',
        entityId: id,
        description: `Purchase Order ${po.po_number} acknowledged by supplier. Remarks: ${remarks || 'None'}`,
        oldValue: oldPO,
        newValue: newPO
      });
    } catch (actErr) {
      console.error('Error logging PO acknowledgement activity:', actErr.message);
    }
    return { id, po_number: po.po_number, status: 'Acknowledged' };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Update PO status manually to Partially Fulfilled / Fulfilled (Officer/Admin only)
 */
export const updatePOStatusManual = async (id, status, remarks, userId) => {
  const oldPO = await getPurchaseOrderById(id, { role: 'admin' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [poRows] = await conn.execute(
      `SELECT status, po_number FROM purchase_orders WHERE id = ?`,
      [id]
    );

    if (poRows.length === 0) {
      const err = new Error('Purchase Order not found.');
      err.statusCode = 404;
      throw err;
    }

    const po = poRows[0];
    const validStatuses = ['Partially Fulfilled', 'Fulfilled'];
    if (!validStatuses.includes(status)) {
      const err = new Error('Invalid manual status. Choose from Partially Fulfilled or Fulfilled.');
      err.statusCode = 400;
      throw err;
    }

    if (po.status === 'Cancelled' || po.status === 'Fulfilled') {
      const err = new Error(`Cannot change status of a PO that is already ${po.status}.`);
      err.statusCode = 400;
      throw err;
    }

    // Transition status
    await conn.execute(
      `UPDATE purchase_orders SET status = ? WHERE id = ?`,
      [status, id]
    );

    // Map history action types
    const historyAction = status === 'Partially Fulfilled' ? 'PartiallyFulfilled' : 'Fulfilled';

    // Log History
    await logPOHistory(conn, id, historyAction, userId, remarks || `Purchase Order status manually updated to ${status}.`);

    await conn.commit();
    conn.release();

    try {
      const newPO = await getPurchaseOrderById(id, { role: 'admin' });
      await logAndNotify(userId, {
        action: status === 'Fulfilled' ? 'PO_COMPLETED' : 'PO_PARTIALLY_FULFILLED',
        module: 'Purchase Orders',
        entityType: 'purchase_order',
        entityId: id,
        description: `Purchase Order status updated to ${status}. Remarks: ${remarks || 'None'}`,
        oldValue: oldPO,
        newValue: newPO
      });
    } catch (actErr) {
      console.error('Error logging PO status update activity:', actErr.message);
    }
    return { id, po_number: po.po_number, status };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Get History Timeline logs for a Purchase Order
 */
export const getPOHistory = async (id) => {
  const [rows] = await pool.execute(
    `SELECT h.*, u.name AS action_by_name, u.role AS action_by_role
     FROM purchase_order_history h
     JOIN users u ON h.action_by = u.id
     WHERE h.purchase_order_id = ?
     ORDER BY h.action_date ASC, h.id ASC`,
    [id]
  );
  return rows;
};
