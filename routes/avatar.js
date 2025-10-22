// routes/avatar.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/checkRole');
const avatarUpload = require('../middleware/avatarUpload');
const User = require('../backend/models/User');
const cloudinary = require('../config/cloudinary');

/**
 * @route POST /api/avatar/upload
 * @desc Upload user avatar
 * @access Private (JWT required)
 */
router.post('/upload', requireAuth, avatarUpload.single, avatarUpload.processImage, avatarUpload.handleUploadError, async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh để upload'
      });
    }

    const userId = req.user.id;

    // Get current user to check for existing avatar
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    // Delete old avatar from Cloudinary if exists
    if (currentUser.avatar && currentUser.avatar.publicId) {
      try {
        await cloudinary.deleteImage(currentUser.avatar.publicId);
      } catch (deleteError) {
        console.warn('Không thể xóa ảnh cũ:', deleteError.message);
        // Continue with upload even if delete fails
      }
    }

    // Upload new avatar to Cloudinary
    const uploadResult = await cloudinary.uploadImage(req.file.buffer, {
      folder: 'avatars',
      public_id: `avatar_${userId}_${Date.now()}`,
      resource_type: 'image',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good', format: 'jpg' }
      ]
    });

    // Generate optimized URLs
    const avatarUrl = uploadResult.secure_url;
    const thumbnailUrl = cloudinary.getOptimizedUrl(uploadResult.public_id, {
      width: 150,
      height: 150,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto:low'
    });

    // Update user avatar in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatar: {
          publicId: uploadResult.public_id,
          url: avatarUrl,
          thumbnailUrl: thumbnailUrl
        }
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Avatar được upload thành công!',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar
        },
        uploadInfo: {
          publicId: uploadResult.public_id,
          originalSize: req.file.size,
          processedUrl: avatarUrl,
          thumbnailUrl: thumbnailUrl,
          uploadedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    
    // Handle specific Cloudinary errors
    if (error.http_code) {
      return res.status(400).json({
        success: false,
        message: 'Lỗi upload ảnh lên Cloudinary',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route DELETE /api/avatar/remove
 * @desc Remove user avatar
 * @access Private (JWT required)
 */
router.delete('/remove', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    // Check if user has avatar
    if (!currentUser.avatar || !currentUser.avatar.publicId) {
      return res.status(400).json({
        success: false,
        message: 'User chưa có avatar để xóa'
      });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.deleteImage(currentUser.avatar.publicId);
    } catch (deleteError) {
      console.warn('Không thể xóa ảnh từ Cloudinary:', deleteError.message);
      // Continue to remove from database even if Cloudinary delete fails
    }

    // Remove avatar from database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $unset: { avatar: 1 }
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Avatar đã được xóa thành công!',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: null
        }
      }
    });

  } catch (error) {
    console.error('Avatar remove error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/avatar/profile
 * @desc Get current user profile with avatar
 * @access Private (JWT required)
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin user thành công',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;