const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(()=>console.log('✅ MongoDB connected'))
  .catch(err=>console.error('❌ MongoDB error', err.message));

// Health check
app.get('/health', (_req,res)=>res.json({ok:true}));

// Routes
app.use('/auth', require('./routes/auth.refresh.demo'));
app.use('/authExtra', require('./routes/authExtra'));
app.use('/users', require('./routes/user'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`🚀 Server running on port ${PORT}`));
