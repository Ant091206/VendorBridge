import { listLogs, getLogById } from '../services/activityService.js';

/**
 * Activity Controller
 */

// GET /api/activity
export const getAllActivity = async (req, res) => {
  try {
    const { user_id, module, action, from, to, search, page, limit } = req.query;
    
    const logs = await listLogs({
      user_id,
      module,
      action,
      from,
      to,
      search,
      page,
      limit
    });

    return res.status(200).json({
      status: 'success',
      ...logs
    });
  } catch (error) {
    console.error('Error in getAllActivity controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve activity logs.'
    });
  }
};

// GET /api/activity/:id
export const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await getLogById(id);

    if (!log) {
      return res.status(404).json({
        status: 'error',
        message: 'Activity log entry not found.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: log
    });
  } catch (error) {
    console.error('Error in getActivityById controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve activity log detail.'
    });
  }
};
