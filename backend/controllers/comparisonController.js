import {
  getComparisonData,
  logComparisonEvent,
  createQuotationSelection,
  getQuotationSelectionByRFQ,
  updateQuotationSelectionStatus,
  getComparisonHistory
} from '../services/comparisonService.js';

const fail = (res, error, fallback = 'Operation failed.') => {
  return res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || fallback
  });
};

/**
 * GET /api/comparisons/rfq/:rfqId
 * Retrieves RFQ and quotation comparison data.
 */
export const getComparison = async (req, res) => {
  try {
    const data = await getComparisonData(req.params.rfqId, req.query, req.user);
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getComparison:', error);
    return fail(res, error, 'Failed to fetch comparison details.');
  }
};

/**
 * POST /api/comparisons/rfq/:rfqId
 * Logs a comparison view event.
 */
export const logComparison = async (req, res) => {
  try {
    const result = await logComparisonEvent(req.params.rfqId, req.user.id);
    return res.status(201).json({
      status: 'success',
      message: 'Comparison event logged successfully.',
      data: result
    });
  } catch (error) {
    console.error('Error in logComparison:', error);
    return fail(res, error, 'Failed to log comparison event.');
  }
};

/**
 * POST /api/selections
 * Recommends/selects a winning quotation.
 */
export const createSelection = async (req, res) => {
  try {
    const selection = await createQuotationSelection(req.body, req.user.id);
    return res.status(201).json({
      status: 'success',
      message: 'Quotation selection recommended successfully.',
      data: selection
    });
  } catch (error) {
    console.error('Error in createSelection:', error);
    return fail(res, error, 'Failed to create quotation selection.');
  }
};

/**
 * GET /api/selections/:rfqId
 * Retrieves the recommended quotation selection details for an RFQ.
 */
export const getSelection = async (req, res) => {
  try {
    const selection = await getQuotationSelectionByRFQ(req.params.rfqId);
    return res.status(200).json({
      status: 'success',
      data: selection
    });
  } catch (error) {
    console.error('Error in getSelection:', error);
    return fail(res, error, 'Failed to fetch selection details.');
  }
};

/**
 * PATCH /api/selections/:id
 * Updates selection status or reason.
 */
export const updateSelection = async (req, res) => {
  try {
    const { status, selection_reason } = req.body;
    const selection = await updateQuotationSelectionStatus(req.params.id, status, { selection_reason }, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Quotation selection updated successfully.',
      data: selection
    });
  } catch (error) {
    console.error('Error in updateSelection:', error);
    return fail(res, error, 'Failed to update selection.');
  }
};

/**
 * GET /api/comparisons/history/:rfqId
 * Retrieves the history of comparisons and selections for an RFQ.
 */
export const getHistory = async (req, res) => {
  try {
    const history = await getComparisonHistory(req.params.rfqId);
    return res.status(200).json({
      status: 'success',
      data: history
    });
  } catch (error) {
    console.error('Error in getHistory:', error);
    return fail(res, error, 'Failed to fetch comparison history.');
  }
};
