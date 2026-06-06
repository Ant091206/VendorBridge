import axiosInstance from './axios';

/**
 * Generate a new invoice from a Purchase Order.
 * @param {number|string} poId - PO ID
 */
export const generateInvoice = async (poId) => {
  try {
    const response = await axiosInstance.post(`/invoices/generate/${poId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to generate invoice for PO ID: ${poId}`);
  }
};

/**
 * Fetch all invoices in the system.
 * @param {object} params - Optional search/filter parameters (e.g. { status: 'generated', search: 'INV-2026-0001' })
 */
export const getAllInvoices = async (params) => {
  try {
    const response = await axiosInstance.get('/invoices', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve invoices.');
  }
};

/**
 * Fetch detailed information for a single invoice.
 * @param {number|string} id - Invoice ID
 */
export const getInvoiceById = async (id) => {
  try {
    const response = await axiosInstance.get(`/invoices/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to retrieve invoice ID: ${id}`);
  }
};

/**
 * Download the generated invoice PDF as binary data.
 * @param {number|string} id - Invoice ID
 */
export const downloadPDF = async (id) => {
  try {
    const response = await axiosInstance.get(`/invoices/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data; // This returns the Blob directly
  } catch (error) {
    throw error.response?.data || new Error(`Failed to download invoice PDF for ID: ${id}`);
  }
};

/**
 * Dispatches the invoice PDF via email to the assigned vendor.
 * @param {number|string} id - Invoice ID
 */
export const sendInvoiceEmail = async (id) => {
  try {
    const response = await axiosInstance.post(`/invoices/${id}/send-email`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to email invoice ID: ${id}`);
  }
};

/**
 * Updates the invoice status (e.g., to 'paid').
 * @param {number|string} id - Invoice ID
 * @param {string} status - Target status ('sent' or 'paid')
 */
export const updateInvoiceStatus = async (id, status) => {
  try {
    const response = await axiosInstance.put(`/invoices/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to update status for invoice ID: ${id}`);
  }
};

/**
 * Fetch invoices belonging to the logged-in vendor supplier.
 */
export const getMyInvoices = async () => {
  try {
    const response = await axiosInstance.get('/invoices/vendor/my-invoices');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve vendor invoices.');
  }
};
