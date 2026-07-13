/**
 * purchaseOrderValidator.js — Validators for Module 7: Purchase Order Management
 */

export const validatePOCreation = (payload) => {
  const errors = [];

  const approvalRequestId = Number(payload.approval_request_id);
  if (isNaN(approvalRequestId) || approvalRequestId <= 0) {
    errors.push('A valid Approval Request ID is required.');
  }

  if (!payload.issue_date) {
    errors.push('Issue Date is required.');
  } else if (isNaN(Date.parse(payload.issue_date))) {
    errors.push('A valid Issue Date is required.');
  }

  if (!payload.expected_delivery_date) {
    errors.push('Expected Delivery Date is required.');
  } else if (isNaN(Date.parse(payload.expected_delivery_date))) {
    errors.push('A valid Expected Delivery Date is required.');
  }

  if (payload.issue_date && payload.expected_delivery_date) {
    const issue = new Date(payload.issue_date);
    const delivery = new Date(payload.expected_delivery_date);
    // Normalize time parts for accurate date comparison
    issue.setHours(0, 0, 0, 0);
    delivery.setHours(0, 0, 0, 0);
    if (delivery < issue) {
      errors.push('Expected Delivery Date cannot be earlier than Issue Date.');
    }
  }

  if (!payload.delivery_address || !payload.delivery_address.trim()) {
    errors.push('Delivery Address is required.');
  }

  if (payload.items) {
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      errors.push('Purchase Order must contain at least one item.');
    } else {
      payload.items.forEach((item, index) => {
        if (!item.item_name || !item.item_name.trim()) {
          errors.push(`Item name at line ${index + 1} is required.`);
        }
        const qty = parseFloat(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          errors.push(`Quantity at line ${index + 1} must be a positive number.`);
        }
        const price = parseFloat(item.unit_price);
        if (isNaN(price) || price < 0) {
          errors.push(`Unit price at line ${index + 1} must be zero or positive.`);
        }
        if (item.tax_percentage !== undefined) {
          const tax = parseFloat(item.tax_percentage);
          if (isNaN(tax) || tax < 0 || tax > 100) {
            errors.push(`Tax percentage at line ${index + 1} must be between 0 and 100.`);
          }
        }
        if (item.discount_percentage !== undefined) {
          const disc = parseFloat(item.discount_percentage);
          if (isNaN(disc) || disc < 0 || disc > 100) {
            errors.push(`Discount percentage at line ${index + 1} must be between 0 and 100.`);
          }
        }
      });
    }
  }

  return errors;
};

export const validatePOUpdate = (payload) => {
  const errors = [];

  if (payload.issue_date && isNaN(Date.parse(payload.issue_date))) {
    errors.push('A valid Issue Date is required.');
  }

  if (payload.expected_delivery_date && isNaN(Date.parse(payload.expected_delivery_date))) {
    errors.push('A valid Expected Delivery Date is required.');
  }

  if (payload.issue_date && payload.expected_delivery_date) {
    const issue = new Date(payload.issue_date);
    const delivery = new Date(payload.expected_delivery_date);
    issue.setHours(0, 0, 0, 0);
    delivery.setHours(0, 0, 0, 0);
    if (delivery < issue) {
      errors.push('Expected Delivery Date cannot be earlier than Issue Date.');
    }
  }

  if (payload.delivery_address !== undefined && (!payload.delivery_address || !payload.delivery_address.trim())) {
    errors.push('Delivery Address is required.');
  }

  if (payload.items) {
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      errors.push('Purchase Order must contain at least one item.');
    } else {
      payload.items.forEach((item, index) => {
        if (!item.item_name || !item.item_name.trim()) {
          errors.push(`Item name at line ${index + 1} is required.`);
        }
        const qty = parseFloat(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          errors.push(`Quantity at line ${index + 1} must be a positive number.`);
        }
        const price = parseFloat(item.unit_price);
        if (isNaN(price) || price < 0) {
          errors.push(`Unit price at line ${index + 1} must be zero or positive.`);
        }
        if (item.tax_percentage !== undefined) {
          const tax = parseFloat(item.tax_percentage);
          if (isNaN(tax) || tax < 0 || tax > 100) {
            errors.push(`Tax percentage at line ${index + 1} must be between 0 and 100.`);
          }
        }
        if (item.discount_percentage !== undefined) {
          const disc = parseFloat(item.discount_percentage);
          if (isNaN(disc) || disc < 0 || disc > 100) {
            errors.push(`Discount percentage at line ${index + 1} must be between 0 and 100.`);
          }
        }
      });
    }
  }

  return errors;
};
