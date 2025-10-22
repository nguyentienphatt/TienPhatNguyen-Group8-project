const jwt = require('jsonwebtoken');

module.exports = (required = true) => (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    if (required) return res.status(401).json({ message: 'Thiếu access token' });
    req.user = null; return next();
  }
  try {
    // ⚠️ Dùng đúng secret của ACCESS TOKEN
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc hết hạn' });
  }
};
