const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/checkRole');

// Import Activity Logging Middleware
const { 
  logLoginAttempt, 
  logRegister, 
  logForgotPassword, 
  logPasswordReset 
} = require('../middleware/logActivity');

// Import Rate Limiting Middleware
const { 
  loginRateLimit, 
  bruteForceProtection, 
  passwordResetRateLimit 
} = require('../middleware/rateLimiting');

const {
  register,
  login,
  getProfile,
  seedUsers,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

/**
 * POST /auth/register - Đăng ký user mới
 * Body: { name, email, password, role? }
 */
/**
 * POST /auth/test-login - Test login with rate limiting (simplified)
 */
router.post('/test-login', loginRateLimit, bruteForceProtection, (req, res) => {
  // Simplified login logic for testing
  const { email, password } = req.body || {};
  
  console.log('📧 Login attempt:', { email, password, body: req.body });
  
  // Simulate login logic
  if (email === "test@example.com" && password === "correct123") {
    res.json({
      success: true,
      message: "Login successful",
      user: { email, id: "test-user-123" },
      accessToken: "fake-token-for-testing"
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
      email: email || "unknown"
    });
  }
});

/**
 * POST /auth/test-rate-limit - Test rate limiting
 */
router.post('/test-rate-limit', loginRateLimit, (req, res) => {
  res.json({
    success: true,
    message: 'Rate limit test passed',
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
});

/**
 * GET /auth/view-logs - View activity logs (simplified for demo)
 */
router.get('/view-logs', async (req, res) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .select('userId action ip userAgent timestamp riskLevel email success statusCode')
      .lean();
    
    res.json({
      success: true,
      message: 'Activity Logs Retrieved',
      count: logs.length,
      logs: logs.map(log => ({
        action: log.action,
        timestamp: log.timestamp,
        ip: log.ip,
        riskLevel: log.riskLevel,
        email: log.email || 'N/A',
        success: log.success,
        userAgent: log.userAgent ? log.userAgent.substring(0, 50) + '...' : 'N/A'
      }))
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Error fetching logs',
      error: error.message,
      logs: []
    });
  }
});

router.post('/debug-register', (req, res) => {
  console.log('🔍 Debug register - req.body:', req.body);
  console.log('🔍 Debug register - req.headers:', req.headers);
  res.json({
    body: req.body,
    headers: req.headers,
    message: 'Debug register endpoint'
  });
});

router.post('/register', logRegister, register);

/**
 * POST /auth/login - Đăng nhập
 * Body: { email, password }
 */
router.post('/login', loginRateLimit, bruteForceProtection, logLoginAttempt, login);

/**
 * GET /auth/profile - Lấy thông tin profile user hiện tại (yêu cầu đăng nhập)
 * Header: Authorization: Bearer <token>
 */
router.get('/profile', requireAuth, getProfile);

/**
 * POST /auth/seed-users - Tạo users mẫu cho testing (dev-only)
 */
router.post('/seed-users', seedUsers);

/**
 * POST /auth/forgot-password - Gửi email reset password
 * Body: { email }
 */
router.post('/forgot-password', passwordResetRateLimit, logForgotPassword, forgotPassword);

/**
 * POST /auth/reset-password/:token - Reset password với token
 * Params: { token }
 * Body: { newPassword }
 */
router.post('/reset-password/:token', logPasswordReset, resetPassword);

module.exports = router;