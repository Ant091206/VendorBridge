import {
  createCategoryRecord,
  createVendorRecord,
  deleteCategoryRecord,
  deleteVendorRecord,
  generateVendorCode,
  getCategoryById,
  getVendor,
  listCategories,
  listVendors,
  patchVendorStatus,
  updateCategoryRecord,
  updateVendorRecord
} from '../services/vendorService.js';
import { validateCategoryPayload, validateVendorPayload } from '../validators/vendorValidator.js';
import { logAndNotify } from '../utils/activityAndNotificationHelper.js';

const fail = (res, error, fallback = 'Request failed.') => res.status(error.statusCode || 500).json({
  status: 'error',
  message: error.message || fallback
});

export const getAllVendors = async (req, res) => {
  try {
    const result = await listVendors(req.query, req.user);
    return res.status(200).json({
      status: 'success',
      results: result.data.length,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return fail(res, error, 'Failed to retrieve vendor list.');
  }
};

export const getVendorById = async (req, res) => {
  try {
    const vendor = await getVendor(req.params.id, req.user);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor not found.' });
    }
    return res.status(200).json({ status: 'success', data: vendor });
  } catch (error) {
    console.error('Error retrieving vendor details:', error);
    return fail(res, error, 'Failed to retrieve vendor profile.');
  }
};

export const createVendor = async (req, res) => {
  try {
    const errors = validateVendorPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: errors[0], errors });
    }

    const vendor = await createVendorRecord(req.body, req.user);

    // Log Activity & Dispatch Notifications
    await logAndNotify(req.user.id, {
      action: 'VENDOR_CREATED',
      module: 'Vendor Management',
      entityType: 'vendor',
      entityId: vendor.id,
      description: `Vendor "${vendor.vendor_name || vendor.name}" registered`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: 'Vendor created successfully.',
      data: vendor
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return fail(res, error, 'Failed to create vendor record.');
  }
};

export const updateVendor = async (req, res) => {
  try {
    const errors = validateVendorPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: errors[0], errors });
    }

    const oldVendor = await getVendor(req.params.id, req.user);
    const vendor = await updateVendorRecord(req.params.id, req.body, req.user);

    // Log Activity & Dispatch Notifications
    await logAndNotify(req.user.id, {
      action: 'VENDOR_UPDATED',
      module: 'Vendor Management',
      entityType: 'vendor',
      entityId: vendor.id,
      description: `Vendor "${vendor.vendor_name || vendor.name}" profile updated`,
      ipAddress: req.ip,
      oldValue: oldVendor,
      newValue: vendor
    });

    return res.status(200).json({
      status: 'success',
      message: 'Vendor updated successfully.',
      data: vendor
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return fail(res, error, 'Failed to update vendor record.');
  }
};

export const deleteVendor = async (req, res) => {
  try {
    const existing = await getVendor(req.params.id, req.user);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Vendor not found.' });
    }
    await deleteVendorRecord(req.params.id, req.user.id);

    // Log Activity & Dispatch Notifications
    await logAndNotify(req.user.id, {
      action: 'VENDOR_DELETED',
      module: 'Vendor Management',
      entityType: 'vendor',
      entityId: Number(req.params.id),
      description: `Vendor "${existing.vendor_name || existing.name}" archived`,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Vendor archived successfully.'
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return fail(res, error, 'Failed to archive vendor.');
  }
};

export const patchVendorStatusController = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'inactive', 'blacklisted'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid or missing status.' });
    }

    const oldVendor = await getVendor(req.params.id, req.user);
    const vendor = await patchVendorStatus(req.params.id, status, req.user.id, req.user);

    // Log Activity & Dispatch Notifications
    await logAndNotify(req.user.id, {
      action: 'VENDOR_STATUS_CHANGED',
      module: 'Vendor Management',
      entityType: 'vendor',
      entityId: vendor.id,
      description: `Vendor "${vendor.vendor_name || vendor.name}" status updated to ${status}`,
      ipAddress: req.ip,
      oldValue: oldVendor,
      newValue: vendor
    });

    return res.status(200).json({
      status: 'success',
      message: 'Vendor status updated successfully.',
      data: vendor
    });
  } catch (error) {
    console.error('Error patching vendor status:', error);
    return fail(res, error, 'Failed to update vendor status.');
  }
};

export const generateCode = async (req, res) => {
  try {
    const code = await generateVendorCode();
    return res.status(200).json({
      status: 'success',
      data: { vendor_code: code }
    });
  } catch (error) {
    console.error('Error generating vendor code:', error);
    return fail(res, error, 'Failed to generate vendor code.');
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await listCategories();
    return res.status(200).json({ status: 'success', data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return fail(res, error, 'Failed to retrieve categories.');
  }
};

export const getCategory = async (req, res) => {
  try {
    const category = await getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found.' });
    }
    return res.status(200).json({ status: 'success', data: category });
  } catch (error) {
    console.error('Error fetching category:', error);
    return fail(res, error, 'Failed to retrieve category.');
  }
};

export const createCategory = async (req, res) => {
  try {
    const errors = validateCategoryPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: errors[0], errors });
    }
    const category = await createCategoryRecord(req.body);
    return res.status(201).json({ status: 'success', message: 'Category created successfully.', data: category });
  } catch (error) {
    console.error('Error creating category:', error);
    return fail(res, error, 'Failed to create category.');
  }
};

export const updateCategory = async (req, res) => {
  try {
    const errors = validateCategoryPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: errors[0], errors });
    }
    const category = await updateCategoryRecord(req.params.id, req.body);
    return res.status(200).json({ status: 'success', message: 'Category updated successfully.', data: category });
  } catch (error) {
    console.error('Error updating category:', error);
    return fail(res, error, 'Failed to update category.');
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await deleteCategoryRecord(req.params.id);
    return res.status(200).json({ status: 'success', message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return fail(res, error, 'Failed to delete category.');
  }
};
