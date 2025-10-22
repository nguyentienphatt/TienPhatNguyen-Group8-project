const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

/**
 * POST /auth/forgot-password
 * body: { email }
 * - Tạo token reset (random 32 bytes), lưu HASH của token vào DB + hạn 10 phút
 * - Gửi email chứa link reset (gồm token gốc - không hash)
 */
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email là bắt buộc' });

    const user = await User.findOne({ email });
    if (!user) {
      // tránh lộ thông tin
      return res.status(200).json({ message: 'Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu' });
    }

    // token thô (gửi qua mail) + token hash (lưu DB)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    await user.save();

    const resetLink = `${process.env.CLIENT_BASE_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Đặt lại mật khẩu',
      html: `
        <p>Xin chào ${user.name || ''},</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn vào link bên dưới (có hiệu lực 10 phút):</p>
        <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
        <p>Nếu không phải bạn, cứ bỏ qua email này.</p>
      `
    });

    return res.json({ message: 'Đã gửi email hướng dẫn đặt lại mật khẩu (nếu email tồn tại)' });
  } catch (err) {
    console.error('forgot-password error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

/**
 * POST /auth/reset-password/:token
 * body: { password }
 * - Hash token từ URL, tìm user với token + còn hạn
 * - Đổi password mới, xóa token reset
 */
router.post('/auth/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 6 ký tự' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });

    user.password = password; // sẽ được pre-save hash
    user.resetPasswordToken = '';
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ message: 'Đổi mật khẩu thành công. Hãy đăng nhập lại.' });
  } catch (err) {
    console.error('reset-password error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

/**
 * POST /users/upload-avatar
 * headers: Authorization: Bearer <JWT>
 * form-data: file (key: avatar)
 * - Upload ảnh lên Cloudinary, cập nhật user.avatar
 * - Xóa ảnh cũ (nếu có)
 */
router.post('/users/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    // Multer-Cloudinary đã upload xong, có req.file.path/url/public_id
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });

    // Xóa ảnh cũ nếu có
    if (user.avatar?.public_id) {
      try { await cloudinary.uploader.destroy(user.avatar.public_id); } catch (e) {}
    }

    user.avatar = {
      public_id: req.file.filename || req.file.public_id || '',
      url: req.file.path || req.file.secure_url || ''
    };
    await user.save();

    return res.json({ message: 'Upload avatar thành công', avatar: user.avatar });
  } catch (err) {
    console.error('upload-avatar error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;
