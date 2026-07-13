import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  getAllLogs,
  getRecentLogs,
  getMyActivity,
  getLogByIdController,
  getLogsByModule
} from '../controllers/activityLogController.js';

const router = express.Router();

/**
 * Activity Logs Routes
 * Provides audit trail access with role-based restrictions.
 */

// GET /api/activity-logs/recent — Last 20 logs scoped by role
router.get('/activity-logs/recent', verifyToken, getRecentLogs);

// GET /api/activity-logs/my-activity — Logged-in user's own activity
router.get('/activity-logs/my-activity', verifyToken, getMyActivity);

// GET /api/activity-logs/module/:module — Fetch logs in a specific module
router.get('/activity-logs/module/:module', verifyToken, getLogsByModule);

// GET /api/activity-logs/:id — Fetch detailed activity log by ID
router.get('/activity-logs/:id', verifyToken, getLogByIdController);

// GET /api/activity-logs — Full audit log list with filters (accessible to all, scoped at controller level)
router.get('/activity-logs', verifyToken, getAllLogs);

export default router;
