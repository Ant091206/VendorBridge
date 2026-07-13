import {
  getRFQsReport,
  getQuotationsReport,
  getApprovalsReport,
  getPurchaseOrdersReport,
  getInvoicesReport,
  getVendorPerformanceReport,
  getAuditActivityReport,
  logReportExport,
  getExportHistory,
  generateCSV,
  generateExcel,
  generatePDF
} from '../services/reportService.js';
import { logActivity } from '../services/activityService.js';

/**
 * Reports Controller for Module 10
 */

// Helper to audit report access
function auditReportAccess(req, action, description) {
  logActivity(
    null,
    req.user.id,
    action,
    'Reports & Analytics',
    'report',
    0,
    description,
    req.ip,
    null,
    null,
    req.headers['user-agent']
  ).catch(err => console.error('[Audit Error] Failed to log report access:', err));
}

// GET /api/reports/vendors
export const getVendors = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getVendorPerformanceReport(req.user, filters);
    auditReportAccess(req, 'REPORT_VIEWED', 'User viewed Vendor Performance Report');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getVendors controller:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve vendor report.' });
  }
};

// GET /api/reports/rfqs
export const getRFQs = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getRFQsReport(req.user, filters);
    auditReportAccess(req, 'REPORT_VIEWED', 'User viewed RFQ Management Report');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getRFQs controller:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve RFQ report.' });
  }
};

// GET /api/reports/quotations
export const getQuotations = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getQuotationsReport(req.user, filters);
    auditReportAccess(req, 'REPORT_VIEWED', 'User viewed Quotation Response Report');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getQuotations controller:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve quotation report.' });
  }
};

// GET /api/reports/approvals
export const getApprovals = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getApprovalsReport(req.user, filters);
    auditReportAccess(req, 'REPORT_VIEWED', 'User viewed Approvals Workflow Report');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getApprovals controller:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve approvals report.' });
  }
};

// GET /api/reports/purchase-orders
export const getPurchaseOrders = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getPurchaseOrdersReport(req.user, filters);
    auditReportAccess(req, 'REPORT_VIEWED', 'User viewed Purchase Order Status Report');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getPurchaseOrders controller:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve PO report.' });
  }
};

// GET /api/reports/invoices
export const getInvoices = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getInvoicesReport(req.user, filters);
    auditReportAccess(req, 'REPORT_VIEWED', 'User viewed Invoice Payments Report');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getInvoices controller:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve invoice report.' });
  }
};

// GET /api/reports/spending
export const getSpending = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getSpendingReport(req.user, filters);
    auditReportAccess(req, 'REPORT_VIEWED', 'User viewed Spending Analysis Report');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getSpending controller:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve spending report.' });
  }
};

// GET /api/reports/procurement-summary
export const getProcurementSummary = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getSummaryReport(req.user, filters);
    auditReportAccess(req, 'REPORT_VIEWED', 'User viewed Executive Procurement Summary Report');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getProcurementSummary controller:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve summary report.' });
  }
};

// GET /api/reports/audit-activity
export const getAuditActivity = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getAuditActivityReport(req.user, filters);
    auditReportAccess(req, 'REPORT_VIEWED', 'User viewed System Activity Audit Log Report');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getAuditActivity controller:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve audit activity report.' });
  }
};

// GET /api/reports/history
export const getHistory = async (req, res) => {
  try {
    const data = await getExportHistory(req.user.id);
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getHistory controller:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve export history.' });
  }
};

// ── DEPRECATED BACKEND ROUTE HANDLERS (for compatibility) ──
export const getSummaryReport = getProcurementSummary;
export const getVendorsReport = getVendors;
export const getSpendingReport = getSpending;

// GET /api/reports/export/csv
export const exportCSVReport = async (req, res) => {
  try {
    const { type, ...filters } = req.query;
    if (!type) {
      return res.status(400).json({ status: 'error', message: 'Export report type is required.' });
    }

    const csvContent = await generateCSV(req.user, type, filters);
    const filename = `report-${type}-${Date.now()}.csv`;

    await logReportExport(req.user.id, type, 'csv', filters, filename);
    auditReportAccess(req, 'REPORT_DOWNLOADED', `User exported ${type} report in CSV format`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Error in exportCSVReport controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to export CSV report.'
    });
  }
};

// GET /api/reports/export/excel
export const exportExcelReport = async (req, res) => {
  try {
    const { type, ...filters } = req.query;
    if (!type) {
      return res.status(400).json({ status: 'error', message: 'Export report type is required.' });
    }

    const excelContent = await generateExcel(req.user, type, filters);
    const filename = `report-${type}-${Date.now()}.xls`;

    await logReportExport(req.user.id, type, 'excel', filters, filename);
    auditReportAccess(req, 'REPORT_DOWNLOADED', `User exported ${type} report in Excel format`);

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(excelContent);
  } catch (error) {
    console.error('Error in exportExcelReport controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to export Excel report.'
    });
  }
};

// GET /api/reports/export/pdf
export const exportPDFReport = async (req, res) => {
  try {
    const { type, ...filters } = req.query;
    if (!type) {
      return res.status(400).json({ status: 'error', message: 'Export report type is required.' });
    }

    const pdfBuffer = await generatePDF(req.user, type, filters);
    const filename = `report-${type}-${Date.now()}.pdf`;

    await logReportExport(req.user.id, type, 'pdf', filters, filename);
    auditReportAccess(req, 'REPORT_DOWNLOADED', `User exported ${type} report in PDF format`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error in exportPDFReport controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to export PDF report.'
    });
  }
};
