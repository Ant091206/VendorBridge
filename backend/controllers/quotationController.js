import {
  createQuotationRecord,
  deleteQuotationRecord,
  getQuotation,
  listQuotations,
  updateQuotationRecord
} from '../services/quotationService.js';
import { validateQuotationPayload } from '../validators/quotationValidator.js';
import { logAndNotify } from '../utils/activityAndNotificationHelper.js';

const fail = (res, error, fallback = 'Request failed.') => {
  return res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || fallback
  });
};

/**
 * GET /api/quotations
 * Returns all quotations submitted in the system (filtered by role).
 */
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

/**
 * GET /api/quotations/:id
 * Retrieve details for a single quotation.
 */
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

/**
 * POST /api/quotations
 * Vendor submits a quotation for an RFQ.
 */
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

    // Log Activity & Dispatch Notifications
    await logAndNotify(req.user.id, {
      action: 'QUOTATION_SUBMITTED',
      module: 'Quotation Management',
      entityType: 'quotation',
      entityId: quote.id,
      description: `Quotation submitted for RFQ #${quote.rfq_id}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: 'Quotation submitted successfully!',
      data: quote
    });
  } catch (error) {
    console.error('Error in submitQuotation:', error);
    return fail(res, error, 'Failed to submit quotation.');
  }
};

/**
 * PUT /api/quotations/:id
 * Vendor updates their active quotation.
 */
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
    return res.status(200).json({
      status: 'success',
      message: 'Quotation updated successfully!',
      data: quote
    });
  } catch (error) {
    console.error('Error in updateQuotation:', error);
    return fail(res, error, 'Failed to update quotation.');
  }
};

/**
 * DELETE /api/quotations/:id
 * Deletes a quotation (draft or submitted, before deadline).
 */
export const deleteQuotation = async (req, res) => {
  try {
    await deleteQuotationRecord(req.params.id, req.user);
    return res.status(200).json({
      status: 'success',
      message: 'Quotation deleted successfully.'
    });
  } catch (error) {
    console.error('Error in deleteQuotation:', error);
    return fail(res, error, 'Failed to delete quotation.');
  }
};

/**
 * GET /api/quotations/my-quotations
 * Vendor-specific endpoint (delegates to listQuotations).
 */
export const getMyQuotations = async (req, res) => {
  try {
    const result = await listQuotations({ ...req.query }, req.user);
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

/**
 * GET /api/quotations/rfq/:rfq_id
 * Retrieves all quotes for an RFQ.
 */
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
