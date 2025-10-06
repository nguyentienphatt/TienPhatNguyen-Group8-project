// server.js
const express = require('express');
const dotenv = require('dotenv');

// Load biến môi trường (nếu có)
dotenv.config();

const app = express();

// Middleware đọc JSON
app.use(express.json());

// Route mặc định để kiểm tra server
app.get('/', (req, res) => {
  res.send('✅ Backend server is running!');
});

// Cổng chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
