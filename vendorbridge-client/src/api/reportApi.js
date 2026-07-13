import axiosInstance from './axios';

/**
 * Reports API Functions
 * Provides client-side access to all reporting and export endpoints in Module 10.
 */

// ── Reports Data Endpoints (staff roles only) ──

export const getVendorsReport = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/reports/vendors', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve vendors report.');
  }
};

export const getRFQsReport = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/reports/rfqs', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve RFQs report.');
  }
};

export const getQuotationsReport = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/reports/quotations', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve quotations report.');
  }
};

export const getApprovalsReport = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/reports/approvals', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve approvals report.');
  }
};

export const getPurchaseOrdersReport = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/reports/purchase-orders', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve purchase orders report.');
  }
};

export const getInvoicesReport = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/reports/invoices', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve invoices report.');
  }
};

export const getSpendingReport = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/reports/spending', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve spending report.');
  }
};

export const getSummaryReport = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/reports/procurement-summary', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve summary report.');
  }
};

export const getAuditActivityReport = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/reports/audit-activity', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve audit activity report.');
  }
};

// ── Export History ──

export const getExportHistory = async () => {
  try {
    const response = await axiosInstance.get('/reports/history');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve download history.');
  }
};

// ── Document Exports ──

export const exportReportCSV = async (type, filters = {}) => {
  try {
    const response = await axiosInstance.get('/reports/export/csv', {
      params: { type, ...filters },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to export CSV report.');
  }
};

export const exportReportExcel = async (type, filters = {}) => {
  try {
    const response = await axiosInstance.get('/reports/export/excel', {
      params: { type, ...filters },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to export Excel report.');
  }
};

export const exportReportPDF = async (type, filters = {}) => {
  try {
    const response = await axiosInstance.get('/reports/export/pdf', {
      params: { type, ...filters },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to export PDF report.');
  }
};

// ── Backward Compatibility Hooks ──
export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get('/reports/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve dashboard stats.');
  }
};

export const getMonthlySpending = async (year) => {
  try {
    const response = await axiosInstance.get('/reports/spending', { params: year ? { year } : {} });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve monthly spending.');
  }
};

export const getVendorPerformance = async () => {
  try {
    const response = await axiosInstance.get('/reports/vendors');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve vendor performance.');
  }
};
export const getRFQStatusAnalytics = getRFQsReport;
export const getApprovalsAnalytics = getApprovalsReport;
export const getMonthlyTrendsAnalytics = getSpendingReport;
export const getRFQAnalytics = getRFQsReport;
export const getSpendingByCategory = getSpendingReport;
export const getTopVendors = getVendorsReport;
export const exportVendors = () => exportReportCSV('vendors');
export const exportPurchaseOrders = () => exportReportCSV('purchase-orders');
export const exportInvoices = () => exportReportCSV('invoices');
