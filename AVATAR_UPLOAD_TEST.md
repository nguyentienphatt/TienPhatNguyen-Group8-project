# Avatar Upload API Test Guide

## 🧪 Test Server đang chạy
- Test Server: http://127.0.0.1:3001 
- Health Check: GET http://127.0.0.1:3001/health
- Login API: POST http://127.0.0.1:3001/auth/login

**Test Credentials:**
- Email: admin@example.com
- Password: Admin@123

## API Testing Steps

### Step 1: Login để lấy JWT Token

**URL:** `http://127.0.0.1:3001/auth/login`  
**Method:** POST  
**Content-Type:** application/json

#### Body (raw JSON):
```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

#### Expected Response:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "mock-admin-id-123",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    "tokens": {
      "accessToken": "mock-jwt-token-for-testing-avatar-upload-api",
      "refreshToken": "mock-refresh-token"
    }
  }
}
```

**⚠️ Copy accessToken từ response để dùng cho upload API**

---

### Step 2: Upload Avatar

**URL:** `http://127.0.0.1:3001/api/avatar/upload`  
**Method:** POST  
**Content-Type:** multipart/form-data

#### Headers:
```
Authorization: Bearer mock-jwt-token-for-testing-avatar-upload-api
```

### POST /api/avatar/upload
Upload avatar image với Multer + Sharp processing

**URL:** `http://127.0.0.1:3001/api/avatar/upload`  
**Method:** POST  
**Content-Type:** multipart/form-data

#### Postman Setup:
1. Mở Postman
2. Tạo request mới với method POST
3. URL: `http://127.0.0.1:3001/api/avatar/upload`
4. Vào tab **Body**
5. Chọn **form-data**
6. Thêm key mới:
   - **Key:** `avatar` (type: File)
   - **Value:** Chọn file ảnh (JPG, PNG, GIF)

#### Expected Response (Success):
```json
{
  "success": true,
  "message": "Avatar được upload thành công! (Test mode)",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Test User", 
      "email": "test@example.com",
      "avatar": {
        "publicId": "test_avatar_1234567890",
        "url": "https://res.cloudinary.com/test/image/upload/test_avatar_1234567890.jpg",
        "thumbnailUrl": "https://res.cloudinary.com/test/image/upload/test_avatar_1234567890.jpg?w=150&h=150"
      }
    },
    "uploadInfo": {
      "publicId": "test_avatar_1234567890",
      "originalSize": 1024000,
      "processedUrl": "https://res.cloudinary.com/test/image/upload/test_avatar_1234567890.jpg",
      "thumbnailUrl": "https://res.cloudinary.com/test/image/upload/test_avatar_1234567890.jpg?w=150&h=150",
      "uploadedAt": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

#### Error Cases:

**No file uploaded:**
```json
{
  "success": false,
  "message": "Vui lòng chọn file ảnh để upload"
}
```

**Invalid file type:**
```json
{
  "success": false,
  "message": "Chỉ chấp nhận file ảnh (JPG, PNG, GIF)!"
}
```

**File too large (>10MB):**
```json
{
  "success": false,
  "message": "File quá lớn. Kích thước tối đa 10MB"
}
```

## Image Processing Features

Khi upload, ảnh sẽ được xử lý với Sharp:
- **Resize:** 400x400 pixels
- **Format:** JPEG
- **Quality:** 90%
- **Fit:** Cover (crop to fit, centered)

## Console Output
Server sẽ log chi tiết trong terminal:
- File presence check
- File details (name, mimetype, size)
- Processing steps
- Simulated Cloudinary upload result

## Test Files
Thử upload với các loại file:
- ✅ JPG/JPEG images
- ✅ PNG images  
- ✅ GIF images
- ❌ PDF files (should reject)
- ❌ Text files (should reject)
- ❌ Files >10MB (should reject)

## Notes
- Server này chạy ở **test mode** - không kết nối thật với Cloudinary
- Không lưu vào database (chỉ simulate response)
- Auth được mock với test user
- Production server sẽ cần JWT token thật và Cloudinary credentials