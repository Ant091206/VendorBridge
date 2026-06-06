import pool from '../config/db.js';
import { generateInvoiceNumber } from '../utils/invoiceNumberGenerator.js';
import { logAndNotify } from '../utils/activityAndNotificationHelper.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { sendEmail } from '../services/emailService.js';

/**
 * Helper to fetch full invoice details with database joins.
 * Shared across details API, PDF download API, and Email dispatch API.
 */
const fetchFullInvoiceData = async (invoiceId) => {
  const sql = `
    SELECT 
      i.id, i.invoice_number, i.subtotal, i.tax, i.grand_total, i.status, i.issued_at,
      po.id AS po_id, po.po_number,
      v.id AS vendor_id, v.name AS vendor_name, v.email AS vendor_email, v.gst_number AS vendor_gst,
      v.address AS vendor_address, v.phone AS vendor_phone,
      r.title AS rfq_title, r.quantity AS rfq_quantity, r.description AS rfq_description,
      q.unit_price, q.delivery_days,
      u.name AS approver_name, a.decided_at AS approved_date
    FROM invoices i
    JOIN purchase_orders po ON i.po_id = po.id
    JOIN approvals a ON po.approval_id = a.id
    JOIN quotations q ON a.quotation_id = q.id
    JOIN vendors v ON q.vendor_id = v.id
    JOIN rfqs r ON q.rfq_id = r.id
    LEFT JOIN users u ON a.approver_id = u.id
    WHERE i.id = ?
  `;
  const [rows] = await pool.execute(sql, [invoiceId]);
  return rows[0] || null;
};

/**
 * POST /api/invoices/generate/:po_id
 * Generates an invoice from a Purchase Order.
 * Protected: officer and admin only.
 */
export const generateInvoice = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { po_id } = req.params;

    // A. Check if PO exists
    const [poRows] = await conn.execute(
      'SELECT * FROM purchase_orders WHERE id = ?',
      [po_id]
    );

    if (poRows.length === 0) {
      conn.release();
      return res.status(404).json({
        status: 'error',
        message: 'Purchase Order not found.'
      });
    }

    const po = poRows[0];

    // B. Validate PO status (must be generated or sent)
    if (po.status !== 'generated' && po.status !== 'sent') {
      conn.release();
      return res.status(400).json({
        status: 'error',
        message: `Invoices can only be generated for POs in 'generated' or 'sent' status. Current status: '${po.status}'.`
      });
    }

    // C. Verify invoice does not already exist for this PO
    const [existingInvoiceRows] = await conn.execute(
      'SELECT id, invoice_number FROM invoices WHERE po_id = ?',
      [po_id]
    );

    if (existingInvoiceRows.length > 0) {
      conn.release();
      return res.status(400).json({
        status: 'error',
        message: `An invoice has already been generated for this Purchase Order (${existingInvoiceRows[0].invoice_number}).`,
        invoice_id: existingInvoiceRows[0].id
      });
    }

    // D. Transaction execution
    await conn.beginTransaction();

    // 1. Generate incremental invoice number (INV-YYYY-XXXX)
    const invoiceNumber = await generateInvoiceNumber(conn);

    // 2. Set cost details
    const subtotal = po.subtotal;
    const tax = po.tax_amount;
    const grand_total = po.grand_total;

    // 3. Insert Invoice
    const [result] = await conn.execute(
      `INSERT INTO invoices (po_id, invoice_number, subtotal, tax, grand_total, status, issued_at)
       VALUES (?, ?, ?, ?, ?, 'generated', CURRENT_TIMESTAMP)`,
      [po_id, invoiceNumber, subtotal, tax, grand_total]
    );

    const invoiceId = result.insertId;

    // 4. Update PO status to 'sent'
    await conn.execute(
      `UPDATE purchase_orders SET status = 'sent' WHERE id = ?`,
      [po_id]
    );

    // 5. Log activity
    await logAndNotify(req.user.id, {
      action: 'INVOICE_GENERATED',
      module: 'Invoices',
      entityType: 'invoice',
      entityId: invoiceId,
      description: `Invoice ${invoiceNumber} generated for PO #${po.po_number}`,
      ipAddress: req.ip
    });
    await logAndNotify(req.user.id, {
      action: 'PO_SENT',
      module: 'Purchase Orders',
      entityType: 'purchase_order',
      entityId: po_id,
      description: `Purchase order ${po.po_number} status updated to sent`,
      ipAddress: req.ip
    });

    await conn.commit();
    conn.release();

    // Fetch newly created invoice details to return
    const invoiceData = await fetchFullInvoiceData(invoiceId);

    return res.status(201).json({
      status: 'success',
      message: `Invoice ${invoiceNumber} generated successfully.`,
      data: invoiceData
    });

  } catch (error) {
    if (conn.connection && conn.connection._protocol && conn.connection._protocol._fatalError === null) {
      await conn.rollback();
    }
    conn.release();
    console.error('Error generating invoice:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate invoice.'
    });
  }
};

/**
 * GET /api/invoices
 * Returns all invoices in the system.
 * Protected: officer and admin only.
 */
