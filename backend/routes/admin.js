const express = require('express');
const router = express.Router();
const { requireAdmin, requireAdminOrModerator } = require('../middleware/checkRole');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changeUserPassword,
  deleteUser,
  getUserStats
} = require('../controllers/adminController');

// Tất cả routes trong file này đều yêu cầu role admin
// Ngoại trừ một số routes cho phép moderator

/**
 * GET /api/admin/users - Lấy danh sách users (Admin only)
 * Query params: page, limit, role, search
 */
router.get('/users', requireAdmin, getAllUsers);

/**
 * GET /api/admin/users/stats - Lấy thống kê users (Admin only)
 */
router.get('/users/stats', requireAdmin, getUserStats);

/**
 * GET /api/admin/users/:id - Lấy thông tin chi tiết user (Admin only)
 */
router.get('/users/:id', requireAdmin, getUserById);

/**
 * POST /api/admin/users - Tạo user mới (Admin only)
 * Body: { name, email, password, role? }
 */
router.post('/users', requireAdmin, createUser);

/**
 * PUT /api/admin/users/:id - Cập nhật thông tin user (Admin only)
 * Body: { name?, email?, role?, isActive? }
 */
router.put('/users/:id', requireAdmin, updateUser);

/**
 * PATCH /api/admin/users/:id/password - Đổi mật khẩu user (Admin only)
 * Body: { newPassword }
 */
router.patch('/users/:id/password', requireAdmin, changeUserPassword);

/**
 * DELETE /api/admin/users/:id - Xóa user (Admin only)
 */
router.delete('/users/:id', requireAdmin, deleteUser);

// Routes cho moderator có thể truy cập (chỉ đọc)
/**
 * GET /api/admin/moderator/users - Moderator có thể xem danh sách users (read-only)
 */
router.get('/moderator/users', requireAdminOrModerator, (req, res, next) => {
  // Moderator chỉ được xem, không được CRUD
  if (req.user.role === 'moderator') {
    req.query.page = req.query.page || 1;
    req.query.limit = Math.min(req.query.limit || 10, 20); // Giới hạn moderator chỉ xem tối đa 20/page
  }
  getAllUsers(req, res, next);
});

/**
 * GET /api/admin/moderator/users/stats - Moderator có thể xem thống kê users
 */
router.get('/moderator/users/stats', requireAdminOrModerator, getUserStats);

module.exports = router;