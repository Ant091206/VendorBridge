/**
 * invoiceValidator.js — Module 8
 * Validation rules for Invoice creation and updates.
 */

export const validateInvoiceCreation = (body) => {
  const errors = [];
  if (!body.po_id) errors.push('Purchase Order ID (po_id) is required.');
  if (body.due_date) {
    const d = new Date(body.due_date);
    if (isNaN(d.getTime())) errors.push('due_date must be a valid date.');
    if (d < new Date()) errors.push('due_date cannot be in the past.');
  }
  return errors;
};

export const validateInvoiceUpdate = (body) => {
  const errors = [];
  if (body.due_date) {
    const d = new Date(body.due_date);
    if (isNaN(d.getTime())) errors.push('due_date must be a valid date.');
  }
  return errors;
};
