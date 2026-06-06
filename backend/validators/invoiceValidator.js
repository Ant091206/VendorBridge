export const validateInvoicePayload = (payload) => {
  const errors = [];

  // po_id is required and must be a positive integer
  if (payload.po_id === undefined || payload.po_id === null || String(payload.po_id).trim() === '') {
    errors.push('Purchase Order ID (po_id) is required.');
  } else {
    const poId = Number(payload.po_id);
    if (!Number.isInteger(poId) || poId <= 0) {
      errors.push('Purchase Order ID (po_id) must be a positive integer.');
    }
  }

  // optional remarks for email body
  if (payload.remarks !== undefined && payload.remarks !== null) {
    if (String(payload.remarks).trim() === '') {
      errors.push('If provided, remarks cannot be empty.');
    }
  }

  return errors;
};
