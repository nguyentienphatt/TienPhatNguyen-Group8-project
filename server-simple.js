const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Basic auth routes (simplified)
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication
  if (email === 'admin@group8.com' && password === 'admin123') {
    res.json({
      message: 'Login successful',
      token: 'mock-admin-token',
      user: { email, role: 'admin' }
    });
  } else if (email === 'user@group8.com' && password === 'user123') {
    res.json({
      message: 'Login successful', 
      token: 'mock-user-token',
      user: { email, role: 'user' }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Mock admin routes
app.get('/api/admin/users', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes('mock-admin-token')) {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  
  res.json({
    message: 'Get users successful',
    users: [
      { id: 1, name: 'Admin User', email: 'admin@group8.com', role: 'admin' },
      { id: 2, name: 'Regular User', email: 'user@group8.com', role: 'user' }
    ]
  });
});

app.post('/api/admin/users', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes('mock-admin-token')) {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  
  res.json({
    message: 'User created successfully',
    user: { id: 3, ...req.body }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/auth/login`);
  console.log(`👥 Admin users: GET http://localhost:${PORT}/api/admin/users`);
});