/**
 * invoiceService.js — VendorBridge Module 8
 * Complete Invoice Management service with:
 *   - Create / Get / Update / Delete (Draft)
 *   - Generate (Draft → Generated, locks items)
 *   - Cancel, Mark Paid
 *   - PDF generation via pdfService
 *   - Email dispatch via emailService with invoice_emails logging
 *   - Audit history via invoice_history
 *   - Full RBAC enforcement
 */

import pool from '../config/db.js';
import { generateInvoiceNumber } from '../utils/invoiceNumberGenerator.js';
import { calculateQuotationAmounts } from '../utils/priceCalculator.js';
import { generateInvoicePDF } from './pdfService.js';
import { sendEmail } from './emailService.js';
import { logAndNotify } from '../utils/activityAndNotificationHelper.js';

// ─── Valid PO statuses that allow invoice creation ───────────────────────────
const INVOICEABLE_PO_STATUSES = ['Issued', 'Acknowledged', 'Partially Fulfilled', 'Fulfilled'];

// ─── Helper: log to invoice_history ──────────────────────────────────────────
const logHistory = async (conn, invoiceId, actionType, userId, remarks = null) => {
  await conn.execute(
    `INSERT INTO invoice_history (invoice_id, action_type, action_by, remarks)
     VALUES (?, ?, ?, ?)`,
    [invoiceId, actionType, userId, remarks]
  );
};

