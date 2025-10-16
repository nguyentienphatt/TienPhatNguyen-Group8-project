// scripts/test-mongo.js
// Usage: node scripts/test-mongo.js
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
console.log('Using MONGODB_URI (first 80 chars):', String(uri||'').slice(0,80));

(async ()=>{
  try{
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB successfully');
    await mongoose.disconnect();
  }catch(e){
    console.error('MongoDB connect error message:', e.message);
    console.error('Full error:');
    console.error(e);
    process.exitCode = 1;
  }
})();
