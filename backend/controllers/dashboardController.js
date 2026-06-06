import {
  getAdminDashboardData,
  getOfficerDashboardData,
  getManagerDashboardData,
  getVendorDashboardData
} from '../services/dashboardService.js';

const sendDashboard = async (req, res, role, loader) => {
  try {
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden: ${role} dashboard access is not permitted for this account.`
      });
    }

    const data = await loader(req.user);
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error(`Dashboard ${role} load error:`, error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to load dashboard data.'
    });
  }
};

export const getAdminDashboard = (req, res) => {
  return sendDashboard(req, res, 'admin', getAdminDashboardData);
};

export const getOfficerDashboard = (req, res) => {
  return sendDashboard(req, res, 'officer', getOfficerDashboardData);
};

export const getManagerDashboard = (req, res) => {
  return sendDashboard(req, res, 'manager', getManagerDashboardData);
};

export const getVendorDashboard = (req, res) => {
  return sendDashboard(req, res, 'vendor', getVendorDashboardData);
};
