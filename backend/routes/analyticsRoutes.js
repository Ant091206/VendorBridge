import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  getRFQStatusAnalytics,
  getApprovalsAnalytics,
  getMonthlyTrendsAnalytics
} from '../controllers/analyticsController.js';

const router = express.Router();

// Chart/analytics endpoints
router.get('/reports/rfq-status', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getRFQStatusAnalytics);
router.get('/reports/approvals', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getApprovalsAnalytics);
router.get('/reports/monthly-trends', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getMonthlyTrendsAnalytics);

export default router;
