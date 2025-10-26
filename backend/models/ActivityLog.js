const mongoose = require('mongoose');

/**
 * ACTIVITY LOG MODEL
 * Lưu trữ tất cả hoạt động của user trong hệ thống
 * 
 * Mục đích:
 * - Theo dõi hoạt động người dùng
 * - Phát hiện hành vi đáng nghi
 * - Audit trail cho bảo mật
 * - Phân tích hành vi người dùng
 */

const activityLogSchema = new mongoose.Schema({
  // User thực hiện hành động (có thể null cho guest)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Loại hành động được thực hiện
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'login_success',
      'login_failed',
      'logout',
      'logout_all',
      'register_success',
      'register_failed',
      
      // Password actions
      'forgot_password_success',
      'forgot_password_failed',
      'password_reset_success',
      'password_reset_failed',
      'password_change',
      
      // Token actions
      'refresh_token',
      'token_expired',
      'invalid_token',
      
      // Profile actions
      'profile_view',
      'profile_update',
      'avatar_upload',
      
      // Admin actions
      'admin_action',
      'user_created',
      'user_updated',
      'user_deleted',
      
      // Security actions
      'rate_limit_exceeded',
      'suspicious_activity',
      'brute_force_detected',
      'account_locked'
    ]
  },
  
  // IP address của client
  ip: {
    type: String,
    required: true,
    index: true
  },
  
  // User-Agent string
  userAgent: {
    type: String,
    default: 'unknown'
  },
  
  // Thời gian thực hiện hành động
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Mức độ rủi ro của hành động
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  
  // Thông tin bổ sung tùy theo action
  email: String,           // Email trong login/register attempts
  success: Boolean,        // Kết quả của hành động
  statusCode: Number,      // HTTP status code
  errorMessage: String,    // Thông báo lỗi nếu có
  additionalData: {        // Dữ liệu bổ sung
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: false, // Sử dụng timestamp tự định nghĩa
  versionKey: false
});

// INDEXES cho performance
activityLogSchema.index({ userId: 1, timestamp: -1 }); // User activity history
activityLogSchema.index({ ip: 1, timestamp: -1 });     // IP-based analysis  
activityLogSchema.index({ action: 1, timestamp: -1 }); // Action-based queries
activityLogSchema.index({ riskLevel: 1, timestamp: -1 }); // Risk analysis

// TTL index - tự động xóa logs cũ hơn 90 ngày
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// STATIC METHODS cho queries thông dụng

/**
 * Lấy các hoạt động gần đây
 */
activityLogSchema.statics.getRecentActivities = function(userId = null, ip = null, limit = 50) {
  const filter = {};
  if (userId) filter.userId = userId;
  if (ip) filter.ip = ip;
  
  return this.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'name email')
    .lean();
};

/**
 * Lấy số lượng login thất bại từ IP trong khoảng thời gian
 */
activityLogSchema.statics.getFailedLoginsByIP = function(ip, minutesAgo = 15) {
  const timeThreshold = new Date(Date.now() - minutesAgo * 60 * 1000);
  
  return this.countDocuments({
    ip: ip,
    action: 'login_failed',
    timestamp: { $gte: timeThreshold }
  });
};

/**
 * Lấy số lượng login thất bại của user trong khoảng thời gian
 */
activityLogSchema.statics.getFailedLoginsByUser = function(userId, minutesAgo = 15) {
  const timeThreshold = new Date(Date.now() - minutesAgo * 60 * 1000);
  
  return this.countDocuments({
    userId: userId,
    action: 'login_failed',
    timestamp: { $gte: timeThreshold }
  });
};

/**
 * Lấy thống kê login trong khoảng thời gian
 */
activityLogSchema.statics.getLoginStats = function(startDate = null) {
  const matchStage = {
    action: { $in: ['login_success', 'login_failed'] }
  };
  
  if (startDate) {
    matchStage.timestamp = { $gte: startDate };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        uniqueIPs: { $addToSet: '$ip' },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        action: '$_id',
        count: 1,
        uniqueIPCount: { $size: '$uniqueIPs' },
        uniqueUserCount: { 
          $size: {
            $filter: {
              input: '$uniqueUsers',
              cond: { $ne: ['$$this', null] }
            }
          }
        }
      }
    }
  ]);
};

/**
 * Phát hiện hoạt động đáng nghi từ IP
 */
activityLogSchema.statics.getSuspiciousActivityByIP = function(ip, hoursAgo = 24) {
  const timeThreshold = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        ip: ip,
        timestamp: { $gte: timeThreshold }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $match: {
        $or: [
          { _id: 'login_failed', count: { $gte: 5 } },
          { _id: 'rate_limit_exceeded', count: { $gte: 1 } },
          { _id: 'suspicious_activity', count: { $gte: 1 } }
        ]
      }
    }
  ]);
};

/**
 * Lấy top IPs có nhiều hoạt động nhất
 */
activityLogSchema.statics.getTopActiveIPs = function(limit = 10, hoursAgo = 24) {
  const timeThreshold = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: timeThreshold }
      }
    },
    {
      $group: {
        _id: '$ip',
        totalActivities: { $sum: 1 },
        uniqueActions: { $addToSet: '$action' },
        lastActivity: { $max: '$timestamp' },
        failedLogins: {
          $sum: { $cond: [{ $eq: ['$action', 'login_failed'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        ip: '$_id',
        totalActivities: 1,
        actionCount: { $size: '$uniqueActions' },
        lastActivity: 1,
        failedLogins: 1,
        riskScore: {
          $add: [
            { $multiply: ['$failedLogins', 2] }, // Failed logins count double
            { $divide: ['$totalActivities', 10] } // Total activity normalized
          ]
        }
      }
    },
    { $sort: { riskScore: -1, totalActivities: -1 } },
    { $limit: limit }
  ]);
};

// MIDDLEWARE để tự động assign risk level
activityLogSchema.pre('save', function(next) {
  // Auto-assign risk level based on action
  const highRiskActions = [
    'login_failed', 'brute_force_detected', 'rate_limit_exceeded',
    'suspicious_activity', 'account_locked', 'invalid_token'
  ];
  
  const mediumRiskActions = [
    'forgot_password_success', 'password_reset_success',
    'password_change', 'logout_all', 'admin_action'
  ];
  
  if (highRiskActions.includes(this.action)) {
    this.riskLevel = 'high';
  } else if (mediumRiskActions.includes(this.action)) {
    this.riskLevel = 'medium';
  } else {
    this.riskLevel = 'low';
  }
  
  next();
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
