const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { findValidRefreshToken, rotateRefreshToken, signAccessToken, signRefreshToken } = require('../utils/jwt');

// Đăng nhập: trả về accessToken và refreshToken
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });

		const user = await User.findOne({ email }).select('+password');
		if (!user) return res.status(401).json({ message: 'User not found' });

		const isMatch = await user.comparePassword(password);
		if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

		const accessToken = signAccessToken(user);
		const refreshToken = signRefreshToken(user);
		await require('../utils/jwt').saveRefreshToken({ user, refreshToken });

		res.json({ accessToken, refreshToken });
	} catch (e) {
		res.status(500).json({ message: 'Login failed', error: e.message });
	}
});


router.post('/refresh', async (req, res) => {
try {
const { refreshToken } = req.body;
if (!refreshToken) return res.status(400).json({ message: 'Missing refreshToken' });


// Verify chữ ký & lấy userId
const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
const userId = payload.sub;


// Kiểm tra DB (hash) & hạn/ revoked
const valid = await findValidRefreshToken({ userId, refreshToken });
if (!valid) return res.status(401).json({ message: 'Refresh token invalid or expired' });


const user = await User.findById(userId);
if (!user) return res.status(404).json({ message: 'User not found' });


// Rotation: thu hồi token cũ, phát token mới
const newRt = signRefreshToken(user);
await rotateRefreshToken({ user, oldRefreshToken: refreshToken, newRefreshToken: newRt });


const at = signAccessToken(user);
res.json({ accessToken: at, refreshToken: newRt });
} catch (e) {
return res.status(401).json({ message: 'Refresh failed', error: e.message });
}
});


module.exports = router;