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
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15'
  return rawToken;
};

// So sánh mật khẩu
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
