const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình multer để lưu file tạm thời
const storage = multer.memoryStorage(); // Lưu trong memory để xử lý với Sharp

const fileFilter = (req, file, cb) => {
  // Chỉ cho phép các file ảnh
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1
  },
  fileFilter: fileFilter
});

/**
 * Middleware xử lý resize ảnh với Sharp
 */
const processImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file nào được upload'
      });
    }

    // Tạo tên file unique
    const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpeg`;
    const filepath = path.join(uploadsDir, filename);

    // Xử lý ảnh với Sharp
    await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 90,
        progressive: true
      })
      .toFile(filepath);

    // Thêm thông tin file đã xử lý vào req
    req.processedFile = {
      filename: filename,
      filepath: filepath,
      originalName: req.file.originalname,
      mimetype: 'image/jpeg',
      size: fs.statSync(filepath).size
    };

    next();
  } catch (error) {
    console.error('Image processing error:', error);
    
    if (error.message.includes('Input file contains unsupported image format')) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ảnh không được hỗ trợ'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý ảnh'
    });
  }
};

/**
 * Middleware xử lý lỗi Multer
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File quá lớn. Kích thước tối đa là 10MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Chỉ được upload tối đa 1 file'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Field name không đúng. Sử dụng field "avatar"'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Lỗi upload file'
        });
    }
  }

  if (err.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)'
    });
  }

  next(err);
};

/**
 * Cleanup function để xóa file tạm
 */
const cleanupTempFile = (filepath) => {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
};

module.exports = {
  upload: upload.single('avatar'),
  processImage,
  handleMulterError,
  cleanupTempFile
};