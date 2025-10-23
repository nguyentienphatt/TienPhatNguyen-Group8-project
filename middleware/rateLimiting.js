const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');
const ActivityLog = require('../models/ActivityLog');

/**
 * GENERAL RATE LIMITING
 * Rate limit chung cho toàn bộ ứng dụng
 */
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * LOGIN RATE LIMITING
 * Giới hạn số lần đăng nhập từ cùng IP
 */
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes.',
    retryAfter: '15 minutes',
    attempts: 5
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Store in MongoDB for persistence across server restarts
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'rate_limit_login',
    expireTimeMs: 15 * 60 * 1000,
  }),
  // Custom key generator - combine IP and action
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `login_${ip}`;
  },
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    console.log(`🚫 Login rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'You have exceeded the maximum number of login attempts. Please try again after 15 minutes.',
      retryAfter: '15 minutes',
      maxAttempts: 5
    });
  }
});

/**
 * PASSWORD RESET RATE LIMITING
 * Giới hạn số lần yêu cầu reset password
 */
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts from this IP, please try again after 1 hour.',
    retryAfter: '1 hour',
    attempts: 3
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'rate_limit_password_reset',
    expireTimeMs: 60 * 60 * 1000,
  }),
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `password_reset_${ip}`;
  },
  handler: (req, res) => {
    console.log(`🚫 Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many password reset attempts',
      message: 'You have exceeded the maximum number of password reset attempts. Please try again after 1 hour.',
      retryAfter: '1 hour',
      maxAttempts: 3
    });
  }
});

/**
 * BRUTE FORCE PROTECTION
 * Bảo vệ khỏi brute force attacks với progressive lockout
 */
const bruteForceProtection = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const email = req.body.email;
    
    // Check recent failed login attempts for this IP
    const recentFailures = await ActivityLog.getFailedLoginsByIP(ip, 15); // last 15 minutes
    
    // Progressive lockout based on failed attempts
    if (recentFailures >= 10) {
      console.log(`🛑 Brute force protection: IP ${ip} blocked (${recentFailures} failures)`);
      return res.status(429).json({
        error: 'Account temporarily locked',
        message: 'Too many failed login attempts. Your IP has been temporarily blocked for security reasons.',
        lockoutTime: '1 hour',
        attempts: recentFailures
      });
    }
    
    if (recentFailures >= 5) {
      // Add delay for suspicious activity
      console.log(`⚠️ Brute force protection: Adding delay for IP ${ip} (${recentFailures} failures)`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    }
    
    // Check if specific user account should be locked
    if (email) {
      const User = require('../models/User');
      const user = await User.findOne({ email });
      
      if (user) {
        const userFailures = await ActivityLog.find({
          userId: user._id,
          action: 'login_failed',
          timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
        }).countDocuments();
        
        if (userFailures >= 5) {
          console.log(`🔒 User account protection: ${email} temporarily locked (${userFailures} failures)`);
          return res.status(423).json({
            error: 'Account temporarily locked',
            message: 'This account has been temporarily locked due to multiple failed login attempts. Please try again later or reset your password.',
            lockoutTime: '15 minutes',
            userAttempts: userFailures
          });
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Brute force protection error:', error);
    // Continue with request if protection check fails
    next();
  }
};

/**
 * ADAPTIVE RATE LIMITING
 * Rate limiting thích ứng dựa trên hành vi người dùng
 */
const adaptiveRateLimit = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Get recent activity for this IP
    const recentActivity = await ActivityLog.getRecentActivities(null, ip, 100); // last 100 activities
    
    // Calculate suspicious activity score
    let suspiciousScore = 0;
    
    const failedLogins = recentActivity.filter(a => a.action === 'login_failed').length;
    const totalActivities = recentActivity.length;
    
    if (failedLogins > 3) suspiciousScore += 2;
    if (totalActivities > 50) suspiciousScore += 1; // Too many requests
    
    // Apply stricter limits for suspicious IPs
    if (suspiciousScore >= 2) {
      const strictLimit = rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 10, // strict limit
        message: {
          error: 'Suspicious activity detected',
          message: 'Your activity has been flagged as suspicious. Please slow down your requests.',
          retryAfter: '5 minutes'
        },
        keyGenerator: () => `suspicious_${ip}`,
        handler: (req, res) => {
          console.log(`🚨 Suspicious activity rate limit exceeded for IP: ${ip}`);
          res.status(429).json({
            error: 'Suspicious activity detected',
            message: 'Your activity has been flagged as suspicious. Please slow down your requests.',
            retryAfter: '5 minutes',
            suspiciousScore
          });
        }
      });
      
      return strictLimit(req, res, next);
    }
    
    next();
  } catch (error) {
    console.error('❌ Adaptive rate limiting error:', error);
    next();
  }
};

/**
 * REGISTRATION RATE LIMITING
 * Giới hạn số lần đăng ký từ cùng IP
 */
const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 registration attempts per hour
  message: {
    error: 'Too many registration attempts from this IP, please try again after 1 hour.',
    retryAfter: '1 hour',
    attempts: 5
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'rate_limit_registration',
    expireTimeMs: 60 * 60 * 1000,
  }),
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `registration_${ip}`;
  },
  handler: (req, res) => {
    console.log(`🚫 Registration rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many registration attempts',
      message: 'You have exceeded the maximum number of registration attempts. Please try again after 1 hour.',
      retryAfter: '1 hour',
      maxAttempts: 5
    });
  }
});

/**
 * API RATE LIMITING
 * Rate limiting cho API endpoints
 */
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 API requests per windowMs
  message: {
    error: 'Too many API requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'rate_limit_api',
    expireTimeMs: 15 * 60 * 1000,
  }),
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `api_${ip}`;
  }
});

module.exports = {
  generalRateLimit,
  loginRateLimit,
  passwordResetRateLimit,
  bruteForceProtection,
  adaptiveRateLimit,
  registrationRateLimit,
  apiRateLimit
};
