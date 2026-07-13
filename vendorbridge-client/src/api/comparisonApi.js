import api from './axios';

const unwrap = (response) => response.data;

/**
 * Fetch side-by-side comparison matrix of bids for a specific RFQ.
 * Protected: Admin, Officer, Manager
 */
export const getComparison = async (rfqId, params = {}) => {
  return unwrap(await api.get(`/comparisons/rfq/${rfqId}`, { params }));
};

/**
 * Log comparison view event when comparison dashboard is opened.
 * Protected: Admin, Officer
 */
export const logComparison = async (rfqId) => {
  return unwrap(await api.post(`/comparisons/rfq/${rfqId}`));
};

/**
 * Recommend/Select a quotation as the winner for the RFQ.
 * Protected: Admin, Officer
 */
export const recommendQuotation = async (rfqId, quotationId, reason) => {
  return unwrap(
    await api.post('/selections', {
      rfq_id: rfqId,
      quotation_id: quotationId,
      selection_reason: reason
    })
  );
};

/**
 * Fetch the selection recommendation for an RFQ.
 * Protected: Admin, Officer, Manager
 */
export const getSelectionByRFQ = async (rfqId) => {
  return unwrap(await api.get(`/selections/${rfqId}`));
};

/**
 * Update quotation selection status or reason.
 * Protected: Admin, Officer
 */
export const updateSelectionStatus = async (selectionId, status, payload = {}) => {
  return unwrap(
    await api.patch(`/selections/${selectionId}`, {
      status,
      selection_reason: payload.selection_reason
    })
  );
};

/**
 * Fetch comparison and selection history log for an RFQ.
 * Protected: Admin, Officer, Manager
 */
export const getComparisonHistory = async (rfqId) => {
  return unwrap(await api.get(`/comparisons/history/${rfqId}`));
};
