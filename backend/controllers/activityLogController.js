import pool from '../config/db.js';

/**
 * Activity Log Controller
 * Provides endpoints for viewing and filtering system-wide audit trail data.
 */

/**
 * GET /api/activity-logs
 * Returns all activity logs with optional filtering.
 * Protected: admin only.
 * 
 * Query params:
 *   ?user_id=1            Filter by user
 *   ?entity_type=rfq      Filter by entity type
 *   ?action=RFQ_CREATED   Filter by action string
 *   ?from=2025-01-01      Start date filter
 *   ?to=2025-01-31        End date filter
 *   ?limit=50             Results limit (default 50, max 200)
 */
export const getAllLogs = async (req, res) => {
  try {
    const { user_id, entity_type, action, from, to, limit } = req.query;

    // Clamp limit between 1 and 200, default 50
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);

    // Build WHERE conditions dynamically
    const conditions = [];
    const params = [];

    if (user_id) {
      conditions.push('al.user_id = ?');
      params.push(user_id);
    }

    if (entity_type) {
      conditions.push('al.entity_type = ?');
      params.push(entity_type);
    }

    if (action) {
      conditions.push('al.action LIKE ?');
      params.push(`%${action}%`);
    }

    if (from) {
      conditions.push('al.created_at >= ?');
      params.push(from);
    }

    if (to) {
      conditions.push('al.created_at <= ?');
      // Extend to end of day
      params.push(`${to} 23:59:59`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Get total count
    const countSql = `
      SELECT COUNT(*) AS total
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `;
    const [countRows] = await pool.execute(countSql, params);
    const total = countRows[0].total;

    // Get paginated results
    const dataSql = `
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.created_at,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ${parsedLimit}
    `;
    const [rows] = await pool.execute(dataSql, params);

    return res.status(200).json({
      status: 'success',
      total,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve activity logs.'
    });
  }
};

/**
 * GET /api/activity-logs/recent
 * Returns the last 20 activity logs for dashboard feed.
 * Protected: admin and officer.
 */
export const getRecentLogs = async (req, res) => {
  try {
    const sql = `
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.created_at,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 20
    `;
    const [rows] = await pool.execute(sql);

    return res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching recent activity logs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve recent activity logs.'
    });
  }
};

/**
 * GET /api/activity-logs/my-activity
 * Returns last 30 actions performed by the logged-in user.
 * Protected: all authenticated roles.
 */
export const getMyActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.created_at,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.user_id = ?
      ORDER BY al.created_at DESC
      LIMIT 30
    `;
    const [rows] = await pool.execute(sql, [userId]);

    return res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve your activity history.'
    });
  }
};
