/**
 * TEST RATE LIMIT SERVER
 * Kiểm tra User Activity Logging & Rate Limiting (Hoạt động 5)
 * 
 * Test cases:
 * 1. Login rate limiting (5 attempts per 15 minutes)
 * 2. Brute force protection (progressive lockout)
 * 3. Activity logging for all actions
 * 4. Admin log viewing
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for testing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Import rate limiting and logging middleware
const { loginRateLimit, bruteForceProtection, passwordResetRateLimit } = require('./middleware/rateLimiting');
const { logLoginAttempt, logRegister, logForgotPassword, logPasswordReset } = require('./middleware/logActivity');

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rate Limit Test Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test login with rate limiting
app.post('/test/login', loginRateLimit, bruteForceProtection, logLoginAttempt, async (req, res) => {
  try {
    // Simulate login logic
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // For testing, simulate different scenarios
    if (email === 'test@example.com' && password === 'correct') {
      res.json({ 
        success: true, 
        message: 'Login successful',
        user: { email, id: 'test-user-id' }
      });
    } else {
      // Simulate failed login
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Test register with logging
app.post('/test/register', logRegister, async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name, email and password are required' 
    });
  }

  res.json({ 
    success: true, 
    message: 'Registration successful (test mode)',
    user: { name, email, id: 'new-test-user-id' }
  });
});

// Test forgot password with rate limiting
app.post('/test/forgot-password', passwordResetRateLimit, logForgotPassword, async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }

  res.json({ 
    success: true, 
    message: 'Password reset email sent (test mode)',
    email 
  });
});

// Test activity logs viewing (admin only - simplified for testing)
app.get('/test/logs', async (req, res) => {
  try {
    const ActivityLog = require('./models/ActivityLog');
    
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      count: logs.length,
      logs: logs.map(log => ({
        action: log.action,
        timestamp: log.timestamp,
        ip: log.ip,
        userAgent: log.userAgent,
        riskLevel: log.riskLevel,
        userId: log.userId
      }))
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching logs' 
    });
  }
});

// Test statistics
app.get('/test/stats', async (req, res) => {
  try {
    const ActivityLog = require('./models/ActivityLog');
    
    const stats = await ActivityLog.getLoginStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching statistics' 
    });
  }
});

// Rate limit status endpoint
app.get('/test/rate-limit-status', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  res.json({
    success: true,
    message: 'Rate limit status',
    clientIP: ip,
    headers: {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'user-agent': req.headers['user-agent']
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /test/login',
      'POST /test/register', 
      'POST /test/forgot-password',
      'GET /test/logs',
      'GET /test/stats',
      'GET /test/rate-limit-status'
    ]
  });
});

// Start server function
const startTestServer = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      await mongoose.connect(mongoUri, { dbName: 'groupDB' });
      console.log('✅ MongoDB connected for rate limit testing');
    } else {
      console.warn('⚠️ No MONGODB_URI - some features may not work');
    }

    const port = process.env.TEST_PORT || 3001;
    const host = process.env.HOST || '127.0.0.1';
    
    const server = app.listen(port, host, () => {
      console.log('\n🧪 RATE LIMIT TEST SERVER STARTED');
      console.log(`🚀 Server running on http://${host}:${port}`);
      console.log(`Health check: http://${host}:${port}/health`);
      console.log('\n📋 TESTING INSTRUCTIONS:');
      console.log('1. Test normal login: POST /test/login with {"email":"test@example.com","password":"correct"}');
      console.log('2. Test failed login: POST /test/login with {"email":"test@example.com","password":"wrong"}');
      console.log('3. Test rate limiting: Make 6+ failed login attempts rapidly');
      console.log('4. View activity logs: GET /test/logs');
      console.log('5. View statistics: GET /test/stats');
      console.log('6. Check rate limit status: GET /test/rate-limit-status');
      console.log('\n⚠️ RATE LIMITS:');
      console.log('- Login: 5 attempts per 15 minutes');
      console.log('- Brute force: Progressive lockout after 5 failed attempts');
      console.log('- Password reset: 3 attempts per hour');
    });

    server.on('error', (err) => {
      console.error('❌ Test server error:', err);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down test server...');
      server.close(() => {
        mongoose.connection.close().then(() => {
          console.log('✅ Test server shutdown complete');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error('❌ Failed to start test server:', error);
    process.exit(1);
  }
};

// Start the test server
if (require.main === module) {
  startTestServer();
}

module.exports = app;