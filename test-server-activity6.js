/**
 * Minimal Activity 6 Test Server
 * For testing Protected Routes APIs without complex dependencies
 */

const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock user data for testing
const mockUsers = {
  'admin@example.com': {
    id: '1',
    name: 'Admin Test',
    email: 'admin@example.com',
    role: 'admin',
    password: '123456'
  },
  'user@example.com': {
    id: '2', 
    name: 'User Test',
    email: 'user@example.com',
    role: 'user',
    password: '123456'
  }
};

// Mock JWT token (for testing only)
const generateMockToken = (user) => {
  return Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + (60 * 60 * 1000) // 1 hour
  })).toString('base64');
};

const verifyMockToken = (token) => {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.exp < Date.now()) throw new Error('Token expired');
    return decoded;
  } catch {
    return null;
  }
};

// Auth middleware
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      code: 'NO_TOKEN'
    });
  }
  
  const decoded = verifyMockToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
  
  req.user = decoded;
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      code: 'INSUFFICIENT_ROLE'
    });
  }
  next();
};

// ================================
// AUTH ROUTES
// ================================

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Activity 6 Test Server' });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = mockUsers[email];
  
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  const token = generateMockToken(user);
  res.json({
    success: true,
    message: 'Login successful',
    accessToken: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

app.post('/auth/verify-token', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.json({ valid: false, message: 'No token provided' });
  }
  
  const decoded = verifyMockToken(token);
  if (!decoded) {
    return res.json({ valid: false, message: 'Invalid token' });
  }
  
  res.json({
    valid: true,
    user: {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    },
    message: 'Token is valid'
  });
});

app.get('/auth/user-profile', requireAuth, (req, res) => {
  const user = mockUsers[req.user.email];
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: {
        canViewAdmin: user.role === 'admin',
        canEditUsers: user.role === 'admin',
        canAccessProfile: true
      }
    },
    message: 'Profile retrieved successfully'
  });
});

app.get('/auth/check-admin', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  res.json({
    success: true,
    isAdmin,
    role: req.user.role,
    message: isAdmin ? 'Admin access granted' : 'User access only'
  });
});

// ================================
// PROTECTED ROUTES
// ================================

app.get('/protected/profile', requireAuth, (req, res) => {
  const user = mockUsers[req.user.email];
  res.json({
    success: true,
    message: 'Protected profile accessed',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      permissions: {
        canEditProfile: true,
        canViewAdmin: user.role === 'admin'
      }
    },
    route: '/protected/profile',
    timestamp: new Date().toISOString()
  });
});

app.get('/protected/dashboard', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard accessed',
    data: {
      user: {
        name: req.user.name || req.user.email,
        role: req.user.role
      },
      navigation: {
        availableRoutes: [
          { name: 'Profile', path: '/profile', accessible: true },
          { name: 'Dashboard', path: '/dashboard', accessible: true },
          { name: 'Admin Panel', path: '/admin', accessible: req.user.role === 'admin' },
          { name: 'User Management', path: '/users', accessible: req.user.role === 'admin' }
        ]
      }
    },
    route: '/protected/dashboard',
    timestamp: new Date().toISOString()
  });
});

app.get('/protected/admin', requireAuth, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin panel accessed',
    data: {
      stats: {
        totalUsers: Object.keys(mockUsers).length,
        currentAdmin: req.user.email
      },
      permissions: {
        canManageUsers: true,
        canViewLogs: true,
        canAccessAllData: true
      }
    },
    route: '/protected/admin',
    timestamp: new Date().toISOString()
  });
});

app.get('/protected/users', requireAuth, requireAdmin, (req, res) => {
  const users = Object.values(mockUsers).map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  }));
  
  res.json({
    success: true,
    message: 'Users list retrieved',
    data: {
      users,
      count: users.length
    },
    route: '/protected/users',
    timestamp: new Date().toISOString()
  });
});

app.get('/protected/test-routes', requireAuth, (req, res) => {
  const userRole = req.user.role;
  
  const routeTests = [
    {
      route: '/protected/profile',
      method: 'GET',
      accessible: true,
      reason: 'All authenticated users'
    },
    {
      route: '/protected/dashboard',
      method: 'GET', 
      accessible: true,
      reason: 'All authenticated users'
    },
    {
      route: '/protected/admin',
      method: 'GET',
      accessible: userRole === 'admin',
      reason: 'Admin role required'
    },
    {
      route: '/protected/users',
      method: 'GET',
      accessible: userRole === 'admin',
      reason: 'Admin role required'
    }
  ];

  res.json({
    success: true,
    message: 'Route accessibility test',
    data: {
      userRole,
      routeTests,
      accessibleRoutes: routeTests.filter(r => r.accessible).length,
      totalRoutes: routeTests.length
    },
    route: '/protected/test-routes',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Activity 6 Test Server running on http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/health`);
  console.log('\n📋 Test Credentials:');
  console.log('Admin: admin@example.com / 123456');
  console.log('User:  user@example.com / 123456');
  console.log('\n🔗 Protected Routes:');
  console.log('- GET /protected/profile (auth required)');
  console.log('- GET /protected/dashboard (auth required)');
  console.log('- GET /protected/admin (admin required)');
  console.log('- GET /protected/users (admin required)');
});

module.exports = app;