import axiosInstance from './axios';

/**
 * Reports & Analytics API Functions
 * Provides client-side access to all reporting endpoints.
 */

/**
 * Fetch all KPI dashboard statistics in one call.
 */
export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get('/reports/dashboard-stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve dashboard statistics.');
  }
};

/**
 * Fetch monthly spending breakdown.
 * @param {number} year - Target year (defaults to current year on server)
 */
export const getMonthlySpending = async (year) => {
  try {
    const response = await axiosInstance.get('/reports/monthly-spending', {
      params: year ? { year } : {}
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve monthly spending data.');
  }
};

/**
 * Fetch vendor performance metrics.
 */
export const getVendorPerformance = async () => {
  try {
    const response = await axiosInstance.get('/reports/vendor-performance');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve vendor performance data.');
  }
};

/**
 * Fetch RFQ conversion analytics.
 */
export const getRFQAnalytics = async () => {
  try {
    const response = await axiosInstance.get('/reports/rfq-analytics');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve RFQ analytics.');
  }
};

/**
 * Fetch spending grouped by vendor category.
 */
export const getSpendingByCategory = async () => {
  try {
    const response = await axiosInstance.get('/reports/spending-by-category');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve category spending data.');
  }
};

/**
 * Fetch top 5 vendors by business value.
 */
export const getTopVendors = async () => {
  try {
    const response = await axiosInstance.get('/reports/top-vendors');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve top vendors.');
  }
};

/**
 * Export vendors list as CSV blob.
 */
export const exportVendors = async () => {
  try {
    const response = await axiosInstance.get('/reports/export/vendors', {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to export vendor data.');
  }
};

/**
 * Export purchase orders list as CSV blob.
 */
export const exportPurchaseOrders = async () => {
  try {
    const response = await axiosInstance.get('/reports/export/purchase-orders', {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to export purchase order data.');
  }
};

/**
 * Export invoices list as CSV blob.
 */
export const exportInvoices = async () => {
  try {
    const response = await axiosInstance.get('/reports/export/invoices', {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to export invoice data.');
  }
};

/**
 * Fetch executive summary reports.
 */
export const getSummaryReport = async () => {
  try {
    const response = await axiosInstance.get('/reports/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve summary report.');
  }
};

/**
 * Fetch vendor performance data.
 */
export const getVendorsReport = async () => {
  try {
    const response = await axiosInstance.get('/reports/vendors');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve vendor performance report.');
  }
};

/**
 * Fetch monthly spending report.
 */
export const getSpendingReport = async (year) => {
  try {
    const response = await axiosInstance.get('/reports/spending', {
      params: year ? { year } : {}
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve spending report.');
  }
};

/**
 * Fetch RFQ status breakdown.
 */
export const getRFQStatusAnalytics = async () => {
  try {
    const response = await axiosInstance.get('/reports/rfq-status');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve RFQ status analytics.');
  }
};

/**
 * Fetch Approvals breakdown.
 */
export const getApprovalsAnalytics = async () => {
  try {
    const response = await axiosInstance.get('/reports/approvals');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve approvals analytics.');
  }
};

/**
 * Fetch monthly trend analysis.
 */
export const getMonthlyTrendsAnalytics = async () => {
  try {
    const response = await axiosInstance.get('/reports/monthly-trends');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve monthly trends analytics.');
  }
};

/**
 * Export CSV Report
 */
export const exportReportCSV = async (type, year) => {
  try {
    const response = await axiosInstance.get('/reports/export/csv', {
      params: { type, year },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to export CSV report.');
  }
};

/**
 * Export Excel Report
 */
export const exportReportExcel = async (type, year) => {
  try {
    const response = await axiosInstance.get('/reports/export/excel', {
      params: { type, year },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to export Excel report.');
  }
};

/**
 * Export PDF Report
 */
export const exportReportPDF = async (type, year) => {
  try {
    const response = await axiosInstance.get('/reports/export/pdf', {
      params: { type, year },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to export PDF report.');
  }
};
