import {
  createCategoryRecord,
  createVendorRecord,
  deleteCategoryRecord,
  deleteVendorRecord,
  getVendor,
  listCategories,
  listVendors,
  updateCategoryRecord,
  updateVendorRecord
} from '../services/vendorService.js';
import { validateCategoryPayload, validateVendorPayload } from '../validators/vendorValidator.js';

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

    const vendor = await updateVendorRecord(req.params.id, req.body, req.user);
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
    await deleteVendorRecord(req.params.id);
    return res.status(200).json({
      status: 'success',
      message: 'Vendor archived successfully.'
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return fail(res, error, 'Failed to archive vendor.');
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
