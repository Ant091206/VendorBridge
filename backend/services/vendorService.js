import db from '../config/db.js';

const allowedVendorSorts = {
  name: 'v.vendor_name',
  vendor_name: 'v.vendor_name',
  company_name: 'v.company_name',
  created_at: 'v.created_at',
  city: 'v.city',
  state: 'v.state',
  vendor_code: 'v.vendor_code',
  status: 'v.status'
};

const toPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

export const generateVendorCode = async () => {
  const [rows] = await db.execute('SELECT id FROM vendors ORDER BY id DESC LIMIT 1');
  const nextId = rows.length > 0 ? rows[0].id + 1 : 1;
  return `VEN-${String(nextId).padStart(4, '0')}`;
};

export const listVendors = async (query, user) => {
  const { page, limit, offset } = toPagination(query);
  const sortColumn = allowedVendorSorts[query.sort] || 'v.created_at';
  const direction = query.order === 'asc' ? 'ASC' : 'DESC';
  const conditions = [];
  const params = [];

  if (query.search) {
    conditions.push(`(
      v.vendor_name LIKE ? OR v.company_name LIKE ? OR v.gst_number LIKE ? OR
      v.name LIKE ? OR v.email LIKE ? OR v.vendor_code LIKE ? OR v.phone LIKE ?
    )`);
    const term = `%${query.search}%`;
    params.push(term, term, term, term, term, term, term);
  }

  if (query.status) {
    conditions.push('v.status = ?');
    params.push(query.status);
  }

  if (query.category_id) {
    conditions.push('v.category_id = ?');
    params.push(query.category_id);
  }

  if (query.city) {
    conditions.push('v.city = ?');
    params.push(query.city);
  }

  if (query.state) {
    conditions.push('v.state = ?');
    params.push(query.state);
  }

  if (user.role === 'vendor') {
    conditions.push('v.email = ?');
    params.push(user.email);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM vendors v ${where}`,
    params
  );

  const [rows] = await db.query(
    `SELECT
       v.id,
       v.vendor_code,
       COALESCE(v.vendor_name, v.name) AS vendor_name,
       COALESCE(v.company_name, v.name) AS company_name,
       COALESCE(v.name, v.vendor_name) AS name,
       v.category_id,
       vc.name AS category_name,
       v.gst_number,
       v.pan_number,
       v.contact_person,
       v.email,
       v.phone,
       v.alternate_phone,
       v.address,
       v.address_line1,
       v.address_line2,
       v.city,
       v.state,
       v.country,
       v.postal_code,
       v.postal_code AS pincode,
       v.notes,
       v.status,
       v.created_by,
       u.name AS created_by_name,
       v.updated_by,
       u2.name AS updated_by_name,
       v.created_at,
       v.updated_at
     FROM vendors v
     LEFT JOIN vendor_categories vc ON vc.id = v.category_id
     LEFT JOIN users u ON u.id = v.created_by
     LEFT JOIN users u2 ON u2.id = v.updated_by
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

export const getVendor = async (id, user) => {
  const params = [id];
  let roleFilter = '';

  if (user.role === 'vendor') {
    roleFilter = 'AND v.email = ?';
    params.push(user.email);
  }

  const [rows] = await db.execute(
    `SELECT
       v.*,
       v.postal_code AS pincode,
       COALESCE(v.vendor_name, v.name) AS vendor_name,
       COALESCE(v.company_name, v.name) AS company_name,
       COALESCE(v.name, v.vendor_name) AS name,
       vc.name AS category_name,
       u.name AS created_by_name,
       u2.name AS updated_by_name
     FROM vendors v
     LEFT JOIN vendor_categories vc ON vc.id = v.category_id
     LEFT JOIN users u ON u.id = v.created_by
     LEFT JOIN users u2 ON u2.id = v.updated_by
     WHERE v.id = ? ${roleFilter}`,
    params
  );

  return rows[0] || null;
};

const ensureCategoryExists = async (categoryId) => {
  if (!categoryId) return;
  const [rows] = await db.execute('SELECT id FROM vendor_categories WHERE id = ?', [categoryId]);
  if (rows.length === 0) {
    const error = new Error('Invalid category.');
    error.statusCode = 400;
    throw error;
  }
};

const ensureVendorUniqueness = async (payload, currentId = null) => {
  const checks = [
    ['vendor_code', payload.vendor_code, 'Duplicate vendor code.'],
    ['email', payload.email, 'Duplicate vendor email.'],
    ['gst_number', payload.gst_number, 'Duplicate GST number.']
  ];

  for (const [column, value, message] of checks) {
    if (!value) continue;
    const params = [value];
    let sql = `SELECT id FROM vendors WHERE ${column} = ?`;
    if (currentId) {
      sql += ' AND id != ?';
      params.push(currentId);
    }
    const [rows] = await db.execute(sql, params);
    if (rows.length > 0) {
      const error = new Error(message);
      error.statusCode = 409;
      throw error;
    }
  }
};

const normalizeVendor = (payload, userId, isUpdate = false) => {
  const address = [payload.address_line1, payload.address_line2, payload.city, payload.state, payload.country, payload.postal_code || payload.pincode]
    .filter(Boolean)
    .join(', ');

  return {
    vendor_code: payload.vendor_code?.trim() || '',
    vendor_name: payload.vendor_name?.trim() || '',
    company_name: payload.company_name?.trim() || '',
    legacy_name: payload.vendor_name?.trim() || '',
    category_id: payload.category_id || null,
    gst_number: payload.gst_number?.trim() || '',
    pan_number: payload.pan_number?.trim() || null,
    contact_person: payload.contact_person || null,
    email: payload.email?.trim().toLowerCase() || '',
    phone: payload.phone || '',
    alternate_phone: payload.alternate_phone || null,
    address: payload.address || address,
    address_line1: payload.address_line1 || '',
    address_line2: payload.address_line2 || null,
    city: payload.city || null,
    state: payload.state || null,
    country: payload.country || 'India',
    postal_code: payload.postal_code || payload.pincode || null,
    status: payload.status || 'active',
    notes: payload.notes || null,
    created_by: isUpdate ? undefined : userId,
    updated_by: isUpdate ? userId : null
  };
};

export const createVendorRecord = async (payload, user) => {
  await ensureCategoryExists(payload.category_id);

  if (!payload.vendor_code?.trim()) {
    payload.vendor_code = await generateVendorCode();
  }

  await ensureVendorUniqueness(payload);

  const vendor = normalizeVendor(payload, user.id, false);
  const [result] = await db.execute(
    `INSERT INTO vendors (
      vendor_code, vendor_name, company_name, name, category_id, gst_number, pan_number,
      contact_person, email, phone, alternate_phone, address, address_line1, address_line2,
      city, state, country, postal_code, notes, status, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      vendor.vendor_code, vendor.vendor_name, vendor.company_name, vendor.legacy_name,
      vendor.category_id, vendor.gst_number, vendor.pan_number, vendor.contact_person,
      vendor.email, vendor.phone, vendor.alternate_phone, vendor.address, vendor.address_line1,
      vendor.address_line2, vendor.city, vendor.state, vendor.country, vendor.postal_code,
      vendor.notes, vendor.status, vendor.created_by, vendor.updated_by
    ]
  );

  return getVendor(result.insertId, user);
};

export const updateVendorRecord = async (id, payload, user) => {
  const existing = await getVendor(id, user);
  if (!existing) {
    const error = new Error('Vendor not found.');
    error.statusCode = 404;
    throw error;
  }

  await ensureCategoryExists(payload.category_id);
  await ensureVendorUniqueness(payload, id);

  const vendor = normalizeVendor(payload, user.id, true);
  await db.execute(
    `UPDATE vendors
     SET vendor_code = ?, vendor_name = ?, company_name = ?, name = ?, category_id = ?,
         gst_number = ?, pan_number = ?, contact_person = ?, email = ?, phone = ?,
         alternate_phone = ?, address = ?, address_line1 = ?, address_line2 = ?, city = ?,
         state = ?, country = ?, postal_code = ?, notes = ?, status = ?, updated_by = ?
     WHERE id = ?`,
    [
      vendor.vendor_code, vendor.vendor_name, vendor.company_name, vendor.legacy_name,
      vendor.category_id, vendor.gst_number, vendor.pan_number, vendor.contact_person,
      vendor.email, vendor.phone, vendor.alternate_phone, vendor.address, vendor.address_line1,
      vendor.address_line2, vendor.city, vendor.state, vendor.country, vendor.postal_code,
      vendor.notes, vendor.status, vendor.updated_by, id
    ]
  );

  return getVendor(id, user);
};

export const patchVendorStatus = async (id, status, userId, user) => {
  const [rows] = await db.execute('SELECT id, status FROM vendors WHERE id = ?', [id]);
  if (rows.length === 0) {
    const error = new Error('Vendor not found.');
    error.statusCode = 404;
    throw error;
  }
  await db.execute('UPDATE vendors SET status = ?, updated_by = ? WHERE id = ?', [status, userId, id]);
  return getVendor(id, user);
};

export const deleteVendorRecord = async (id, userId) => {
  const [rows] = await db.execute('SELECT id FROM vendors WHERE id = ?', [id]);
  if (rows.length === 0) {
    const error = new Error('Vendor not found.');
    error.statusCode = 404;
    throw error;
  }

  await db.execute("UPDATE vendors SET status = 'inactive', updated_by = ? WHERE id = ?", [userId, id]);
};

export const listCategories = async () => {
  const [rows] = await db.execute('SELECT id, name, description, created_at, updated_at FROM vendor_categories ORDER BY name ASC');
  return rows;
};

export const getCategoryById = async (id) => {
  const [rows] = await db.execute('SELECT id, name, description, created_at, updated_at FROM vendor_categories WHERE id = ?', [id]);
  return rows[0] || null;
};

export const createCategoryRecord = async (payload) => {
  const [existing] = await db.execute('SELECT id FROM vendor_categories WHERE name = ?', [payload.name.trim()]);
  if (existing.length > 0) {
    const error = new Error('Category already exists.');
    error.statusCode = 409;
    throw error;
  }

  const [result] = await db.execute(
    'INSERT INTO vendor_categories (name, description) VALUES (?, ?)',
    [payload.name.trim(), payload.description || null]
  );

  return { id: result.insertId, name: payload.name.trim(), description: payload.description || null };
};

export const updateCategoryRecord = async (id, payload) => {
  const [rows] = await db.execute('SELECT id FROM vendor_categories WHERE id = ?', [id]);
  if (rows.length === 0) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  await db.execute(
    'UPDATE vendor_categories SET name = ?, description = ? WHERE id = ?',
    [payload.name.trim(), payload.description || null, id]
  );

  return { id: Number(id), name: payload.name.trim(), description: payload.description || null };
};

export const deleteCategoryRecord = async (id) => {
  const [used] = await db.execute('SELECT id FROM vendors WHERE category_id = ? LIMIT 1', [id]);
  if (used.length > 0) {
    const error = new Error('Category is assigned to vendors and cannot be deleted.');
    error.statusCode = 409;
    throw error;
  }

  const [result] = await db.execute('DELETE FROM vendor_categories WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }
};
