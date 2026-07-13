/**
 * quotationValidator.js — Validation rules for Module 4 quotations
 */

export const validateQuotationPayload = (payload) => {
  const errors = [];

  // 1. RFQ ID Validation
  if (payload.rfq_id === undefined || payload.rfq_id === null || String(payload.rfq_id).trim() === '') {
    errors.push('RFQ Reference is required.');
  } else {
    const rfqId = Number(payload.rfq_id);
    if (isNaN(rfqId) || rfqId <= 0 || !Number.isInteger(rfqId)) {
      errors.push('Invalid RFQ reference ID.');
    }
  }

  // 2. Delivery Days Validation
  if (payload.delivery_days === undefined || payload.delivery_days === null || String(payload.delivery_days).trim() === '') {
    errors.push('Delivery timeline (days) is required.');
  } else {
    const days = Number(payload.delivery_days);
    if (isNaN(days) || days <= 0 || !Number.isInteger(days)) {
      errors.push('Delivery timeline must be a positive integer greater than 0.');
    }
  }

  // 3. Currency Validation
  if (payload.currency && typeof payload.currency !== 'string') {
    errors.push('Currency code must be a string.');
  }

  // 4. Notes & Terms Validation
  if (payload.notes && typeof payload.notes !== 'string') {
    errors.push('Notes must be text.');
  }
  if (payload.terms_conditions && typeof payload.terms_conditions !== 'string') {
    errors.push('Terms & conditions must be text.');
  }

  // 5. Items list validation
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('At least one quoted item response is required.');
  } else {
    payload.items.forEach((item, index) => {
      const idxStr = `at item position ${index + 1}`;

      if (!item.rfq_item_id) {
        errors.push(`RFQ Item reference is required ${idxStr}.`);
      } else {
        const itemRef = Number(item.rfq_item_id);
        if (isNaN(itemRef) || itemRef <= 0) {
          errors.push(`Invalid RFQ Item reference ${idxStr}.`);
        }
      }

      const price = Number(item.unit_price);
      if (item.unit_price === undefined || item.unit_price === null || isNaN(price) || price <= 0) {
        errors.push(`Unit Price must be greater than zero ${idxStr}.`);
      }

      const qty = Number(item.quantity);
      if (item.quantity === undefined || item.quantity === null || isNaN(qty) || qty <= 0) {
        errors.push(`Quantity must be greater than zero ${idxStr}.`);
      }

      if (item.tax_percentage !== undefined && item.tax_percentage !== null && item.tax_percentage !== '') {
        const tax = Number(item.tax_percentage);
        if (isNaN(tax) || tax < 0 || tax > 100) {
          errors.push(`Tax percentage must be between 0 and 100 ${idxStr}.`);
        }
      }

      if (item.discount_percentage !== undefined && item.discount_percentage !== null && item.discount_percentage !== '') {
        const disc = Number(item.discount_percentage);
        if (isNaN(disc) || disc < 0 || disc > 100) {
          errors.push(`Discount percentage must be between 0 and 100 ${idxStr}.`);
        }
      }
    });
  }

  return errors;
};
