import {
  getRFQStatus,
  getApprovals,
  getMonthlyTrends
} from '../services/analyticsService.js';

/**
 * Analytics Controller
 */

// GET /api/reports/rfq-status
export const getRFQStatusAnalytics = async (req, res) => {
  try {
    const data = await getRFQStatus(req.user);
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getRFQStatusAnalytics controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve RFQ status analytics.'
    });
  }
};

// GET /api/reports/approvals
export const getApprovalsAnalytics = async (req, res) => {
  try {
    const data = await getApprovals(req.user);
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getApprovalsAnalytics controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve approvals analytics.'
    });
  }
};

// GET /api/reports/monthly-trends
export const getMonthlyTrendsAnalytics = async (req, res) => {
  try {
    const data = await getMonthlyTrends(req.user);
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getMonthlyTrendsAnalytics controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve monthly trends.'
    });
  }
};
