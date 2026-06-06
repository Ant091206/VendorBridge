import pool from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * Returns all purchase orders in the system with optional search and status filtering.
 */
export const getAllPurchaseOrders = async (status, search) => {
  let sql = `
    SELECT 
      po.id, 
      po.po_number, 
      po.subtotal, 
      po.tax_amount, 
      po.grand_total, 
      po.status, 
      po.created_at,
      po.generated_at,
      po.updated_at,
      po.generated_by,
      v.name AS vendor_name, 
      v.email AS vendor_email, 
      v.gst_number AS vendor_gst,
      r.title AS rfq_title, 
      r.quantity AS rfq_quantity
    FROM purchase_orders po
    JOIN approvals a ON po.approval_id = a.id
    JOIN quotations q ON a.quotation_id = q.id
    JOIN vendors v ON q.vendor_id = v.id
    JOIN rfqs r ON q.rfq_id = r.id
  `;
  
  const params = [];
  const conditions = [];
  
  if (status) {
    conditions.push(`po.status = ?`);
    params.push(status);
  }
  
  if (search) {
    conditions.push(`(po.po_number LIKE ? OR v.name LIKE ?)`);
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }
  
  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }
  
  sql += ` ORDER BY po.id DESC`;
  
  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * Returns purchase orders issued to the currently logged-in vendor.
 */
export const getMyPurchaseOrders = async (vendorEmail) => {
  const [vendorRecord] = await pool.execute(
    'SELECT id FROM vendors WHERE email = ?',
    [vendorEmail]
  );
  
  if (vendorRecord.length === 0) {
    throw { statusCode: 404, message: 'Vendor record not found for the logged-in email.' };
  }
  
  const vendorId = vendorRecord[0].id;
  
  const sql = `
    SELECT 
      po.id,
      po.po_number, 
      po.grand_total, 
      po.status, 
      po.created_at,
      po.generated_at,
      r.title AS rfq_title
    FROM purchase_orders po
    JOIN approvals a ON po.approval_id = a.id
    JOIN quotations q ON a.quotation_id = q.id
    JOIN vendors v ON q.vendor_id = v.id
    JOIN rfqs r ON q.rfq_id = r.id
    WHERE v.id = ?
    ORDER BY po.id DESC
  `;
  
  const [rows] = await pool.execute(sql, [vendorId]);
  return rows;
};

/**
 * Returns single purchase order full details. Checks vendor ownership if restricted.
 */
export const getPurchaseOrderById = async (id, userRole, vendorEmail) => {
  const sql = `
    SELECT 
      po.id,
      po.po_number,
      po.subtotal,
      po.tax_amount,
      po.grand_total,
      po.status,
      po.created_at,
      po.generated_at,
      po.updated_at,
      po.generated_by,
      v.id AS vendor_id,
      v.name AS vendor_name,
      v.email AS vendor_email,
      v.phone AS vendor_phone,
      v.address AS vendor_address,
      v.gst_number AS vendor_gst,
      r.id AS rfq_id,
      r.title AS rfq_title,
      r.quantity AS rfq_quantity,
      r.description AS rfq_description,
      q.id AS quotation_id,
      q.unit_price AS quotation_unit_price,
      q.delivery_days AS quotation_delivery_days,
      q.notes AS quotation_notes,
      a.id AS approval_id,
      a.remarks AS approval_remarks,
      a.decided_at AS approval_decided_at,
      u.name AS approver_name,
      inv.id AS invoice_id,
      inv.invoice_number AS invoice_number
    FROM purchase_orders po
    JOIN approvals a ON po.approval_id = a.id
    JOIN quotations q ON a.quotation_id = q.id
    JOIN vendors v ON q.vendor_id = v.id
    JOIN rfqs r ON q.rfq_id = r.id
    LEFT JOIN users u ON a.approver_id = u.id
    LEFT JOIN invoices inv ON inv.po_id = po.id
    WHERE po.id = ?
  `;
  
  const [rows] = await pool.execute(sql, [id]);
  if (rows.length === 0) {
    return null;
  }
  
  const po = rows[0];
  
  if (userRole === 'vendor') {
    const [vendorRecord] = await pool.execute(
      'SELECT id FROM vendors WHERE email = ?',
      [vendorEmail]
    );
    
    if (vendorRecord.length === 0 || vendorRecord[0].id !== po.vendor_id) {
      throw { statusCode: 403, message: 'Access Denied: You are not authorized to view this purchase order.' };
    }
  }
  
  // Construct line items list
  po.line_items = [
    {
      description: po.rfq_title,
      quantity: parseInt(po.rfq_quantity, 10),
      unit_price: parseFloat(po.quotation_unit_price),
      subtotal: parseFloat(po.subtotal),
      tax_rate: 18,
      tax_amount: parseFloat(po.tax_amount),
      grand_total: parseFloat(po.grand_total)
    }
  ];
  
  return po;
};

/**
 * Updates PO status following state machine rules:
 * generated -> sent -> completed
 */
export const updatePOStatus = async (id, status, userId) => {
  const conn = await pool.getConnection();
  try {
    const validStatuses = ['sent', 'completed', 'acknowledged', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw { statusCode: 400, message: 'Invalid status. Status can only be updated to: sent, completed, acknowledged, cancelled.' };
    }
    
    const [poRows] = await conn.execute(
      'SELECT status FROM purchase_orders WHERE id = ?',
      [id]
    );
    
    if (poRows.length === 0) {
      throw { statusCode: 404, message: 'Purchase order not found.' };
    }
    
    const currentStatus = poRows[0].status;
    
    // State machine check
    if (currentStatus === 'generated' && status !== 'sent' && status !== 'cancelled') {
      throw { statusCode: 400, message: 'Invalid state transition. A newly generated PO must be marked as "sent" or "cancelled".' };
    }
    
    if (currentStatus === 'sent' && status !== 'completed' && status !== 'acknowledged' && status !== 'cancelled') {
      throw { statusCode: 400, message: 'Invalid state transition from "sent".' };
    }
    
    if (currentStatus === 'completed') {
      throw { statusCode: 400, message: 'Purchase order is already completed and cannot be transitioned further.' };
    }
    
    if (currentStatus === 'cancelled') {
      throw { statusCode: 400, message: 'Purchase order is cancelled and cannot be transitioned further.' };
    }
    
    await conn.beginTransaction();
    
    await conn.execute(
      'UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    const actionLogName = `PO_${status.toUpperCase()}`;
    await logActivity(conn, userId, 'purchase_order', id, actionLogName);
    
    await conn.commit();
    conn.release();
    
    return { id, status };
  } catch (error) {
    if (conn.connection && conn.connection._protocol && conn.connection._protocol._fatalError === null) {
      await conn.rollback();
    }
    conn.release();
    throw error;
  }
};
