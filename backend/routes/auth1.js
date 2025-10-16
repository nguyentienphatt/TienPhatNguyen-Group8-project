// backend/routes/auth.js
const express = require('express');
const router = express.Router();

console.log('AUTH ROUTES FROM:', __filename);

// (route test siêu đơn giản)
router.get('/dev/ping', (_req, res) => res.json({ pong: true }));

// ===== DEV ONLY: reset password nhanh (xong việc nhớ xóa) =====
const User = require('../models/User');
router.post('/dev/reset-pass', async (req, res) => {
  try {
    const { email, newPassword } = req.body || {};
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'email & newPassword required' });
    }
    const u = await User.findOne({ email });
    if (!u) return res.status(404).json({ message: 'User not found' });

    u.password = newPassword; // User.js pre('save') sẽ hash
    await u.save();

    return res.json({ ok: true, email: u.email });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

// (giữ chỗ cho các route chuẩn của bạn nếu cần)
// const ctrl = require('../controllers/authController');
// const auth = require('../middleware/auth');
// router.post('/login', ctrl.login);
// router.post('/refresh', ctrl.refresh);
// router.post('/logout', ctrl.logout);
// router.get('/me', auth(true), (req, res) => res.json(req.user));

module.exports = router;
