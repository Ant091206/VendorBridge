import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  issuePurchaseOrder,
  cancelPurchaseOrder,
  acknowledgePurchaseOrder,
  updatePOStatusManual,
  getPOHistory
} from '../services/purchaseOrderService.js';
import { validatePOCreation, validatePOUpdate } from '../validators/purchaseOrderValidator.js';

const fail = (res, error, fallback = 'Purchase Order operation failed.') => {
  return res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || fallback
  });
};

/**
 * POST /api/purchase-orders
 * Create new Purchase Order in Draft
 */
export const createPO = async (req, res) => {
  const errors = validatePOCreation(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: errors[0], errors });
  }

  try {
    const result = await createPurchaseOrder(req.body, req.user.id);
    return res.status(201).json({
      status: 'success',
      message: 'Purchase Order created successfully in Draft.',
      data: result
    });
  } catch (error) {
    console.error('Error in createPO:', error);
    return fail(res, error, 'Failed to create Purchase Order.');
  }
};

/**
 * GET /api/purchase-orders
 * List purchase orders with filters, search, and pagination
 */
export const getAllPOs = async (req, res) => {
  try {
    const result = await getPurchaseOrders(req.query, req.user);
    return res.status(200).json({
      status: 'success',
      data: result.purchaseOrders,
      stats: result.stats,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getAllPOs:', error);
    return fail(res, error, 'Failed to retrieve Purchase Orders.');
  }
};

/**
 * GET /api/purchase-orders/:id
 * Retrieve details of a single purchase order
 */
export const getPOById = async (req, res) => {
  try {
    const po = await getPurchaseOrderById(req.params.id, req.user);
    if (!po) {
      return res.status(404).json({
        status: 'error',
        message: 'Purchase Order not found.'
      });
    }
    return res.status(200).json({
      status: 'success',
      data: po
    });
  } catch (error) {
    console.error('Error in getPOById:', error);
    return fail(res, error, 'Failed to retrieve Purchase Order details.');
  }
};

/**
 * PUT /api/purchase-orders/:id
 * Update a Draft Purchase Order
 */
export const updatePO = async (req, res) => {
  const errors = validatePOUpdate(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: errors[0], errors });
  }

  try {
    const result = await updatePurchaseOrder(req.params.id, req.body, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Purchase Order updated successfully.',
      data: result
    });
  } catch (error) {
    console.error('Error in updatePO:', error);
    return fail(res, error, 'Failed to update Purchase Order.');
  }
};

/**
 * DELETE /api/purchase-orders/:id
 * Delete a Draft Purchase Order
 */
export const deletePO = async (req, res) => {
  try {
    const result = await deletePurchaseOrder(req.params.id, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Purchase Order deleted successfully.',
      data: result
    });
  } catch (error) {
    console.error('Error in deletePO:', error);
    return fail(res, error, 'Failed to delete Purchase Order.');
  }
};

/**
 * PATCH /api/purchase-orders/:id/issue
 * Issue a Draft Purchase Order
 */
export const issuePO = async (req, res) => {
  try {
    const result = await issuePurchaseOrder(req.params.id, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Purchase Order issued successfully.',
      data: result
    });
  } catch (error) {
    console.error('Error in issuePO:', error);
    return fail(res, error, 'Failed to issue Purchase Order.');
  }
};

/**
 * PATCH /api/purchase-orders/:id/cancel
 * Cancel an active Purchase Order
 */
export const cancelPO = async (req, res) => {
  try {
    const result = await cancelPurchaseOrder(req.params.id, req.body.remarks, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Purchase Order cancelled successfully.',
      data: result
    });
  } catch (error) {
    console.error('Error in cancelPO:', error);
    return fail(res, error, 'Failed to cancel Purchase Order.');
  }
};

/**
 * PATCH /api/purchase-orders/:id/acknowledge
 * Vendor Acknowledge Purchase Order
 */
export const acknowledgePO = async (req, res) => {
  try {
    const result = await acknowledgePurchaseOrder(
      req.params.id,
      req.body.remarks,
      req.user.email,
      req.user.id
    );
    return res.status(200).json({
      status: 'success',
      message: 'Purchase Order acknowledged successfully.',
      data: result
    });
  } catch (error) {
    console.error('Error in acknowledgePO:', error);
    return fail(res, error, 'Failed to acknowledge Purchase Order.');
  }
};

/**
 * PATCH /api/purchase-orders/:id/status
 * Manually update PO status to Partially Fulfilled / Fulfilled (Officer/Admin only)
 */
export const updateStatusManual = async (req, res) => {
  const { status, remarks } = req.body;
  if (!status) {
    return res.status(400).json({
      status: 'error',
      message: 'Status is required.'
    });
  }

  try {
    const result = await updatePOStatusManual(req.params.id, status, remarks, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: `Purchase Order status updated to ${status} successfully.`,
      data: result
    });
  } catch (error) {
    console.error('Error in updateStatusManual:', error);
    return fail(res, error, 'Failed to update Purchase Order status.');
  }
};

/**
 * GET /api/purchase-orders/:id/history
 * Retrieve chronological timeline logs of a PO
 */
export const getHistoryTimeline = async (req, res) => {
  try {
    const result = await getPOHistory(req.params.id);
    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error in getHistoryTimeline:', error);
    return fail(res, error, 'Failed to retrieve timeline logs.');
  }
};
