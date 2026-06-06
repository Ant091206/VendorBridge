import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  getAllLogs,
  getRecentLogs,
  getMyActivity
} from '../controllers/activityLogController.js';

const router = express.Router();

/**
 * Activity Logs Routes
 * Provides audit trail access with role-based restrictions.
 */

// GET /api/activity-logs/recent — Last 20 logs for dashboard feed (admin and officer)
// Note: Registered before parameterized routes to prevent collision
router.get('/activity-logs/recent', verifyToken, restrictTo('admin', 'officer'), getRecentLogs);

// GET /api/activity-logs/my-activity — Logged-in user's own activity (all roles)
router.get('/activity-logs/my-activity', verifyToken, getMyActivity);

// GET /api/activity-logs — Full audit log list with filters (admin only)
router.get('/activity-logs', verifyToken, restrictTo('admin'), getAllLogs);

export default router;
