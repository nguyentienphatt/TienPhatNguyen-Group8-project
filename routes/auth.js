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
router.post('/login', logLoginAttempt, login); // Tạm thời disable rate limiting

/**
 * GET /auth/seed-users - Tạo users test với mật khẩu 123456
 */
router.get('/seed-users', async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Xóa users cũ
    await User.deleteMany({});
    
    // Tạo users mới
    const users = [
      { name: 'Admin User', email: 'admin@example.com', password: '123456', role: 'admin' },
      { name: 'Regular User', email: 'user@example.com', password: '123456', role: 'user' }
    ];
    
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
    }
    
    res.json({ 
      message: 'Seed completed!', 
      users: [
        'admin@example.com / 123456 (admin)',
        'user@example.com / 123456 (user)'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

// =================================
// 🚀 ACTIVITY 6: REDUX & PROTECTED ROUTES APIs
// =================================

/**
 * POST /auth/verify-token - Verify if token is valid (for Redux state management)
 * Header: Authorization: Bearer <token>
 * Returns: { valid: true, user: {...} } or { valid: false }
 */
router.post('/verify-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.json({
        valid: false,
        message: 'No token provided'
      });
    }

    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.json({
        valid: false,
        message: 'User not found'
      });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: 'Token is valid'
    });
  } catch (error) {
    res.json({
      valid: false,
      message: 'Invalid token',
      error: error.message
    });
  }
});

/**
 * POST /auth/refresh-token - Refresh access token (for Redux persistence)
 * Body: { refreshToken }
 * Returns: { accessToken, refreshToken } or error
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const jwt = require('jsonwebtoken');
    const RefreshToken = require('../models/RefreshToken');
    
    // Find refresh token in database
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken }).populate('user');
    
    if (!tokenDoc) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    // Check if token is expired
    if (tokenDoc.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: tokenDoc.user._id, email: tokenDoc.user.email, role: tokenDoc.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: tokenDoc.user._id,
        name: tokenDoc.user.name,
        email: tokenDoc.user.email,
        role: tokenDoc.user.role
      },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
});

/**
 * GET /auth/user-profile - Enhanced profile endpoint for Redux state
 * Header: Authorization: Bearer <token>
 * Returns: Complete user profile with permissions
 */
router.get('/user-profile', requireAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user permissions based on role
    const permissions = {
      canViewAdmin: user.role === 'admin',
      canEditUsers: user.role === 'admin',
      canViewLogs: user.role === 'admin',
      canAccessProfile: true
    };

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        permissions
      },
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

/**
 * GET /auth/check-admin - Check if user has admin access (for protected routes)
 * Header: Authorization: Bearer <token>
 */
router.get('/check-admin', requireAuth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    
    res.json({
      success: true,
      isAdmin,
      role: req.user.role,
      message: isAdmin ? 'Admin access granted' : 'User access only'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking admin status',
      error: error.message
    });
  }
});

module.exports = router;