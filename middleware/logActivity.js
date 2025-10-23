const ActivityLog = require('../models/ActivityLog');

/**
 * CORE LOGGING FUNCTION
 * Tạo log cho user activity với đầy đủ thông tin context
 */
const logActivity = async (userId, action, req, additionalData = {}) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    const logData = {
      userId: userId || null,
      action,
      ip,
      userAgent,
      timestamp: new Date(),
      ...additionalData
    };

    await ActivityLog.create(logData);
    console.log(`📝 Activity logged: ${action} from ${ip}`);
  } catch (error) {
    console.error('❌ Activity logging error:', error);
    // Don't throw - logging should not break the main flow
  }
};

/**
 * MIDDLEWARE FACTORY
 * Tạo middleware cho từng loại action cụ thể
 */
const createLogMiddleware = (action) => {
  return async (req, res, next) => {
    try {
      // Extract user ID from various sources
      let userId = null;
      
      // From JWT token in Authorization header
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const jwt = require('../utils/jwt');
          const decoded = jwt.verifyAccessToken(token);
          userId = decoded.userId;
        } catch (jwtError) {
          // Token invalid or expired - continue without userId
        }
      }
      
      // From request body (for login/register)
      if (!userId && req.body && req.body.email) {
        const User = require('../models/User');
        try {
          const user = await User.findOne({ email: req.body.email });
          if (user) userId = user._id;
        } catch (userError) {
          // User not found - continue without userId
        }
      }
      
      // Log the activity
      await logActivity(userId, action, req);
      
      next();
    } catch (error) {
      console.error(`❌ ${action} logging middleware error:`, error);
      // Continue with request even if logging fails
      next();
    }
  };
};

/**
 * SPECIFIC ACTION MIDDLEWARES
 * Middleware cho từng hành động cụ thể
 */

// Login attempt logging
const logLoginAttempt = async (req, res, next) => {
  try {
    const { email } = req.body;
    let userId = null;
    
    if (email) {
      try {
        const User = require('../models/User');
        const user = await User.findOne({ email });
        userId = user ? user._id : null;
      } catch (error) {
        // Continue without userId if user lookup fails
      }
    }
    
    // Store original res.json to capture login result
    const originalJson = res.json;
    res.json = function(data) {
      // Determine if login was successful
      const success = data && (data.success !== false) && (data.accessToken || data.token);
      const action = success ? 'login_success' : 'login_failed';
      
      // Log the result asynchronously
      setImmediate(async () => {
        try {
          await logActivity(userId, action, req, {
            email,
            success,
            statusCode: res.statusCode
          });
        } catch (error) {
          console.error('❌ Login result logging error:', error);
        }
      });
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    console.error('❌ Login attempt logging middleware error:', error);
    next();
  }
};

// Register logging
const logRegister = async (req, res, next) => {
  try {
    const { email, name } = req.body || {};
    
    // Store original res.json to capture registration result
    const originalJson = res.json;
    res.json = function(data) {
      // Determine if registration was successful
      const success = data && (data.success !== false) && !data.error;
      const action = success ? 'register_success' : 'register_failed';
      
      // Log the result asynchronously
      setImmediate(async () => {
        try {
          let userId = null;
          if (success && data.user && data.user.id) {
            userId = data.user.id;
          }
          
          await logActivity(userId, action, req, {
            email: email || 'unknown',
            name: name || 'unknown',
            success,
            statusCode: res.statusCode
          });
        } catch (error) {
          console.error('❌ Register result logging error:', error);
        }
      });
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    console.error('❌ Register logging middleware error:', error);
    next();
  }
};

// Forgot password logging
const logForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    let userId = null;
    
    if (email) {
      try {
        const User = require('../models/User');
        const user = await User.findOne({ email });
        userId = user ? user._id : null;
      } catch (error) {
        // Continue without userId
      }
    }
    
    // Store original res.json to capture result
    const originalJson = res.json;
    res.json = function(data) {
      const success = data && (data.success !== false) && !data.error;
      const action = success ? 'forgot_password_success' : 'forgot_password_failed';
      
      // Log the result asynchronously
      setImmediate(async () => {
        try {
          await logActivity(userId, action, req, {
            email,
            success,
            statusCode: res.statusCode
          });
        } catch (error) {
          console.error('❌ Forgot password result logging error:', error);
        }
      });
      
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    console.error('❌ Forgot password logging middleware error:', error);
    next();
  }
};

// Password reset logging
const logPasswordReset = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    // Store original res.json to capture result
    const originalJson = res.json;
    res.json = function(data) {
      const success = data && (data.success !== false) && !data.error;
      const action = success ? 'password_reset_success' : 'password_reset_failed';
      
      // Log the result asynchronously
      setImmediate(async () => {
        try {
          let userId = null;
          if (success && data.user && data.user.id) {
            userId = data.user.id;
          }
          
          await logActivity(userId, action, req, {
            token: token ? `${token.substring(0, 8)}...` : 'missing', // Only log partial token for security
            success,
            statusCode: res.statusCode
          });
        } catch (error) {
          console.error('❌ Password reset result logging error:', error);
        }
      });
      
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    console.error('❌ Password reset logging middleware error:', error);
    next();
  }
};

/**
 * UTILITY FUNCTIONS
 */

// Extract IP address with fallbacks
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         'unknown';
};

// Extract User Agent
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

module.exports = {
  logActivity,
  createLogMiddleware,
  logLoginAttempt,
  logRegister,
  logForgotPassword,
  logPasswordReset,
  getClientIP,
  getUserAgent
};
