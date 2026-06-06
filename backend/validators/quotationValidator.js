export const validateQuotationPayload = (payload) => {
  const errors = [];

  // 1. Unit Price Validation
  if (payload.unit_price === undefined || payload.unit_price === null || String(payload.unit_price).trim() === '') {
    errors.push('Unit price is required.');
  } else {
    const price = Number(payload.unit_price);
    if (isNaN(price) || price <= 0) {
      errors.push('Unit price must be a positive number greater than 0.');
    }
  }

  // 2. Quantity Validation
  if (payload.quantity === undefined || payload.quantity === null || String(payload.quantity).trim() === '') {
    errors.push('Quantity is required.');
  } else {
    const qty = Number(payload.quantity);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      errors.push('Quantity must be a positive integer greater than 0.');
    }
  }

  // 3. Delivery Days Validation
  if (payload.delivery_days === undefined || payload.delivery_days === null || String(payload.delivery_days).trim() === '') {
    errors.push('Delivery days is required.');
  } else {
    const days = Number(payload.delivery_days);
    if (isNaN(days) || days <= 0 || !Number.isInteger(days)) {
      errors.push('Delivery days must be a positive integer greater than 0.');
    }
  }

  return errors;
};
