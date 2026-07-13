import axiosInstance from './axios';

/**
 * Fetch all purchase orders (officer, admin, manager).
 * @param {object} params - Optional query parameters (e.g. { page, limit, status, search, sort })
 */
export const getAllPOs = async (params) => {
  try {
    const response = await axiosInstance.get('/purchase-orders', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve purchase orders.');
  }
};

/**
 * Fetch purchase orders belonging to the logged-in vendor.
 * @param {object} params - Optional query parameters (e.g. { page, limit, status, search, sort })
 */
export const getVendorPOs = async (params) => {
  try {
    const response = await axiosInstance.get('/vendor/purchase-orders', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve vendor purchase orders.');
  }
};

/**
 * Fetch detailed information for a single purchase order.
 * @param {number|string} id - PO record ID
 */
export const getPOById = async (id) => {
  try {
    const response = await axiosInstance.get(`/purchase-orders/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to retrieve purchase order ID: ${id}`);
  }
};

/**
 * Fetch detailed information for a single purchase order (Vendor view).
 * @param {number|string} id - PO record ID
 */
export const getVendorPOById = async (id) => {
  try {
    const response = await axiosInstance.get(`/vendor/purchase-orders/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to retrieve vendor purchase order ID: ${id}`);
  }
};

/**
 * Create a new Purchase Order from an approved quotation/approval request.
 * @param {object} payload - PO details
 */
export const createPO = async (payload) => {
  try {
    const response = await axiosInstance.post('/purchase-orders', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to create purchase order.');
  }
};

/**
 * Update details of a Draft purchase order.
 * @param {number|string} id - PO record ID
 * @param {object} payload - PO updated details
 */
export const updatePO = async (id, payload) => {
  try {
    const response = await axiosInstance.put(`/purchase-orders/${id}`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to update purchase order ID: ${id}`);
  }
};

/**
 * Delete a Draft purchase order.
 * @param {number|string} id - PO record ID
 */
export const deletePO = async (id) => {
  try {
    const response = await axiosInstance.delete(`/purchase-orders/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to delete purchase order ID: ${id}`);
  }
};

/**
 * Issue a Draft purchase order to the vendor.
 * @param {number|string} id - PO record ID
 */
export const issuePO = async (id) => {
  try {
    const response = await axiosInstance.patch(`/purchase-orders/${id}/issue`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to issue purchase order ID: ${id}`);
  }
};

/**
 * Cancel a purchase order.
 * @param {number|string} id - PO record ID
 * @param {string} remarks - Cancellation reasons
 */
export const cancelPO = async (id, remarks) => {
  try {
    const response = await axiosInstance.patch(`/purchase-orders/${id}/cancel`, { remarks });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to cancel purchase order ID: ${id}`);
  }
};

/**
 * Acknowledge a purchase order (Vendor action).
 * @param {number|string} id - PO record ID
 * @param {string} remarks - Optional acknowledgement notes
 */
export const acknowledgePO = async (id, remarks) => {
  try {
    const response = await axiosInstance.patch(`/purchase-orders/${id}/acknowledge`, { remarks });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to acknowledge purchase order ID: ${id}`);
  }
};

/**
 * Manually update status of a purchase order to Partially Fulfilled / Fulfilled.
 * @param {number|string} id - PO record ID
 * @param {string} status - Target status ('Partially Fulfilled' or 'Fulfilled')
 * @param {string} remarks - Action remarks
 */
export const updatePOStatusManual = async (id, status, remarks) => {
  try {
    const response = await axiosInstance.patch(`/purchase-orders/${id}/status`, { status, remarks });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to update status for PO ID: ${id}`);
  }
};

/**
 * Fetch chronological timeline history for a purchase order.
 * @param {number|string} id - PO record ID
 */
export const getPOHistory = async (id) => {
  try {
    const response = await axiosInstance.get(`/purchase-orders/${id}/history`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to retrieve history for PO ID: ${id}`);
  }
};

/**
 * Legacy alias mapping for vendor order lists.
 */
export const getMyOrders = getVendorPOs;
