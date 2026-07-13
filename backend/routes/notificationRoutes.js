import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  createNotificationHandler,
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationByIdHandler,
  archiveNotificationHandler,
  deleteNotificationHandler
} from '../controllers/notificationController.js';

const router = express.Router();

// POST /api/notifications - Create a manual/system notification (admin only)
router.post('/notifications', verifyToken, restrictTo('admin'), createNotificationHandler);

// GET /api/notifications - List all notifications for authenticated user (scoped by role)
router.get('/notifications', verifyToken, getUserNotifications);

// GET /api/notifications/unread-count - Fetch unread count for badge indicators
router.get('/notifications/unread-count', verifyToken, getUnreadNotificationsCount);

// GET /api/notifications/:id - Fetch single notification by ID
router.get('/notifications/:id', verifyToken, getNotificationByIdHandler);

// PATCH /api/notifications/:id/read - Mark single alert as read
router.patch('/notifications/:id/read', verifyToken, markNotificationAsRead);

// PATCH /api/notifications/:id/archive - Archive single alert
router.patch('/notifications/:id/archive', verifyToken, archiveNotificationHandler);

// DELETE /api/notifications/:id - Hard delete/dismiss notification
router.delete('/notifications/:id', verifyToken, deleteNotificationHandler);

// POST endpoints for backward compatibility
router.post('/notifications/:id/read', verifyToken, markNotificationAsRead);
router.post('/notifications/read-all', verifyToken, markAllNotificationsAsRead);

export default router;
