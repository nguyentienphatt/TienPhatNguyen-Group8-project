exports.deleteUser = (req, res) => {
  const { id } = req.params;
  const before = users.length;
  users = users.filter(u => u.id != id);
  if (users.length === before) return res.status(404).json({ message: "User not found" });

  // >>> THAY DÒNG NÀY THÀNH PHIÊN BẢN A <<<
res.json({ message: "User deleted (A)" });
};
