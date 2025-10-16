const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

// helpers
const ms = (str) => {
  const n = parseInt(str, 10);
  if (str.endsWith('ms')) return n;
  if (str.endsWith('s'))  return n * 1000;
  if (str.endsWith('m'))  return n * 60 * 1000;
  if (str.endsWith('h'))  return n * 60 * 60 * 1000;
  if (str.endsWith('d'))  return n * 24 * 60 * 60 * 1000;
  return n;
};
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const hashToken = (t) => bcrypt.hashSync(sha256(t), 10);
const compareToken = (t, h) => bcrypt.compare(sha256(t), h);

const buildAccess = (user) =>
  signAccessToken({ sub: user._id.toString(), role: user.role, email: user.email });
const buildRefresh = (user, familyId) =>
  signRefreshToken({ sub: user._id.toString(), familyId });

// helper to check mongoose connection
const mongoose = require('mongoose');
const isDbConnected = () => mongoose.connection.readyState === 1; // 1 = connected

exports.login = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ message: 'DB chưa sẵn sàng, thử lại sau' });
    const { email, password } = req.body;
    const ua = req.get('user-agent'); const ip = req.ip;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });

    const ok = user.comparePassword
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });

    const familyId = uuidv4();
    const accessToken = buildAccess(user);
    const refreshToken = buildRefresh(user, familyId);

    await RefreshToken.create({
      user: user._id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES || '7d')),
      userAgent: ua,
      ip,
    });

    res.json({
      message: 'Đăng nhập thành công',
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ message: 'DB chưa sẵn sàng, thử lại sau' });
    const { refreshToken } = req.body;
    const ua = req.get('user-agent'); const ip = req.ip;
    if (!refreshToken) return res.status(400).json({ message: 'Missing refreshToken' });

    let payload;
    try { payload = verifyRefreshToken(refreshToken); }
    catch { return res.status(401).json({ message: 'Invalid or expired refresh token' }); }

    const list = await RefreshToken.find({
      user: payload.sub, familyId: payload.familyId, revoked: false
    }).sort({ createdAt: -1 });

    const current = (await Promise.all(
      list.map(async t => (await compareToken(refreshToken, t.tokenHash)) ? t : null)
    )).find(Boolean);

    if (!current) {
      await RefreshToken.updateMany({ familyId: payload.familyId }, { $set: { revoked: true } });
      return res.status(401).json({ message: 'Refresh token reuse detected' });
    }

    current.revoked = true; await current.save();

    const user = await User.findById(payload.sub);
    const accessToken = buildAccess(user);
    const newRefreshToken = buildRefresh(user, payload.familyId);

    await RefreshToken.create({
      user: user._id,
      tokenHash: hashToken(newRefreshToken),
      familyId: payload.familyId,
      expiresAt: new Date(Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES || '7d')),
      userAgent: ua, ip
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.logout = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ message: 'DB chưa sẵn sàng, thử lại sau' });
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Missing refreshToken' });

    const all = await RefreshToken.find({ revoked: false });
    const matches = await Promise.all(all.map(async t =>
      (await compareToken(refreshToken, t.tokenHash)) ? t : null
    ));
    const found = matches.find(Boolean);
    if (found) { found.revoked = true; await found.save(); }

    res.json({ message: 'Logged out' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// List refresh tokens for current user (for SV3 testing) - protected route
exports.listMyRefreshTokens = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Thiếu token' });
    const list = await RefreshToken.find({ user: userId }).select('-tokenHash -__v').sort({ createdAt: -1 }).lean();
    return res.json({ tokens: list });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// Dev-only: seed a user for testing (POST /auth/seed-user)
exports.seedUser = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ message: 'DB chưa sẵn sàng' });
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email và password bắt buộc' });

    // don't allow seeding in production by mistake
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ message: 'Not allowed in production' });

    let user = await User.findOne({ email });
    if (user) return res.json({ message: 'User already exists', user: { id: user._id, email: user.email, name: user.name } });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    user = await User.create({ name: name || 'Seed User', email, password: hash });
    return res.json({ message: 'User created', user: { id: user._id, email: user.email, name: user.name } });
  } catch (e) {
    // Log full error on server for debugging
    console.error('seedUser error:', e);
    const payload = { message: e.message };
    if (process.env.NODE_ENV !== 'production') payload.stack = e.stack;
    return res.status(500).json(payload);
  }
};
