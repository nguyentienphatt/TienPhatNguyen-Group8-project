const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');


(async () => {
try {
await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);


const email = process.argv[2];
if (!email) throw new Error('Thiếu email user');


const user = await User.findOne({ email });
if (!user) throw new Error('Không tìm thấy user với email ' + email);


const now = new Date();
const tokens = await RefreshToken.find({ user: user._id, revoked: false, expiresAt: { $gt: now } })
.sort({ createdAt: -1 })
.lean();


console.log('✅ Tokens còn hiệu lực:', tokens.length);
tokens.forEach((t, i) => console.log(`#${i + 1}`, { _id: t._id, expiresAt: t.expiresAt }));
process.exit(0);
} catch (e) {
console.error('❌', e.message);
process.exit(1);
}
})();