const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User'); // cần có User model
const { signRefreshToken, saveRefreshToken } = require('../utils/jwt');


(async () => {
try {
await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);


const email = process.argv[2]; // ví dụ: node scripts/rt_create.js phat@example.com
if (!email) throw new Error('Thiếu email user');


const user = await User.findOne({ email });
if (!user) throw new Error('Không tìm thấy user với email ' + email);


const rt = signRefreshToken(user);
await saveRefreshToken({ user, refreshToken: rt });


console.log('✅ Tạo & lưu refresh token OK');
console.log('Refresh token (đưa cho client demo):\n', rt);
process.exit(0);
} catch (e) {
console.error('❌', e.message);
process.exit(1);
}
})();