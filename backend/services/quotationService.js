import db from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

const toPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

const generateQuotationNumber = async (conn) => {
  const year = new Date().getFullYear();
  const [rows] = await conn.execute(
    `SELECT quotation_number
     FROM quotations
     WHERE quotation_number LIKE ?
     ORDER BY id DESC
     LIMIT 1`,
    [`QTN-${year}-%`]
  );

  if (rows.length === 0 || !rows[0].quotation_number) {
    return `QTN-${year}-00001`;
  }

  const last = rows[0].quotation_number.split('-').pop();
  const next = (Number.parseInt(last, 10) || 0) + 1;
  return `QTN-${year}-${String(next).padStart(5, '0')}`;
};

export const getVendorIdForEmail = async (email) => {
  const [rows] = await db.execute('SELECT id, name FROM vendors WHERE email = ?', [email]);
  if (rows.length === 0) {
    const error = new Error('Logged-in user is not registered as an active vendor in the ERP directory.');
    error.statusCode = 403;
    throw error;
  }
  return rows[0].id;
};

export const listQuotations = async (query, user) => {
  const { page, limit, offset } = toPagination(query);
  const conditions = [];
  const params = [];

  // Role-based visibility scoping
  if (user.role === 'vendor') {
    const vendorId = await getVendorIdForEmail(user.email);
    conditions.push('q.vendor_id = ?');
    params.push(vendorId);
  }

  if (query.rfq_id) {
    conditions.push('q.rfq_id = ?');
    params.push(query.rfq_id);
  }

  if (query.status) {
    conditions.push('q.status = ?');
    params.push(query.status);
  }

  if (query.search) {
    conditions.push('(r.title LIKE ? OR r.rfq_number LIKE ? OR v.name LIKE ? OR q.quotation_number LIKE ?)');
    const term = `%${query.search}%`;
    params.push(term, term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total 
     FROM quotations q
     JOIN rfqs r ON q.rfq_id = r.id
     JOIN vendors v ON q.vendor_id = v.id
     ${where}`,
    params
  );

  const [rows] = await db.execute(
    `SELECT 
       q.id,
       q.quotation_number,
       q.rfq_id,
       r.rfq_number,
       r.title AS rfq_title,
       r.deadline AS rfq_deadline,
       q.vendor_id,
       v.name AS vendor_name,
       v.email AS vendor_email,
       q.unit_price,
       q.quantity,
       q.total_price,
       q.delivery_days,
       q.notes,
       q.attachment_url,
       q.status,
       q.submitted_at,
       q.updated_at
     FROM quotations q
     JOIN rfqs r ON q.rfq_id = r.id
     JOIN vendors v ON q.vendor_id = v.id
     ${where}
     ORDER BY q.submitted_at DESC
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

export const getQuotation = async (id, user) => {
  const [rows] = await db.execute(
    `SELECT 
       q.*,
       r.rfq_number,
       r.title AS rfq_title,
       r.quantity AS rfq_qty,
       r.deadline AS rfq_deadline,
       r.status AS rfq_status,
       v.name AS vendor_name,
       v.email AS vendor_email
     FROM quotations q
     JOIN rfqs r ON q.rfq_id = r.id
     JOIN vendors v ON q.vendor_id = v.id
     WHERE q.id = ?`,
    [id]
  );

  if (rows.length === 0) return null;
  const quote = rows[0];

  // Role verification check
  const isStaff = ['admin', 'officer', 'manager'].includes(user.role);
  if (!isStaff) {
    const vendorId = await getVendorIdForEmail(user.email);
    if (quote.vendor_id !== vendorId) {
      const error = new Error('Access Denied: You do not have permissions to view this quotation.');
      error.statusCode = 403;
      throw error;
    }
  }

  return quote;
};

export const createQuotationRecord = async (payload, user) => {
  const vendorId = await getVendorIdForEmail(user.email);
  const rfqId = payload.rfq_id;

  // 1. Check vendor assignment
  const [assignment] = await db.execute(
    'SELECT id FROM rfq_vendors WHERE rfq_id = ? AND vendor_id = ?',
    [rfqId, vendorId]
  );
  if (assignment.length === 0) {
    const error = new Error('Access Denied: Your business is not assigned/invited to this RFQ.');
    error.statusCode = 403;
    throw error;
  }

  // 2. Check RFQ open status & deadline
  const [rfqRecord] = await db.execute('SELECT status, deadline FROM rfqs WHERE id = ?', [rfqId]);
  if (rfqRecord.length === 0) {
    const error = new Error('RFQ not found.');
    error.statusCode = 404;
    throw error;
  }
  const rfq = rfqRecord[0];
  if (rfq.status !== 'open') {
    const error = new Error(`Bids are closed. The RFQ status is: ${rfq.status}`);
    error.statusCode = 400;
    throw error;
  }
  if (new Date(rfq.deadline) < new Date()) {
    const error = new Error('RFQ deadline has passed. Cannot submit quotation.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Uniqueness: Vendor cannot submit twice for the same RFQ
  const [existing] = await db.execute(
    'SELECT id FROM quotations WHERE rfq_id = ? AND vendor_id = ? AND status != "rejected"',
    [rfqId, vendorId]
  );
  if (existing.length > 0) {
    const error = new Error('Duplicate Quotation: You have already submitted a quotation for this RFQ.');
    error.statusCode = 409;
    throw error;
  }

  const unitPrice = parseFloat(payload.unit_price);
  const quantity = parseInt(payload.quantity);
  const totalPrice = unitPrice * quantity;
  const deliveryDays = parseInt(payload.delivery_days);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const quotationNumber = await generateQuotationNumber(conn);

    const insertSql = `
      INSERT INTO quotations (quotation_number, rfq_id, vendor_id, unit_price, quantity, total_price, delivery_days, notes, attachment_url, status, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', CURRENT_TIMESTAMP)
    `;
    const [result] = await conn.execute(insertSql, [
      quotationNumber,
      rfqId,
      vendorId,
      unitPrice,
      quantity,
      totalPrice,
      deliveryDays,
      payload.notes || null,
      payload.attachment_url || null
    ]);

    const quoteId = result.insertId;

    await logActivity(conn, user.id, 'quotation', quoteId, 'QUOTATION_SUBMITTED');

    await conn.commit();
    conn.release();

    return getQuotation(quoteId, user);
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

export const updateQuotationRecord = async (id, payload, user) => {
  const vendorId = await getVendorIdForEmail(user.email);
  const quote = await getQuotation(id, user);

  if (!quote) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  if (quote.vendor_id !== vendorId) {
    const error = new Error('Access Denied: This quotation does not belong to your business profile.');
    error.statusCode = 403;
    throw error;
  }

  if (quote.status !== 'draft' && quote.status !== 'submitted') {
    const error = new Error(`This quotation has been selected or rejected (${quote.status}) and cannot be edited.`);
    error.statusCode = 400;
    throw error;
  }

  if (new Date(quote.rfq_deadline) < new Date()) {
    const error = new Error('RFQ deadline has passed. Modifying quotations is disabled.');
    error.statusCode = 400;
    throw error;
  }

  const unitPrice = parseFloat(payload.unit_price);
  const quantity = parseInt(payload.quantity);
  const totalPrice = unitPrice * quantity;
  const deliveryDays = parseInt(payload.delivery_days);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const updateSql = `
      UPDATE quotations
      SET unit_price = ?, quantity = ?, total_price = ?, delivery_days = ?, notes = ?, attachment_url = ?, status = 'submitted', submitted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await conn.execute(updateSql, [
      unitPrice,
      quantity,
      totalPrice,
      deliveryDays,
      payload.notes || null,
      payload.attachment_url || null,
      id
    ]);

    await logActivity(conn, user.id, 'quotation', id, 'QUOTATION_UPDATED');

    await conn.commit();
    conn.release();

    return getQuotation(id, user);
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

export const deleteQuotationRecord = async (id, user) => {
  const quote = await getQuotation(id, user);
  if (!quote) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  // Check delete auth: only admin or the owning vendor can delete
  if (user.role === 'vendor') {
    const vendorId = await getVendorIdForEmail(user.email);
    if (quote.vendor_id !== vendorId) {
      const error = new Error('Access Denied: This quotation does not belong to your business profile.');
      error.statusCode = 403;
      throw error;
    }
  } else if (user.role !== 'admin') {
    const error = new Error('Access Denied: You do not have permissions to delete this quotation.');
    error.statusCode = 403;
    throw error;
  }

  if (quote.status === 'selected') {
    const error = new Error('A selected winning quotation cannot be deleted.');
    error.statusCode = 400;
    throw error;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute('DELETE FROM quotations WHERE id = ?', [id]);
    await logActivity(conn, user.id, 'quotation', id, 'QUOTATION_DELETED');

    await conn.commit();
    conn.release();
    return true;
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};
