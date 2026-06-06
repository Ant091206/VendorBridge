import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from '../services/notificationService.js';

/**
 * Notifications Controller
 */

// GET /api/notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { is_read, limit } = req.query;

    const list = await listNotifications(userId, { is_read, limit });
    return res.status(200).json({
      status: 'success',
      data: list
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

// POST /api/notifications/:id/read
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
