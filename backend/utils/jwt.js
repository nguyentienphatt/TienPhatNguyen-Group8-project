// backend/utils/jwt.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ms = require('ms');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '7d';

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), typ: 'refresh' },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TTL }
  );
}

async function saveRefreshToken({ user, refreshToken, req }) {
  const tokenHash = sha256(refreshToken);
  const ttlMs = ms(REFRESH_TTL);
  const expiresAt = new Date(Date.now() + ttlMs);
  const doc = await RefreshToken.create({
    user: user._id,
    tokenHash,
    createdByIp: req?.ip,
    userAgent: req?.headers?.['user-agent'],
    expiresAt,
  });
  return doc;
}

async function rotateRefreshToken({ user, oldRefreshToken, newRefreshToken }) {
  const oldHash = sha256(oldRefreshToken);
  const newHash = sha256(newRefreshToken);
  const now = new Date();

  const oldDoc = await RefreshToken.findOne({ user: user._id, tokenHash: oldHash, revoked: false });
  if (oldDoc) {
    oldDoc.revoked = true;
    oldDoc.revokedAt = now;
    oldDoc.replacedByTokenHash = newHash;
    await oldDoc.save();
  }

  const ttlMs = ms(REFRESH_TTL);
  return await RefreshToken.create({
    user: user._id,
    tokenHash: newHash,
    expiresAt: new Date(Date.now() + ttlMs),
  });
}

async function findValidRefreshToken({ userId, refreshToken }) {
  const tokenHash = sha256(refreshToken);
  const now = new Date();
  return await RefreshToken.findOne({
    user: userId,
    tokenHash,
    revoked: false,
    expiresAt: { $gt: now },
  });
}

async function revokeToken({ userId, refreshToken }) {
  const tokenHash = sha256(refreshToken);
  const doc = await RefreshToken.findOne({ user: userId, tokenHash, revoked: false });
  if (!doc) return null;
  doc.revoked = true;
  doc.revokedAt = new Date();
  await doc.save();
  return doc;
}

async function revokeAllForUser(userId) {
  return RefreshToken.updateMany(
    { user: userId, revoked: false },
    { $set: { revoked: true, revokedAt: new Date() } }
  );
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  saveRefreshToken,
  rotateRefreshToken,
  findValidRefreshToken,
  revokeToken,
  revokeAllForUser,
};
