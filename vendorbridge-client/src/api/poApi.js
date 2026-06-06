import axiosInstance from './axios';

/**
 * Fetch all purchase orders (officer, admin, manager).
 * @param {object} params - Optional search/filter parameters (e.g. { status: 'generated', search: 'PO-2026-0001' })
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
 * Update the status of a purchase order (generated -> sent -> completed).
 * @param {number|string} id - PO record ID
 * @param {string} status - Target status ('sent' or 'completed')
 */
export const updatePOStatus = async (id, status) => {
  try {
    const response = await axiosInstance.put(`/purchase-orders/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to update status for PO ID: ${id}`);
  }
};

/**
 * Fetch purchase orders belonging to the logged-in vendor.
 */
export const getMyOrders = async () => {
  try {
    const response = await axiosInstance.get('/purchase-orders/vendor/my-orders');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve vendor purchase orders.');
  }
};
