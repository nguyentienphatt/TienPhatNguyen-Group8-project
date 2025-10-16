const { verifyAccessToken } = require('../utils/jwt');

module.exports = function auth(required = true) {
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return required ? res.status(401).json({ message: 'No token' }) : next();
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid/expired access token' });
    }
  };
};
