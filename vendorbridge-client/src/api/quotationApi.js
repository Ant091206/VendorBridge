import axiosInstance from './axios';

/**
 * Submit a new quotation as a vendor.
 */
export const submitQuotation = async (data) => {
  try {
    const response = await axiosInstance.post('/quotations', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to submit quotation.');
  }
};

/**
 * Update parameters of an active quotation.
 */
export const updateQuotation = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/quotations/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to update quotation ID: ${id}`);
  }
};

/**
 * Fetch all quotations submitted by the logged-in vendor.
 */
export const getMyQuotations = async () => {
  try {
    const response = await axiosInstance.get('/quotations/my-quotations');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to fetch submitted quotations list.');
  }
};

/**
 * Fetch all quotations received for a specific RFQ.
 */
export const getQuotationsByRFQ = async (rfqId) => {
  try {
    const response = await axiosInstance.get(`/quotations/rfq/${rfqId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to retrieve quotations for RFQ ID: ${rfqId}`);
  }
};

/**
 * Fetch details for a single quotation.
 */
export const getQuotationById = async (id) => {
  try {
    const response = await axiosInstance.get(`/quotations/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to fetch quotation details for ID: ${id}`);
  }
};

/**
 * Select a quotation as winning, triggering approvals and deactivating alternatives.
 */
export const selectQuotation = async (id) => {
  try {
    const response = await axiosInstance.put(`/quotations/${id}/select`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to select winning quotation ID: ${id}`);
  }
};

/**
 * Fetch all quotations submitted in the ERP system.
 */
export const getAllQuotations = async () => {
  try {
    const response = await axiosInstance.get('/quotations');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to fetch global quotations list.');
  }
};

