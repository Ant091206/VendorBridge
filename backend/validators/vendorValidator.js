const vendorStatuses = ['active', 'inactive', 'blacklisted'];

export const validateVendorPayload = (payload) => {
  const errors = [];

  // Required checks
  if (!payload.vendor_name?.trim()) {
    errors.push('Vendor name is required.');
  }

  if (!payload.company_name?.trim()) {
    errors.push('Company name is required.');
  }

  if (!payload.email?.trim()) {
    errors.push('Vendor email is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
    errors.push('Vendor email is invalid.');
  }

  if (!payload.phone?.trim()) {
    errors.push('Phone number is required.');
  } else if (!/^\+?[0-9\s\-()]{10,20}$/.test(payload.phone.trim())) {
    errors.push('Phone number is invalid. Must be between 10 and 20 digits.');
  }

  if (payload.alternate_phone?.trim()) {
    if (!/^\+?[0-9\s\-()]{10,20}$/.test(payload.alternate_phone.trim())) {
      errors.push('Alternate phone number is invalid.');
    }
  }

  if (!payload.gst_number?.trim()) {
    errors.push('GST number is required.');
  } else if (!/^[a-zA-Z0-9]{15}$/.test(payload.gst_number.trim())) {
    errors.push('GST number must be a 15-character alphanumeric code.');
  }

  if (payload.pan_number?.trim()) {
    if (!/^[a-zA-Z0-9]{10}$/.test(payload.pan_number.trim())) {
      errors.push('PAN number must be a 10-character alphanumeric code.');
    }
  }

  if (!payload.category_id) {
    errors.push('Category is required.');
  } else if (isNaN(parseInt(payload.category_id, 10))) {
    errors.push('Invalid Category ID.');
  }

  if (!payload.status?.trim()) {
    errors.push('Status is required.');
  } else if (!vendorStatuses.includes(payload.status.trim())) {
    errors.push('Invalid vendor status.');
  }

  if (payload.notes && payload.notes.length > 2000) {
    errors.push('Notes cannot exceed 2000 characters.');
  }

  return errors;
};

export const validateCategoryPayload = (payload) => {
  const errors = [];
  if (!payload.name?.trim()) {
    errors.push('Category name is required.');
  }
  return errors;
};
