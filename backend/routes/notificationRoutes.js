import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/notificationController.js';

const router = express.Router();

// GET /api/notifications - List all notifications for authenticated user
router.get('/notifications', verifyToken, getUserNotifications);

// GET /api/notifications/unread-count - Fetch unread count for badge indicators
router.get('/notifications/unread-count', verifyToken, getUnreadNotificationsCount);

// POST /api/notifications/:id/read - Mark single alert as read
router.post('/notifications/:id/read', verifyToken, markNotificationAsRead);

// POST /api/notifications/read-all - Bulk mark all notifications as read
router.post('/notifications/read-all', verifyToken, markAllNotificationsAsRead);

export default router;
