// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: { type: String, required: true, minlength: 6 },
    role: { 
      type: String, 
      enum: ['user', 'admin', 'moderator'], 
      default: 'user',
      required: true
    },
    isActive: { type: Boolean, default: true },
    
    // Avatar field for image upload
    avatar: {
      publicId: { type: String }, // Cloudinary public ID for deletion
      url: { type: String }, // Full Cloudinary URL for display
      thumbnailUrl: { type: String } // Optimized thumbnail URL
    },

    // Password reset functionality  
    resetPasswordToken: { type: String, index: true },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true, versionKey: false }
);

// Hash mật khẩu trước khi lưu (chỉ khi mật khẩu thay đổi)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Tạo token reset (trả về raw token để gửi email)
userSchema.methods.generatePasswordReset = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordToken = hashed;
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
  return rawToken;
};

// So khớp mật khẩu khi đăng nhập
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Ẩn password khi trả JSON
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema, 'users');
