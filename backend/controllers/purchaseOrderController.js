import pool from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * GET /api/purchase-orders
 * Returns all purchase orders in the system.
 * Protected: officer and admin only (and managers for approval linkages)
 * Query Params: ?status=generated|sent|completed &search=po_number_or_vendor_name
 */
export const getAllPurchaseOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let sql = `
      SELECT 
        po.id, 
        po.po_number, 
        po.subtotal, 
        po.tax_amount, 
        po.grand_total, 
        po.status, 
        po.created_at,
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
    
    return res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error in getAllPurchaseOrders:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve purchase orders.'
    });
  }
};

/**
 * GET /api/purchase-orders/vendor/my-orders
 * Returns purchase orders issued to the currently logged-in vendor.
 * Protected: vendor only
 */
export const getMyPurchaseOrders = async (req, res) => {
  try {
    // Look up vendor ID associated with the vendor's login email
    const [vendorRecord] = await pool.execute(
      'SELECT id FROM vendors WHERE email = ?',
      [req.user.email]
    );
    
    if (vendorRecord.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Vendor record not found for the logged-in email.'
      });
    }
    
    const vendorId = vendorRecord[0].id;
    
    const sql = `
      SELECT 
        po.id,
        po.po_number, 
        po.grand_total, 
        po.status, 
        po.created_at,
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
    
    return res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error in getMyPurchaseOrders:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve vendor purchase orders.'
    });
  }
};

/**
 * GET /api/purchase-orders/:id
 * Returns complete single purchase order details.
 * Protected: officer, admin, manager, or the vendor it belongs to.
 */
export const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        po.id,
        po.po_number,
        po.subtotal,
        po.tax_amount,
        po.grand_total,
        po.status,
        po.created_at,
        v.id AS vendor_id,
        v.name AS vendor_name,
        v.email AS vendor_email,
        v.phone AS vendor_phone,
        v.address AS vendor_address,
        v.gst_number AS vendor_gst,
        r.title AS rfq_title,
        r.quantity AS rfq_quantity,
        r.description AS rfq_description,
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
      return res.status(404).json({
        status: 'error',
        message: 'Purchase order not found.'
      });
    }
    
    const po = rows[0];
    
    // If user is a vendor, check if this PO belongs to them
    if (req.user.role === 'vendor') {
      const [vendorRecord] = await pool.execute(
        'SELECT id FROM vendors WHERE email = ?',
        [req.user.email]
      );
      
      if (vendorRecord.length === 0 || vendorRecord[0].id !== po.vendor_id) {
        return res.status(403).json({
          status: 'error',
          message: 'Access Denied: You are not authorized to view this purchase order.'
        });
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
    
    return res.status(200).json({
      status: 'success',
      data: po
    });
  } catch (error) {
    console.error('Error in getPurchaseOrderById:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve purchase order details.'
    });
  }
};

/**
 * PUT /api/purchase-orders/:id/status
 * Updates PO status following state machine rules:
 * generated -> sent -> completed
 * Protected: officer and admin only (and manager for operational flow)
 */
export const updatePOStatus = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['sent', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Status can only be updated to: sent, completed.'
      });
    }
    
    // Get current PO status
    const [poRows] = await conn.execute(
      'SELECT status FROM purchase_orders WHERE id = ?',
      [id]
    );
    
    if (poRows.length === 0) {
      conn.release();
      return res.status(404).json({
        status: 'error',
        message: 'Purchase order not found.'
      });
    }
    
    const currentStatus = poRows[0].status;
    
    // Validate state machine transitions
    // generated -> sent -> completed
    if (currentStatus === 'generated' && status !== 'sent') {
      conn.release();
      return res.status(400).json({
        status: 'error',
        message: 'Invalid state transition. A newly generated PO must be marked as "sent" first.'
      });
    }
    
    if (currentStatus === 'sent' && status !== 'completed') {
      conn.release();
      return res.status(400).json({
        status: 'error',
        message: 'Invalid state transition. A "sent" PO can only transition to "completed".'
      });
    }
    
    if (currentStatus === 'completed') {
      conn.release();
      return res.status(400).json({
        status: 'error',
        message: 'Purchase order is already completed and cannot be transitioned further.'
      });
    }
    
    // Execute update inside a transaction
    await conn.beginTransaction();
    
    await conn.execute(
      'UPDATE purchase_orders SET status = ? WHERE id = ?',
      [status, id]
    );
    
    // Log the activity
    const actionLogName = status === 'sent' ? 'PO_SENT' : 'PO_COMPLETED';
    await logActivity(conn, req.user.id, 'purchase_order', id, actionLogName);
    
    await conn.commit();
    conn.release();
    
    return res.status(200).json({
      status: 'success',
      message: `Purchase order status updated to ${status}.`,
      data: {
        id: id,
        status: status
      }
    });
    
  } catch (error) {
    if (conn.connection && conn.connection._protocol && conn.connection._protocol._fatalError === null) {
      await conn.rollback();
    }
    conn.release();
    console.error('Error in updatePOStatus:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update purchase order status.'
    });
  }
};
