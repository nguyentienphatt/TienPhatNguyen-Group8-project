const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(()=>console.log('✅ MongoDB connected'))
  .catch(err=>console.error('❌ MongoDB error', err.message));

app.get('/health', (_req,res)=>res.json({ok:true}));

app.use('/auth', require('./routes/auth.refresh.demo'));
app.use('/authExtra', require('./routes/authExtra'));

const port = process.env.PORT || 5000;
app.listen(port, ()=>console.log('🚀 Server running on', port));
