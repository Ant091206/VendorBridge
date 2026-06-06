import pool from '../config/db.js';

/**
 * Notifications Service
 */

/**
 * Create a new notification for a specific user.
 */
export async function createNotification(userId, title, message, type, referenceType = null, referenceId = null) {
  try {
    const sql = `
      INSERT INTO notifications (user_id, title, message, type, is_read, reference_type, reference_id, created_at)
      VALUES (?, ?, ?, ?, 0, ?, ?, NOW())
    `;
    await pool.execute(sql, [userId, title, message, type, referenceType, referenceId]);
  } catch (error) {
    console.error('[NotificationService Error] Failed to create notification:', error.message);
  }
}

/**
 * Fetch notifications for a user with optional read filtering.
 */
export async function listNotifications(userId, filters = {}) {
  const { is_read, limit = 50 } = filters;
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);

  const conditions = ['user_id = ?'];
  const params = [userId];

  if (is_read !== undefined && is_read !== null) {
    conditions.push('is_read = ?');
    params.push(is_read === 'true' || is_read === true || is_read === 1 ? 1 : 0);
  }

  const whereClause = 'WHERE ' + conditions.join(' AND ');

  const sql = `
    SELECT id, user_id, title, message, type, is_read, reference_type, reference_id, created_at
    FROM notifications
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ?
  `;

  const [rows] = await pool.execute(sql, [...params, parsedLimit.toString()]);
  return rows;
}

/**
 * Get the count of unread notifications for a user.
 */
export async function getUnreadCount(userId) {
  const sql = 'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0';
  const [rows] = await pool.execute(sql, [userId]);
  return rows[0]?.count || 0;
}

/**
 * Mark a specific notification as read.
 */
export async function markAsRead(id, userId) {
  // Check if notification exists and belongs to user
  const [rows] = await pool.execute('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
  if (rows.length === 0) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  const sql = 'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?';
  await pool.execute(sql, [id, userId]);
}

/**
 * Mark all notifications for a user as read.
 */
export async function markAllAsRead(userId) {
  const sql = 'UPDATE notifications SET is_read = 1 WHERE user_id = ?';
  await pool.execute(sql, [userId]);
}
