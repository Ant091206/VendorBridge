import pool from '../config/db.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Activity and Notification Helper
 */

// Helper: Get user IDs by roles
async function getUserIdsByRoles(roles = []) {
  if (roles.length === 0) return [];
  const placeholders = roles.map(() => '?').join(',');
  const [rows] = await pool.execute(`SELECT id FROM users WHERE role IN (${placeholders})`, roles);
  return rows.map(r => r.id);
}

// Helper: Get user ID associated with a vendor ID
async function getUserIdByVendorId(vendorId) {
  const [vRows] = await pool.execute('SELECT email FROM vendors WHERE id = ? LIMIT 1', [vendorId]);
  if (vRows.length === 0) return null;
  const [uRows] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [vRows[0].email]);
  return uRows[0]?.id || null;
}

// Helper: Get user ID of RFQ creator
async function getRfqCreatorUserId(rfqId) {
  const [rows] = await pool.execute('SELECT created_by FROM rfqs WHERE id = ? LIMIT 1', [rfqId]);
  return rows[0]?.created_by || null;
}

/**
 * Utility to write activity log and dispatch notifications to appropriate roles.
 */
export async function logAndNotify(userId, { action, module, entityType, entityId, description, ipAddress, oldValue = null, newValue = null, deviceInfo = null }) {
  // 1. Log Activity
  await logActivity(pool, userId, action, module, entityType, entityId, description, ipAddress, oldValue, newValue, deviceInfo);

  // 2. Dispatch Notifications
  try {
    let recipientIds = [];
    let title = '';
    let message = '';
    let type = 'System';

    switch (action) {
      case 'RFQ_CREATED':
      case 'RFQ_PUBLISHED':
      case 'RFQ_ASSIGNED':
      case 'RFQ_VENDOR_ASSIGNED':
        type = 'RFQ';
        title = `New RFQ Assigned`;
        message = `You have been assigned to RFQ #${entityId}: ${description || ''}`;
        
        // Notify all active vendors assigned to this RFQ
        const [assignedVendors] = await pool.execute('SELECT vendor_id FROM rfq_vendors WHERE rfq_id = ?', [entityId]);
        for (const vendor of assignedVendors) {
          const vendorUserId = await getUserIdByVendorId(vendor.vendor_id);
          if (vendorUserId) recipientIds.push(vendorUserId);
        }
        break;

      case 'QUOTATION_SUBMITTED':
        type = 'Quotation';
        title = 'Quotation Submitted';
        message = `A vendor has submitted a quotation for RFQ #${entityId}. Description: ${description || ''}`;
        
        // Notify Admins and Officers
        recipientIds = await getUserIdsByRoles(['admin', 'officer']);
        break;

      case 'QUOTATION_SELECTED':
      case 'VENDOR_SELECTED':
        type = 'Quotation';
        title = 'Quotation Selected';
        message = `Your quotation for RFQ #${entityId} has been selected. PO will be generated.`;
        
        // Find vendor associated with this quotation or quotation selection.
        const [quoteRows] = entityType === 'quotation_selection'
          ? await pool.execute(
              `SELECT q.vendor_id
               FROM quotation_selections qs
               JOIN quotations q ON q.id = qs.quotation_id
               WHERE qs.id = ? LIMIT 1`,
              [entityId]
            )
          : await pool.execute('SELECT vendor_id FROM quotations WHERE id = ? LIMIT 1', [entityId]);
        if (quoteRows.length > 0) {
          const vendorUserId = await getUserIdByVendorId(quoteRows[0].vendor_id);
          if (vendorUserId) recipientIds.push(vendorUserId);
        }
        // Also notify admins/officers/managers
        const adminStaff = await getUserIdsByRoles(['admin', 'officer', 'manager']);
        recipientIds.push(...adminStaff);
        break;

      case 'APPROVAL_REQUESTED':
        type = 'Approval';
        title = 'Approval Pending Decision';
        message = `Quotation approval requested. Action required. Reference ID #${entityId}`;
        
        // Notify Managers and Admins
        recipientIds = await getUserIdsByRoles(['admin', 'manager']);
        break;

      case 'APPROVAL_APPROVED':
        type = 'Approval';
        title = 'Approval Decision: Approved';
        message = `Approval Reference #${entityId} has been APPROVED. Purchase Order generated.`;
        
        // Notify RFQ Creator (Officer/Admin)
        const [apprRows] = await pool.execute(
          `SELECT rfq_id, vendor_id FROM approval_requests 
           WHERE id = ? LIMIT 1`,
          [entityId]
        );
        if (apprRows.length > 0) {
          const creatorId = await getRfqCreatorUserId(apprRows[0].rfq_id);
          if (creatorId) recipientIds.push(creatorId);
          
          // Notify Vendor
          const vendorUserId = await getUserIdByVendorId(apprRows[0].vendor_id);
          if (vendorUserId) recipientIds.push(vendorUserId);
        }
        // Notify Admins and Officers
        const otherStaff = await getUserIdsByRoles(['admin', 'officer']);
        recipientIds.push(...otherStaff);
        break;

      case 'APPROVAL_REJECTED':
        type = 'Approval';
        title = 'Approval Decision: Rejected';
        message = `Approval Reference #${entityId} has been REJECTED. Description: ${description || ''}`;
        
        // Notify RFQ Creator and Vendor
        const [apprRejRows] = await pool.execute(
          `SELECT rfq_id, vendor_id FROM approval_requests 
           WHERE id = ? LIMIT 1`,
          [entityId]
        );
        if (apprRejRows.length > 0) {
          const creatorId = await getRfqCreatorUserId(apprRejRows[0].rfq_id);
          if (creatorId) recipientIds.push(creatorId);
          
          // Notify Vendor
          const vendorUserId = await getUserIdByVendorId(apprRejRows[0].vendor_id);
          if (vendorUserId) recipientIds.push(vendorUserId);
        }
        // Notify Admins and Officers
        recipientIds.push(...(await getUserIdsByRoles(['admin', 'officer'])));
        break;

      case 'PO_GENERATED':
        type = 'Purchase Order';
        title = 'Purchase Order Generated';
        message = `Purchase Order PO #${entityId} has been generated. ${description || ''}`;
        
        // Notify Vendor and Officer
        const [poRows] = await pool.execute(
          `SELECT po.vendor_id, po.rfq_id FROM purchase_orders po
           WHERE po.id = ? LIMIT 1`,
          [entityId]
        );
        if (poRows.length > 0) {
          const vendorUserId = await getUserIdByVendorId(poRows[0].vendor_id);
          if (vendorUserId) recipientIds.push(vendorUserId);

          const creatorId = await getRfqCreatorUserId(poRows[0].rfq_id);
          if (creatorId) recipientIds.push(creatorId);
        }
        recipientIds.push(...(await getUserIdsByRoles(['admin', 'manager'])));
        break;

      case 'PO_SENT':
      case 'PO_ISSUED':
        type = 'Purchase Order';
        title = 'Purchase Order Issued';
        message = `Purchase Order #${entityId} has been issued. ${description || ''}`;

        const [issuedPoRows] = await pool.execute(
          `SELECT po.vendor_id, po.rfq_id FROM purchase_orders po
           WHERE po.id = ? LIMIT 1`,
          [entityId]
        );
        if (issuedPoRows.length > 0) {
          const vendorUserId = await getUserIdByVendorId(issuedPoRows[0].vendor_id);
          if (vendorUserId) recipientIds.push(vendorUserId);

          const creatorId = await getRfqCreatorUserId(issuedPoRows[0].rfq_id);
          if (creatorId) recipientIds.push(creatorId);
        }
        recipientIds.push(...(await getUserIdsByRoles(['admin', 'manager'])));
        break;

      case 'INVOICE_GENERATED':
        type = 'Invoice';
        title = 'Invoice Received';
        message = `Invoice #${entityId} has been generated. Total: ${description || ''}`;
        
        // Notify Admins and Officers
        recipientIds = await getUserIdsByRoles(['admin', 'officer']);
        break;

      case 'INVOICE_SENT':
      case 'INVOICE_EMAILED':
        type = 'Invoice';
        title = 'Invoice Dispatched';
        message = `Invoice #${entityId} has been emailed/sent. Description: ${description || ''}`;
        
        // Notify Vendor
        const [invRows] = await pool.execute(
          `SELECT po.vendor_id FROM invoices i 
           JOIN purchase_orders po ON i.po_id = po.id
           WHERE i.id = ? LIMIT 1`,
          [entityId]
        );
        if (invRows.length > 0) {
          const vendorUserId = await getUserIdByVendorId(invRows[0].vendor_id);
          if (vendorUserId) recipientIds.push(vendorUserId);
        }
        break;

      case 'INVOICE_PAID':
        type = 'Invoice';
        title = 'Invoice Paid';
        message = `Invoice #${entityId} has been marked as paid. ${description || ''}`;

        const [paidInvRows] = await pool.execute(
          `SELECT po.vendor_id FROM invoices i
           JOIN purchase_orders po ON i.po_id = po.id
           WHERE i.id = ? LIMIT 1`,
          [entityId]
        );
        if (paidInvRows.length > 0) {
          const vendorUserId = await getUserIdByVendorId(paidInvRows[0].vendor_id);
          if (vendorUserId) recipientIds.push(vendorUserId);
        }
        recipientIds.push(...(await getUserIdsByRoles(['admin', 'officer'])));
        break;

      case 'VENDOR_CREATED':
        type = 'System';
        title = 'New Vendor Registered';
        message = `Vendor company ${description || ''} has registered.`;
        recipientIds = await getUserIdsByRoles(['admin', 'officer']);
        break;

      case 'VENDOR_UPDATED':
        type = 'System';
        title = 'Vendor Profile Updated';
        message = `Vendor profile for ${description || ''} has been updated.`;
        recipientIds = await getUserIdsByRoles(['admin', 'officer']);
        break;

      case 'VENDOR_DELETED':
        type = 'System';
        title = 'Vendor Profile Deleted/Archived';
        message = `Vendor profile for ${description || ''} has been set to inactive.`;
        recipientIds = await getUserIdsByRoles(['admin', 'officer']);
        break;

      case 'VENDOR_STATUS_CHANGED':
        type = 'System';
        title = 'Vendor Status Changed';
        message = `Vendor status updated: ${description || ''}`;
        recipientIds = await getUserIdsByRoles(['admin', 'officer']);
        break;

      case 'USER_LOGGED_IN':
      case 'USER_LOGGED_OUT':
        // Activity log is written, no need to push internal notification alert
        return;
    }

    // Deduplicate recipients and filter out any nulls
    const uniqueRecipients = [...new Set(recipientIds.filter(Boolean))];

    // Bulk insert notifications
    for (const recipientId of uniqueRecipients) {
      await createNotification(recipientId, title, message, type, entityType, entityId);
    }
  } catch (error) {
    console.error('[logAndNotify Error] Failed to generate notifications:', error.message);
  }
}
