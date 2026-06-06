import {
  getSummary,
  getVendors,
  getSpending,
  generateCSV,
  generateExcel,
  generatePDF
} from '../services/reportService.js';

/**
 * Reports Controller
 */

// GET /api/reports/summary
export const getSummaryReport = async (req, res) => {
  try {
    const data = await getSummary(req.user);
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getSummaryReport controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve procurement summary.'
    });
  }
};

// GET /api/reports/vendors
export const getVendorsReport = async (req, res) => {
  try {
    const data = await getVendors(req.user);
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getVendorsReport controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve vendor performance data.'
    });
  }
};

// GET /api/reports/spending
export const getSpendingReport = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    const data = await getSpending(req.user, currentYear);
    
    return res.status(200).json({
      status: 'success',
      year: currentYear,
      data
    });
  } catch (error) {
    console.error('Error in getSpendingReport controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve spending report data.'
    });
  }
};

// GET /api/reports/export/csv
export const exportCSVReport = async (req, res) => {
  try {
    const { type, year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    if (!type) {
      return res.status(400).json({ status: 'error', message: 'Export report type is required.' });
    }

    const csvContent = await generateCSV(req.user, type, currentYear);
    const filename = `report-${type}-${currentYear}-${Date.now()}.csv`;

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
    const { type, year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    if (!type) {
      return res.status(400).json({ status: 'error', message: 'Export report type is required.' });
    }

    const excelContent = await generateExcel(req.user, type, currentYear);
    const filename = `report-${type}-${currentYear}-${Date.now()}.xls`;

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
    const { type, year } = req.query;
    const currentYear = year || new Date().getFullYear();

    if (!type) {
      return res.status(400).json({ status: 'error', message: 'Export report type is required.' });
    }

    const pdfBuffer = await generatePDF(req.user, type, currentYear);
    const filename = `report-${type}-${currentYear}-${Date.now()}.pdf`;

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
