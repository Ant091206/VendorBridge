import db from '../config/db.js';

const allowedRFQSorts = {
  created_at: 'r.created_at',
  submission_deadline: 'r.submission_deadline',
  title: 'r.title',
  rfq_number: 'r.rfq_number',
  priority: 'r.priority',
  status: 'r.status'
};

const toPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

const generateRFQNumber = async (conn) => {
  const year = new Date().getFullYear();
  const [rows] = await conn.execute(
    `SELECT rfq_number
     FROM rfqs
     WHERE rfq_number LIKE ?
     ORDER BY id DESC
     LIMIT 1`,
    [`RFQ-${year}-%`]
  );

  let next = 1;
  if (rows.length > 0 && rows[0].rfq_number) {
    const last = rows[0].rfq_number.split('-').pop();
    next = (Number.parseInt(last, 10) || 0) + 1;
  }
  return `RFQ-${year}-${String(next).padStart(4, '0')}`;
};

const getVendorEmailFilter = async (user) => {
  if (user.role !== 'vendor') return null;
  const [rows] = await db.execute('SELECT id FROM vendors WHERE email = ? LIMIT 1', [user.email]);
  return rows[0]?.id || -1;
};

export const listRFQs = async (query, user) => {
  const { page, limit, offset } = toPagination(query);
  const sortColumn = allowedRFQSorts[query.sort] || 'r.created_at';
  const direction = query.order === 'asc' ? 'ASC' : 'DESC';
  const conditions = [];
  const params = [];

  if (query.search) {
    conditions.push('(r.rfq_number LIKE ? OR r.title LIKE ? OR r.description LIKE ?)');
    const term = `%${query.search}%`;
    params.push(term, term, term);
  }

  if (query.status) {
    conditions.push('r.status = ?');
    params.push(query.status);
  }

  if (query.priority) {
    conditions.push('r.priority = ?');
    params.push(query.priority);
  }

  if (query.type) {
    conditions.push('r.type = ?');
    params.push(query.type);
  }

  const vendorId = await getVendorEmailFilter(user);
  let vendorJoin = '';
  
  if (user.role === 'vendor') {
    vendorJoin = 'JOIN rfq_vendors rv_scope ON rv_scope.rfq_id = r.id';
    conditions.push('rv_scope.vendor_id = ?');
    conditions.push("r.status != 'draft'");
    params.push(vendorId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await db.execute(
    `SELECT COUNT(DISTINCT r.id) AS total
     FROM rfqs r
     ${vendorJoin}
     ${where}`,
    params
  );

  const [rows] = await db.query(
    `SELECT
       r.id,
       r.rfq_number,
       r.title,
       r.description,
       r.type,
       r.priority,
       r.issue_date,
       r.submission_deadline,
       r.status,
       r.notes,
       r.created_by,
       u.name AS created_by_name,
       r.created_at,
       r.updated_at,
       (SELECT COUNT(*) FROM rfq_vendors WHERE rfq_id = r.id) AS assigned_vendors_count,
       (SELECT COUNT(*) FROM rfq_items WHERE rfq_id = r.id) AS items_count,
       (SELECT COUNT(*) FROM rfq_attachments WHERE rfq_id = r.id) AS attachments_count
     FROM rfqs r
     LEFT JOIN users u ON u.id = r.created_by
     ${vendorJoin}
     ${where}
     ORDER BY ${sortColumn} ${direction}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total: countRows[0].total,
      total_pages: Math.ceil(countRows[0].total / limit)
    }
  };
};

export const getRFQ = async (id, user) => {
  const vendorId = await getVendorEmailFilter(user);
  const params = [id];
  let vendorJoin = '';
  let vendorWhere = '';

  if (user.role === 'vendor') {
    vendorJoin = 'JOIN rfq_vendors rv_scope ON rv_scope.rfq_id = r.id';
    vendorWhere = "AND rv_scope.vendor_id = ? AND r.status != 'draft'";
    params.push(vendorId);
  }

  const [rows] = await db.execute(
    `SELECT r.*, u.name AS created_by_name, u2.name AS updated_by_name
     FROM rfqs r
     LEFT JOIN users u ON u.id = r.created_by
     LEFT JOIN users u2 ON u2.id = r.updated_by
     ${vendorJoin}
     WHERE r.id = ? ${vendorWhere}`,
    params
  );

  if (rows.length === 0) return null;
  const rfq = rows[0];

  // Fetch items
  const [items] = await db.execute(
    'SELECT * FROM rfq_items WHERE rfq_id = ? ORDER BY id ASC',
    [id]
  );
  rfq.items = items;

  // Fetch assigned vendors
  const [vendors] = await db.execute(
    `SELECT
       v.id,
       COALESCE(v.vendor_name, v.name) AS vendor_name,
       COALESCE(v.company_name, v.name) AS company_name,
       v.vendor_code,
       v.email,
       v.phone,
       v.city,
       v.status,
       vc.name AS category_name
     FROM rfq_vendors rv
     JOIN vendors v ON v.id = rv.vendor_id
     LEFT JOIN vendor_categories vc ON vc.id = v.category_id
     WHERE rv.rfq_id = ?
     ORDER BY v.name ASC`,
    [id]
  );
  rfq.assigned_vendors = vendors;

  // Fetch attachments
  const [attachments] = await db.execute(
    'SELECT * FROM rfq_attachments WHERE rfq_id = ? ORDER BY id ASC',
    [id]
  );
  rfq.attachments = attachments;

  return rfq;
};

const ensureVendorsExist = async (vendorIds) => {
  if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) return [];
  const uniqueIds = [...new Set(vendorIds.map((id) => Number(id)).filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const placeholders = uniqueIds.map(() => '?').join(',');
  const [rows] = await db.execute(
    `SELECT id FROM vendors WHERE id IN (${placeholders}) AND status = 'active'`,
    uniqueIds
  );

  if (rows.length !== uniqueIds.length) {
    const error = new Error('One or more assigned vendors are invalid or inactive.');
    error.statusCode = 400;
    throw error;
  }

  return uniqueIds;
};

const normalizeRFQ = (payload, userId, isUpdate = false) => ({
  title: payload.title.trim(),
  description: payload.description.trim(),
  type: payload.type?.trim() || 'Other',
  priority: payload.priority || 'Medium',
  submission_deadline: new Date(payload.submission_deadline),
  status: payload.status || 'draft',
  notes: payload.notes || null,
  created_by: isUpdate ? undefined : userId,
  updated_by: isUpdate ? userId : null
});

export const createRFQRecord = async (payload, user) => {
  const vendorIds = await ensureVendorsExist(payload.vendor_ids);
  const rfq = normalizeRFQ(payload, user.id, false);
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    const rfqNumber = await generateRFQNumber(conn);

    const [result] = await conn.execute(
      `INSERT INTO rfqs (
        rfq_number, title, description, type, priority, submission_deadline, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rfqNumber, rfq.title, rfq.description, rfq.type, rfq.priority, rfq.submission_deadline, rfq.status, rfq.notes, user.id
      ]
    );

    const rfqId = result.insertId;

    // Insert items
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      for (const item of payload.items) {
        await conn.execute(
          `INSERT INTO rfq_items (rfq_id, item_name, description, quantity, unit, expected_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [rfqId, item.item_name.trim(), item.description || null, Number(item.quantity), item.unit.trim(), item.expected_price || null]
        );
      }
    }

    // Insert vendors
    for (const vendorId of vendorIds) {
      await conn.execute('INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)', [rfqId, vendorId]);
    }

    await conn.commit();
    conn.release();
    return getRFQ(rfqId, user);
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

export const updateRFQRecord = async (id, payload, user) => {
  const existing = await getRFQ(id, { ...user, role: 'admin' });
  if (!existing) {
    const error = new Error('RFQ not found.');
    error.statusCode = 404;
    throw error;
  }

  if (existing.status === 'closed' || existing.status === 'cancelled') {
    const error = new Error('Closed or cancelled RFQs cannot be edited.');
    error.statusCode = 400;
    throw error;
  }

  const vendorIds = await ensureVendorsExist(payload.vendor_ids);
  const rfq = normalizeRFQ(payload, user.id, true);
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE rfqs
       SET title = ?, description = ?, type = ?, priority = ?, submission_deadline = ?, status = ?, notes = ?, updated_by = ?
       WHERE id = ?`,
      [
        rfq.title, rfq.description, rfq.type, rfq.priority, rfq.submission_deadline, rfq.status, rfq.notes, rfq.updated_by, id
      ]
    );

    // Sync items: delete all and re-insert
    await conn.execute('DELETE FROM rfq_items WHERE rfq_id = ?', [id]);
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      for (const item of payload.items) {
        await conn.execute(
          `INSERT INTO rfq_items (rfq_id, item_name, description, quantity, unit, expected_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, item.item_name.trim(), item.description || null, Number(item.quantity), item.unit.trim(), item.expected_price || null]
        );
      }
    }

    // Sync vendors: delete all and re-insert
    await conn.execute('DELETE FROM rfq_vendors WHERE rfq_id = ?', [id]);
    for (const vendorId of vendorIds) {
      await conn.execute('INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)', [id, vendorId]);
    }

    await conn.commit();
    conn.release();
    return getRFQ(id, user);
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

export const patchRFQStatus = async (id, status, userId, user) => {
  const existing = await getRFQ(id, { ...user, role: 'admin' });
  if (!existing) {
    const error = new Error('RFQ not found.');
    error.statusCode = 404;
    throw error;
  }

  if (status === 'published') {
    const [vendors] = await db.execute('SELECT id FROM rfq_vendors WHERE rfq_id = ? LIMIT 1', [id]);
    if (vendors.length === 0) {
      const error = new Error('At least one vendor must be assigned before publishing.');
      error.statusCode = 400;
      throw error;
    }
  }

  await db.execute(
    'UPDATE rfqs SET status = ?, updated_by = ? WHERE id = ?',
    [status, userId, id]
  );

  return getRFQ(id, user);
};

export const closeRFQRecord = async (id, userId) => {
  const [rows] = await db.execute('SELECT id FROM rfqs WHERE id = ?', [id]);
  if (rows.length === 0) {
    const error = new Error('RFQ not found.');
    error.statusCode = 404;
    throw error;
  }

  await db.execute("UPDATE rfqs SET status = 'closed', updated_by = ? WHERE id = ?", [userId, id]);
};

export const deleteRFQRecord = async (id) => {
  const [rows] = await db.execute('SELECT id FROM rfqs WHERE id = ?', [id]);
  if (rows.length === 0) {
    const error = new Error('RFQ not found.');
    error.statusCode = 404;
    throw error;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM rfq_items WHERE rfq_id = ?', [id]);
    await conn.execute('DELETE FROM rfq_vendors WHERE rfq_id = ?', [id]);
    await conn.execute('DELETE FROM rfq_attachments WHERE rfq_id = ?', [id]);
    await conn.execute('DELETE FROM rfqs WHERE id = ?', [id]);
    await conn.commit();
    conn.release();
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

// ── Item Sub-Resources ───────────────────────────────────────────────────────
export const addRFQItemRecord = async (rfqId, item) => {
  const [result] = await db.execute(
    `INSERT INTO rfq_items (rfq_id, item_name, description, quantity, unit, expected_price)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [rfqId, item.item_name.trim(), item.description || null, Number(item.quantity), item.unit.trim(), item.expected_price || null]
  );
  return { id: result.insertId, rfq_id: Number(rfqId), ...item };
};

export const updateRFQItemRecord = async (itemId, item) => {
  const [rows] = await db.execute('SELECT id FROM rfq_items WHERE id = ?', [itemId]);
  if (rows.length === 0) {
    const error = new Error('RFQ item not found.');
    error.statusCode = 404;
    throw error;
  }
  await db.execute(
    `UPDATE rfq_items
     SET item_name = ?, description = ?, quantity = ?, unit = ?, expected_price = ?
     WHERE id = ?`,
    [item.item_name.trim(), item.description || null, Number(item.quantity), item.unit.trim(), item.expected_price || null, itemId]
  );
  return { id: Number(itemId), ...item };
};

export const deleteRFQItemRecord = async (itemId) => {
  const [result] = await db.execute('DELETE FROM rfq_items WHERE id = ?', [itemId]);
  if (result.affectedRows === 0) {
    const error = new Error('RFQ item not found.');
    error.statusCode = 404;
    throw error;
  }
};

// ── Vendor Sub-Resources ─────────────────────────────────────────────────────
export const assignRFQVendorsRecord = async (rfqId, vendorIds) => {
  const validatedIds = await ensureVendorsExist(vendorIds);
  const added = [];
  for (const vId of validatedIds) {
    const [existing] = await db.execute('SELECT id FROM rfq_vendors WHERE rfq_id = ? AND vendor_id = ?', [rfqId, vId]);
    if (existing.length === 0) {
      await db.execute('INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)', [rfqId, vId]);
      added.push(vId);
    }
  }
  return added;
};

export const removeRFQVendorRecord = async (rfqId, vendorId) => {
  const [result] = await db.execute('DELETE FROM rfq_vendors WHERE rfq_id = ? AND vendor_id = ?', [rfqId, vendorId]);
  if (result.affectedRows === 0) {
    const error = new Error('Assignment not found.');
    error.statusCode = 404;
    throw error;
  }
};

// ── Attachment Sub-Resources ─────────────────────────────────────────────────
export const addRFQAttachmentRecord = async (rfqId, file) => {
  const [result] = await db.execute(
    `INSERT INTO rfq_attachments (rfq_id, file_name, file_path, file_type)
     VALUES (?, ?, ?, ?)`,
    [rfqId, file.originalname, `/uploads/${file.filename}`, file.mimetype]
  );
  return {
    id: result.insertId,
    rfq_id: Number(rfqId),
    file_name: file.originalname,
    file_path: `/uploads/${file.filename}`,
    file_type: file.mimetype
  };
};

export const deleteRFQAttachmentRecord = async (attachmentId) => {
  const [rows] = await db.execute('SELECT file_path FROM rfq_attachments WHERE id = ?', [attachmentId]);
  if (rows.length === 0) {
    const error = new Error('Attachment not found.');
    error.statusCode = 404;
    throw error;
  }
  
  // Delete database record first
  await db.execute('DELETE FROM rfq_attachments WHERE id = ?', [attachmentId]);

  return rows[0].file_path;
};
