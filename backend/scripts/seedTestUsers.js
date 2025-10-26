const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: '123456',
    role: 'admin',
    isActive: true
  },
  {
    name: 'Regular User',
    email: 'user@example.com', 
    password: '123456',
    role: 'user',
    isActive: true
  },
  {
    name: 'Test User 1',
    email: 'test1@example.com',
    password: '123456',
    role: 'user',
    isActive: true
  },
  {
    name: 'Test User 2',
    email: 'test2@example.com',
    password: '123456',
    role: 'moderator',
    isActive: false
  }
];

const seedUsers = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'groupDB',
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000
    });
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Cleared existing users');

    console.log('👥 Seeding test users...');
    
    for (const userData of testUsers) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      await user.save();
      console.log(`✅ Created user: ${userData.email}`);
    }

    console.log('🎉 All test users seeded successfully!');
    console.log('\nTest users:');
    console.log('- admin@example.com / 123456 (admin)');
    console.log('- user@example.com / 123456 (user)');
    console.log('- test1@example.com / 123456 (user)');
    console.log('- test2@example.com / 123456 (moderator, inactive)');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedUsers();