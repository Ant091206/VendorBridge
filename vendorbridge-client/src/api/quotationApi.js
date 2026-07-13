import axiosInstance from './axios';

/**
 * Submit a new quotation as a vendor (payload contains core fields and nested items).
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
 * Delete a quotation (only draft status for vendor, any status for admin).
 */
export const deleteQuotation = async (id) => {
  try {
    const response = await axiosInstance.delete(`/quotations/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to delete quotation ID: ${id}`);
  }
};

/**
 * Submit a draft quotation.
 */
export const submitQuotationStatus = async (id) => {
  try {
    const response = await axiosInstance.patch(`/quotations/${id}/submit`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to submit quotation ID: ${id}`);
  }
};

/**
 * Withdraw an active quotation.
 */
export const withdrawQuotationStatus = async (id) => {
  try {
    const response = await axiosInstance.patch(`/quotations/${id}/withdraw`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to withdraw quotation ID: ${id}`);
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
export const getAllQuotations = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/quotations', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to fetch global quotations list.');
  }
};

// ── Sub-resource: Items ──
export const addQuotationItem = async (quotationId, item) => {
  try {
    const response = await axiosInstance.post(`/quotations/${quotationId}/items`, item);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to add quotation item.');
  }
};

export const updateQuotationItem = async (itemId, item) => {
  try {
    const response = await axiosInstance.put(`/quotation-items/${itemId}`, item);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to update quotation item ID: ${itemId}`);
  }
};

export const deleteQuotationItem = async (itemId) => {
  try {
    const response = await axiosInstance.delete(`/quotation-items/${itemId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to delete quotation item ID: ${itemId}`);
  }
};

// ── Sub-resource: Attachments ──
export const uploadQuotationAttachment = async (quotationId, formData) => {
  try {
    const response = await axiosInstance.post(`/quotations/${quotationId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to upload quotation attachment.');
  }
};

export const deleteQuotationAttachment = async (attachmentId) => {
  try {
    const response = await axiosInstance.delete(`/quotation-attachments/${attachmentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to delete attachment ID: ${attachmentId}`);
  }
};
