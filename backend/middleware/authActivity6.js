const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Enhanced Authentication Middleware for Activity 6 - Redux & Protected Routes
 * Supports better error handling and user data injection
 */

/**
 * Verify JWT token and inject user data into req.user
 * @param {boolean} required - Whether token is required
 */
const authenticateToken = (required = true) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      if (required) {
        return res.status(401).json({
          success: false,
          message: 'Access token required',
          code: 'NO_TOKEN'
        });
      }
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Inject user data into request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
        error: error.message
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
        error: error.message
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Authentication error',
        code: 'AUTH_ERROR',
        error: error.message
      });
    }
  }
};

/**
 * Require authentication (token must be present and valid)
 */
const requireAuth = authenticateToken(true);

/**
 * Optional authentication (token can be missing)
 */
const optionalAuth = authenticateToken(false);

/**
 * Require specific role(s)
 * @param {string|array} roles - Required role(s)
 */
const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'NO_AUTH'
    });
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      code: 'INSUFFICIENT_ROLE',
      userRole: req.user.role,
      requiredRoles: allowedRoles
    });
  }

  next();
};

/**
 * Require admin role
 */
const requireAdmin = [requireAuth, requireRole('admin')];

/**
 * Check if user owns resource or is admin
 * @param {function} getResourceUserId - Function to extract user ID from resource
 */
const requireOwnershipOrAdmin = (getResourceUserId) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'NO_AUTH'
    });
  }

  const resourceUserId = getResourceUserId(req);
  const isOwner = req.user.id.toString() === resourceUserId.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources or need admin privileges.',
      code: 'NOT_OWNER_OR_ADMIN'
    });
  }

  next();
};

/**
 * Validate request body fields
 * @param {array} requiredFields - Required fields in request body
 */
const validateFields = (requiredFields) => (req, res, next) => {
  const missingFields = requiredFields.filter(field => 
    !req.body[field] || req.body[field].toString().trim() === ''
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      code: 'MISSING_FIELDS',
      missingFields,
      requiredFields
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireOwnershipOrAdmin,
  validateFields
};