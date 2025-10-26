const express = require('express');
const router = express.Router();

// Import Activity 6 Auth Middleware
const { 
  requireAuth, 
  requireAdmin, 
  requireRole,
  requireOwnershipOrAdmin,
  validateFields
} = require('../middleware/authActivity6');

/**
 * =================================
 * 🔒 ACTIVITY 6: PROTECTED ROUTES for Redux Testing
 * =================================
 * 
 * These routes are designed to test:
 * - Redux state management
 * - Protected route navigation
 * - Role-based access control
 * - Token validation
 */

/**
 * GET /protected/profile - User profile (requires login)
 * Any authenticated user can access
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('-password');
    
    res.json({
      success: true,
      message: 'Profile data retrieved',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        permissions: {
          canEditProfile: true,
          canViewAdmin: user.role === 'admin',
          canManageUsers: user.role === 'admin'
        }
      },
      route: '/protected/profile',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile',
      error: error.message
    });
  }
});

/**
 * GET /protected/admin - Admin dashboard (requires admin role)
 * Only admin users can access
 */
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const ActivityLog = require('../models/ActivityLog');
    
    // Get admin dashboard stats
    const [userCount, logCount, recentLogs] = await Promise.all([
      User.countDocuments(),
      ActivityLog.countDocuments(),
      ActivityLog.find()
        .sort({ timestamp: -1 })
        .limit(5)
        .select('action email timestamp ip riskLevel')
    ]);

    res.json({
      success: true,
      message: 'Admin dashboard data',
      data: {
        stats: {
          totalUsers: userCount,
          totalLogs: logCount,
          currentAdmin: req.user.name
        },
        recentActivity: recentLogs,
        permissions: {
          canManageUsers: true,
          canViewLogs: true,
          canAccessAllData: true
        }
      },
      route: '/protected/admin',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving admin data',
      error: error.message
    });
  }
});

/**
 * GET /protected/users - User management (admin only)
 * List all users for admin management
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Users list retrieved',
      data: {
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          isActive: true
        })),
        count: users.length
      },
      route: '/protected/users',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message
    });
  }
});

/**
 * GET /protected/dashboard - General dashboard (any authenticated user)
 * Dashboard data based on user role
 */
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    const ActivityLog = require('../models/ActivityLog');
    
    // Get user-specific data
    const userLogs = await ActivityLog.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('action timestamp ip success');

    const dashboardData = {
      user: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      activity: {
        recentActions: userLogs,
        totalActions: userLogs.length
      },
      navigation: {
        availableRoutes: [
          { name: 'Profile', path: '/profile', accessible: true },
          { name: 'Dashboard', path: '/dashboard', accessible: true },
          { name: 'Admin Panel', path: '/admin', accessible: req.user.role === 'admin' },
          { name: 'User Management', path: '/users', accessible: req.user.role === 'admin' }
        ]
      }
    };

    res.json({
      success: true,
      message: 'Dashboard data retrieved',
      data: dashboardData,
      route: '/protected/dashboard',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard data',
      error: error.message
    });
  }
});

/**
 * PUT /protected/profile - Update user profile
 * Users can update their own profile
 */
router.put('/profile', 
  requireAuth,
  validateFields(['name']),
  async (req, res) => {
    try {
      const User = require('../models/User');
      const { name } = req.body;
      
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { name },
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role
          }
        },
        route: '/protected/profile',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: error.message
      });
    }
  }
);

/**
 * GET /protected/test-routes - Test route accessibility
 * Returns which routes user can access based on role
 */
router.get('/test-routes', requireAuth, (req, res) => {
  const userRole = req.user.role;
  
  const routeTests = [
    {
      route: '/protected/profile',
      method: 'GET',
      accessible: true,
      reason: 'All authenticated users'
    },
    {
      route: '/protected/dashboard',
      method: 'GET', 
      accessible: true,
      reason: 'All authenticated users'
    },
    {
      route: '/protected/admin',
      method: 'GET',
      accessible: userRole === 'admin',
      reason: 'Admin role required'
    },
    {
      route: '/protected/users',
      method: 'GET',
      accessible: userRole === 'admin',
      reason: 'Admin role required'
    }
  ];

  res.json({
    success: true,
    message: 'Route accessibility test',
    data: {
      userRole,
      routeTests,
      accessibleRoutes: routeTests.filter(r => r.accessible).length,
      totalRoutes: routeTests.length
    },
    route: '/protected/test-routes',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;