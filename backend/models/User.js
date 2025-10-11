const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
