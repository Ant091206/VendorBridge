import {
  getDashboardAnalytics,
  getProcurementAnalytics,
  getVendorAnalytics,
  getSpendingAnalytics,
  getApprovalAnalytics,
  getPurchaseOrderAnalytics,
  getInvoiceAnalytics,
  getTrendsAnalytics
} from '../services/analyticsService.js';
import { logActivity } from '../services/activityService.js';

/**
 * Analytics Controller
 */

// General function to audit access asynchronously
function auditAccess(req, action, description, entityType = 'analytics') {
  logActivity(
    null, // use default pool
    req.user.id,
    action,
    'Reports & Analytics',
    entityType,
    0, // general entityId
    description,
    req.ip,
    null,
    null,
    req.headers['user-agent']
  ).catch(err => console.error('[Audit Error] Failed to log analytics access:', err));
}

// GET /api/analytics/dashboard
export const getDashboard = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getDashboardAnalytics(req.user, filters);
    auditAccess(req, 'DASHBOARD_ACCESSED', 'User accessed Executive Dashboard', 'dashboard');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getDashboard controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve dashboard analytics.'
    });
  }
};

// GET /api/analytics/procurement
export const getProcurement = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getProcurementAnalytics(filters);
    auditAccess(req, 'ANALYTICS_VIEWED', 'User viewed Procurement Analytics');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getProcurement controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve procurement analytics.'
    });
  }
};

// GET /api/analytics/vendors
export const getVendors = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getVendorAnalytics(filters);
    auditAccess(req, 'ANALYTICS_VIEWED', 'User viewed Vendor Analytics');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getVendors controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve vendor performance analytics.'
    });
  }
};

// GET /api/analytics/spending
export const getSpending = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getSpendingAnalytics(filters);
    auditAccess(req, 'ANALYTICS_VIEWED', 'User viewed Spend Analytics');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getSpending controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve spending analytics.'
    });
  }
};

// GET /api/analytics/approvals
export const getApprovals = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getApprovalAnalytics(filters);
    auditAccess(req, 'ANALYTICS_VIEWED', 'User viewed Approval Workflow Analytics');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getApprovals controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve approvals workflow analytics.'
    });
  }
};

// GET /api/analytics/purchase-orders
export const getPurchaseOrders = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getPurchaseOrderAnalytics(filters);
    auditAccess(req, 'ANALYTICS_VIEWED', 'User viewed Purchase Order Analytics');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getPurchaseOrders controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve purchase order analytics.'
    });
  }
};

// GET /api/analytics/invoices
export const getInvoices = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getInvoiceAnalytics(filters);
    auditAccess(req, 'ANALYTICS_VIEWED', 'User viewed Invoice Analytics');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getInvoices controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve invoice analytics.'
    });
  }
};

// GET /api/analytics/trends
export const getTrends = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getTrendsAnalytics(filters);
    auditAccess(req, 'ANALYTICS_VIEWED', 'User viewed Procurement Trends Analysis');
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in getTrends controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve procurement trend data.'
    });
  }
};
