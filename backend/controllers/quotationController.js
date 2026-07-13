/**
 * quotationController.js — Controller mapping for Module 4 quotations
 */

import fs from 'fs';
import path from 'path';
import {
  createQuotationRecord,
  deleteQuotationRecord,
  getQuotation,
  listQuotations,
  updateQuotationRecord,
  submitQuotationRecord,
  withdrawQuotationRecord,
  addQuotationItemRecord,
  updateQuotationItemRecord,
  deleteQuotationItemRecord,
  addQuotationAttachmentRecord,
  deleteQuotationAttachmentRecord
} from '../services/quotationService.js';
import { validateQuotationPayload } from '../validators/quotationValidator.js';
import { logAndNotify } from '../utils/activityAndNotificationHelper.js';

const fail = (res, error, fallback = 'Request failed.') => {
  return res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || fallback
  });
};

// ── GET All Quotations ──
export const getAllQuotations = async (req, res) => {
  try {
    const result = await listQuotations(req.query, req.user);
    return res.status(200).json({
      status: 'success',
      results: result.data.length,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getAllQuotations:', error);
    return fail(res, error, 'Failed to retrieve quotations.');
  }
};

// ── GET Quotation By ID ──
export const getQuotationById = async (req, res) => {
  try {
    const quote = await getQuotation(req.params.id, req.user);
    if (!quote) {
      return res.status(404).json({
        status: 'error',
        message: 'Quotation not found.'
      });
    }
    return res.status(200).json({
      status: 'success',
      data: quote
    });
  } catch (error) {
    console.error('Error in getQuotationById:', error);
    return fail(res, error, 'Failed to retrieve quotation details.');
  }
};

// ── POST Create Quotation ──
export const submitQuotation = async (req, res) => {
  try {
    const errors = validateQuotationPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: errors[0],
        errors
      });
    }

    const quote = await createQuotationRecord(req.body, req.user);

    // Log Activity & Dispatch Notification
    await logAndNotify(req.user.id, {
      action: quote.status === 'submitted' ? 'QUOTATION_SUBMITTED' : 'QUOTATION_CREATED',
      module: 'Quotation Management',
      entityType: 'quotation',
      entityId: quote.id,
      description: `Quotation "${quote.quotation_number}" created with status "${quote.status}" for RFQ #${quote.rfq_id}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: 'Quotation created successfully.',
      data: quote
    });
  } catch (error) {
    console.error('Error in submitQuotation:', error);
    return fail(res, error, 'Failed to submit quotation.');
  }
};

// ── PUT Update Quotation ──
export const updateQuotation = async (req, res) => {
  try {
    const errors = validateQuotationPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: errors[0],
        errors
      });
    }

    const quote = await updateQuotationRecord(req.params.id, req.body, req.user);

    // Log Activity
    await logAndNotify(req.user.id, {
      action: 'QUOTATION_UPDATED',
      module: 'Quotation Management',
      entityType: 'quotation',
      entityId: quote.id,
      description: `Quotation "${quote.quotation_number}" updated`,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Quotation updated successfully.',
      data: quote
    });
  } catch (error) {
    console.error('Error in updateQuotation:', error);
    return fail(res, error, 'Failed to update quotation.');
  }
};

// ── DELETE Quotation ──
export const deleteQuotation = async (req, res) => {
  try {
    // Fetch info before deletion for logging
    const existing = await getQuotation(req.params.id, { ...req.user, role: 'admin' });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Quotation not found.' });
    }

    // Delete attachments from disk first
    if (existing.attachments && existing.attachments.length > 0) {
      for (const att of existing.attachments) {
        const absPath = path.resolve('.' + att.file_path);
        fs.unlink(absPath, (err) => {
          if (err) console.warn('Physical file delete skipped during Quotation drop:', err.message);
        });
      }
    }

    await deleteQuotationRecord(req.params.id, req.user);

    // Log Activity
    await logAndNotify(req.user.id, {
      action: 'QUOTATION_DELETED',
      module: 'Quotation Management',
      entityType: 'quotation',
      entityId: Number(req.params.id),
      description: `Quotation "${existing.quotation_number}" deleted`,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Quotation deleted successfully.'
    });
  } catch (error) {
    console.error('Error in deleteQuotation:', error);
    return fail(res, error, 'Failed to delete quotation.');
  }
};

// ── PATCH Submit ──
export const submitQuotationStatus = async (req, res) => {
  try {
    const quote = await submitQuotationRecord(req.params.id, req.user);

    // Log Activity
    await logAndNotify(req.user.id, {
      action: 'QUOTATION_SUBMITTED',
      module: 'Quotation Management',
      entityType: 'quotation',
      entityId: quote.id,
      description: `Quotation "${quote.quotation_number}" submitted`,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Quotation submitted successfully.',
      data: quote
    });
  } catch (error) {
    console.error('Error in submitQuotationStatus:', error);
    return fail(res, error, 'Failed to submit quotation.');
  }
};

// ── PATCH Withdraw ──
export const withdrawQuotationStatus = async (req, res) => {
  try {
    const quote = await withdrawQuotationRecord(req.params.id, req.user);

    // Log Activity
    await logAndNotify(req.user.id, {
      action: 'QUOTATION_WITHDRAWN',
      module: 'Quotation Management',
      entityType: 'quotation',
      entityId: quote.id,
      description: `Quotation "${quote.quotation_number}" withdrawn`,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Quotation withdrawn successfully.',
      data: quote
    });
  } catch (error) {
    console.error('Error in withdrawQuotationStatus:', error);
    return fail(res, error, 'Failed to withdraw quotation.');
  }
};

// ── GET My Quotations ──
export const getMyQuotations = async (req, res) => {
  try {
    const result = await listQuotations(req.query, req.user);
    return res.status(200).json({
      status: 'success',
      results: result.data.length,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getMyQuotations:', error);
    return fail(res, error, 'Failed to retrieve your quotations.');
  }
};

// ── GET Quotations By RFQ ──
export const getQuotationsByRFQ = async (req, res) => {
  try {
    const result = await listQuotations({ rfq_id: req.params.rfq_id, limit: 100 }, req.user);
    return res.status(200).json({
      status: 'success',
      results: result.data.length,
      data: result.data
    });
  } catch (error) {
    console.error('Error in getQuotationsByRFQ:', error);
    return fail(res, error, 'Failed to retrieve RFQ quotations.');
  }
};

// ── ITEM SUB-RESOURCES ──
export const addQuotationItem = async (req, res) => {
  try {
    const { rfq_item_id, quantity, unit_price } = req.body;
    if (!rfq_item_id || !quantity || !unit_price) {
      return res.status(400).json({ status: 'error', message: 'RFQ item ID, quantity, and unit price are required.' });
    }

    const item = await addQuotationItemRecord(req.params.id, req.body);

    await logAndNotify(req.user.id, {
      action: 'QUOTATION_UPDATED',
      module: 'Quotation Management',
      entityType: 'quotation',
      entityId: Number(req.params.id),
      description: `Added item ref #${rfq_item_id} to quotation`,
      ipAddress: req.ip
    });

    return res.status(201).json({ status: 'success', data: item });
  } catch (error) {
    console.error('Error adding quotation item:', error);
    return fail(res, error, 'Failed to add quotation item.');
  }
};

