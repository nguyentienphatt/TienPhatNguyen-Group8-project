const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const requireAuth = require('../middleware/auth');
const { checkRole, requireAdmin } = require('../middleware/checkRole');

/**
 * ADMIN ACTIVITY LOG ROUTES
 * Quản lý và xem activity logs (chỉ admin)
 */

/**
 * GET /api/logs/activities
 * Lấy danh sách activity logs với pagination và filtering
 * Yêu cầu: Admin role
 */
router.get('/activities', requireAuth(), requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Filtering options
    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.ip) filter.ip = req.query.ip;
    if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
    
    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) filter.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.timestamp.$lte = new Date(req.query.endDate);
    }
    
    // Get logs with pagination
    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .lean();
    
    // Get total count for pagination
    const total = await ActivityLog.countDocuments(filter);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filter: filter
    });
    
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity logs',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/statistics
 * Lấy thống kê activity logs
 */
router.get('/statistics', requireAuth(), requireAdmin, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d'; // 1d, 7d, 30d
    let startDate;
    
    switch (timeRange) {
      case '1d':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Get login statistics
    const loginStats = await ActivityLog.getLoginStats(startDate);
    
    // Get activity count by action
    const actionStats = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get risk level distribution
    const riskStats = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);
    
    // Get top IPs by activity
    const ipStats = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: '$ip', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      timeRange,
      startDate,
      statistics: {
        login: loginStats,
        actions: actionStats,
        riskLevels: riskStats,
        topIPs: ipStats
      }
    });
    
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/suspicious
 * Lấy danh sách hoạt động đáng nghi
 */
router.get('/suspicious', requireAuth(), requireAdmin, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    let startDate;
    
    switch (timeRange) {
      case '1h':
        startDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }
    
    // Find suspicious activities
    const suspiciousActivities = await ActivityLog.find({
      timestamp: { $gte: startDate },
      $or: [
        { riskLevel: 'high' },
        { action: 'login_failed' },
        { action: 'suspicious_activity' }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .populate('userId', 'name email')
    .lean();
    
    // Group by IP for analysis
    const ipAnalysis = await ActivityLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          action: 'login_failed'
        }
      },
      {
        $group: {
          _id: '$ip',
          failedAttempts: { $sum: 1 },
          lastAttempt: { $max: '$timestamp' },
          emails: { $addToSet: '$email' }
        }
      },
      { $match: { failedAttempts: { $gte: 3 } } },
      { $sort: { failedAttempts: -1 } }
    ]);
    
    res.json({
      success: true,
      timeRange,
      startDate,
      suspiciousActivities,
      ipAnalysis
    });
    
  } catch (error) {
    console.error('Get suspicious activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suspicious activities',
      error: error.message
    });
  }
});

/**
 * DELETE /api/logs/cleanup
 * Dọn dẹp logs cũ (chỉ admin)
 */
router.delete('/cleanup', requireAuth(), requireAdmin, async (req, res) => {
  try {
    const daysOld = parseInt(req.query.days) || 90;
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old activity logs`,
      deletedCount: result.deletedCount,
      cutoffDate
    });
    
  } catch (error) {
    console.error('Cleanup logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up logs',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/export
 * Export logs to CSV format
 */
router.get('/export', requireAuth(), requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.startDate) filter.timestamp = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) {
      filter.timestamp = filter.timestamp || {};
      filter.timestamp.$lte = new Date(req.query.endDate);
    }
    
    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(1000) // Limit for performance
      .populate('userId', 'name email')
      .lean();
    
    // Convert to CSV format
    const csvHeader = 'Timestamp,User ID,User Email,Action,IP,User Agent,Risk Level,Success,Additional Data\\n';
    const csvRows = logs.map(log => {
      const userData = log.userId ? `${log.userId._id},${log.userId.email}` : ',';
      const additionalData = JSON.stringify(log.additionalData || {}).replace(/"/g, '""');
      
      return `${log.timestamp.toISOString()},${userData},${log.action},${log.ip},"${log.userAgent}",${log.riskLevel},${log.success || ''},"${additionalData}"`;
    }).join('\\n');
    
    const csvContent = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="activity_logs_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Export logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting logs',
      error: error.message
    });
  }
});

module.exports = router;
