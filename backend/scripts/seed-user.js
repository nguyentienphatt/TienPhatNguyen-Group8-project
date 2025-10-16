// scripts/seed-user.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'groupDB' });
    console.log('Connected for seeding');

    let u = await User.findOne({ email: 'anhsv3@example.com' });
    if (!u) {
      u = await User.create({
        name: 'anhsv3',
        email: 'anhsv3@example.com',
        password: '123456',
      });
      console.log('Created:', u.email);
    } else {
      console.log('Exists:', u.email);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
})();
