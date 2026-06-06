// backend/services/invoiceService.js
import pool from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';
import { generateInvoiceNumber } from '../utils/invoiceNumberGenerator.js';
import { generateInvoicePDF } from './pdfService.js';
import { sendEmail } from './emailService.js';

/**
 * Retrieves all invoices with optional status filter and search term.
 */
export const getAllInvoices = async (status, search) => {
  let sql = `
    SELECT 
      i.id, i.invoice_number, i.subtotal, i.tax, i.grand_total, i.status, i.issued_at,
      po.po_number,
      v.name AS vendor_name, v.email AS vendor_email, v.gst_number AS vendor_gst,
      v.address AS vendor_address, v.phone AS vendor_phone,
      r.title AS rfq_title, r.quantity AS rfq_quantity,
      q.unit_price, q.delivery_days
    FROM invoices i
    JOIN purchase_orders po ON i.po_id = po.id
    JOIN approvals a ON po.approval_id = a.id
    JOIN quotations q ON a.quotation_id = q.id
    JOIN vendors v ON q.vendor_id = v.id
    JOIN rfqs r ON q.rfq_id = r.id
  `;
  const params = [];
  const conditions = [];
  if (status) {
    conditions.push('i.status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(i.invoice_number LIKE ? OR v.name LIKE ?)');
    const pattern = `%${search}%`;
    params.push(pattern, pattern);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY i.id DESC';
  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * Retrieves a single invoice with full joined details.
 */
export const getInvoiceById = async (id) => {
  const sql = `
    SELECT 
      i.id, i.invoice_number, i.subtotal, i.tax, i.grand_total, i.status, i.issued_at,
      po.po_number,
      v.id AS vendor_id, v.name AS vendor_name, v.email AS vendor_email, v.gst_number AS vendor_gst,
      v.address AS vendor_address, v.phone AS vendor_phone,
      r.title AS rfq_title, r.quantity AS rfq_quantity,
      q.unit_price, q.delivery_days
    FROM invoices i
    JOIN purchase_orders po ON i.po_id = po.id
    JOIN approvals a ON po.approval_id = a.id
    JOIN quotations q ON a.quotation_id = q.id
    JOIN vendors v ON q.vendor_id = v.id
    JOIN rfqs r ON q.rfq_id = r.id
    WHERE i.id = ?
  `;
  const [rows] = await pool.execute(sql, [id]);
  return rows[0] || null;
};

/**
 * Retrieves invoices belonging to the currently authenticated vendor.
 */
export const getMyInvoices = async (vendorEmail) => {
  const [vendorRows] = await pool.execute('SELECT id FROM vendors WHERE email = ?', [vendorEmail]);
  if (!vendorRows.length) return [];
  const vendorId = vendorRows[0].id;
  const sql = `
    SELECT 
      i.id, i.invoice_number, i.grand_total, i.status, i.issued_at,
      po.po_number,
      r.title AS rfq_title
    FROM invoices i
    JOIN purchase_orders po ON i.po_id = po.id
    JOIN approvals a ON po.approval_id = a.id
    JOIN quotations q ON a.quotation_id = q.id
    JOIN vendors v ON q.vendor_id = v.id
    JOIN rfqs r ON q.rfq_id = r.id
    WHERE v.id = ?
    ORDER BY i.id DESC
  `;
  const [rows] = await pool.execute(sql, [vendorId]);
  return rows;
};

/**
 * Generates an invoice for a given purchase order.
 */
export const generateInvoice = async (poId, userId, userName) => {
  const conn = await pool.getConnection();
  try {
    // Verify PO exists and is in correct state
    const [poRows] = await conn.execute('SELECT * FROM purchase_orders WHERE id = ?', [poId]);
    if (!poRows.length) {
      conn.release();
      return { error: 'Purchase Order not found.', status: 404 };
    }
    const po = poRows[0];
    if (po.status !== 'generated' && po.status !== 'sent') {
      conn.release();
      return { error: `Invoices can only be generated for PO status 'generated' or 'sent'. Current: ${po.status}.`, status: 400 };
    }
    // Ensure no existing invoice for this PO
    const [existing] = await conn.execute('SELECT id, invoice_number FROM invoices WHERE po_id = ?', [poId]);
    if (existing.length) {
      conn.release();
      return { error: `Invoice already exists: ${existing[0].invoice_number}`, status: 400, existingId: existing[0].id };
    }
    // Transaction
    await conn.beginTransaction();
    const invoiceNumber = await generateInvoiceNumber(conn);
    const { subtotal, tax, grand_total } = po; // po includes these columns from migration
    const [result] = await conn.execute(
      `INSERT INTO invoices (po_id, invoice_number, subtotal, tax, grand_total, status, issued_at)
       VALUES (?, ?, ?, ?, ?, 'generated', CURRENT_TIMESTAMP)`,
      [poId, invoiceNumber, subtotal, tax, grand_total]
    );
    const invoiceId = result.insertId;
    // Update PO status to sent
    await conn.execute('UPDATE purchase_orders SET status = ? WHERE id = ?', ['sent', poId]);
    // Log activities
    await logActivity(conn, userId, 'invoice', invoiceId, 'INVOICE_GENERATED');
    await logActivity(conn, userId, 'purchase_order', poId, 'PO_SENT');
    await conn.commit();
    conn.release();
    return { invoiceId, invoiceNumber, subtotal, tax, grand_total, status: 'generated' };
  } catch (err) {
    if (conn.connection && conn.connection._protocol && conn.connection._protocol._fatalError === null) {
      await conn.rollback();
    }
    conn.release();
    throw err;
  }
};

/**
 * Updates the status of an invoice (sent / paid).
 */
export const updateInvoiceStatus = async (invoiceId, newStatus, userId) => {
  const valid = ['sent', 'paid'];
  if (!valid.includes(newStatus)) return { error: 'Invalid status', status: 400 };
  const [rows] = await pool.execute('SELECT invoice_number FROM invoices WHERE id = ?', [invoiceId]);
  if (!rows.length) return { error: 'Invoice not found', status: 404 };
  await pool.execute('UPDATE invoices SET status = ? WHERE id = ?', [newStatus, invoiceId]);
  const action = newStatus === 'paid' ? 'INVOICE_PAID' : 'INVOICE_SENT';
  await logActivity(pool, userId, 'invoice', invoiceId, action);
  return { success: true };
};

/**
 * Generates PDF for an invoice using existing pdfService helper.
 */
export const getInvoicePDF = async (invoiceId) => {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) return null;
  const pdfBuffer = await generateInvoicePDF(invoice);
  return pdfBuffer;
};

/**
 * Sends the invoice PDF to the vendor via email.
 */
export const sendInvoiceEmail = async (invoiceId, userId) => {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) return { error: 'Invoice not found', status: 404 };
  const pdfBuffer = await generateInvoicePDF(invoice);
  const subject = `Invoice ${invoice.invoice_number} — VendorBridge`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-top: 0;">VendorBridge Tax Invoice</h2>
      <p>Dear <strong>${invoice.vendor_name}</strong>,</p>
      <p>Please find attached the official tax invoice for your recent procurement order.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0; width: 40%;">Invoice Number:</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #111827;">${invoice.invoice_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Purchase Order Number:</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-mono; font-weight: bold; color: #0284c7;">${invoice.po_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Grand Total:</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #4f46e5;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(parseFloat(invoice.grand_total))}</td>
        </tr>
      </table>
      <p>Please log in to VendorBridge to track status or download duplicates. Contact us for any clarifications.</p>
      <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b;">
        Regards,<br><strong>VendorBridge Procurement Team</strong>
      </p>
    </div>
  `;
  const attachments = [{ filename: `${invoice.invoice_number}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }];
  await sendEmail(invoice.vendor_email, subject, htmlBody, attachments);
  // Update status to sent
  await pool.execute('UPDATE invoices SET status = ? WHERE id = ?', ['sent', invoiceId]);
  await logActivity(pool, userId, 'invoice', invoiceId, 'INVOICE_EMAILED');
  return { success: true };
};
