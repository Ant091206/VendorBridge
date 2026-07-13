const rfqStatuses = ['draft', 'published', 'closed', 'cancelled'];
const rfqPriorities = ['Low', 'Medium', 'High', 'Urgent'];

export const validateRFQPayload = (payload) => {
  const errors = [];

  // Title validation
  if (!payload.title?.trim()) {
    errors.push('RFQ title is required.');
  } else if (payload.title.trim().length < 5) {
    errors.push('RFQ title must be at least 5 characters long.');
  }

  // Description validation
  if (!payload.description?.trim()) {
    errors.push('Description is required.');
  }

  // Type validation
  if (!payload.type?.trim()) {
    errors.push('RFQ Type is required.');
  }

  // Priority validation
  if (payload.priority && !rfqPriorities.includes(payload.priority)) {
    errors.push('Invalid priority level. Must be one of Low, Medium, High, Urgent.');
  }

  // Dates validation
  const issueDate = payload.issue_date ? new Date(payload.issue_date) : new Date();
  if (!payload.submission_deadline) {
    errors.push('Submission deadline is required.');
  } else {
    const deadline = new Date(payload.submission_deadline);
    if (isNaN(deadline.getTime())) {
      errors.push('Invalid submission deadline date format.');
    } else {
      if (deadline <= new Date()) {
        errors.push('Submission deadline must be a future date.');
      }
      if (deadline <= issueDate) {
        errors.push('Submission deadline cannot be before or equal to the issue date.');
      }
    }
  }

  // Items validation
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('At least one RFQ item is required.');
  } else {
    payload.items.forEach((item, index) => {
      const idxStr = `at item ${index + 1}`;
      if (!item.item_name?.trim()) {
        errors.push(`Item name is required ${idxStr}.`);
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        errors.push(`Quantity must be greater than zero ${idxStr}.`);
      }
      if (!item.unit?.trim()) {
        errors.push(`Unit is required ${idxStr}.`);
      }
      if (item.expected_price !== undefined && item.expected_price !== null && item.expected_price !== '') {
        const price = Number(item.expected_price);
        if (isNaN(price) || price < 0) {
          errors.push(`Expected price must be a non-negative number ${idxStr}.`);
        }
      }
    });
  }

  // Status validation
  if (payload.status && !rfqStatuses.includes(payload.status)) {
    errors.push('Invalid RFQ status.');
  }

  // Vendor Assignment validation (Required before publishing)
  const isPublishing = payload.status === 'published';
  const hasVendors = Array.isArray(payload.vendor_ids) && payload.vendor_ids.length > 0;
  if (isPublishing && !hasVendors) {
    errors.push('At least one vendor must be assigned before publishing the RFQ.');
  }

  return errors;
};
