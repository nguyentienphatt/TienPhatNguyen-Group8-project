const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');

/**
 * Đăng ký user mới
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin bắt buộc: name, email, password' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Mật khẩu phải có ít nhất 6 ký tự' 
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Tạo user mới
    const newUser = new User({
      name,
      email,
      password, // Sẽ được hash trong pre-save hook
      role: role === 'admin' ? 'user' : role // Không cho phép tự đăng ký làm admin
    });

    await newUser.save();

    // Tạo tokens
    const accessToken = signAccessToken({ 
      sub: newUser._id.toString(), 
      role: newUser.role, 
      email: newUser.email 
    });
    
    const refreshToken = signRefreshToken({ 
      sub: newUser._id.toString() 
    });

    res.status(201).json({
      message: 'Đăng ký thành công',
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

/**
 * Đăng nhập
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Thiếu email hoặc password' 
      });
    }

    // Tìm user và kiểm tra password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Kiểm tra tài khoản có active không
    if (!user.isActive) {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    // Tạo tokens
    const accessToken = signAccessToken({ 
      sub: user._id.toString(), 
      role: user.role, 
      email: user.email 
    });
    
    const refreshToken = signRefreshToken({ 
      sub: user._id.toString() 
    });

    res.json({
      message: 'Đăng nhập thành công',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
};

/**
 * Lấy thông tin profile user hiện tại
 */
const getProfile = async (req, res) => {
  try {
    // req.user được set từ middleware checkRole
    res.json({
      message: 'Lấy thông tin profile thành công',
      user: req.user
    });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy profile' });
  }
};

/**
 * Seed users mẫu cho testing (dev-only)
 */
const seedUsers = async (req, res) => {
  try {
    // Không cho phép trong production
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Không được phép trong môi trường production' });
    }

    // Tạo admin user
    const adminExists = await User.findOne({ email: 'admin@group8.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@group8.com',
        password: 'admin123',
        role: 'admin'
      });
    }

    // Tạo moderator user
    const moderatorExists = await User.findOne({ email: 'moderator@group8.com' });
    if (!moderatorExists) {
      await User.create({
        name: 'Moderator User',
        email: 'moderator@group8.com',
        password: 'moderator123',
        role: 'moderator'
      });
    }

    // Tạo normal user
    const userExists = await User.findOne({ email: 'user@group8.com' });
    if (!userExists) {
      await User.create({
        name: 'Normal User',
        email: 'user@group8.com',
        password: 'user123',
        role: 'user'
      });
    }

    // Tạo thêm vài test users
    const testUsers = [
      { name: 'Test User 1', email: 'test1@group8.com', password: 'test123', role: 'user' },
      { name: 'Test User 2', email: 'test2@group8.com', password: 'test123', role: 'user' },
      { name: 'Test Moderator', email: 'testmod@group8.com', password: 'test123', role: 'moderator' }
    ];

    for (const testUser of testUsers) {
      const exists = await User.findOne({ email: testUser.email });
      if (!exists) {
        await User.create(testUser);
      }
    }

    const userCount = await User.countDocuments();
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      message: 'Seed users thành công',
      stats: {
        totalUsers: userCount,
        byRole: roleStats
      },
      testAccounts: [
        { email: 'admin@group8.com', password: 'admin123', role: 'admin' },
        { email: 'moderator@group8.com', password: 'moderator123', role: 'moderator' },
        { email: 'user@group8.com', password: 'user123', role: 'user' }
      ]
    });
  } catch (error) {
    console.error('seedUsers error:', error);
    res.status(500).json({ message: 'Lỗi server khi seed users' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  seedUsers
};