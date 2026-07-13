import {
  createApprovalRequest,
  getApprovalRequests,
  getApprovalRequestById,
  updateApprovalRequest,
  submitApprovalRequest,
  approveApprovalRequest,
  rejectApprovalRequest,
  cancelApprovalRequest,
  getApprovalRequestHistory
} from '../services/approvalService.js';
import { validateApprovalRequest, validateRejectionPayload } from '../validators/approvalValidator.js';

const fail = (res, error, fallback = 'Approval operation failed.') => {
  return res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || fallback
  });
};

/**
 * POST /api/approvals
 * Create Approval Request
 */
export const createRequest = async (req, res) => {
  const errors = validateApprovalRequest(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: errors[0], errors });
  }

  try {
    const result = await createApprovalRequest(req.body, req.user.id);
    return res.status(201).json({
      status: 'success',
      message: 'Approval request created successfully.',
      data: result
    });
  } catch (error) {
    console.error('Error in createRequest:', error);
    return fail(res, error, 'Failed to create approval request.');
  }
};

/**
 * GET /api/approvals
 * List Approval Requests with pagination/sorting/filtering
 */
export const getRequests = async (req, res) => {
  try {
    const result = await getApprovalRequests(req.query, req.user);
    return res.status(200).json({
      status: 'success',
      data: result.data,
      stats: result.stats,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getRequests:', error);
    return fail(res, error, 'Failed to fetch approval requests.');
  }
};

/**
 * GET /api/approvals/:id
 * Get details of a single approval request
 */
export const getRequestById = async (req, res) => {
  try {
    const result = await getApprovalRequestById(req.params.id, req.user);
    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error in getRequestById:', error);
    return fail(res, error, 'Failed to fetch approval request details.');
  }
};

/**
 * PUT /api/approvals/:id
 * Update approval request (Draft state only)
 */
export const updateRequest = async (req, res) => {
  try {
    const result = await updateApprovalRequest(req.params.id, req.body, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Approval request updated successfully.',
      data: result
    });
  } catch (error) {
    console.error('Error in updateRequest:', error);
    return fail(res, error, 'Failed to update approval request.');
  }
};

/**
 * PATCH /api/approvals/:id/submit
 * Submit approval request (Draft -> Pending Approval)
 */
export const submitRequest = async (req, res) => {
  try {
    const result = await submitApprovalRequest(req.params.id, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Approval request submitted successfully.',
      data: result
    });
  } catch (error) {
    console.error('Error in submitRequest:', error);
    return fail(res, error, 'Failed to submit approval request.');
  }
};

/**
 * PATCH /api/approvals/:id/approve
 * Approve request (Pending Approval -> Approved)
 */
export const approveRequest = async (req, res) => {
  try {
    const { remarks } = req.body;
    const result = await approveApprovalRequest(req.params.id, remarks, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Approval request approved successfully.',
      data: result
    });
  } catch (error) {
    console.error('Error in approveRequest:', error);
    return fail(res, error, 'Failed to approve request.');
  }
};

/**
 * PATCH /api/approvals/:id/reject
 * Reject request (Pending Approval -> Rejected)
 */
export const rejectRequest = async (req, res) => {
  const errors = validateRejectionPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: errors[0], errors });
  }

  try {
    const { remarks } = req.body;
    const result = await rejectApprovalRequest(req.params.id, remarks, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Approval request rejected successfully.',
      data: result
    });
  } catch (error) {
    console.error('Error in rejectRequest:', error);
    return fail(res, error, 'Failed to reject request.');
  }
};

/**
 * PATCH /api/approvals/:id/cancel
 * Cancel request (Pending Approval/Draft -> Cancelled)
 */
export const cancelRequest = async (req, res) => {
  try {
    const result = await cancelApprovalRequest(req.params.id, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Approval request cancelled successfully.',
      data: result
    });
  } catch (error) {
    console.error('Error in cancelRequest:', error);
    return fail(res, error, 'Failed to cancel approval request.');
  }
};

/**
 * GET /api/approvals/:id/history
 * Fetch approval request timeline history
 */
export const getHistory = async (req, res) => {
  try {
    const result = await getApprovalRequestHistory(req.params.id);
    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error in getHistory:', error);
    return fail(res, error, 'Failed to fetch approval history.');
  }
};

/**
 * GET /api/manager/approvals
 * Fetch manager list of assigned requests
 */
export const getManagerQueue = async (req, res) => {
  try {
    const result = await getApprovalRequests(req.query, req.user);
    return res.status(200).json({
      status: 'success',
      data: result.data,
      stats: result.stats,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getManagerQueue:', error);
    return fail(res, error, 'Failed to fetch manager approvals queue.');
  }
};

/**
 * GET /api/manager/approvals/pending
 * Fetch manager pending requests list
 */
export const getManagerPendingQueue = async (req, res) => {
  try {
    const result = await getApprovalRequests({ ...req.query, status: 'Pending Approval' }, req.user);
    return res.status(200).json({
      status: 'success',
      data: result.data,
      stats: result.stats,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getManagerPendingQueue:', error);
    return fail(res, error, 'Failed to fetch manager pending approvals queue.');
  }
};
