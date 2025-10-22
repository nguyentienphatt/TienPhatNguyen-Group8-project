const mongoose = require('mongoose');


const RefreshTokenSchema = new mongoose.Schema(
{
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
tokenHash: { type: String, required: true, index: true },
createdByIp: { type: String },
userAgent: { type: String },
revoked: { type: Boolean, default: false },
revokedAt: { type: Date },
replacedByTokenHash: { type: String },
// TTL index: Mongo sẽ tự xóa doc khi hết hạn
expiresAt: { type: Date, required: true, index: true },
},
{ timestamps: true }
);


// Index kết hợp (tùy chọn) để tăng tốc tra cứu
RefreshTokenSchema.index({ user: 1, tokenHash: 1 });


module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);