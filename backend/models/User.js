<<<<<<< HEAD
// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
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
  },
  { timestamps: true, versionKey: false }
);

// Hash mật khẩu trước khi lưu (chỉ khi mật khẩu thay đổi)
=======
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },

    avatar: {
      publicId: { type: String },
      url: { type: String }
    },

    resetPasswordToken: { type: String, index: true },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true }
);

// Hash password nếu bị thay đổi
>>>>>>> b8c00f4ad72b7718d7a0c93e336ce9be03a69715
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

<<<<<<< HEAD
// So khớp mật khẩu khi đăng nhập
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Ẩn password khi trả JSON
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema, 'users');
=======
// Tạo token reset (trả về raw token để gửi email)
userSchema.methods.generatePasswordReset = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordToken = hashed;
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15'
  return rawToken;
};

// So sánh mật khẩu
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
>>>>>>> b8c00f4ad72b7718d7a0c93e336ce9be03a69715
