import pool from '../config/db.js';
import { EventEmitter } from 'events';

// Real-time notification dispatcher hook (can be subscribed by WebSocket server in future)
export const notificationDispatcher = new EventEmitter();

/**
 * Notifications Service
 */

/**
 * Create a new notification for a specific user.
 */
export async function createNotification(userId, title, message, type, referenceModule = null, referenceId = null) {
  try {
    if (!userId || !title?.trim() || !message?.trim() || !type?.trim()) {
      const error = new Error('userId, title, message, and type are required to create a notification.');
      error.statusCode = 400;
      throw error;
    }

    const sql = `
      INSERT INTO notifications (user_id, title, message, status, notification_type, reference_module, reference_id, created_at)
      VALUES (?, ?, ?, 'Unread', ?, ?, ?, NOW())
    `;
    const [result] = await pool.execute(sql, [
      userId,
      title.trim(),
      message.trim(),
      type.trim(),
      referenceModule || null,
      referenceId || null
    ]);
    
    const notifId = result.insertId;
    
    // Emit event for real-time handlers
    notificationDispatcher.emit('created', {
      id: notifId,
      user_id: userId,
      title: title.trim(),
      message: message.trim(),
      status: 'Unread',
      notification_type: type.trim(),
      reference_module: referenceModule,
      reference_id: referenceId,
      created_at: new Date()
    });

    return notifId;
  } catch (error) {
    console.error('[NotificationService Error] Failed to create notification:', error.message);
    throw error;
  }
}

/**
 * Fetch notifications for a user with filters and role-based access scoping.
 */
export async function listNotifications(user, filters = {}) {
  const { status, type, search, sort = 'created_desc', limit = 50, page = 1 } = filters;
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const params = [];

  // Scoping based on user role
  if (user.role === 'admin' && filters.all === 'true') {
    // Admin can see all system notifications if explicitly requested
  } else if (user.role === 'manager') {
    // Managers see their own OR approval workflow notifications
    conditions.push('(user_id = ? OR notification_type = ?)');
    params.push(user.id, 'Approval');
  } else {
    // Default scoping: user sees their own notifications
    conditions.push('user_id = ?');
    params.push(user.id);
  }

  // Filter by status (e.g. Unread, Read, Archived, Dismissed)
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  } else {
    // By default, exclude dismissed/deleted ones
    conditions.push("status != 'Dismissed'");
  }

  if (type) {
    conditions.push('notification_type = ?');
    params.push(type);
  }

  if (search) {
    conditions.push('(title LIKE ? OR message LIKE ? OR notification_type LIKE ? OR reference_module LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const sortMap = {
    created_desc: 'created_at DESC',
    created_asc: 'created_at ASC',
    type_asc: 'notification_type ASC, created_at DESC',
    type_desc: 'notification_type DESC, created_at DESC',
    status_asc: 'status ASC, created_at DESC',
    status_desc: 'status DESC, created_at DESC'
  };
  const orderBy = sortMap[sort] || sortMap.created_desc;

  // Count query
  const countSql = `SELECT COUNT(*) AS total FROM notifications ${whereClause}`;
  const [countRows] = await pool.execute(countSql, params);
  const total = countRows[0].total;

  // Data query
  const sql = `
    SELECT id, user_id, title, message, status, notification_type, reference_module, reference_id, read_at, created_at
    FROM notifications
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.execute(sql, [...params, parsedLimit.toString(), offset.toString()]);
  
  return {
    total,
    data: rows,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit)
  };
}

/**
 * Fetch a specific notification by ID (with authorization checks)
 */
export async function getNotificationById(id, user) {
  const sql = `
    SELECT id, user_id, title, message, status, notification_type, reference_module, reference_id, read_at, created_at
    FROM notifications
    WHERE id = ? LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [id]);
  const notification = rows[0] || null;

  if (!notification) return null;

  // Authorization check
  if (user.role === 'admin') return notification;
  if (user.role === 'manager' && notification.notification_type === 'Approval') return notification;
  if (notification.user_id === user.id) return notification;

  const error = new Error('Access denied to this notification.');
  error.statusCode = 403;
  throw error;
}

/**
 * Get the count of unread notifications for a user.
 */
export async function getUnreadCount(userId) {
  const sql = "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND status = 'Unread'";
  const [rows] = await pool.execute(sql, [userId]);
  return rows[0]?.count || 0;
}

/**
 * Mark a specific notification as read.
 */
export async function markAsRead(id, userId) {
  const [rows] = await pool.execute('SELECT id, status FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
  if (rows.length === 0) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  const sql = "UPDATE notifications SET status = 'Read', read_at = NOW() WHERE id = ? AND user_id = ?";
  await pool.execute(sql, [id, userId]);
}

/**
 * Mark all notifications for a user as read.
 */
export async function markAllAsRead(userId) {
  const sql = "UPDATE notifications SET status = 'Read', read_at = NOW() WHERE user_id = ? AND status = 'Unread'";
  await pool.execute(sql, [userId]);
}

/**
 * Archive a specific notification.
 */
export async function archiveNotification(id, userId) {
  const [rows] = await pool.execute('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
  if (rows.length === 0) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  const sql = "UPDATE notifications SET status = 'Archived' WHERE id = ? AND user_id = ?";
  await pool.execute(sql, [id, userId]);
}

/**
 * Delete a specific notification (Dismiss/Hard delete)
 */
export async function deleteNotification(id, userId) {
  const [rows] = await pool.execute('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
  if (rows.length === 0) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  const sql = 'DELETE FROM notifications WHERE id = ? AND user_id = ?';
  await pool.execute(sql, [id, userId]);
}
