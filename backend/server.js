const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const mongoose = require('mongoose');

// Don't buffer mongoose model commands when disconnected — return errors fast
mongoose.set('bufferCommands', false);

const app = express();

// --- middleware chung ---
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());                 // có thể cấu hình origin cụ thể khi deploy
app.use(express.json());

// serve uploaded files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- healthcheck ---
app.get('/health', (_req, res) => res.json({ ok: true }));

// --- rate limit cho /auth và /api ---
app.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// --- routes ---
app.use('/auth', require('./routes/auth'));
// app.use('/upload', require('./routes/upload')); // Comment out for now
app.use('/users', require('./routes/user'));
app.use('/api/admin', require('./routes/admin')); // New RBAC admin routes
app.use('/api/avatar', require('./routes/avatar')); // New avatar upload routes
app.use('/api/logs', require('./routes/logs')); // Admin activity logs routes

// 🔒 ACTIVITY 6: Protected Routes for Redux Testing
app.use('/protected', require('./routes/protected')); // New protected routes for Activity 6

const startServer = () => {
  const port = process.env.PORT || 5000; // Backend on port 5000
  const host = process.env.HOST || '127.0.0.1'; // Changed to localhost only
  const server = app.listen(port, host, () => {
    console.log(`🚀 Server running on ${host}:${port}`);
    console.log(`Health check: http://${host}:${port}/health`);
  });
  
  server.on('error', (err) => {
    console.error('Server error:', err);
  });
};

// Try to connect to MongoDB but start server even if it fails (helps local dev/testing)
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  mongoose.connect(mongoUri, { 
    dbName: 'groupDB',
    serverSelectionTimeoutMS: 30000, // 30 seconds timeout
    socketTimeoutMS: 45000 // 45 seconds socket timeout
  })
    .then(() => {
      console.log('✅ MongoDB connected');
      startServer();
    })
    .catch(err => {
      console.error('⚠️ MongoDB connection warning:', err?.message || err);
      console.error('⚠️ Continuing without DB connection (development mode)');
      startServer();
    });
} else {
  console.warn('⚠️ No MONGODB_URI provided in .env — starting server without DB');
  startServer();
}

// --- optional: graceful shutdown ---
process.on('SIGINT', () => { mongoose.connection.close().then(() => process.exit(0)); });
