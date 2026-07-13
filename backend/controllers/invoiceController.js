/**
 * invoiceController.js — VendorBridge Module 8
 * Thin controller layer — all business logic in invoiceService.js
 */

import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  generateInvoice,
  cancelInvoice,
  markInvoicePaid,
  getInvoicePDFBuffer,
  sendInvoiceEmail,
  getInvoiceHistory,
  getEmailHistory,
  fetchFullInvoice
} from '../services/invoiceService.js';
import {
  validateInvoiceCreation,
  validateInvoiceUpdate
} from '../validators/invoiceValidator.js';

// Standard error helper
const fail = (res, err, fallback = 'Operation failed.') =>
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || fallback
  });

// ─── POST /api/invoices ───────────────────────────────────────────────────────
export const createInvoiceHandler = async (req, res) => {
  const errors = validateInvoiceCreation(req.body);
  if (errors.length) return res.status(400).json({ status: 'error', message: errors[0], errors });

  try {
    const result = await createInvoice(req.body, req.user.id);
    return res.status(201).json({
      status: 'success',
      message: 'Draft invoice created successfully.',
      data: result
    });
  } catch (err) {
    console.error('createInvoice error:', err.message);
    return fail(res, err, 'Failed to create invoice.');
  }
};

// ─── GET /api/invoices ────────────────────────────────────────────────────────
export const getAllInvoicesHandler = async (req, res) => {
  try {
    const result = await getAllInvoices(req.query, req.user);
    return res.status(200).json({
      status: 'success',
      data: result.invoices,
      stats: result.stats,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('getAllInvoices error:', err.message);
    return fail(res, err, 'Failed to retrieve invoices.');
  }
};

// ─── GET /api/invoices/:id ────────────────────────────────────────────────────
export const getInvoiceByIdHandler = async (req, res) => {
  try {
    const invoice = await getInvoiceById(req.params.id, req.user);
    if (!invoice) return res.status(404).json({ status: 'error', message: 'Invoice not found.' });
    return res.status(200).json({ status: 'success', data: invoice });
  } catch (err) {
    console.error('getInvoiceById error:', err.message);
    return fail(res, err, 'Failed to retrieve invoice.');
  }
};

// ─── PUT /api/invoices/:id ────────────────────────────────────────────────────
export const updateInvoiceHandler = async (req, res) => {
  const errors = validateInvoiceUpdate(req.body);
  if (errors.length) return res.status(400).json({ status: 'error', message: errors[0], errors });

  try {
    const result = await updateInvoice(req.params.id, req.body, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Invoice updated successfully.',
      data: result
    });
  } catch (err) {
    console.error('updateInvoice error:', err.message);
    return fail(res, err, 'Failed to update invoice.');
  }
};

// ─── DELETE /api/invoices/:id ─────────────────────────────────────────────────
export const deleteInvoiceHandler = async (req, res) => {
  try {
    const result = await deleteInvoice(req.params.id, req.user.id);
    return res.status(200).json({ status: 'success', message: 'Draft invoice deleted.', data: result });
  } catch (err) {
    console.error('deleteInvoice error:', err.message);
    return fail(res, err, 'Failed to delete invoice.');
  }
};

// ─── PATCH /api/invoices/:id/generate ─────────────────────────────────────────
export const generateInvoiceHandler = async (req, res) => {
  try {
    const result = await generateInvoice(req.params.id, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Invoice generated successfully.',
      data: result
    });
  } catch (err) {
    console.error('generateInvoice error:', err.message);
    return fail(res, err, 'Failed to generate invoice.');
  }
};

// ─── PATCH /api/invoices/:id/cancel ───────────────────────────────────────────
export const cancelInvoiceHandler = async (req, res) => {
  try {
    const result = await cancelInvoice(req.params.id, req.body.remarks, req.user.id);
    return res.status(200).json({ status: 'success', message: 'Invoice cancelled.', data: result });
  } catch (err) {
    console.error('cancelInvoice error:', err.message);
    return fail(res, err, 'Failed to cancel invoice.');
  }
};

// ─── PATCH /api/invoices/:id/mark-paid ────────────────────────────────────────
export const markPaidHandler = async (req, res) => {
  try {
    const result = await markInvoicePaid(req.params.id, req.body, req.user.id);
    return res.status(200).json({ status: 'success', message: 'Invoice marked as Paid.', data: result });
  } catch (err) {
    console.error('markInvoicePaid error:', err.message);
    return fail(res, err, 'Failed to mark invoice as paid.');
  }
};

// ─── GET /api/invoices/:id/pdf ─────────────────────────────────────────────────
export const downloadPDFHandler = async (req, res) => {
  try {
    // Check access
    const invoice = await fetchFullInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ status: 'error', message: 'Invoice not found.' });

    if (req.user.role === 'vendor' && invoice.vendor_email !== req.user.email) {
      return res.status(403).json({ status: 'error', message: 'Access denied.' });
    }

    const pdfBuffer = await getInvoicePDFBuffer(req.params.id, req.user.id);
    if (!pdfBuffer) return res.status(404).json({ status: 'error', message: 'Invoice not found.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('downloadPDF error:', err.message);
    return fail(res, err, 'Failed to generate PDF.');
  }
};

// ─── POST /api/invoices/:id/send-email ────────────────────────────────────────
export const sendEmailHandler = async (req, res) => {
  try {
    const result = await sendInvoiceEmail(req.params.id, req.user.id);
    return res.status(200).json({
      status: result.success ? 'success' : 'error',
      message: result.success
        ? `Invoice emailed to ${result.recipient} successfully.`
        : `Email failed: ${result.error}`,
      data: result
    });
  } catch (err) {
    console.error('sendInvoiceEmail error:', err.message);
    return fail(res, err, 'Failed to send invoice email.');
  }
};

// ─── GET /api/invoices/:id/history ────────────────────────────────────────────
export const getHistoryHandler = async (req, res) => {
  try {
    const rows = await getInvoiceHistory(req.params.id);
    return res.status(200).json({ status: 'success', data: rows });
  } catch (err) {
    console.error('getInvoiceHistory error:', err.message);
    return fail(res, err, 'Failed to retrieve invoice history.');
  }
};

// ─── GET /api/invoices/:id/email-history ──────────────────────────────────────
export const getEmailHistoryHandler = async (req, res) => {
  try {
    const rows = await getEmailHistory(req.params.id);
    return res.status(200).json({ status: 'success', data: rows });
  } catch (err) {
    console.error('getEmailHistory error:', err.message);
    return fail(res, err, 'Failed to retrieve email history.');
  }
};

// Legacy: vendor my-invoices — redirects to filtered getAllInvoices
export const getMyInvoicesHandler = async (req, res) => {
  try {
    const result = await getAllInvoices(req.query, req.user);
    return res.status(200).json({
      status: 'success',
      data: result.invoices,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('getMyInvoices error:', err.message);
    return fail(res, err, 'Failed to retrieve your invoices.');
  }
};
