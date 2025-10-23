// middleware/avatarUpload.js
const multer = require('multer');
const sharp = require('sharp');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF)!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1 // Only 1 file per request
  }
});

// Middleware to process image with Sharp
const processImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Process image with Sharp
    const processedBuffer = await sharp(req.file.buffer)
      .resize({
        width: 400,
        height: 400,
        fit: 'cover', // Crop to fit
        position: 'center'
      })
      .jpeg({ 
        quality: 90,
        progressive: true 
      })
      .toBuffer();

    // Replace buffer with processed image
    req.file.buffer = processedBuffer;
    req.file.mimetype = 'image/jpeg';
    req.file.originalname = req.file.originalname.replace(/\.[^/.]+$/, '.jpg');

    next();
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(400).json({
      success: false,
      message: 'Lỗi xử lý ảnh',
      error: error.message
    });
  }
};

// Error handling middleware for multer errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Kích thước tối đa 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được upload 1 file'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Trường file không hợp lệ. Sử dụng trường "avatar"'
      });
    }
  }
  
  if (error.message.includes('Chỉ chấp nhận file ảnh')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

module.exports = {
  single: upload.single('avatar'),
  processImage,
  handleUploadError
};