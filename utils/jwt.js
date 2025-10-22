const jwt = require('jsonwebtoken');

/**
 * Tạo access token
 */
const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m',
    issuer: 'group8-backend'
  });
};

/**
 * Tạo refresh token
 */
const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-refresh-secret', {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d',
    issuer: 'group8-backend'
  });
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-refresh-secret');
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
