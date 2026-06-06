import pool from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';
import { generatePONumber } from '../utils/poNumberGenerator.js';
import { sendEmail } from '../services/emailService.js';

/**
 * GET /api/approvals
 * Returns all approvals with quotation, vendor, and RFQ details.
 * Query Param: ?decision=pending|approved|rejected
 * Protected: manager and admin only
 */
export const getAllApprovals = async (req, res) => {
  try {
    const { decision } = req.query;
    
    let sql = `
      SELECT 
        a.id,
        a.decision,
        a.remarks,
        a.decided_at,
        u.name AS approver_name,
        q.unit_price,
        q.total_price,
        q.delivery_days,
        v.name AS vendor_name,
        v.email AS vendor_email,
        vc.name AS vendor_category,
        r.title AS rfq_title,
        r.quantity AS rfq_quantity,
        r.deadline AS rfq_deadline
      FROM approvals a
      JOIN quotations q ON a.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      JOIN rfqs r ON q.rfq_id = r.id
      LEFT JOIN users u ON a.approver_id = u.id
    `;
    
    const params = [];
    if (decision) {
      sql += ` WHERE a.decision = ?`;
      params.push(decision);
    }
    
    sql += ` ORDER BY a.id DESC`;
    
    const [rows] = await pool.execute(sql, params);
    
    return res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error in getAllApprovals:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve approvals.'
    });
  }
};

/**
 * GET /api/approvals/pending
 * Returns only pending approvals.
 * Protected: manager and admin only
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const sql = `
      SELECT 
        a.id,
        a.decision,
        a.remarks,
        a.decided_at,
        u.name AS approver_name,
        q.unit_price,
        q.total_price,
        q.delivery_days,
        v.name AS vendor_name,
        v.email AS vendor_email,
        vc.name AS vendor_category,
        r.title AS rfq_title,
        r.quantity AS rfq_quantity,
        r.deadline AS rfq_deadline
      FROM approvals a
      JOIN quotations q ON a.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      JOIN rfqs r ON q.rfq_id = r.id
      LEFT JOIN users u ON a.approver_id = u.id
      WHERE a.decision = 'pending'
      ORDER BY a.id DESC
    `;
    
    const [rows] = await pool.execute(sql);
    
    return res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error in getPendingApprovals:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve pending approvals.'
    });
  }
};

/**
 * GET /api/approvals/:id
 * Returns single approval full details including price comparisons.
 * Protected: manager and admin only
 */
