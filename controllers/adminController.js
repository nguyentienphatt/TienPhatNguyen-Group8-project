const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Lấy danh sách tất cả users (chỉ admin)
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    // Tạo filter object
    const filter = {};
    if (role && ['user', 'admin', 'moderator'].includes(role)) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      message: 'Lấy danh sách users thành công',
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách users' });
  }
};

/**
 * Lấy thông tin chi tiết một user (chỉ admin)
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    res.json({
      message: 'Lấy thông tin user thành công',
      user
    });
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin user' });
  }
};

/**
 * Tạo user mới (chỉ admin)
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin bắt buộc: name, email, password' 
      });
    }

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ 
        message: 'Role không hợp lệ. Chỉ chấp nhận: user, admin, moderator' 
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Tạo user mới
    const newUser = new User({
      name,
      email,
      password, // Sẽ được hash trong pre-save hook
      role
    });

    await newUser.save();

    res.status(201).json({
      message: 'Tạo user thành công',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo user' });
  }
};

/**
 * Cập nhật thông tin user (chỉ admin)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    // Kiểm tra role hợp lệ
    if (role && !['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ 
        message: 'Role không hợp lệ. Chỉ chấp nhận: user, admin, moderator' 
      });
    }

    // Kiểm tra email mới có bị trùng không (nếu thay đổi email)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
    }

    // Cập nhật thông tin
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Cập nhật user thành công',
      user: updatedUser
    });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật user' });
  }
};

/**
 * Đổi mật khẩu user (chỉ admin)
 */
const changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự' 
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    // Cập nhật mật khẩu (sẽ được hash trong pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('changeUserPassword error:', error);
    res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu' });
  }
};

/**
 * Xóa user (chỉ admin)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Không cho phép admin xóa chính mình
    if (id === req.user.id || id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Không thể xóa chính mình' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    await User.findByIdAndDelete(id);

    res.json({
      message: 'Xóa user thành công',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa user' });
  }
};

/**
 * Lấy thống kê users theo role (chỉ admin)
 */
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    res.json({
      message: 'Lấy thống kê users thành công',
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: stats
      }
    });
  } catch (error) {
    console.error('getUserStats error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê users' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changeUserPassword,
  deleteUser,
  getUserStats
};