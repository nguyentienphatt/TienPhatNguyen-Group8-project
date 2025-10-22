require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Simple User schema for this script
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Pre-save hook for password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/groupDB');
    console.log('Connected to MongoDB');

    // Check if admin exists
    let admin = await User.findOne({ email: 'admin@group8.com' });
    
    if (!admin) {
      admin = new User({
        name: 'Admin User',
        email: 'admin@group8.com',
        password: 'admin123',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created: admin@group8.com / admin123');
    } else {
      // Update existing user to admin role
      admin.role = 'admin';
      admin.isActive = true;
      await admin.save();
      console.log('✅ Admin user updated: admin@group8.com');
    }

    // Also create moderator and user for testing
    let moderator = await User.findOne({ email: 'moderator@group8.com' });
    if (!moderator) {
      moderator = new User({
        name: 'Moderator User',
        email: 'moderator@group8.com',
        password: 'moderator123',
        role: 'moderator'
      });
      await moderator.save();
      console.log('✅ Moderator user created: moderator@group8.com / moderator123');
    }

    let user = await User.findOne({ email: 'user@group8.com' });
    if (!user) {
      user = new User({
        name: 'Regular User',
        email: 'user@group8.com',
        password: 'user123',
        role: 'user'
      });
      await user.save();
      console.log('✅ Regular user created: user@group8.com / user123');
    }

    console.log('\n🎯 Test Accounts:');
    console.log('Admin: admin@group8.com / admin123');
    console.log('Moderator: moderator@group8.com / moderator123');
    console.log('User: user@group8.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedAdmin();