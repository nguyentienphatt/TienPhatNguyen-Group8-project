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


// --- healthcheck ---
app.get('/health', (_req, res) => res.json({ ok: true }));

// --- rate limit cho /auth ---
app.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// --- routes ---
app.use('/auth', require('./routes/auth'));

// --- start / connect DB ---
const startServer = () => {
  const port = process.env.PORT || 5000;
  const host = process.env.HOST || '0.0.0.0';
  app.listen(port, host, () => console.log(`🚀 Server running on ${host}:${port}`));
};
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err?.message || err);
    process.exit(1);
  });
  


// --- optional: graceful shutdown ---
process.on('SIGINT', () => { mongoose.connection.close().then(() => process.exit(0)); });
