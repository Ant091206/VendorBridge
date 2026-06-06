import { getRFQComparisonData, selectWinningVendor } from '../services/comparisonService.js';

const fail = (res, error, fallback = 'Comparison operation failed.') => {
  return res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || fallback
  });
};

/**
 * GET /api/rfqs/:id/comparison
 * Retrieves RFQ side-by-side quotation comparison data.
 */
export const getComparison = async (req, res) => {
  try {
    const data = await getRFQComparisonData(req.params.id, req.user);
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
 * POST /api/rfqs/:id/select-vendor
 * Selects a winning vendor/quotation, rejects others, creates approval request, and logs activity.
 */
export const selectVendor = async (req, res) => {
  try {
    const result = await selectWinningVendor(req.params.id, req.body, req.user);
    return res.status(200).json({
      status: 'success',
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Error in selectVendor:', error);
    return fail(res, error, 'Failed to select winning vendor.');
  }
};
