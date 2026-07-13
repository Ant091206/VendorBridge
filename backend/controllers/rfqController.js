import fs from 'fs';
import path from 'path';
import {
  closeRFQRecord,
  createRFQRecord,
  deleteRFQRecord,
  getRFQ,
  listRFQs,
  patchRFQStatus,
  updateRFQRecord,
  addRFQItemRecord,
  updateRFQItemRecord,
  deleteRFQItemRecord,
  assignRFQVendorsRecord,
  removeRFQVendorRecord,
  addRFQAttachmentRecord,
  deleteRFQAttachmentRecord
} from '../services/rfqService.js';
import { validateRFQPayload } from '../validators/rfqValidator.js';
import { logAndNotify } from '../utils/activityAndNotificationHelper.js';

const fail = (res, error, fallback = 'Request failed.') => res.status(error.statusCode || 500).json({
  status: 'error',
  message: error.message || fallback
});

export const getAllRFQs = async (req, res) => {
  try {
    const result = await listRFQs(req.query, req.user);
    return res.status(200).json({
      status: 'success',
      results: result.data.length,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching RFQs:', error);
    return fail(res, error, 'Failed to retrieve RFQs.');
  }
};

export const getRFQById = async (req, res) => {
  try {
    const rfq = await getRFQ(req.params.id, req.user);
    if (!rfq) return res.status(404).json({ status: 'error', message: 'RFQ not found.' });
    return res.status(200).json({ status: 'success', data: rfq });
  } catch (error) {
    console.error('Error fetching RFQ detail:', error);
    return fail(res, error, 'Failed to retrieve RFQ details.');
  }
};

export const createRFQ = async (req, res) => {
  try {
    const errors = validateRFQPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: errors[0], errors });
    }

    const rfq = await createRFQRecord(req.body, req.user);

    // Log Activity & Notification
    await logAndNotify(req.user.id, {
      action: rfq.status === 'published' ? 'RFQ_PUBLISHED' : 'RFQ_CREATED',
      module: 'RFQ Management',
      entityType: 'rfq',
      entityId: rfq.id,
      description: `RFQ "${rfq.title}" created with status "${rfq.status}"`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: 'RFQ created successfully.',
      data: rfq
    });
  } catch (error) {
    console.error('Error creating RFQ:', error);
    return fail(res, error, 'Failed to create RFQ.');
  }
};

export const updateRFQ = async (req, res) => {
  try {
    const errors = validateRFQPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: errors[0], errors });
    }

    const oldRFQ = await getRFQ(req.params.id, req.user);
    const rfq = await updateRFQRecord(req.params.id, req.body, req.user);

    // Log Activity
    await logAndNotify(req.user.id, {
      action: 'RFQ_UPDATED',
      module: 'RFQ Management',
      entityType: 'rfq',
      entityId: rfq.id,
      description: `RFQ "${rfq.title}" updated`,
      ipAddress: req.ip,
      oldValue: oldRFQ,
      newValue: rfq
    });

    return res.status(200).json({
      status: 'success',
      message: 'RFQ updated successfully.',
      data: rfq
    });
  } catch (error) {
    console.error('Error updating RFQ:', error);
    return fail(res, error, 'Failed to update RFQ.');
  }
};

export const closeRFQ = async (req, res) => {
  try {
    await closeRFQRecord(req.params.id, req.user.id);

    // Log Activity
    await logAndNotify(req.user.id, {
      action: 'RFQ_CLOSED',
      module: 'RFQ Management',
      entityType: 'rfq',
      entityId: Number(req.params.id),
      description: `RFQ closed`,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'RFQ closed successfully.'
    });
  } catch (error) {
    console.error('Error closing RFQ:', error);
    return fail(res, error, 'Failed to close RFQ.');
  }
};

export const deleteRFQ = async (req, res) => {
  try {
    // Load existing for description before deletion
    const existing = await getRFQ(req.params.id, { ...req.user, role: 'admin' });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'RFQ not found.' });
    }

    // Load attachments to delete from disk
    if (existing.attachments && existing.attachments.length > 0) {
      for (const att of existing.attachments) {
        const absPath = path.resolve('.' + att.file_path);
        fs.unlink(absPath, (err) => {
          if (err) console.warn('Physical file delete skipped during RFQ drop:', err.message);
        });
      }
    }

    await deleteRFQRecord(req.params.id);

    // Log Activity
    await logAndNotify(req.user.id, {
      action: 'RFQ_DELETED',
      module: 'RFQ Management',
      entityType: 'rfq',
      entityId: Number(req.params.id),
      description: `RFQ "${existing.title}" deleted`,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'RFQ deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting RFQ:', error);
    return fail(res, error, 'Failed to delete RFQ.');
  }
};

export const patchRFQStatusController = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['draft', 'published', 'closed', 'cancelled'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid or missing status.' });
    }

    const oldRFQ = await getRFQ(req.params.id, req.user);
    const rfq = await patchRFQStatus(req.params.id, status, req.user.id, req.user);

    // Log Activity & Notification
    await logAndNotify(req.user.id, {
      action: status === 'published' ? 'RFQ_PUBLISHED' : 'RFQ_STATUS_CHANGED',
      module: 'RFQ Management',
      entityType: 'rfq',
      entityId: rfq.id,
      description: `RFQ status updated to "${status}"`,
      ipAddress: req.ip,
      oldValue: oldRFQ,
      newValue: rfq
    });

    return res.status(200).json({
      status: 'success',
      message: `RFQ status changed to ${status} successfully.`,
      data: rfq
    });
  } catch (error) {
    console.error('Error patching RFQ status:', error);
    return fail(res, error, 'Failed to patch RFQ status.');
  }
};

