import {
  closeRFQRecord,
  createRFQRecord,
  deleteRFQRecord,
  getRFQ,
  listRFQs,
  updateRFQRecord
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

    // Log Activity & Dispatch Notifications
    await logAndNotify(req.user.id, {
      action: 'RFQ_CREATED',
      module: 'RFQ Management',
      entityType: 'rfq',
      entityId: rfq.id,
      description: `RFQ "${rfq.title}" created`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: 'RFQ created and vendors assigned successfully.',
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

    const rfq = await updateRFQRecord(req.params.id, req.body, req.user);

    // Log Activity
    await logAndNotify(req.user.id, {
      action: 'RFQ_UPDATED',
      module: 'RFQ Management',
      entityType: 'rfq',
      entityId: rfq.id,
      description: `RFQ "${rfq.title}" updated`,
      ipAddress: req.ip
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
    await closeRFQRecord(req.params.id);

    // Log Activity
    await logAndNotify(req.user.id, {
      action: 'RFQ_CLOSED',
      module: 'RFQ Management',
      entityType: 'rfq',
      entityId: req.params.id,
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
    await deleteRFQRecord(req.params.id);
    return res.status(200).json({
      status: 'success',
      message: 'RFQ deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting RFQ:', error);
    return fail(res, error, 'Failed to delete RFQ.');
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
