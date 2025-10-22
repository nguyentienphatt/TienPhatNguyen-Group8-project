const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { forgotPassword, resetPassword, uploadAvatar } = require('../controllers/authExtraController');

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/upload-avatar', auth, upload.single('avatar'), uploadAvatar);

module.exports = router;
