// scripts/list-refresh-tokens.js
// Usage: node scripts/list-refresh-tokens.js <userId?>
const mongoose = require('mongoose');
require('dotenv').config();
const RefreshToken = require('../backend/models/RefreshToken');

(async()=>{
  try{
    await mongoose.connect(process.env.MONGODB_URI);
    const userId = process.argv[2];
    const query = userId ? { user: userId } : {};
    const list = await RefreshToken.find(query).sort({ createdAt: -1 }).limit(50).lean();
    console.log('Found', list.length, 'refresh tokens');
    console.log(JSON.stringify(list, null, 2));
    await mongoose.disconnect();
  }catch(e){
    console.error('Error', e.message);
    process.exit(1);
  }
})();
