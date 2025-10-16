const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, index: true }, // KHÔNG lưu token thô
  familyId:  { type: String, required: true },              // phục vụ rotate & reuse detect
  expiresAt: { type: Date,   required: true, index: true },
  revoked:   { type: Boolean, default: false },
  userAgent: String,
  ip:        String,
}, { timestamps: true });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
