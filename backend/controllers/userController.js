const User = require('../models/User');

// GET /users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách users' });
  }
};

// POST /users
exports.createUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'name và email là bắt buộc' });
    }
    const doc = await User.create({ name, email });
    console.log('✅ Created user:', doc);
    res.status(201).json(doc); // <-- trả về document MongoDB với _id
  } catch (err) {
    console.error('POST /users error:', err);
    if (err.code === 11000) return res.status(409).json({ message: 'Email đã tồn tại' });
    res.status(500).json({ message: 'Lỗi server khi tạo user' });
  }
};
