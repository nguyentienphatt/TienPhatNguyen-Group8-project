// ✅ controllers/userController.js (tối thiểu)
let users = [];

exports.getUsers = (req, res) => res.json(users);

exports.createUser = (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'name và email là bắt buộc' });
  const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const newUser = { id, name, email };
  users.push(newUser);
  res.status(201).json(newUser);
};

exports.updateUser = (req, res) => {
  const { id } = req.params;
  const i = users.findIndex(u => u.id == id);
  if (i === -1) return res.status(404).json({ message: 'User not found' });
  users[i] = { ...users[i], ...req.body };
  res.json(users[i]);
};

exports.deleteUser = (req, res) => {
  const { id } = req.params;
  const before = users.length;
  users = users.filter(u => u.id != id);
  if (users.length === before) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted' });
};
