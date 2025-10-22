const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/checkRole');
const {
  register,
  login,
  getProfile,
  seedUsers
} = require('../controllers/authController');

/**
 * POST /auth/register - Đăng ký user mới
 * Body: { name, email, password, role? }
 */
router.post('/register', register);

/**
 * POST /auth/login - Đăng nhập
 * Body: { email, password }
 */
router.post('/login', login);

/**
 * GET /auth/profile - Lấy thông tin profile user hiện tại (yêu cầu đăng nhập)
 * Header: Authorization: Bearer <token>
 */
router.get('/profile', requireAuth, getProfile);

/**
 * POST /auth/seed-users - Tạo users mẫu cho testing (dev-only)
 */
router.post('/seed-users', seedUsers);

module.exports = router;