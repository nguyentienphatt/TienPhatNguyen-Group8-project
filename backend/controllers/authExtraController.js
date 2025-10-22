const fs = require('fs');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const cloudinary = require('../utils/cloudinary');

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    // Luôn trả 200 để tránh lộ email tồn tại
    if (!user) return res.status(200).json({ ok: true, message: 'If email exists, reset link sent' });

    const rawToken = user.generatePasswordReset();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.APP_URL}/reset-password?token=${rawToken}`;
    const html = `
      <p>Xin chào,</p>
      <p>Nhấn vào link để đặt lại mật khẩu (hết hạn sau 15 phút):</p>
      <p><a href="${resetURL}">${resetURL}</a></p>
    `;
    const info = await sendEmail(user.email, 'Reset mật khẩu', html);
    return res.status(200).json({ ok: true, message: 'Reset link sent', preview: info.preview });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Missing token or password' });

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) return res.status(400).json({ message: 'Token invalid or expired' });

    user.password = password; // pre('save') sẽ hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ ok: true, message: 'Password updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Missing file' });

    const uploaded = await cloudinary.uploader.upload(req.file.path, {
      folder: 'group8/avatars',
      transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }]
    });

    // xóa file tạm
    fs.unlink(req.file.path, () => {});

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Xóa avatar cũ nếu có
    if (user.avatar?.publicId) {
      try { await cloudinary.uploader.destroy(user.avatar.publicId); } catch {}
    }

    user.avatar = { publicId: uploaded.public_id, url: uploaded.secure_url };
    await user.save();

    res.status(200).json({ ok: true, avatar: user.avatar });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Upload error' });
  }
};
