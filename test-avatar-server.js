// test-avatar-server.js - Simple server to test avatar upload without MongoDB
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Avatar test server is running',
    timestamp: new Date().toISOString()
  });
});

// Simple login mock for testing
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email và password là bắt buộc'
    });
  }
  
  // Mock admin user
  if (email === 'admin@example.com' && password === 'Admin@123') {
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: 'mock-admin-id-123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        },
        tokens: {
          accessToken: 'mock-jwt-token-for-testing-avatar-upload-api',
          refreshToken: 'mock-refresh-token'
        }
      }
    });
  }
  
  return res.status(401).json({
    success: false,
    message: 'Email hoặc password không đúng'
  });
});

// Simple auth middleware for testing
const testAuth = (req, res, next) => {
  // For testing, we'll create a dummy user
  req.user = { 
    id: '507f1f77bcf86cd799439011', // test ObjectId
    email: 'test@example.com',
    name: 'Test User'
  };
  next();
};

// Test avatar routes
const avatarUpload = require('./middleware/avatarUpload');
const cloudinary = require('./config/cloudinary');

/**
 * Test avatar upload endpoint
 */
app.post('/api/avatar/upload', testAuth, avatarUpload.single, avatarUpload.processImage, async (req, res) => {
  try {
    console.log('Avatar upload request received');
    console.log('File:', req.file ? 'Present' : 'Missing');
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh để upload'
      });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // For testing, we'll just return success without saving to database
    // since we don't have real user in DB
    
    // Simulate Cloudinary upload for testing
    const uploadResult = {
      public_id: `test_avatar_${Date.now()}`,
      secure_url: `https://res.cloudinary.com/test/image/upload/test_avatar_${Date.now()}.jpg`
    };

    console.log('Simulated Cloudinary upload:', uploadResult);

    const avatarUrl = uploadResult.secure_url;
    const thumbnailUrl = `${avatarUrl}?w=150&h=150`;

    res.status(200).json({
      success: true,
      message: 'Avatar được upload thành công! (Test mode)',
      data: {
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          avatar: {
            publicId: uploadResult.public_id,
            url: avatarUrl,
            thumbnailUrl: thumbnailUrl
          }
        },
        uploadInfo: {
          publicId: uploadResult.public_id,
          originalSize: req.file.size,
          processedUrl: avatarUrl,
          thumbnailUrl: thumbnailUrl,
          uploadedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload avatar',
      error: error.message
    });
  }
});

// Error handling for avatar upload
app.use('/api/avatar/upload', avatarUpload.handleUploadError);

// Generic error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Lỗi server',
    error: error.message
  });
});

const startServer = () => {
  const port = 3001; // Use different port
  const host = '127.0.0.1';
  
  const server = app.listen(port, host, () => {
    console.log(`🧪 Avatar Test Server running on ${host}:${port}`);
    console.log(`Health check: http://${host}:${port}/health`);
    console.log(`Test login: POST http://${host}:${port}/auth/login`);
    console.log(`Avatar upload: POST http://${host}:${port}/api/avatar/upload`);
    console.log('');
    console.log('Test credentials:');
    console.log('  Email: admin@example.com');
    console.log('  Password: Admin@123');
  });
  
  server.on('error', (err) => {
    console.error('Server error:', err);
  });
};

console.log('Starting test server without MongoDB...');
startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  process.exit(0);
});