export const updateQuotationItem = async (req, res) => {
  try {
    const { quantity, unit_price } = req.body;
    if (!quantity || !unit_price) {
      return res.status(400).json({ status: 'error', message: 'Quantity and unit price are required.' });
    }

    const item = await updateQuotationItemRecord(req.params.id, req.body);

    return res.status(200).json({ status: 'success', data: item });
  } catch (error) {
    console.error('Error updating quotation item:', error);
    return fail(res, error, 'Failed to update quotation item.');
  }
};

export const deleteQuotationItem = async (req, res) => {
  try {
    await deleteQuotationItemRecord(req.params.id);
    return res.status(200).json({ status: 'success', message: 'Quotation item deleted successfully.' });
  } catch (error) {
    console.error('Error deleting quotation item:', error);
    return fail(res, error, 'Failed to delete quotation item.');
  }
};

// ── ATTACHMENT SUB-RESOURCES ──
export const addQuotationAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded or forbidden format.' });
    }

    const attachment = await addQuotationAttachmentRecord(req.params.id, req.file);

    await logAndNotify(req.user.id, {
      action: 'QUOTATION_UPDATED',
      module: 'Quotation Management',
      entityType: 'quotation',
      entityId: Number(req.params.id),
      description: `Uploaded attachment: "${attachment.file_name}"`,
      ipAddress: req.ip
    });

    return res.status(201).json({ status: 'success', data: attachment });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return fail(res, error, 'Failed to upload attachment.');
  }
};

export const deleteQuotationAttachment = async (req, res) => {
  try {
    const filePath = await deleteQuotationAttachmentRecord(req.params.id);
    const absPath = path.resolve('.' + filePath);

    fs.unlink(absPath, (err) => {
      if (err) console.warn('Failed to delete physical file:', err.message);
    });

    return res.status(200).json({ status: 'success', message: 'Attachment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return fail(res, error, 'Failed to delete attachment.');
  }
};
