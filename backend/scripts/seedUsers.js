const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin@123',
    role: 'admin'
  },
  {
    name: 'Moderator User',
    email: 'moderator@example.com',
    password: 'Moderator@123',
    role: 'moderator'
  },
  {
    name: 'Regular User 1',
    email: 'user1@example.com',
    password: 'User@123',
    role: 'user'
  },
  {
    name: 'Regular User 2',
    email: 'user2@example.com',
    password: 'User@123',
    role: 'user'
  }
];

async function seedUsers() {
  try {
    console.log('🔄 Đang kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    console.log('🔄 Đang xóa dữ liệu cũ...');
    await User.deleteMany({});
    console.log('✅ Đã xóa dữ liệu cũ');

    console.log('🔄 Đang tạo dữ liệu mẫu...');
    const createdUsers = await User.create(sampleUsers);
    console.log('✅ Đã tạo thành công', createdUsers.length, 'users:');
    
    createdUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    console.log('\n📝 Thông tin đăng nhập:');
    console.log('   Admin:     admin@example.com / Admin@123');
    console.log('   Moderator: moderator@example.com / Moderator@123');
    console.log('   User:      user1@example.com / User@123');
    console.log('   User:      user2@example.com / User@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

seedUsers();