export const getAllInvoices = async (req, res) => {
  try {
    const { status, search } = req.query;

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
      conditions.push(`i.status = ?`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(i.invoice_number LIKE ? OR v.name LIKE ?)`);
      const pattern = `%${search}%`;
      params.push(pattern, pattern);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY i.id DESC';

    const [rows] = await pool.execute(sql, params);

    return res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve invoices.'
    });
  }
};

/**
 * GET /api/invoices/:id
 * Returns single invoice full details.
 * Protected: officer, admin, or the vendor owner.
 */
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await fetchFullInvoiceData(id);

    if (!invoice) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found.'
      });
    }

    // Role guard check for vendor user role
    if (req.user.role === 'vendor') {
      const [vendorRecord] = await pool.execute(
        'SELECT id FROM vendors WHERE email = ?',
        [req.user.email]
      );
      
      if (vendorRecord.length === 0 || vendorRecord[0].id !== invoice.vendor_id) {
        return res.status(403).json({
          status: 'error',
          message: 'Access Denied: You are not authorized to view this invoice.'
        });
      }
    }

    return res.status(200).json({
      status: 'success',
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice by ID:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve invoice details.'
    });
  }
};

/**
 * GET /api/invoices/:id/pdf
 * Generates and downloads the invoice as a PDF file using Puppeteer.
 * Protected: officer, admin, or the vendor owner.
 */
export const getInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await fetchFullInvoiceData(id);

    if (!invoice) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found.'
      });
    }

    // Role guard check for vendor user role
    if (req.user.role === 'vendor') {
      const [vendorRecord] = await pool.execute(
        'SELECT id FROM vendors WHERE email = ?',
        [req.user.email]
      );
      
      if (vendorRecord.length === 0 || vendorRecord[0].id !== invoice.vendor_id) {
        return res.status(403).json({
          status: 'error',
          message: 'Access Denied: You cannot download this invoice PDF.'
        });
      }
    }

    // Generate PDF buffer using Puppeteer
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Set response headers for file attachment download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation handler error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to render invoice PDF on the server.'
    });
  }
};

/**
 * POST /api/invoices/:id/send-email
 * Emails the invoice PDF as an attachment to the Vendor and updates status.
 * Protected: officer and admin only.
 */
export const sendInvoiceEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await fetchFullInvoiceData(id);

    if (!invoice) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found.'
      });
    }

    // Generate PDF buffer
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Subject and HTML Body
    const emailSubject = `Invoice ${invoice.invoice_number} — VendorBridge`;
    
    const formattedGrandTotal = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(parseFloat(invoice.grand_total));

    const formattedTax = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(parseFloat(invoice.tax));

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-top: 0;">VendorBridge Tax Invoice</h2>
        <p>Dear <strong>${invoice.vendor_name}</strong>,</p>
        <p>Please find attached the official tax invoice generated for your recent procurement order.</p>
        
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
            <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">GST (18%):</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${formattedTax}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Grand Total Amount:</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #4f46e5;">${formattedGrandTotal}</td>
          </tr>
        </table>
        
        <p>Please log in to the VendorBridge portal to track status or download duplicates. Contact us for any clarifications.</p>
        <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b;">
          Regards,<br>
          <strong>VendorBridge Procurement Team</strong>
        </p>
      </div>
    `;

    // Email attachments configuration
    const attachments = [
      {
        filename: `${invoice.invoice_number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ];

    // Dispatch email
    await sendEmail(invoice.vendor_email, emailSubject, htmlBody, attachments);

    // Update status to 'sent' in database
    await pool.execute(
      `UPDATE invoices SET status = 'sent' WHERE id = ?`,
      [id]
    );

    // Log operational activity
    await logAndNotify(req.user.id, {
      action: 'INVOICE_EMAILED',
      module: 'Invoices',
      entityType: 'invoice',
      entityId: id,
      description: `Invoice ${invoice.invoice_number} emailed to vendor`,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: `Invoice ${invoice.invoice_number} emailed to ${invoice.vendor_email} successfully. Status updated to 'sent'.`
    });

  } catch (error) {
    console.error('Failed to email invoice PDF:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to compile and email invoice attachment.'
    });
  }
};

/**
 * PUT /api/invoices/:id/status
 * Updates invoice status manually (e.g. marking as paid).
 * Protected: officer and admin only.
 */
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['sent', 'paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Status can only be updated to: sent, paid.'
      });
    }

    // Check if invoice exists
    const [invoiceRows] = await pool.execute(
      'SELECT invoice_number FROM invoices WHERE id = ?',
      [id]
    );

    if (invoiceRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found.'
      });
    }

    // Update DB
    await pool.execute(
      'UPDATE invoices SET status = ? WHERE id = ?',
      [status, id]
    );

    // Log activity
    const action = status === 'paid' ? 'INVOICE_PAID' : 'INVOICE_SENT';
    await logAndNotify(req.user.id, {
      action: action,
      module: 'Invoices',
      entityType: 'invoice',
      entityId: id,
      description: `Invoice ${invoiceRows[0].invoice_number} status updated to ${status}`,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: `Invoice status updated to ${status}.`,
      data: {
        id: id,
        status: status
      }
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update invoice status.'
    });
  }
};

/**
 * GET /api/invoices/vendor/my-invoices
 * Returns all invoices for the currently logged-in vendor.
 * Protected: vendor only.
 */
export const getMyInvoices = async (req, res) => {
  try {
    // 1. Resolve vendor ID by email
    const [vendorRecord] = await pool.execute(
      'SELECT id FROM vendors WHERE email = ?',
      [req.user.email]
    );

    if (vendorRecord.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Vendor record not found.'
      });
    }

    const vendorId = vendorRecord[0].id;

    // 2. Fetch invoices
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

    return res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error getting vendor invoices:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve your invoices.'
    });
  }
};
