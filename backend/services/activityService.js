import pool from '../config/db.js';

/**
 * Activity Logs Service
 */

/**
 * Create an activity log record.
 * Runs asynchronously and catches errors to prevent blocking the primary request flow.
 */
export async function logActivity(dbOrPool, userId, action, module, entityType, entityId, description, ipAddress) {
  const db = dbOrPool || pool;
  try {
    let userName = null;
    let role = null;

    if (userId) {
      const [userRows] = await db.execute('SELECT name, role FROM users WHERE id = ? LIMIT 1', [userId]);
      if (userRows.length > 0) {
        userName = userRows[0].name;
        role = userRows[0].role;
      }
    }

    const sql = `
      INSERT INTO activity_logs (user_id, user_name, role, action, module, entity_type, entity_id, description, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    await db.execute(sql, [
      userId || null,
      userName,
      role,
      action,
      module,
      entityType || null,
      entityId || null,
      description || null,
      ipAddress || null
    ]);
  } catch (error) {
    console.error('[ActivityLogger Error] Failed to write log:', error.message);
  }
}

/**
 * List activity logs with query options.
 */
export async function listLogs(filters = {}) {
  const { user_id, module, action, from, to, search, page = 1, limit = 50 } = filters;
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const params = [];

  if (user_id) {
    conditions.push('user_id = ?');
    params.push(user_id);
  }

  if (module) {
    conditions.push('module = ?');
    params.push(module);
  }

  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }

  if (from) {
    conditions.push('created_at >= ?');
    params.push(from);
  }

  if (to) {
    conditions.push('created_at <= ?');
    params.push(`${to} 23:59:59`);
  }

  if (search) {
    conditions.push('(user_name LIKE ? OR action LIKE ? OR description LIKE ? OR module LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  // Get total count
  const countSql = `SELECT COUNT(*) AS total FROM activity_logs ${whereClause}`;
  const [countRows] = await pool.execute(countSql, params);
  const total = countRows[0].total;

  // Get paginated results
  const dataSql = `
    SELECT id, user_id, user_name, role, action, module, entity_type, entity_id, description, ip_address, created_at
    FROM activity_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  // pool.execute limit/offset parameters must be numbers in mysql2 when prepared statements are used.
  const [rows] = await pool.execute(dataSql, [...params, parsedLimit.toString(), offset.toString()]);

  return {
    total,
    data: rows,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit)
  };
}

/**
 * Retrieve a specific log by ID
 */
export async function getLogById(id) {
  const sql = `
    SELECT id, user_id, user_name, role, action, module, entity_type, entity_id, description, ip_address, created_at
    FROM activity_logs
    WHERE id = ? LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [id]);
  return rows[0] || null;
}
