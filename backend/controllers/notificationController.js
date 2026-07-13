import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  getNotificationById,
  createNotification
} from '../services/notificationService.js';

/**
 * Notifications Controller
 */

// POST /api/notifications
export const createNotificationHandler = async (req, res) => {
  try {
    const {
      user_id,
      title,
      message,
      notification_type,
      type,
      reference_module,
      reference_id
    } = req.body;

    const resolvedType = notification_type || type;
    if (!user_id || !title?.trim() || !message?.trim() || !resolvedType?.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'user_id, title, message, and notification_type are required.'
      });
    }

    const id = await createNotification(
      Number(user_id),
      title,
      message,
      resolvedType,
      reference_module || null,
      reference_id || null
    );

    return res.status(201).json({
      status: 'success',
      message: 'Notification created successfully.',
      data: { id }
    });
  } catch (error) {
    console.error('Error in createNotificationHandler:', error);
    return res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Failed to create notification.'
    });
  }
};

// GET /api/notifications
export const getUserNotifications = async (req, res) => {
  try {
    const user = req.user;
    const { status, type, search, sort, limit, page, all } = req.query;

    const result = await listNotifications(user, {
      status,
      type,
      search: search?.trim() || undefined,
      sort,
      limit,
      page,
      all
    });
    return res.status(200).json({
      status: 'success',
      total: result.total,
      data: result.data,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('Error in getUserNotifications controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve notifications.'
    });
  }
};

// GET /api/notifications/unread-count
export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await getUnreadCount(userId);

    return res.status(200).json({
      status: 'success',
      data: { count }
    });
  } catch (error) {
    console.error('Error in getUnreadNotificationsCount controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve unread notification count.'
    });
  }
};

// GET /api/notifications/:id
export const getNotificationByIdHandler = async (req, res) => {
  try {
    const notification = await getNotificationById(req.params.id, req.user);
    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification not found.' });
    }
    return res.status(200).json({
      status: 'success',
      data: notification
    });
  } catch (error) {
    console.error('Error in getNotificationByIdHandler:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ status: 'error', message: error.message });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve notification.' });
  }
};

// PATCH /api/notifications/:id/read
export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await markAsRead(id, userId);

    return res.status(200).json({
      status: 'success',
      message: 'Notification marked as read.'
    });
  } catch (error) {
    console.error('Error in markNotificationAsRead controller:', error);
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read.'
    });
  }
};

// PATCH /api/notifications/:id/archive
export const archiveNotificationHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await archiveNotification(id, userId);

    return res.status(200).json({
      status: 'success',
      message: 'Notification archived successfully.'
    });
  } catch (error) {
    console.error('Error in archiveNotification controller:', error);
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Failed to archive notification.'
    });
  }
};

// DELETE /api/notifications/:id
export const deleteNotificationHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await deleteNotification(id, userId);

    return res.status(200).json({
      status: 'success',
      message: 'Notification dismissed/deleted.'
    });
  } catch (error) {
    console.error('Error in deleteNotification controller:', error);
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification.'
    });
  }
};

// POST /api/notifications/read-all
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await markAllAsRead(userId);

    return res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read.'
    });
  }
};
