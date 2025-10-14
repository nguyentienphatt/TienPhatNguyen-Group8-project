// backend/controllers/userController.js
const User = require('../models/User'); // đảm bảo file models/User.js tồn tại

exports.getUsers = async (_req, res) => {
  const list = await User.find();
  res.json(list);
};

exports.createUser = async (req, res) => {
  const u = await User.create(req.body);
  res.status(201).json(u);
};

exports.updateUser = async (req, res) => {
  const u = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!u) return res.status(404).json({ message: 'Not found' });
  res.json(u);
};

exports.deleteUser = async (req, res) => {
  const u = await User.findByIdAndDelete(req.params.id);
  if (!u) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'deleted', id: req.params.id });
};
