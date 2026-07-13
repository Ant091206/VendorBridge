/**
 * quotationService.js — Backend business logic for Module 4 quotations
 */

import db from '../config/db.js';
import { calculateQuotationAmounts } from '../utils/priceCalculator.js';

const toPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

// Auto generate Quotation Number (QTN-YYYY-XXXX)
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

  let next = 1;
  if (rows.length > 0 && rows[0].quotation_number) {
    const last = rows[0].quotation_number.split('-').pop();
    next = (Number.parseInt(last, 10) || 0) + 1;
  }
  return `QTN-${year}-${String(next).padStart(4, '0')}`;
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

// ── GET List of Quotations ──
export const listQuotations = async (query, user) => {
  const { page, limit, offset } = toPagination(query);
  const conditions = [];
  const params = [];

  // Role visibility restriction
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
    conditions.push('(q.quotation_number LIKE ? OR r.title LIKE ? OR r.rfq_number LIKE ? OR v.vendor_name LIKE ? OR v.company_name LIKE ?)');
    const term = `%${query.search}%`;
    params.push(term, term, term, term, term);
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

  const [rows] = await db.query(
    `SELECT 
       q.id,
       q.quotation_number,
       q.rfq_id,
       r.rfq_number,
       r.title AS rfq_title,
       r.submission_deadline AS rfq_deadline,
       r.status AS rfq_status,
       q.vendor_id,
       COALESCE(v.vendor_name, v.name) AS vendor_name,
       COALESCE(v.company_name, v.name) AS company_name,
       v.vendor_code,
       v.email AS vendor_email,
       q.currency,
       q.subtotal,
       q.tax_amount,
       q.discount_amount,
       q.grand_total,
       q.delivery_days,
       q.status,
       q.submission_date,
       q.created_at,
       q.updated_at,
       (SELECT COUNT(*) FROM quotation_items WHERE quotation_id = q.id) AS items_count,
       (SELECT COUNT(*) FROM quotation_attachments WHERE quotation_id = q.id) AS attachments_count
     FROM quotations q
     JOIN rfqs r ON q.rfq_id = r.id
     JOIN vendors v ON q.vendor_id = v.id
     ${where}
     ORDER BY q.created_at DESC
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

// ── GET Single Quotation Detail ──
export const getQuotation = async (id, user) => {
  const [rows] = await db.execute(
    `SELECT 
       q.*,
       r.rfq_number,
       r.title AS rfq_title,
       r.submission_deadline AS rfq_deadline,
       r.status AS rfq_status,
       COALESCE(v.vendor_name, v.name) AS vendor_name,
       COALESCE(v.company_name, v.name) AS company_name,
       v.vendor_code,
       v.email AS vendor_email,
       v.phone AS vendor_phone
     FROM quotations q
     JOIN rfqs r ON q.rfq_id = r.id
     JOIN vendors v ON q.vendor_id = v.id
     WHERE q.id = ?`,
    [id]
  );

  if (rows.length === 0) return null;
  const quote = rows[0];

  // Access validation checks
  if (user.role === 'vendor') {
    const vendorId = await getVendorIdForEmail(user.email);
    if (quote.vendor_id !== vendorId) {
      const error = new Error('Access Denied: You do not have permissions to view this quotation.');
      error.statusCode = 403;
      throw error;
    }
  }

  // Load items
  const [items] = await db.execute(
    `SELECT qi.*, ri.item_name, ri.description AS rfq_item_desc, ri.unit
     FROM quotation_items qi
     JOIN rfq_items ri ON qi.rfq_item_id = ri.id
     WHERE qi.quotation_id = ?
     ORDER BY qi.id ASC`,
    [id]
  );
  quote.items = items;

  // Load attachments
  const [attachments] = await db.execute(
    `SELECT * FROM quotation_attachments WHERE quotation_id = ? ORDER BY id ASC`,
    [id]
  );
  quote.attachments = attachments;

  return quote;
};

// ── CREATE Quotation ──
export const createQuotationRecord = async (payload, user) => {
  const vendorId = await getVendorIdForEmail(user.email);
  const rfqId = Number(payload.rfq_id);

  // 1. Verify vendor assignment
  const [assignment] = await db.execute(
    'SELECT id FROM rfq_vendors WHERE rfq_id = ? AND vendor_id = ?',
    [rfqId, vendorId]
  );
  if (assignment.length === 0) {
    const error = new Error('Access Denied: Your business profile is not assigned to this RFQ invitation.');
    error.statusCode = 403;
    throw error;
  }

  // 2. Load RFQ
  const [rfqRecord] = await db.execute(
    'SELECT status, submission_deadline FROM rfqs WHERE id = ?',
    [rfqId]
  );
  if (rfqRecord.length === 0) {
    const error = new Error('RFQ not found.');
    error.statusCode = 404;
    throw error;
  }
  const rfq = rfqRecord[0];

  // Validate status
  if (rfq.status !== 'published' && rfq.status !== 'open') {
    const error = new Error(`Quotation is blocked: RFQ is not in published/open state. Current status: ${rfq.status}`);
    error.statusCode = 400;
    throw error;
  }

  // Validate deadline
  if (rfq.submission_deadline && new Date(rfq.submission_deadline) < new Date()) {
    const error = new Error('Quotation is blocked: RFQ deadline has passed.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Duplicate check: only one active quotation allowed per RFQ
  const [existing] = await db.execute(
    `SELECT id, status FROM quotations 
     WHERE rfq_id = ? AND vendor_id = ? AND status IN ('draft', 'submitted', 'selected')`,
    [rfqId, vendorId]
  );
  if (existing.length > 0) {
    const error = new Error(`Duplicate Quotation: You already have an active quotation for this RFQ (Status: ${existing[0].status}). Please update the existing one instead.`);
    error.statusCode = 409;
    throw error;
  }

  // Calculate prices using centralized calculator
  const calcResult = calculateQuotationAmounts(payload.items);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const quotationNumber = await generateQuotationNumber(conn);
    const initialStatus = payload.status === 'submitted' ? 'submitted' : 'draft';
    const submissionDate = initialStatus === 'submitted' ? new Date() : null;

    const [qResult] = await conn.execute(
      `INSERT INTO quotations (
        quotation_number, rfq_id, vendor_id, submission_date, delivery_days, currency, notes, terms_conditions, subtotal, tax_amount, discount_amount, grand_total, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quotationNumber,
        rfqId,
        vendorId,
        submissionDate,
        Number(payload.delivery_days),
        payload.currency || 'INR',
        payload.notes || null,
        payload.terms_conditions || null,
        calcResult.subtotal,
        calcResult.tax_amount,
        calcResult.discount_amount,
        calcResult.grand_total,
        initialStatus
      ]
    );

    const quotationId = qResult.insertId;

    // Write items
    for (const item of calcResult.items) {
      await conn.execute(
        `INSERT INTO quotation_items (
          quotation_id, rfq_item_id, quantity, unit_price, tax_percentage, discount_percentage, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          quotationId,
          item.rfq_item_id,
          item.quantity,
          item.unit_price,
          item.tax_percentage,
          item.discount_percentage,
          item.total_amount
        ]
      );
    }

    await conn.commit();
    conn.release();

    return getQuotation(quotationId, user);
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

// ── UPDATE Quotation ──
export const updateQuotationRecord = async (id, payload, user) => {
  const vendorId = await getVendorIdForEmail(user.email);
  const quote = await getQuotation(id, user);

  if (!quote) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  // Auth check
  if (quote.vendor_id !== vendorId) {
    const error = new Error('Access Denied: This quotation does not belong to your vendor profile.');
    error.statusCode = 403;
    throw error;
  }

  // Status check: only drafts and submitted are editable before deadline
  if (quote.status !== 'draft' && quote.status !== 'submitted') {
    const error = new Error(`Quotations with status "${quote.status}" cannot be modified.`);
    error.statusCode = 400;
    throw error;
  }

  // Deadline check
  if (quote.rfq_deadline && new Date(quote.rfq_deadline) < new Date()) {
    const error = new Error('Quotation is locked: RFQ deadline has passed.');
    error.statusCode = 400;
    throw error;
  }

  // Recalculate
  const calcResult = calculateQuotationAmounts(payload.items);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const isSubmitting = payload.status === 'submitted' || quote.status === 'submitted';
    const statusVal = isSubmitting ? 'submitted' : 'draft';
    const submissionDate = isSubmitting ? (quote.submission_date || new Date()) : null;

    // Update headers
    await conn.execute(
      `UPDATE quotations
       SET delivery_days = ?, currency = ?, notes = ?, terms_conditions = ?, subtotal = ?, tax_amount = ?, discount_amount = ?, grand_total = ?, status = ?, submission_date = ?
       WHERE id = ?`,
      [
        Number(payload.delivery_days),
        payload.currency || 'INR',
        payload.notes || null,
        payload.terms_conditions || null,
        calcResult.subtotal,
        calcResult.tax_amount,
        calcResult.discount_amount,
        calcResult.grand_total,
        statusVal,
        submissionDate,
        id
      ]
    );

    // Sync items: clear old and write new
    await conn.execute('DELETE FROM quotation_items WHERE quotation_id = ?', [id]);
    for (const item of calcResult.items) {
      await conn.execute(
        `INSERT INTO quotation_items (
          quotation_id, rfq_item_id, quantity, unit_price, tax_percentage, discount_percentage, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.rfq_item_id,
          item.quantity,
          item.unit_price,
          item.tax_percentage,
          item.discount_percentage,
          item.total_amount
        ]
      );
    }

    await conn.commit();
    conn.release();

    return getQuotation(id, user);
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

// ── SUBMIT Quotation ──
export const submitQuotationRecord = async (id, user) => {
  const quote = await getQuotation(id, user);
  if (!quote) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  // Auth checks
  if (user.role === 'vendor') {
    const vendorId = await getVendorIdForEmail(user.email);
    if (quote.vendor_id !== vendorId) {
      const error = new Error('Access Denied: This quotation does not belong to your profile.');
      error.statusCode = 403;
      throw error;
    }
  }

  // RFQ deadline check
  if (quote.rfq_deadline && new Date(quote.rfq_deadline) < new Date()) {
    const error = new Error('Quotation is locked: RFQ deadline has passed.');
    error.statusCode = 400;
    throw error;
  }

  if (quote.status !== 'draft') {
    const error = new Error(`Only draft quotations can be submitted. Current status: ${quote.status}`);
    error.statusCode = 400;
    throw error;
  }

  await db.execute(
    `UPDATE quotations 
     SET status = 'submitted', submission_date = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [id]
  );

  return getQuotation(id, user);
};

// ── WITHDRAW Quotation ──
export const withdrawQuotationRecord = async (id, user) => {
  const quote = await getQuotation(id, user);
  if (!quote) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  // Auth checks
  if (user.role === 'vendor') {
    const vendorId = await getVendorIdForEmail(user.email);
    if (quote.vendor_id !== vendorId) {
      const error = new Error('Access Denied: This quotation does not belong to your profile.');
      error.statusCode = 403;
      throw error;
    }
  }

  // RFQ deadline check
  if (quote.rfq_deadline && new Date(quote.rfq_deadline) < new Date()) {
    const error = new Error('Quotation is locked: RFQ deadline has passed. Cannot withdraw.');
    error.statusCode = 400;
    throw error;
  }

  if (quote.status !== 'submitted' && quote.status !== 'draft') {
    const error = new Error(`Only active quotations can be withdrawn. Current status: ${quote.status}`);
    error.statusCode = 400;
    throw error;
  }

  await db.execute(
    `UPDATE quotations 
     SET status = 'withdrawn', submission_date = NULL 
     WHERE id = ?`,
    [id]
  );

  return getQuotation(id, user);
};

// ── DELETE Quotation ──
export const deleteQuotationRecord = async (id, user) => {
  const quote = await getQuotation(id, user);
  if (!quote) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  // Check auth and status rules
  if (user.role === 'vendor') {
    const vendorId = await getVendorIdForEmail(user.email);
    if (quote.vendor_id !== vendorId) {
      const error = new Error('Access Denied: This quotation does not belong to your profile.');
      error.statusCode = 403;
      throw error;
    }
    // Vendors can only delete drafts
    if (quote.status !== 'draft') {
      const error = new Error('Vendors can only delete draft quotations. Submitted quotations must be withdrawn instead.');
      error.statusCode = 400;
      throw error;
    }
  } else if (user.role !== 'admin') {
    const error = new Error('Access Denied: Only admins can delete quotations.');
    error.statusCode = 403;
    throw error;
  }

  // Selected quotation cannot be deleted
  if (quote.status === 'selected') {
    const error = new Error('A selected winning quotation cannot be deleted.');
    error.statusCode = 400;
    throw error;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute('DELETE FROM quotation_items WHERE quotation_id = ?', [id]);
    await conn.execute('DELETE FROM quotation_attachments WHERE quotation_id = ?', [id]);
    await conn.execute('DELETE FROM quotations WHERE id = ?', [id]);

    await conn.commit();
    conn.release();
    return true;
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

// ── SUB-RESOURCE: Attachments ──
export const addQuotationAttachmentRecord = async (quotationId, file) => {
  const [result] = await db.execute(
    `INSERT INTO quotation_attachments (quotation_id, file_name, file_path, file_type)
     VALUES (?, ?, ?, ?)`,
    [
      quotationId,
      file.originalname,
      `/uploads/${file.filename}`,
      file.mimetype
    ]
  );

  return {
    id: result.insertId,
    quotation_id: Number(quotationId),
    file_name: file.originalname,
    file_path: `/uploads/${file.filename}`,
    file_type: file.mimetype
  };
};

export const deleteQuotationAttachmentRecord = async (attachmentId) => {
  const [rows] = await db.execute(
    'SELECT file_path FROM quotation_attachments WHERE id = ?',
    [attachmentId]
  );
  if (rows.length === 0) {
    const error = new Error('Attachment not found.');
    error.statusCode = 404;
    throw error;
  }

  await db.execute('DELETE FROM quotation_attachments WHERE id = ?', [attachmentId]);
  return rows[0].file_path;
};

export const syncQuotationTotals = async (conn, quotationId) => {
  const [items] = await conn.execute(
    'SELECT quantity, unit_price, tax_percentage, discount_percentage, rfq_item_id FROM quotation_items WHERE quotation_id = ?',
    [quotationId]
  );
  const calcResult = calculateQuotationAmounts(items);
  await conn.execute(
    `UPDATE quotations
     SET subtotal = ?, tax_amount = ?, discount_amount = ?, grand_total = ?
     WHERE id = ?`,
    [
      calcResult.subtotal,
      calcResult.tax_amount,
      calcResult.discount_amount,
      calcResult.grand_total,
      quotationId
    ]
  );
};

export const addQuotationItemRecord = async (quotationId, item) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const taxPct = parseFloat(item.tax_percentage) || 0;
    const discPct = parseFloat(item.discount_percentage) || 0;

    const baseAmount = qty * price;
    const discAmt = baseAmount * (discPct / 100);
    const taxableAmt = baseAmount - discAmt;
    const taxAmt = taxableAmt * (taxPct / 100);
    const totalAmt = taxableAmt + taxAmt;

    const [result] = await conn.execute(
      `INSERT INTO quotation_items (quotation_id, rfq_item_id, quantity, unit_price, tax_percentage, discount_percentage, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [quotationId, item.rfq_item_id, qty, price, taxPct, discPct, totalAmt]
    );

    const newItemId = result.insertId;

    // Recalculate
    await syncQuotationTotals(conn, quotationId);

    await conn.commit();
    conn.release();

    return {
      id: newItemId,
      quotation_id: Number(quotationId),
      rfq_item_id: Number(item.rfq_item_id),
      quantity: qty,
      unit_price: price,
      tax_percentage: taxPct,
      discount_percentage: discPct,
      total_amount: totalAmt
    };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

export const updateQuotationItemRecord = async (itemId, item) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute('SELECT quotation_id FROM quotation_items WHERE id = ?', [itemId]);
    if (rows.length === 0) {
      const error = new Error('Quotation item not found.');
      error.statusCode = 404;
      throw error;
    }
    const quotationId = rows[0].quotation_id;

    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const taxPct = parseFloat(item.tax_percentage) || 0;
    const discPct = parseFloat(item.discount_percentage) || 0;

    const baseAmount = qty * price;
    const discAmt = baseAmount * (discPct / 100);
    const taxableAmt = baseAmount - discAmt;
    const taxAmt = taxableAmt * (taxPct / 100);
    const totalAmt = taxableAmt + taxAmt;

    await conn.execute(
      `UPDATE quotation_items
       SET quantity = ?, unit_price = ?, tax_percentage = ?, discount_percentage = ?, total_amount = ?
       WHERE id = ?`,
      [qty, price, taxPct, discPct, totalAmt, itemId]
    );

    // Recalculate
    await syncQuotationTotals(conn, quotationId);

    await conn.commit();
    conn.release();

    return {
      id: Number(itemId),
      quotation_id: Number(quotationId),
      quantity: qty,
      unit_price: price,
      tax_percentage: taxPct,
      discount_percentage: discPct,
      total_amount: totalAmt
    };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

export const deleteQuotationItemRecord = async (itemId) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute('SELECT quotation_id FROM quotation_items WHERE id = ?', [itemId]);
    if (rows.length === 0) {
      const error = new Error('Quotation item not found.');
      error.statusCode = 404;
      throw error;
    }
    const quotationId = rows[0].quotation_id;

    await conn.execute('DELETE FROM quotation_items WHERE id = ?', [itemId]);

    // Recalculate
    await syncQuotationTotals(conn, quotationId);

    await conn.commit();
    conn.release();

    return true;
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};
