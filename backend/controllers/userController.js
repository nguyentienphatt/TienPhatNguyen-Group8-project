let users = [];

exports.getUsers = (req, res) => res.json(users);

exports.createUser = (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'name và email là bắt buộc' });
  const id = users.length ? users[users.length - 1].id + 1 : 1;
  const newUser = { id, name, email };
  users.push(newUser);
  res.status(201).json(newUser);
};

exports.createUsersBulk = (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ message: 'Body phải là mảng users' });
  }
  const created = [];
  req.body.forEach(({ name, email }) => {
    if (name && email) {
      const id = users.length ? users[users.length - 1].id + 1 : 1;
      const u = { id, name, email };
      users.push(u);
      created.push(u);
    }
  });
  res.status(201).json(created);
};
