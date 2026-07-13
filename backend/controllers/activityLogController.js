import { listLogs, getLogById } from '../services/activityService.js';

/**
 * Activity Log Controller
 * Provides endpoints for viewing and filtering system-wide audit trail data.
 */

/**
 * GET /api/activity-logs
 * Returns all activity logs with optional filtering.
 * Protected: all authenticated roles (scopings apply).
 */
export const getAllLogs = async (req, res) => {
  try {
    const { user_id, role, entity_type, action, from, to, limit, page = 1, search, sort } = req.query;
    const user = req.user;

    const filters = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      search: search?.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
      action: action || undefined,
      entity_type: entity_type || undefined,
      role: role || undefined,
      sort: sort || undefined
    };

    // Scoping based on user role
    if (user.role === 'admin') {
      if (user_id) filters.user_id = user_id;
      if (req.query.module) filters.module = req.query.module;
    } else if (user.role === 'officer') {
      // Officers view activities for relevant modules
      filters.allowed_modules = ['Vendor Management', 'RFQ Management', 'Quotation Management', 'Quotation Comparison', 'Purchase Orders', 'Invoices'];
      if (user_id) filters.user_id = user_id;
      if (req.query.module) {
        if (filters.allowed_modules.includes(req.query.module)) {
          filters.module = req.query.module;
        } else {
          filters.module = 'NONE_ALLOWED';
        }
      }
    } else if (user.role === 'manager') {
      // Managers view activities for workflow modules
      filters.allowed_modules = ['Approval Workflow', 'Purchase Orders'];
      if (user_id) filters.user_id = user_id;
      if (req.query.module) {
        if (filters.allowed_modules.includes(req.query.module)) {
          filters.module = req.query.module;
        } else {
          filters.module = 'NONE_ALLOWED';
        }
      }
    } else if (user.role === 'vendor') {
      // Vendors view their own activity only
      filters.user_id = user.id;
    }

    const result = await listLogs(filters);

    return res.status(200).json({
      status: 'success',
      total: result.total,
      data: result.data,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve activity logs.'
    });
  }
};

/**
 * GET /api/activity-logs/recent
 * Returns the last 20 activity logs for dashboard feeds.
 * Scoped by role.
 */
export const getRecentLogs = async (req, res) => {
  try {
    const user = req.user;
    const filters = { limit: 20, page: 1 };

    if (user.role === 'officer') {
      filters.allowed_modules = ['Vendor Management', 'RFQ Management', 'Quotation Management', 'Quotation Comparison', 'Purchase Orders', 'Invoices'];
    } else if (user.role === 'manager') {
      filters.allowed_modules = ['Approval Workflow', 'Purchase Orders'];
    } else if (user.role === 'vendor') {
      filters.user_id = user.id;
    }

    const result = await listLogs(filters);

    return res.status(200).json({
      status: 'success',
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching recent activity logs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve recent activity logs.'
    });
  }
};

/**
 * GET /api/activity-logs/my-activity
 * Returns last 30 actions performed by the logged-in user.
 */
export const getMyActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await listLogs({ user_id: userId, limit: 30, page: 1 });

    return res.status(200).json({
      status: 'success',
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve your activity history.'
    });
  }
};

/**
 * GET /api/activity-logs/:id
 * Retrieve a specific log detail by ID (with authorization checks).
 */
export const getLogByIdController = async (req, res) => {
  try {
    const log = await getLogById(req.params.id);
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Activity log not found.' });
    }

    const user = req.user;

    // Authorization checks
    if (user.role === 'officer') {
      const allowed = ['Vendor Management', 'RFQ Management', 'Quotation Management', 'Quotation Comparison', 'Purchase Orders', 'Invoices'];
      if (log.module_name && !allowed.includes(log.module_name)) {
        return res.status(403).json({ status: 'error', message: 'Access denied to this activity log.' });
      }
    } else if (user.role === 'manager') {
      const allowed = ['Approval Workflow', 'Purchase Orders'];
      if (log.module_name && !allowed.includes(log.module_name)) {
        return res.status(403).json({ status: 'error', message: 'Access denied to this activity log.' });
      }
    } else if (user.role === 'vendor' && log.user_id !== user.id) {
      return res.status(403).json({ status: 'error', message: 'Access denied to this activity log.' });
    }

    return res.status(200).json({
      status: 'success',
      data: log
    });
  } catch (error) {
    console.error('Error fetching activity log detail:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve activity log detail.'
    });
  }
};

/**
 * GET /api/activity-logs/module/:module
 * Fetch activity logs for a specific module.
 */
export const getLogsByModule = async (req, res) => {
  try {
    const { module } = req.params;
    const { limit, page = 1 } = req.query;
    const user = req.user;

    const filters = {
      module,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    };

    // Role checks
    if (user.role === 'officer') {
      const allowed = ['Vendor Management', 'RFQ Management', 'Quotation Management', 'Quotation Comparison', 'Purchase Orders', 'Invoices'];
      if (!allowed.includes(module)) {
        return res.status(403).json({ status: 'error', message: 'Access denied to logs in this module.' });
      }
    } else if (user.role === 'manager') {
      const allowed = ['Approval Workflow', 'Purchase Orders'];
      if (!allowed.includes(module)) {
        return res.status(403).json({ status: 'error', message: 'Access denied to logs in this module.' });
      }
    } else if (user.role === 'vendor') {
      filters.user_id = user.id;
    }

    const result = await listLogs(filters);

    return res.status(200).json({
      status: 'success',
      total: result.total,
      data: result.data,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('Error fetching logs by module:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve logs by module.'
    });
  }
};
