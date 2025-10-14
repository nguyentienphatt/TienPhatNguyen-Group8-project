// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(()=>console.log('✅ MongoDB connected'))
  .catch(err=>{ console.error('❌ MongoDB error:', err.message); process.exit(1); });

// Mount router /users
const userRouter = require('./routes/user');
app.use('/users', userRouter);   // <— PHẢI CÓ DÒNG NÀY

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`✅ Server running on port ${PORT}`));
