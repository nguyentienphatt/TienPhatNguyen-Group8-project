<<<<<<< HEAD
// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
=======
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
>>>>>>> b8c00f4ad72b7718d7a0c93e336ce9be03a69715

const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(()=>console.log('✅ MongoDB connected'))
  .catch(err=>{ console.error('❌ MongoDB error:', err.message); process.exit(1); });

// Mount router /users
const userRouter = require('./routes/user');
app.use('/users', userRouter);   // <— PHẢI CÓ DÒNG NÀY

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`✅ Server running on port ${PORT}`));
=======
mongoose.connect(process.env.MONGODB_URI)
  .then(()=>console.log('✅ MongoDB connected'))
  .catch(err=>console.error('❌ MongoDB error', err.message));

app.get('/health', (_req,res)=>res.json({ok:true}));

app.use('/auth', require('./routes/auth.refresh.demo'));
app.use('/authExtra', require('./routes/authExtra'));

const port = process.env.PORT || 5000;
app.listen(port, ()=>console.log('🚀 Server running on', port));
>>>>>>> b8c00f4ad72b7718d7a0c93e336ce9be03a69715