// ─── Helper: fetch full invoice data with joins ───────────────────────────────
export const fetchFullInvoice = async (invoiceId) => {
  const [rows] = await pool.execute(
    `SELECT
       i.*,
       po.po_number, po.delivery_address, po.terms_conditions AS po_terms,
       po.expected_delivery_date,
       r.title AS rfq_title, r.description AS rfq_description,
       v.name AS vendor_name, v.email AS vendor_email,
       v.phone AS vendor_phone, v.address AS vendor_address,
       v.gst_number AS vendor_gst,
       q.delivery_days,
       ar.approval_number,
       creator.name AS created_by_name,
       creator.email AS created_by_email
     FROM invoices i
     JOIN purchase_orders po ON i.po_id = po.id
     JOIN rfqs r             ON i.rfq_id = r.id
     JOIN quotations q       ON i.quotation_id = q.id
     JOIN vendors v          ON i.vendor_id = v.id
     JOIN approval_requests ar ON po.approval_request_id = ar.id
     JOIN users creator      ON i.created_by = creator.id
     WHERE i.id = ?`,
    [invoiceId]
  );
  if (!rows.length) return null;
  const invoice = rows[0];

  // Fetch line items
  const [items] = await pool.execute(
    `SELECT ii.*, poi.unit AS po_unit
     FROM invoice_items ii
     LEFT JOIN purchase_order_items poi ON ii.purchase_order_item_id = poi.id
     WHERE ii.invoice_id = ?
     ORDER BY ii.id ASC`,
    [invoiceId]
  );
  invoice.items = items;

  // Fetch history
  const [history] = await pool.execute(
    `SELECT h.*, u.name AS action_by_name, u.role AS action_by_role
     FROM invoice_history h
     JOIN users u ON h.action_by = u.id
     WHERE h.invoice_id = ?
     ORDER BY h.action_date ASC, h.id ASC`,
    [invoiceId]
  );
  invoice.history = history;

  // Fetch email log
  const [emailLog] = await pool.execute(
    `SELECT * FROM invoice_emails WHERE invoice_id = ? ORDER BY sent_at DESC`,
    [invoiceId]
  );
  invoice.email_history = emailLog;

  return invoice;
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE INVOICE (Draft)
// ─────────────────────────────────────────────────────────────────────────────
export const createInvoice = async (payload, userId) => {
  const {
    po_id,
    payment_terms = 'Net 30',
    due_date,
    notes
  } = payload;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Fetch and validate PO
    const [poRows] = await conn.execute(
      `SELECT po.*, v.email AS vendor_email, v.name AS vendor_name
       FROM purchase_orders po
       JOIN vendors v ON po.vendor_id = v.id
       WHERE po.id = ?`,
      [po_id]
    );
    if (!poRows.length) {
      const err = new Error('Purchase Order not found.');
      err.statusCode = 404; throw err;
    }
    const po = poRows[0];

    if (!INVOICEABLE_PO_STATUSES.includes(po.status)) {
      const err = new Error(
        `Invoice can only be created from POs with status: ${INVOICEABLE_PO_STATUSES.join(', ')}. Current status: ${po.status}`
      );
      err.statusCode = 400; throw err;
    }

    // 2. Check for existing active (non-cancelled) invoice
    const [existingRows] = await conn.execute(
      `SELECT id, invoice_number FROM invoices WHERE po_id = ? AND status != 'Cancelled'`,
      [po_id]
    );
    if (existingRows.length) {
      const err = new Error(
        `An active invoice (${existingRows[0].invoice_number}) already exists for this Purchase Order.`
      );
      err.statusCode = 400; throw err;
    }

    // 3. Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(conn);

    // 4. Use PO totals (already calculated from quotation items)
    const subtotal = parseFloat(po.subtotal) || 0;
    const discountAmount = parseFloat(po.discount_amount) || 0;
    const taxAmount = parseFloat(po.tax_amount) || 0;
    const grandTotal = parseFloat(po.grand_total) || 0;
    const roundOff = Math.round(grandTotal) - grandTotal;

    // 5. Calculate due date (default: issue_date + 30 days)
    const issueDate = new Date();
    const issueDateStr = issueDate.toISOString().split('T')[0];
    let dueDateStr = due_date;
    if (!dueDateStr) {
      const d = new Date(issueDate);
      d.setDate(d.getDate() + 30);
      dueDateStr = d.toISOString().split('T')[0];
    }

    // 6. Insert invoice header
    const [result] = await conn.execute(
      `INSERT INTO invoices (
         invoice_number, po_id, rfq_id, quotation_id, vendor_id,
         issue_date, due_date, payment_terms,
         subtotal, discount_amount, tax_amount, round_off_amount, grand_total,
         payment_status, status, notes, created_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid', 'Draft', ?, ?)`,
      [
        invoiceNumber, po_id, po.rfq_id, po.quotation_id, po.vendor_id,
        issueDateStr, dueDateStr, payment_terms,
        subtotal, discountAmount, taxAmount, roundOff, grandTotal,
        notes || null, userId
      ]
    );
    const invoiceId = result.insertId;

    // 7. Copy PO items to invoice_items
    const [poItems] = await conn.execute(
      `SELECT * FROM purchase_order_items WHERE purchase_order_id = ? ORDER BY id ASC`,
      [po_id]
    );
    for (const item of poItems) {
      await conn.execute(
        `INSERT INTO invoice_items (
           invoice_id, purchase_order_item_id, item_name, description,
           quantity, unit, unit_price, tax_percentage, discount_percentage, line_total
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId, item.id, item.item_name, item.description,
          item.quantity, item.unit, item.unit_price,
          item.tax_percentage, item.discount_percentage, item.line_total
        ]
      );
    }

    // 8. Log history
    await logHistory(conn, invoiceId, 'Created', userId, `Invoice ${invoiceNumber} created as Draft.`);

    await conn.commit();

    // 9. Activity log (non-fatal)
    try {
      const newInvoice = await fetchFullInvoice(invoiceId);
      await logAndNotify(userId, {
        action: 'INVOICE_CREATED',
        module: 'Invoices',
        entityType: 'invoice',
        entityId: invoiceId,
        description: `Draft Invoice ${invoiceNumber} created for PO ${po.po_number}`,
        oldValue: null,
        newValue: newInvoice
      });
    } catch (e) { console.error('Activity log error:', e.message); }

    conn.release();
    return { id: invoiceId, invoice_number: invoiceNumber, status: 'Draft' };
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL INVOICES (paginated, filtered)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllInvoices = async (query, user) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 15;
  const offset = (page - 1) * limit;
  const { status, search, sort = 'id_desc' } = query;

  let sql = `
    SELECT
      i.id, i.invoice_number, i.issue_date, i.due_date,
      i.payment_terms, i.subtotal, i.tax_amount, i.discount_amount,
      i.grand_total, i.status, i.payment_status, i.created_at,
      po.po_number,
      v.name AS vendor_name, v.email AS vendor_email,
      r.title AS rfq_title
    FROM invoices i
    JOIN purchase_orders po ON i.po_id = po.id
    JOIN vendors v          ON i.vendor_id = v.id
    JOIN rfqs r             ON i.rfq_id = r.id
  `;

  const params = [];
  const conditions = [];

  // Vendor scoping
  if (user.role === 'vendor') {
    conditions.push(`v.email = ?`);
    params.push(user.email);
  }

  if (status) {
    conditions.push(`i.status = ?`);
    params.push(status);
  }

  if (search) {
    conditions.push(`(i.invoice_number LIKE ? OR v.name LIKE ? OR po.po_number LIKE ?)`);
    const p = `%${search}%`;
    params.push(p, p, p);
  }

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');

  // Sorting
  const sortMap = {
    id_desc: 'i.id DESC',
    id_asc: 'i.id ASC',
    date_desc: 'i.issue_date DESC',
    date_asc: 'i.issue_date ASC',
    due_asc: 'i.due_date ASC',
    total_desc: 'i.grand_total DESC'
  };
  sql += ` ORDER BY ${sortMap[sort] || 'i.id DESC'}`;

  // Count query
  let countSql = `
    SELECT COUNT(*) AS total FROM invoices i
    JOIN vendors v ON i.vendor_id = v.id
    JOIN purchase_orders po ON i.po_id = po.id
  `;
  const countParams = [...params];
  if (conditions.length) countSql += ' WHERE ' + conditions.join(' AND ');
  const [countRows] = await pool.execute(countSql, countParams);
  const total = countRows[0].total;

  // Stats
  let statsSql = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN i.status = 'Draft'     THEN 1 ELSE 0 END) AS draft,
      SUM(CASE WHEN i.status = 'Generated' THEN 1 ELSE 0 END) AS \`generated\`,
      SUM(CASE WHEN i.status = 'Sent'      THEN 1 ELSE 0 END) AS sent,
      SUM(CASE WHEN i.status = 'Viewed'    THEN 1 ELSE 0 END) AS viewed,
      SUM(CASE WHEN i.status = 'Paid'      THEN 1 ELSE 0 END) AS paid,
      SUM(CASE WHEN i.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
      COALESCE(SUM(CASE WHEN i.payment_status != 'Paid' AND i.status NOT IN ('Cancelled','Draft') THEN i.grand_total ELSE 0 END), 0) AS outstanding_amount,
      COALESCE(SUM(CASE WHEN i.status = 'Paid' THEN i.grand_total ELSE 0 END), 0) AS paid_amount
    FROM invoices i
    JOIN vendors v ON i.vendor_id = v.id
    JOIN purchase_orders po ON i.po_id = po.id
  `;
  const statsParams = [];
  if (user.role === 'vendor') {
    statsSql += ` WHERE v.email = ?`;
    statsParams.push(user.email);
  }
  const [statsRows] = await pool.execute(statsSql, statsParams);

  // Paginated data
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const [rows] = await pool.query(sql, params);

  return {
    invoices: rows,
    stats: statsRows[0],
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET INVOICE BY ID (full detail)
// ─────────────────────────────────────────────────────────────────────────────
export const getInvoiceById = async (id, user) => {
  const invoice = await fetchFullInvoice(id);
  if (!invoice) return null;

  // RBAC: vendor can only see own invoice
  if (user.role === 'vendor' && invoice.vendor_email !== user.email) {
    const err = new Error('Access Denied: You are not authorized to view this invoice.');
    err.statusCode = 403; throw err;
  }

  // Track "Viewed" for vendors
  if (user.role === 'vendor') {
    const conn = await pool.getConnection();
    try {
      const [viewed] = await conn.execute(
        `SELECT id FROM invoice_history WHERE invoice_id = ? AND action_type = 'Viewed' AND action_by = ?`,
        [id, user.id]
      );
      if (!viewed.length) {
        await conn.execute(
          `INSERT INTO invoice_history (invoice_id, action_type, action_by, remarks)
           VALUES (?, 'Viewed', ?, 'Invoice viewed by vendor.')`,
          [id, user.id]
        );
        // Update invoice status to Viewed if it's Sent
        await conn.execute(
          `UPDATE invoices SET status = 'Viewed' WHERE id = ? AND status = 'Sent'`,
          [id]
        );
      }
    } finally { conn.release(); }
  }

  return invoice;
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE DRAFT INVOICE
// ─────────────────────────────────────────────────────────────────────────────
export const updateInvoice = async (id, payload, userId) => {
  const oldInvoice = await fetchFullInvoice(id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT status, invoice_number FROM invoices WHERE id = ?`, [id]
    );
    if (!rows.length) { const e = new Error('Invoice not found.'); e.statusCode = 404; throw e; }
    if (rows[0].status !== 'Draft') {
      const e = new Error('Only Draft invoices can be edited.'); e.statusCode = 400; throw e;
    }

    const { payment_terms, due_date, notes, items } = payload;

    // Recalculate if items provided
    let calcResult = null;
    if (items && items.length > 0) {
      calcResult = calculateQuotationAmounts(items);
    }

    let updateSql = `UPDATE invoices SET
      payment_terms = COALESCE(?, payment_terms),
      due_date      = COALESCE(?, due_date),
      notes         = ?
    `;
    const params = [payment_terms || null, due_date || null, notes || null];

    if (calcResult) {
      updateSql += `, subtotal = ?, discount_amount = ?, tax_amount = ?, grand_total = ?,
        round_off_amount = ?`;
      const roundOff = Math.round(calcResult.grand_total) - calcResult.grand_total;
      params.push(calcResult.subtotal, calcResult.discount_amount, calcResult.tax_amount, calcResult.grand_total, roundOff);
    }

    updateSql += ' WHERE id = ?';
    params.push(id);

    await conn.execute(updateSql, params);

    if (items && items.length > 0) {
      await conn.execute(`DELETE FROM invoice_items WHERE invoice_id = ?`, [id]);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const lc = calcResult.items[i];
        await conn.execute(
          `INSERT INTO invoice_items (invoice_id, purchase_order_item_id, item_name, description,
             quantity, unit, unit_price, tax_percentage, discount_percentage, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, item.purchase_order_item_id || null, item.item_name, item.description || null,
           item.quantity, item.unit || 'Units', item.unit_price,
           item.tax_percentage || 0, item.discount_percentage || 0, lc.total_amount]
        );
      }
    }

    await logHistory(conn, id, 'Updated', userId, 'Invoice details updated.');
    await conn.commit();
    conn.release();

    try {
      const newInvoice = await fetchFullInvoice(id);
      await logAndNotify(userId, {
        action: 'INVOICE_UPDATED',
        module: 'Invoices',
        entityType: 'invoice',
        entityId: id,
        description: `Invoice ${rows[0].invoice_number} details updated`,
        oldValue: oldInvoice,
        newValue: newInvoice
      });
    } catch (e) { console.error('Activity log error:', e.message); }

    return { id, invoice_number: rows[0].invoice_number, status: 'Draft' };
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE DRAFT INVOICE
// ─────────────────────────────────────────────────────────────────────────────
export const deleteInvoice = async (id, userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(`SELECT status, invoice_number FROM invoices WHERE id = ?`, [id]);
    if (!rows.length) { const e = new Error('Invoice not found.'); e.statusCode = 404; throw e; }
    if (rows[0].status !== 'Draft') {
      const e = new Error('Only Draft invoices can be deleted.'); e.statusCode = 400; throw e;
    }
    await conn.execute(`DELETE FROM invoices WHERE id = ?`, [id]);
    await conn.commit();
    conn.release();
    return { id, message: 'Draft invoice deleted.' };
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE INVOICE (Draft → Generated, locks items)
// ─────────────────────────────────────────────────────────────────────────────
export const generateInvoice = async (id, userId) => {
  const oldInvoice = await fetchFullInvoice(id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT i.*, po.po_number FROM invoices i
       JOIN purchase_orders po ON i.po_id = po.id
       WHERE i.id = ?`, [id]
    );
    if (!rows.length) { const e = new Error('Invoice not found.'); e.statusCode = 404; throw e; }
    const inv = rows[0];
    if (inv.status !== 'Draft') {
      const e = new Error(`Only Draft invoices can be generated. Current: ${inv.status}`);
      e.statusCode = 400; throw e;
    }

    // Check items exist
    const [itemRows] = await conn.execute(
      `SELECT COUNT(*) AS cnt FROM invoice_items WHERE invoice_id = ?`, [id]
    );
    if (itemRows[0].cnt === 0) {
      const e = new Error('Cannot generate invoice with no line items.'); e.statusCode = 400; throw e;
    }

    await conn.execute(
      `UPDATE invoices SET status = 'Generated' WHERE id = ?`, [id]
    );
    await logHistory(conn, id, 'Generated', userId, `Invoice ${inv.invoice_number} finalized and generated.`);
    await conn.commit();
    conn.release();

    try {
      const newInvoice = await fetchFullInvoice(id);
      await logAndNotify(userId, {
        action: 'INVOICE_GENERATED',
        module: 'Invoices',
        entityType: 'invoice',
        entityId: id,
        description: `Invoice ${inv.invoice_number} generated for PO ${inv.po_number}`,
        oldValue: oldInvoice,
        newValue: newInvoice
      });
    } catch (e) { console.error('Activity log error:', e.message); }

    return { id, invoice_number: inv.invoice_number, status: 'Generated' };
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL INVOICE
// ─────────────────────────────────────────────────────────────────────────────
export const cancelInvoice = async (id, remarks, userId) => {
  const oldInvoice = await fetchFullInvoice(id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(`SELECT status, invoice_number FROM invoices WHERE id = ?`, [id]);
    if (!rows.length) { const e = new Error('Invoice not found.'); e.statusCode = 404; throw e; }
    if (['Paid', 'Cancelled'].includes(rows[0].status)) {
      const e = new Error(`Cannot cancel a ${rows[0].status} invoice.`); e.statusCode = 400; throw e;
    }
    await conn.execute(`UPDATE invoices SET status = 'Cancelled' WHERE id = ?`, [id]);
    await logHistory(conn, id, 'Cancelled', userId, remarks || 'Invoice cancelled by procurement.');
    await conn.commit();
    conn.release();

    try {
      const newInvoice = await fetchFullInvoice(id);
      await logAndNotify(userId, {
        action: 'INVOICE_CANCELLED',
        module: 'Invoices',
        entityType: 'invoice',
        entityId: id,
        description: `Invoice ${rows[0].invoice_number} cancelled. Remarks: ${remarks || 'None'}`,
        oldValue: oldInvoice,
        newValue: newInvoice
      });
    } catch (e) { console.error('Activity log error:', e.message); }

    return { id, invoice_number: rows[0].invoice_number, status: 'Cancelled' };
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK PAID
// ─────────────────────────────────────────────────────────────────────────────
export const markInvoicePaid = async (id, payload, userId) => {
  const { payment_reference, remarks } = payload;
  const oldInvoice = await fetchFullInvoice(id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(`SELECT status, invoice_number FROM invoices WHERE id = ?`, [id]);
    if (!rows.length) { const e = new Error('Invoice not found.'); e.statusCode = 404; throw e; }
    if (['Draft', 'Cancelled', 'Paid'].includes(rows[0].status)) {
      const e = new Error(`Cannot mark a ${rows[0].status} invoice as paid.`); e.statusCode = 400; throw e;
    }

    await conn.execute(
      `UPDATE invoices SET status = 'Paid', payment_status = 'Paid', payment_reference = ? WHERE id = ?`,
      [payment_reference || null, id]
    );
    await logHistory(conn, id, 'Paid', userId,
      remarks || `Payment received. Reference: ${payment_reference || 'N/A'}`
    );
    await conn.commit();
    conn.release();

    try {
      const newInvoice = await fetchFullInvoice(id);
      await logAndNotify(userId, {
        action: 'INVOICE_PAID',
        module: 'Invoices',
        entityType: 'invoice',
        entityId: id,
        description: `Invoice ${rows[0].invoice_number} marked as Paid. Ref: ${payment_reference || 'N/A'}`,
        oldValue: oldInvoice,
        newValue: newInvoice
      });
    } catch (e) { console.error('Activity log error:', e.message); }

    return { id, invoice_number: rows[0].invoice_number, status: 'Paid' };
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PDF BUFFER
// ─────────────────────────────────────────────────────────────────────────────
export const getInvoicePDFBuffer = async (id, userId) => {
  const invoice = await fetchFullInvoice(id);
  if (!invoice) return null;

  const pdfBuffer = await generateInvoicePDF(invoice);

  // Log download
  const conn = await pool.getConnection();
  try {
    await logHistory(conn, id, 'Downloaded', userId, 'Invoice PDF downloaded.');
  } finally { conn.release(); }

  return pdfBuffer;
};

// ─────────────────────────────────────────────────────────────────────────────
// SEND EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export const sendInvoiceEmail = async (id, userId) => {
  const invoice = await fetchFullInvoice(id);
  if (!invoice) { const e = new Error('Invoice not found.'); e.statusCode = 404; throw e; }

  if (!['Generated', 'Sent', 'Viewed'].includes(invoice.status)) {
    const e = new Error(
      `Email can only be sent for Generated, Sent, or Viewed invoices. Current: ${invoice.status}`
    );
    e.statusCode = 400; throw e;
  }

  const formatCurrency = (v) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(parseFloat(v) || 0);

  // Generate PDF
  let pdfBuffer;
  try {
    pdfBuffer = await generateInvoicePDF(invoice);
  } catch (pdfErr) {
    await pool.execute(
      `INSERT INTO invoice_emails (invoice_id, recipient_email, email_subject, email_status, error_message)
       VALUES (?, ?, ?, 'Failed', ?)`,
      [id, invoice.vendor_email, `Invoice ${invoice.invoice_number} — VendorBridge`, pdfErr.message]
    );
    throw new Error('PDF generation failed: ' + pdfErr.message);
  }

  const subject = `Invoice ${invoice.invoice_number} — VendorBridge Procurement`;
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'On Receipt';

  const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; max-width: 620px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 28px;">
        <div style="font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -0.5px;">🔷 VendorBridge ERP</div>
        <div style="font-size: 13px; color: rgba(255,255,255,0.8); margin-top: 4px;">Procurement & Vendor Management System</div>
      </div>
      <div style="padding: 28px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #111827;">Tax Invoice Notification</h2>
        <p style="color: #4b5563; line-height: 1.7; margin: 0 0 20px;">Dear <strong>${invoice.vendor_name}</strong>,</p>
        <p style="color: #4b5563; line-height: 1.7; margin: 0 0 24px;">Please find attached the official tax invoice for your recent procurement order. Kindly review the details and process payment by the due date.</p>
        
        <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #6b7280; width: 45%; border-bottom: 1px solid #e5e7eb;">Invoice Number</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 800; color: #111827; border-bottom: 1px solid #e5e7eb;">${invoice.invoice_number}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Purchase Order</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #0284c7; border-bottom: 1px solid #e5e7eb;">${invoice.po_number}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">${formatCurrency(invoice.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #6b7280; border-bottom: 1px solid #e5e7eb;">GST / Tax</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">${formatCurrency(invoice.tax_amount)}</td>
          </tr>
          <tr style="background: #ede9fe;">
            <td style="padding: 14px 16px; font-size: 15px; font-weight: 900; color: #4f46e5;">Grand Total</td>
            <td style="padding: 14px 16px; font-size: 15px; font-weight: 900; color: #4f46e5;">${formatCurrency(invoice.grand_total)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #6b7280;">Payment Terms</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #374151;">${invoice.payment_terms}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #dc2626;">Due Date</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 800; color: #dc2626;">${dueDate}</td>
          </tr>
        </table>

        <p style="color: #6b7280; font-size: 13px; line-height: 1.7;">The invoice PDF is attached to this email. You may also log in to the VendorBridge portal to view, download, or raise any queries.</p>
        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
          Regards,<br><strong style="color: #374151;">VendorBridge Procurement Team</strong><br>
          <span style="color: #d1d5db;">This is an automated notification. Please do not reply to this email.</span>
        </div>
      </div>
    </div>
  `;

  const attachments = [{
    filename: `${invoice.invoice_number}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf'
  }];

  let emailStatus = 'Sent';
  let errorMsg = null;
  try {
    await sendEmail(invoice.vendor_email, subject, htmlBody, attachments);
  } catch (emailErr) {
    emailStatus = 'Failed';
    errorMsg = emailErr.message;
    console.error('Email send error:', emailErr.message);
  }

  // Log to invoice_emails
  await pool.execute(
    `INSERT INTO invoice_emails (invoice_id, recipient_email, email_subject, email_status, delivery_status, error_message)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, invoice.vendor_email, subject, emailStatus, emailStatus === 'Sent' ? 'Delivered' : 'Failed', errorMsg]
  );

  // Update invoice status to Sent (only if email succeeded and not already Viewed/Paid)
  if (emailStatus === 'Sent') {
    await pool.execute(
      `UPDATE invoices SET status = 'Sent' WHERE id = ? AND status IN ('Generated','Sent')`,
      [id]
    );

    const conn = await pool.getConnection();
    try {
      await logHistory(conn, id, 'Sent', userId, `Invoice emailed to ${invoice.vendor_email}`);
    } finally { conn.release(); }

    try {
      const newInvoice = await fetchFullInvoice(id);
      await logAndNotify(userId, {
        action: 'INVOICE_EMAILED',
        module: 'Invoices',
        entityType: 'invoice',
        entityId: id,
        description: `Invoice ${invoice.invoice_number} emailed to ${invoice.vendor_email}`,
        oldValue: invoice,
        newValue: newInvoice
      });
    } catch (e) { console.error('Activity log error:', e.message); }
  }

  return {
    success: emailStatus === 'Sent',
    email_status: emailStatus,
    recipient: invoice.vendor_email,
    error: errorMsg
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET HISTORY
// ─────────────────────────────────────────────────────────────────────────────
export const getInvoiceHistory = async (id) => {
  const [rows] = await pool.execute(
    `SELECT h.*, u.name AS action_by_name, u.role AS action_by_role
     FROM invoice_history h
     JOIN users u ON h.action_by = u.id
     WHERE h.invoice_id = ?
     ORDER BY h.action_date ASC, h.id ASC`,
    [id]
  );
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET EMAIL HISTORY
// ─────────────────────────────────────────────────────────────────────────────
export const getEmailHistory = async (id) => {
  const [rows] = await pool.execute(
    `SELECT * FROM invoice_emails WHERE invoice_id = ? ORDER BY sent_at DESC`,
    [id]
  );
  return rows;
};
