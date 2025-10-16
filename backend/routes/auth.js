const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/authController');

// Tối thiểu cho SV1 kiểm thử:
router.post('/login', ctrl.login);     // dùng để lấy access/refresh
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);

// Route cần access token để test 401/200
router.get('/me', auth(true), (req, res) => {
  res.json({ userId: req.user.id, email: req.user.email, role: req.user.role });
});

module.exports = router;
