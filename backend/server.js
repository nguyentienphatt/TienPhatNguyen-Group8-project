const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🧩 Kiểm tra môi trường
console.log('ENV PORT =', process.env.PORT);
console.log('ENV MONGO_URI exists =', !!process.env.MONGO_URI);

// 🧭 Routes
app.use('/users', require('./routes/user'));

const PORT = process.env.PORT || 5000;

// ⚙️ Kết nối MongoDB
(async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('❌ Thiếu MONGO_URI trong file .env');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () =>
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('❌ MongoDB connection error:', err?.message || err);
    process.exit(1);
  }
})();
