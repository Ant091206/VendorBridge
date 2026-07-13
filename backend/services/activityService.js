import pool from '../config/db.js';

/**
 * Activity Logs Service
 */

/**
 * Create an activity log record.
 * Runs asynchronously and catches errors to prevent blocking the primary request flow.
 */
export async function logActivity(
  dbOrPool, 
  userId, 
  actionType, 
  moduleName, 
  entityType, 
  entityId, 
  description, 
  ipAddress, 
  oldValue = null, 
  newValue = null, 
  deviceInfo = null
) {
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
      INSERT INTO activity_logs (
        user_id, user_name, role, action_type, module_name, 
        entity_type, entity_id, old_value, new_value, 
        description, ip_address, device_info, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    // Ensure JSON values are stringified
    const oldValJson = oldValue ? JSON.stringify(oldValue) : null;
    const newValJson = newValue ? JSON.stringify(newValue) : null;

    await db.execute(sql, [
      userId || null,
      userName,
      role,
      actionType,
      moduleName,
      entityType || 'system',
      (entityId !== undefined && entityId !== null) ? entityId : 0,
      oldValJson,
      newValJson,
      description || null,
      ipAddress || null,
      deviceInfo || null
    ]);
  } catch (error) {
    console.error('[ActivityLogger Error] Failed to write log:', error.message);
  }
}

/**
 * List activity logs with query options.
 */
export async function listLogs(filters = {}) {
  const {
    user_id,
    role,
    entity_type,
    module,
    action,
    from,
    to,
    search,
    page = 1,
    limit = 50,
    allowed_modules,
    sort = 'created_desc'
  } = filters;
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const params = [];

  if (user_id) {
    conditions.push('user_id = ?');
    params.push(user_id);
  }

  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }

  if (entity_type) {
    conditions.push('entity_type = ?');
    params.push(entity_type);
  }

  // Handle both filter names
  const moduleName = module || filters.module_name;
  if (moduleName) {
    conditions.push('module_name = ?');
    params.push(moduleName);
  }

  // Handle allowed modules constraint
  if (allowed_modules && allowed_modules.length > 0) {
    const placeholders = allowed_modules.map(() => '?').join(',');
    conditions.push(`module_name IN (${placeholders})`);
    params.push(...allowed_modules);
  }

  // Handle both action/action_type
  const actType = action || filters.action_type;
  if (actType) {
    conditions.push('action_type = ?');
    params.push(actType);
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
    conditions.push('(user_name LIKE ? OR role LIKE ? OR action_type LIKE ? OR description LIKE ? OR module_name LIKE ? OR entity_type LIKE ? OR ip_address LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const sortMap = {
    created_desc: 'created_at DESC',
    created_asc: 'created_at ASC',
    action_asc: 'action_type ASC, created_at DESC',
    action_desc: 'action_type DESC, created_at DESC',
    module_asc: 'module_name ASC, created_at DESC',
    module_desc: 'module_name DESC, created_at DESC',
    user_asc: 'user_name ASC, created_at DESC',
    user_desc: 'user_name DESC, created_at DESC'
  };
  const orderBy = sortMap[sort] || sortMap.created_desc;

  // Get total count
  const countSql = `SELECT COUNT(*) AS total FROM activity_logs ${whereClause}`;
  const [countRows] = await pool.execute(countSql, params);
  const total = countRows[0].total;

  // Get paginated results
  const dataSql = `
    SELECT id, user_id, user_name, role, action_type, module_name, 
           entity_type, entity_id, old_value, new_value, description, 
           ip_address, device_info, created_at
    FROM activity_logs
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  
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
    SELECT id, user_id, user_name, role, action_type, module_name, 
           entity_type, entity_id, old_value, new_value, description, 
           ip_address, device_info, created_at
    FROM activity_logs
    WHERE id = ? LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [id]);
  return rows[0] || null;
}
