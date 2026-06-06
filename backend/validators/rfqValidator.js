const rfqStatuses = ['draft', 'open', 'closed', 'cancelled'];

export const validateRFQPayload = (payload) => {
  const errors = [];

  if (!payload.title?.trim()) errors.push('RFQ title is required.');
  if (!payload.description?.trim()) errors.push('Description is required.');
  if (!payload.product_details?.trim()) errors.push('Product details are required.');

  const quantity = Number(payload.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) errors.push('Quantity must be greater than 0.');

  if (!payload.deadline) {
    errors.push('Deadline is required.');
  } else if (new Date(payload.deadline) <= new Date()) {
    errors.push('Deadline must be a future date.');
  }

  if (!Array.isArray(payload.vendor_ids) || payload.vendor_ids.length === 0) {
    errors.push('At least one vendor must be assigned.');
  }

  if (payload.status && !rfqStatuses.includes(payload.status)) errors.push('Invalid RFQ status.');

  return errors;
};
