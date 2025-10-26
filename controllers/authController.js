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

    // Hard-coded users để test (tạm thời) - với ObjectId hợp lệ
    const testUsers = {
      'admin@example.com': { 
        id: '507f1f77bcf86cd799439011', name: 'Admin User', email: 'admin@example.com', 
        role: 'admin', password: '123456' 
      },
      'user@example.com': { 
        id: '507f1f77bcf86cd799439012', name: 'Regular User', email: 'user@example.com', 
        role: 'user', password: '123456' 
      }
    };

    const user = testUsers[email];
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Tạo tokens
    const accessToken = signAccessToken({ 
      sub: user.id, 
      role: user.role, 
      email: user.email 
    });
    
    const refreshToken = signRefreshToken({ 
      sub: user.id 
    });

    res.json({
      message: 'Đăng nhập thành công',
      token: accessToken, // Frontend expect 'token' field
      accessToken,
      refreshToken,
      user: {
        id: user.id,
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

/**
 * Forgot Password - Gửi email reset password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      // Vì lý do bảo mật, không tiết lộ email có tồn tại hay không
      return res.status(200).json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, link reset password đã được gửi'
      });
    }

    // Kiểm tra user có active không
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordReset();
    await user.save();

    // Send reset email
    const { sendPasswordResetEmail } = require('../utils/sendEmail');
    
    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetToken: resetToken,
        userName: user.name
      });

      console.log(`✅ Password reset email sent to: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Email reset password đã được gửi thành công',
        data: {
          email: user.email,
          resetTokenExpires: user.resetPasswordExpires,
          // Chỉ hiện token trong development mode cho debugging
          ...(process.env.NODE_ENV === 'development' && { resetToken: resetToken })
        }
      });

    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      
      // Clear the reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Có lỗi khi gửi email. Vui lòng thử lại sau',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý yêu cầu reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reset Password - Đặt lại password với token
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Validation
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token reset password là bắt buộc'
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới là bắt buộc'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Hash token để so sánh với database
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Tìm user với token và kiểm tra thời hạn
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() } // Token chưa hết hạn
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token reset password không hợp lệ hoặc đã hết hạn'
      });
    }

    // Kiểm tra user có active không
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Update password (sẽ được hash tự động bởi pre-save middleware)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`✅ Password reset successful for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        resetAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đặt lại mật khẩu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  seedUsers,
  forgotPassword,
  resetPassword
};