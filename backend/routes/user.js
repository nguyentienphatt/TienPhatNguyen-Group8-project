// backend/routes/user.js
const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// /users
router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);      // <— QUAN TRỌNG
router.delete('/:id', deleteUser);   // <— QUAN TRỌNG

module.exports = router;
