const vendorStatuses = ['active', 'inactive', 'blacklisted'];

export const validateVendorPayload = (payload) => {
  const errors = [];

  if (!payload.vendor_name?.trim()) errors.push('Vendor name is required.');
  if (!payload.company_name?.trim()) errors.push('Company name is required.');
  if (!payload.vendor_code?.trim()) errors.push('Vendor code is required.');
  if (!payload.gst_number?.trim()) errors.push('GST number is required.');
  if (!payload.email?.trim()) errors.push('Vendor email is required.');
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.push('Vendor email is invalid.');
  if (payload.status && !vendorStatuses.includes(payload.status)) errors.push('Invalid vendor status.');

  return errors;
};

export const validateCategoryPayload = (payload) => {
  const errors = [];
  if (!payload.name?.trim()) errors.push('Category name is required.');
  return errors;
};
