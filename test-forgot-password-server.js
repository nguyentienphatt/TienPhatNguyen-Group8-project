// test-forgot-password-server.js - Server để test forgot password mà không cần real Gmail
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage để demo (thay thế MongoDB)
let mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2a$10$8K1p/a0drtJ8Cun/yiCE3OGHnAjWTbByRfsV4Gc11JYqBqT8TiHTK', // Admin@123
    role: 'admin',
    isActive: true,
    resetPasswordToken: null,
    resetPasswordExpires: null
  },
  {
    id: '2',
    name: 'Test User',
    email: 'user@example.com',
    password: '$2a$10$8K1p/a0drtJ8Cun/yiCE3OGHnAjWTbByRfsV4Gc11JYqBqT8TiHTK', // User@123
    role: 'user',
    isActive: true,
    resetPasswordToken: null,
    resetPasswordExpires: null
  }
];

// Mock email storage để demo
let sentEmails = [];

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Forgot Password Test Server',
    timestamp: new Date().toISOString(),
    mockUsers: mockUsers.length,
    sentEmails: sentEmails.length
  });
});

// Mock email sending function
const sendMockEmail = (to, resetToken, userName) => {
  const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
  
  const emailContent = {
    to: to,
    subject: '🔐 Đặt lại mật khẩu - Group 8 Project',
    resetToken: resetToken,
    resetUrl: resetUrl,
    userName: userName,
    sentAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
  };
  
  // Store email in mock storage
  sentEmails.push(emailContent);
  
  // Keep only last 10 emails
  if (sentEmails.length > 10) {
    sentEmails = sentEmails.slice(-10);
  }
  
  console.log(`📧 Mock email sent to: ${to}`);
  console.log(`🔗 Reset URL: ${resetUrl}`);
  console.log(`🔑 Reset Token: ${resetToken}`);
  
  return emailContent;
};

// Generate password reset token
const generatePasswordReset = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
  
  return { rawToken, hashed, expires };
};

/**
 * POST /auth/forgot-password
 */
app.post('/auth/forgot-password', async (req, res) => {
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

    // Find mock user
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      // Security: don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, link reset password đã được gửi'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Generate reset token
    const { rawToken, hashed, expires } = generatePasswordReset();
    
    // Update user with reset token
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = expires;

    // Send mock email
    const emailInfo = sendMockEmail(user.email, rawToken, user.name);

    console.log(`✅ Password reset initiated for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Email reset password đã được gửi thành công (Mock mode)',
      data: {
        email: user.email,
        resetTokenExpires: new Date(user.resetPasswordExpires).toISOString(),
        // Show token in development for easy testing
        resetToken: rawToken,
        mockEmailInfo: {
          resetUrl: emailInfo.resetUrl,
          sentAt: emailInfo.sentAt,
          expiresAt: emailInfo.expiresAt
        }
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý yêu cầu reset password',
      error: error.message
    });
  }
});

/**
 * POST /auth/reset-password/:token
 */
app.post('/auth/reset-password/:token', async (req, res) => {
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

    // Hash token to compare with stored version
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = mockUsers.find(u => 
      u.resetPasswordToken === hashedToken && 
      u.resetPasswordExpires > Date.now()
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token reset password không hợp lệ hoặc đã hết hạn'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Mock password hashing (in real app, this would be bcrypt)
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear reset token
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    console.log(`✅ Password reset successful for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        resetAt: new Date().toISOString(),
        note: 'Password has been updated in mock storage'
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đặt lại mật khẩu',
      error: error.message
    });
  }
});

/**
 * GET /test/sent-emails - Xem các email đã gửi (for testing)
 */
app.get('/test/sent-emails', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mock emails sent',
    data: {
      totalSent: sentEmails.length,
      emails: sentEmails.map(email => ({
        to: email.to,
        resetToken: email.resetToken,
        resetUrl: email.resetUrl,
        sentAt: email.sentAt,
        expiresAt: email.expiresAt
      }))
    }
  });
});

/**
 * GET /test/users - Xem mock users (for testing)
 */
app.get('/test/users', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mock users',
    data: mockUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasResetToken: !!user.resetPasswordToken,
      resetTokenExpires: user.resetPasswordExpires ? new Date(user.resetPasswordExpires).toISOString() : null
    }))
  });
});

/**
 * Login for testing
 */
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và password là bắt buộc'
      });
    }

    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc password không đúng'
      });
    }

    // Check password with bcrypt
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc password không đúng'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        tokens: {
          accessToken: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token'
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập'
    });
  }
});

const PORT = 3002; // Different port  
const HOST = '127.0.0.1';

// Graceful shutdown prevention
process.on('SIGINT', () => {
  console.log('\n⚠️ SIGINT received, but server will continue running for Postman testing...');
  console.log('💡 To stop server, close this terminal window or use Ctrl+C twice quickly.');
});

const server = app.listen(PORT, HOST, () => {
  console.log(`🧪 Forgot Password Test Server running on ${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`Forgot password: POST http://${HOST}:${PORT}/auth/forgot-password`);
  console.log(`Reset password: POST http://${HOST}:${PORT}/auth/reset-password/:token`);
  console.log(`View sent emails: GET http://${HOST}:${PORT}/test/sent-emails`);
  console.log(`View users: GET http://${HOST}:${PORT}/test/users`);
  console.log('');
  console.log('Test users:');
  mockUsers.forEach(user => {
    console.log(`  ${user.email} - Role: ${user.role}`);
  });
  console.log('\n🚀 Server is ready for Postman testing!');
  console.log('💡 Keep this terminal open while testing in Postman.');
});

// Keep server alive and stable
server.keepAliveTimeout = 60000;
server.headersTimeout = 65000;