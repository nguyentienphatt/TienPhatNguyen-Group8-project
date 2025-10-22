const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); // đường dẫn này phải đúng

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'group8_avatars',
    resource_type: 'image',
    public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
  }),
});

module.exports = multer({ storage });
