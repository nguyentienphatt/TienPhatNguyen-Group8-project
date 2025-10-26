require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User model
const User = require('../models/User');

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Xóa users cũ nếu có
    await User.deleteMany({});
    console.log('🗑️ Cleared existing users');

    // Tạo users mới với mật khẩu 123456
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: '123456',
        role: 'admin'
      },
      {
        name: 'Regular User', 
        email: 'user@example.com',
        password: '123456',
        role: 'user'
      },
      {
        name: 'Test User',
        email: 'test@example.com', 
        password: '123456',
        role: 'user'
      }
    ];

    // Tạo từng user
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.email} / ${userData.password} (${userData.role})`);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Test accounts:');
    console.log('👤 Admin: admin@example.com / 123456');
    console.log('👤 User: user@example.com / 123456');
    console.log('👤 Test: test@example.com / 123456');

  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
}

// Chạy seed nếu file được gọi trực tiếp
if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;