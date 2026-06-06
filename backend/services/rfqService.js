import db from '../config/db.js';

const allowedRFQSorts = {
  created_at: 'r.created_at',
  deadline: 'r.deadline',
  title: 'r.title',
  rfq_number: 'r.rfq_number'
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

  const last = rows[0]?.rfq_number?.split('-').pop();
  const next = (Number.parseInt(last, 10) || 0) + 1;
  return `RFQ-${year}-${String(next).padStart(5, '0')}`;
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
    conditions.push('(r.rfq_number LIKE ? OR r.title LIKE ? OR r.product_name LIKE ?)');
    const term = `%${query.search}%`;
    params.push(term, term, term);
  }

  if (query.status) {
    conditions.push('r.status = ?');
    params.push(query.status);
  }

  const vendorId = await getVendorEmailFilter(user);
  let vendorJoin = '';
  let quotationJoin = '';
  let quotationFields = '';
  let selectParams = [];
  if (user.role === 'vendor') {
    vendorJoin = 'JOIN rfq_vendors rv_scope ON rv_scope.rfq_id = r.id';
    conditions.push('rv_scope.vendor_id = ?');
    conditions.push("r.status != 'draft'");
    params.push(vendorId);

    quotationJoin = 'LEFT JOIN quotations q ON q.rfq_id = r.id AND q.vendor_id = ?';
    quotationFields = `, q.id AS quotation_id, q.status AS quotation_actual_status, q.unit_price,
                       CASE WHEN q.id IS NOT NULL THEN 'Submitted' ELSE 'Pending' END AS quotation_status`;
    selectParams.push(vendorId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await db.execute(
    `SELECT COUNT(DISTINCT r.id) AS total
     FROM rfqs r
     ${vendorJoin}
     ${where}`,
    params
  );

  const groupBy = user.role === 'vendor' ? 'GROUP BY r.id, q.id' : 'GROUP BY r.id';
  const executionParams = [...selectParams, ...params, limit, offset];

  const [rows] = await db.execute(
    `SELECT
       r.id,
       r.rfq_number,
       r.title,
       r.description,
       r.product_name,
       r.product_details,
       r.quantity,
       r.estimated_budget,
       r.deadline,
       r.status,
       r.created_by,
       u.name AS created_by_name,
       r.created_at,
       r.updated_at,
       COUNT(DISTINCT rv.vendor_id) AS assigned_vendors_count
       ${quotationFields}
     FROM rfqs r
     ${vendorJoin}
     LEFT JOIN users u ON u.id = r.created_by
     LEFT JOIN rfq_vendors rv ON rv.rfq_id = r.id
     ${quotationJoin}
     ${where}
     ${groupBy}
     ORDER BY ${sortColumn} ${direction}
     LIMIT ? OFFSET ?`,
    executionParams
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
    `SELECT r.*, u.name AS created_by_name, COUNT(DISTINCT rv.vendor_id) AS assigned_vendors_count
     FROM rfqs r
     ${vendorJoin}
     LEFT JOIN users u ON u.id = r.created_by
     LEFT JOIN rfq_vendors rv ON rv.rfq_id = r.id
     WHERE r.id = ? ${vendorWhere}
     GROUP BY r.id`,
    params
  );

  if (rows.length === 0) return null;
  const rfq = rows[0];

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
       vc.name AS category_name,
       rv.assigned_at
     FROM rfq_vendors rv
     JOIN vendors v ON v.id = rv.vendor_id
     LEFT JOIN vendor_categories vc ON vc.id = v.category_id
     WHERE rv.rfq_id = ?
     ORDER BY v.vendor_name ASC`,
    [id]
  );

  rfq.assigned_vendors = vendors;
  return rfq;
};

const ensureVendorsExist = async (vendorIds) => {
  const uniqueIds = [...new Set(vendorIds.map((id) => Number(id)).filter(Boolean))];
  if (uniqueIds.length === 0) {
    const error = new Error('No vendors assigned.');
    error.statusCode = 400;
    throw error;
  }

  const placeholders = uniqueIds.map(() => '?').join(',');
  const [rows] = await db.execute(
    `SELECT id FROM vendors WHERE id IN (${placeholders}) AND status = 'active'`,
    uniqueIds
  );

  if (rows.length !== uniqueIds.length) {
    const error = new Error('One or more assigned vendors were not found or are inactive.');
    error.statusCode = 400;
    throw error;
  }

  return uniqueIds;
};

const normalizeRFQ = (payload) => ({
  title: payload.title.trim(),
  description: payload.description.trim(),
  product_name: payload.product_name || payload.title.trim(),
  product_details: payload.product_details.trim(),
  quantity: Number(payload.quantity),
  estimated_budget: Number(payload.estimated_budget || 0),
  deadline: new Date(payload.deadline),
  status: payload.status || 'open'
});

export const createRFQRecord = async (payload, user) => {
  const vendorIds = await ensureVendorsExist(payload.vendor_ids);
  const rfq = normalizeRFQ(payload);
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    const rfqNumber = payload.rfq_number || await generateRFQNumber(conn);

    const [result] = await conn.execute(
      `INSERT INTO rfqs (
        rfq_number, title, description, product_name, product_details, quantity,
        estimated_budget, deadline, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rfqNumber, rfq.title, rfq.description, rfq.product_name, rfq.product_details,
        rfq.quantity, rfq.estimated_budget, rfq.deadline, rfq.status, user.id
      ]
    );

    const rfqId = result.insertId;
    for (const vendorId of vendorIds) {
      await conn.execute('INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)', [rfqId, vendorId]);
    }

    await conn.commit();
    conn.release();
    return getRFQ(rfqId, user);
  } catch (error) {
    await conn.rollback();
    conn.release();
    if (error.code === 'ER_DUP_ENTRY') {
      error.message = 'Duplicate RFQ number.';
      error.statusCode = 409;
    }
    throw error;
  }
};

export const updateRFQRecord = async (id, payload, user) => {
  const existing = await getRFQ(id, { ...user, role: user.role === 'vendor' ? 'vendor' : 'admin' });
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
  const rfq = normalizeRFQ(payload);
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE rfqs
       SET title = ?, description = ?, product_name = ?, product_details = ?, quantity = ?,
           estimated_budget = ?, deadline = ?, status = ?
       WHERE id = ?`,
      [
        rfq.title, rfq.description, rfq.product_name, rfq.product_details,
        rfq.quantity, rfq.estimated_budget, rfq.deadline, rfq.status, id
      ]
    );

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

export const closeRFQRecord = async (id) => {
  const [rows] = await db.execute('SELECT id FROM rfqs WHERE id = ?', [id]);
  if (rows.length === 0) {
    const error = new Error('RFQ not found.');
    error.statusCode = 404;
    throw error;
  }

  await db.execute("UPDATE rfqs SET status = 'closed' WHERE id = ?", [id]);
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
    await conn.execute('DELETE FROM rfq_vendors WHERE rfq_id = ?', [id]);
    await conn.execute('DELETE FROM rfqs WHERE id = ?', [id]);
    await conn.commit();
    conn.release();
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};
