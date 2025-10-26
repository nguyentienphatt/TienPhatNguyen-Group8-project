const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware kiểm tra role của user
 * @param {string|array} allowedRoles - Role được phép truy cập (string hoặc array)
 * @returns {function} Express middleware
 */
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Kiểm tra xem có token không
      const authHeader = req.header('Authorization');
      console.log('Auth header:', authHeader); // Debug log
      
      const token = authHeader?.replace('Bearer ', '');
      console.log('Extracted token:', token ? 'Token exists' : 'No token'); // Debug log
      
      if (!token) {
        console.log('No token provided in Authorization header'); // Debug log
        return res.status(401).json({ 
          message: 'Access denied. Không có token được cung cấp.' 
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', decoded); // Debug log
      
      // Lấy thông tin user từ database để có role mới nhất
      let user;
      try {
        user = await User.findById(decoded.sub).select('-password');
      } catch (error) {
        console.log('User not found in DB, using token data for hard-coded users');
      }
      
      // Nếu không tìm thấy trong DB (hard-coded users), tạo user object từ token
      if (!user) {
        // Hard-coded users để test
        const testUsers = {
          '507f1f77bcf86cd799439011': { 
            _id: '507f1f77bcf86cd799439011', name: 'Admin User', email: 'admin@example.com', 
            role: 'admin', isActive: true 
          },
          '507f1f77bcf86cd799439012': { 
            _id: '507f1f77bcf86cd799439012', name: 'Regular User', email: 'user@example.com', 
            role: 'user', isActive: true 
          }
        };
        
        user = testUsers[decoded.sub];
        if (!user) {
          return res.status(401).json({ 
            message: 'Token không hợp lệ. User không tồn tại.' 
          });
        }
      }

      // Kiểm tra user có active không
      if (!user.isActive) {
        return res.status(403).json({ 
          message: 'Tài khoản đã bị vô hiệu hóa.' 
        });
      }

      // Chuẩn hóa allowedRoles thành array
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Kiểm tra role của user có trong danh sách được phép không
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Yêu cầu role: ${roles.join(' hoặc ')}. Role hiện tại: ${user.role}` 
        });
      }

      // Gán thông tin user vào req để sử dụng ở middleware/controller tiếp theo
      req.user = user;
      next();

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token không hợp lệ.' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token đã hết hạn.' });
      }
      
      console.error('checkRole middleware error:', error);
      res.status(500).json({ message: 'Lỗi server khi kiểm tra quyền hạn.' });
    }
  };
};

/**
 * Middleware chỉ cho phép admin truy cập
 */
const requireAdmin = checkRole('admin');

/**
 * Middleware chỉ cho phép admin hoặc moderator truy cập
 */
const requireAdminOrModerator = checkRole(['admin', 'moderator']);

/**
 * Middleware cho phép tất cả role đã đăng nhập
 */
const requireAuth = checkRole(['user', 'admin', 'moderator']);

module.exports = {
  checkRole,
  requireAdmin,
  requireAdminOrModerator, 
  requireAuth
};