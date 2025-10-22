const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { revokeToken } = require('../utils/jwt');


(async () => {
try {
await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);


const email = process.argv[2];
const raw = process.argv[3]; // refresh token raw string
if (!email || !raw) throw new Error('Cách dùng: node scripts/rt_revoke.js <email> <refreshToken>');


const user = await User.findOne({ email });
if (!user) throw new Error('Không tìm thấy user ' + email);


const doc = await revokeToken({ userId: user._id, refreshToken: raw });
if (!doc) console.log('⚠️ Không tìm thấy token hợp lệ để revoke');
else console.log('✅ Đã revoke token:', doc._id.toString());


process.exit(0);
} catch (e) {
console.error('❌', e.message);
process.exit(1);
}
})();