export const getApprovalById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        a.id,
        a.decision,
        a.remarks,
        a.decided_at,
        u.name AS approver_name,
        q.id AS quotation_id,
        q.unit_price,
        q.total_price,
        q.delivery_days,
        q.notes AS vendor_notes,
        v.name AS vendor_name,
        v.email AS vendor_email,
        v.gst_number AS vendor_gst,
        vc.name AS vendor_category,
        r.id AS rfq_id,
        r.title AS rfq_title,
        r.description AS rfq_description,
        r.quantity AS rfq_quantity,
        r.deadline AS rfq_deadline,
        po.id AS po_id
      FROM approvals a
      JOIN quotations q ON a.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      JOIN rfqs r ON q.rfq_id = r.id
      LEFT JOIN users u ON a.approver_id = u.id
      LEFT JOIN purchase_orders po ON po.approval_id = a.id
      WHERE a.id = ?
    `;
    
    const [rows] = await pool.execute(sql, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Approval request not found.'
      });
    }
    
    const approval = rows[0];
    const rfqId = approval.rfq_id;
    
    // Fetch quotes to calculate comparison metrics
    const [quotes] = await pool.execute(
      `SELECT total_price FROM quotations WHERE rfq_id = ? AND status IN ('submitted', 'selected', 'rejected')`,
      [rfqId]
    );
    
    const totalVendors = quotes.length;
    let lowestPrice = 0;
    
    if (totalVendors > 0) {
      const prices = quotes.map(q => parseFloat(q.total_price));
      lowestPrice = Math.min(...prices);
    }
    
    const selectedPrice = parseFloat(approval.total_price);
    const priceDifference = selectedPrice - lowestPrice;
    
    // Handle division by zero
    const percentageDifference = lowestPrice > 0 
      ? parseFloat(((priceDifference / lowestPrice) * 100).toFixed(1)) 
      : 0;
      
    approval.comparison_summary = {
      total_vendors: totalVendors,
      lowest_price: lowestPrice,
      difference: priceDifference,
      percentage_difference: percentageDifference
    };
    
    return res.status(200).json({
      status: 'success',
      data: approval
    });
  } catch (error) {
    console.error('Error in getApprovalById:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve approval details.'
    });
  }
};

/**
 * PUT /api/approvals/:id/approve
 * Approves a pending request, auto-generates a PO, updates database, and triggers email notifications.
 * Protected: manager only
 */
export const approveRequest = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    
    // Retrieve the approval request details
    const [approvalRows] = await conn.execute(
      `SELECT a.*, q.total_price, r.title AS rfq_title, r.created_by AS rfq_creator_id,
              v.name AS vendor_name, v.email AS vendor_email
       FROM approvals a
       JOIN quotations q ON a.quotation_id = q.id
       JOIN rfqs r ON q.rfq_id = r.id
       JOIN vendors v ON q.vendor_id = v.id
       WHERE a.id = ?`,
      [id]
    );
    
    if (approvalRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Approval request not found.'
      });
    }
    
    const approval = approvalRows[0];
    
    // Validate pending status
    if (approval.decision !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `Approval request is already ${approval.decision}.`
      });
    }
    
    // Validate authorization: must be manager/admin or assigned approver
    const isManager = req.user.role === 'manager' || req.user.role === 'admin';
    const isAssignedApprover = req.user.id === approval.approver_id;
    if (!isManager && !isAssignedApprover) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: Only the assigned approver or a manager can approve this request.'
      });
    }
    
    // Retrieve the officer details (who created the RFQ) to notify them
    const [officerRows] = await conn.execute(
      `SELECT name, email FROM users WHERE id = ?`,
      [approval.rfq_creator_id]
    );
    
    const officer = officerRows[0] || { name: 'Procurement Officer', email: null };
    
    // Start transactional processing
    await conn.beginTransaction();
    
    // Update approval details
    await conn.execute(
      `UPDATE approvals 
       SET decision = 'approved', remarks = ?, decided_at = CURRENT_TIMESTAMP, approver_id = ?
       WHERE id = ?`,
      [remarks || 'Approved', req.user.id, id]
    );
    
    // Generate sequential PO number
    const poNumber = await generatePONumber(conn);
    
    // Compute monetary parts: 18% GST standard
    const subtotal = parseFloat(approval.total_price);
    const taxAmount = subtotal * 0.18;
    const grandTotal = subtotal + taxAmount;
    
    // Create Purchase Order record
    const [poResult] = await conn.execute(
      `INSERT INTO purchase_orders (po_number, approval_id, subtotal, tax_amount, grand_total, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'generated', CURRENT_TIMESTAMP)`,
      [poNumber, id, subtotal, taxAmount, grandTotal]
    );
    
    const poId = poResult.insertId;
    
    // Log activity
    await logActivity(conn, req.user.id, 'approval', id, 'APPROVAL_APPROVED');
    await logActivity(conn, req.user.id, 'purchase_order', poId, 'PO_GENERATED');
    
    await conn.commit();
    conn.release();
    
    // Trigger emails asynchronously in the background so failures don't block request success
    const indianFormattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(grandTotal);
    
    // 1. Email to Procurement Officer
    if (officer.email) {
      const officerSubject = 'Procurement Approved — VendorBridge';
      const officerBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-top: 0;">Procurement Approved</h2>
          <p>Dear ${officer.name},</p>
          <p>The procurement request for <strong>${approval.rfq_title}</strong> has been approved by <strong>${req.user.name}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0; width: 35%;">Vendor:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${approval.vendor_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Amount:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #111827;">${indianFormattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Purchase Order:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #0284c7;">${poNumber}</td>
            </tr>
          </table>
          <p>Purchase Order <strong>${poNumber}</strong> has been generated automatically.</p>
          <p>Please login to VendorBridge to view the purchase order and dispatch details.</p>
          <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b;">
            Regards,<br>
            <strong>VendorBridge Team</strong>
          </p>
        </div>
      `;
      sendEmail(officer.email, officerSubject, officerBody);
    }
    
    // 2. Email to Selected Vendor
    if (approval.vendor_email) {
      const vendorSubject = 'Purchase Order Generated — VendorBridge';
      const vendorBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-top: 0;">Purchase Order Generated</h2>
          <p>Dear ${approval.vendor_name},</p>
          <p>Your quotation for <strong>${approval.rfq_title}</strong> has been approved.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0; width: 35%;">Purchase Order:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #0284c7;">${poNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Total Amount:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #111827;">${indianFormattedAmount} <span style="font-weight: normal; font-size: 12px; color: #64748b;">(incl. 18% GST)</span></td>
            </tr>
          </table>
          <p>Our procurement team will be in touch shortly regarding delivery coordination.</p>
          <p>You can track the PO status through your VendorBridge portal.</p>
          <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b;">
            Regards,<br>
            <strong>VendorBridge Team</strong>
          </p>
        </div>
      `;
      sendEmail(approval.vendor_email, vendorSubject, vendorBody);
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Approval request approved. Purchase Order generated.',
      data: {
        approval_id: id,
        decision: 'approved',
        purchase_order: {
          id: poId,
          po_number: poNumber,
          subtotal: subtotal,
          tax_amount: taxAmount,
          grand_total: grandTotal,
          status: 'generated'
        }
      }
    });
    
  } catch (error) {
    if (conn.connection && conn.connection._protocol && conn.connection._protocol._fatalError === null) {
      await conn.rollback();
    }
    conn.release();
    console.error('Error in approveRequest:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to approve procurement request.'
    });
  }
};

/**
 * PUT /api/approvals/:id/reject
 * Rejects a pending request, reverts RFQ & quotations statuses, logs details, and triggers officer email.
 * Protected: manager only
 */
export const rejectRequest = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    
    // Validate remarks
    if (!remarks || remarks.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection remarks (reason) are required.'
      });
    }
    
    // Retrieve the approval request details
    const [approvalRows] = await conn.execute(
      `SELECT a.*, q.rfq_id, r.title AS rfq_title, r.created_by AS rfq_creator_id,
              v.name AS vendor_name
       FROM approvals a
       JOIN quotations q ON a.quotation_id = q.id
       JOIN rfqs r ON q.rfq_id = r.id
       JOIN vendors v ON q.vendor_id = v.id
       WHERE a.id = ?`,
      [id]
    );
    
    if (approvalRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Approval request not found.'
      });
    }
    
    const approval = approvalRows[0];
    const rfqId = approval.rfq_id;
    
    // Validate pending status
    if (approval.decision !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `Approval request is already ${approval.decision}.`
      });
    }
    
    // Retrieve the officer details (who created the RFQ) to notify them
    const [officerRows] = await conn.execute(
      `SELECT name, email FROM users WHERE id = ?`,
      [approval.rfq_creator_id]
    );
    
    const officer = officerRows[0] || { name: 'Procurement Officer', email: null };
    
    // Start transactional processing
    await conn.beginTransaction();
    
    // Update approval details
    await conn.execute(
      `UPDATE approvals 
       SET decision = 'rejected', remarks = ?, decided_at = CURRENT_TIMESTAMP, approver_id = ?
       WHERE id = ?`,
      [remarks, req.user.id, id]
    );
    
    // Revert selected & rejected quotations of this RFQ back to 'submitted'
    await conn.execute(
      `UPDATE quotations 
       SET status = 'submitted' 
       WHERE rfq_id = ? AND status IN ('selected', 'rejected')`,
      [rfqId]
    );
    
    // Revert RFQ status back to 'open'
    await conn.execute(
      `UPDATE rfqs 
       SET status = 'open' 
       WHERE id = ?`,
      [rfqId]
    );
    
    // Log activity
    await logActivity(conn, req.user.id, 'approval', id, 'APPROVAL_REJECTED');
    
    await conn.commit();
    conn.release();
    
    // Trigger emails asynchronously in the background
    if (officer.email) {
      const officerSubject = 'Procurement Rejected — VendorBridge';
      const officerBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-top: 0;">Procurement Request Rejected</h2>
          <p>Dear ${officer.name},</p>
          <p>The procurement request for <strong>${approval.rfq_title}</strong> has been rejected by <strong>${req.user.name}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0; width: 35%;">Vendor Selected:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${approval.vendor_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0; color: #ef4444;">Reason for Rejection:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-style: italic;">${remarks}</td>
            </tr>
          </table>
          <p>The RFQ status has been reset to <strong>Open</strong>, and quotations have been reset to <strong>Submitted</strong> to allow you to review and select a vendor again.</p>
          <p>Please login to VendorBridge to review the RFQ comparison screen.</p>
          <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b;">
            Regards,<br>
            <strong>VendorBridge Team</strong>
          </p>
        </div>
      `;
      sendEmail(officer.email, officerSubject, officerBody);
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Procurement request rejected. State reverted.',
      data: {
        approval_id: id,
        decision: 'rejected',
        remarks: remarks
      }
    });
    
  } catch (error) {
    if (conn.connection && conn.connection._protocol && conn.connection._protocol._fatalError === null) {
      await conn.rollback();
    }
    conn.release();
    console.error('Error in rejectRequest:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to reject procurement request.'
    });
  }
};