export const getRFQVendors = async (req, res) => {
  try {
    const rfq = await getRFQ(req.params.id, req.user);
    if (!rfq) return res.status(404).json({ status: 'error', message: 'RFQ not found.' });
    return res.status(200).json({ status: 'success', data: rfq.assigned_vendors || [] });
  } catch (error) {
    console.error('Error fetching RFQ vendors:', error);
    return fail(res, error, 'Failed to retrieve RFQ vendors.');
  }
};

export const getMyRFQs = async (req, res) => {
  try {
    const result = await listRFQs(req.query, req.user);
    return res.status(200).json({
      status: 'success',
      results: result.data.length,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching vendor RFQs:', error);
    return fail(res, error, 'Failed to retrieve assigned RFQs.');
  }
};

// ── Item Sub-Resources Controllers ───────────────────────────────────────────
export const addRFQItem = async (req, res) => {
  try {
    const { item_name, quantity, unit } = req.body;
    if (!item_name?.trim() || !quantity || !unit?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Item name, quantity and unit are required.' });
    }
    if (Number(quantity) <= 0) {
      return res.status(400).json({ status: 'error', message: 'Quantity must be greater than zero.' });
    }
    const item = await addRFQItemRecord(req.params.id, req.body);

    await logAndNotify(req.user.id, {
      action: 'RFQ_UPDATED',
      module: 'RFQ Management',
      entityType: 'rfq',
      entityId: Number(req.params.id),
      description: `Added item "${item.item_name}"`,
      ipAddress: req.ip
    });

    return res.status(201).json({ status: 'success', data: item });
  } catch (error) {
    console.error('Error adding RFQ item:', error);
    return fail(res, error, 'Failed to add RFQ item.');
  }
};

export const updateRFQItem = async (req, res) => {
  try {
    const { item_name, quantity, unit } = req.body;
    if (!item_name?.trim() || !quantity || !unit?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Item name, quantity and unit are required.' });
    }
    if (Number(quantity) <= 0) {
      return res.status(400).json({ status: 'error', message: 'Quantity must be greater than zero.' });
    }
    const item = await updateRFQItemRecord(req.params.id, req.body);

    return res.status(200).json({ status: 'success', data: item });
  } catch (error) {
    console.error('Error updating RFQ item:', error);
    return fail(res, error, 'Failed to update RFQ item.');
  }
};

export const deleteRFQItem = async (req, res) => {
  try {
    await deleteRFQItemRecord(req.params.id);
    return res.status(200).json({ status: 'success', message: 'RFQ item deleted successfully.' });
  } catch (error) {
    console.error('Error deleting RFQ item:', error);
    return fail(res, error, 'Failed to delete RFQ item.');
  }
};

// ── Vendor Sub-Resources Controllers ─────────────────────────────────────────
export const assignRFQVendors = async (req, res) => {
  try {
    const { vendor_ids } = req.body;
    if (!Array.isArray(vendor_ids) || vendor_ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'At least one vendor ID is required.' });
    }
    const added = await assignRFQVendorsRecord(req.params.id, vendor_ids);

    await logAndNotify(req.user.id, {
      action: 'RFQ_VENDOR_ASSIGNED',
      module: 'RFQ Management',
      entityType: 'rfq',
      entityId: Number(req.params.id),
      description: `Assigned ${added.length} vendor(s) to RFQ`,
      ipAddress: req.ip
    });

    return res.status(200).json({ status: 'success', message: 'Vendors assigned successfully.', data: added });
  } catch (error) {
    console.error('Error assigning RFQ vendors:', error);
    return fail(res, error, 'Failed to assign RFQ vendors.');
  }
};

export const removeRFQVendor = async (req, res) => {
  try {
    await removeRFQVendorRecord(req.params.id, req.params.vendorId);

    await logAndNotify(req.user.id, {
      action: 'RFQ_VENDOR_REMOVED',
      module: 'RFQ Management',
      entityType: 'rfq',
      entityId: Number(req.params.id),
      description: `Removed vendor #${req.params.vendorId} from RFQ`,
      ipAddress: req.ip
    });

    return res.status(200).json({ status: 'success', message: 'Vendor removed from RFQ successfully.' });
  } catch (error) {
    console.error('Error removing vendor from RFQ:', error);
    return fail(res, error, 'Failed to remove vendor assignment.');
  }
};

// ── Attachment Sub-Resources Controllers ─────────────────────────────────────
export const addRFQAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded or forbidden format.' });
    }
    const attachment = await addRFQAttachmentRecord(req.params.id, req.file);

    await logAndNotify(req.user.id, {
      action: 'RFQ_ATTACHMENT_UPLOADED',
      module: 'RFQ Management',
      entityType: 'rfq',
      entityId: Number(req.params.id),
      description: `Uploaded attachment: "${attachment.file_name}"`,
      ipAddress: req.ip
    });

    return res.status(201).json({ status: 'success', data: attachment });
  } catch (error) {
    console.error('Error uploading RFQ attachment:', error);
    return fail(res, error, 'Failed to upload attachment.');
  }
};

export const deleteRFQAttachment = async (req, res) => {
  try {
    const filePath = await deleteRFQAttachmentRecord(req.params.id);
    const absPath = path.resolve('.' + filePath);
    
    // Physical file delete
    fs.unlink(absPath, (err) => {
      if (err) console.warn('Failed to delete physical file:', err.message);
    });

    return res.status(200).json({ status: 'success', message: 'Attachment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting RFQ attachment:', error);
    return fail(res, error, 'Failed to delete attachment.');
  }
};
