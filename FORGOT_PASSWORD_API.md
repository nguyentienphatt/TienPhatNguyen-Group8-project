# Forgot Password & Reset Password API Documentation

## 🔐 Hoạt động 4 - Password Recovery System

### Setup Requirements (SV3)

**1. Gmail SMTP Configuration**
```bash
# Trong file .env, cập nhật:
GMAIL_EMAIL=matuananhh@gmail.com
GMAIL_APP_PASSWORD=@Anh1402
FRONTEND_URL=http://localhost:3000
```

**2. Tạo Gmail App Password**
- Vào [Google Account Settings](https://myaccount.google.com/security)
- Enable 2-Step Verification
- Tạo App Password cho "Mail"
- Copy 16-character password vào .env

---

## 📡 API Endpoints

### 1. POST /auth/forgot-password
**Mô tả:** Gửi email reset password cho user

**URL:** `http://127.0.0.1:3000/auth/forgot-password`  
**Method:** POST  
**Content-Type:** application/json

#### Request Body:
```json
{
  "email": "user@example.com"
}
```

#### Success Response (200):
```json
{
  "success": true,
  "message": "Email reset password đã được gửi thành công",
  "data": {
    "email": "user@example.com",
    "resetTokenExpires": "2025-10-23T10:30:00.000Z",
    "resetToken": "abc123...xyz" // Chỉ hiện trong development mode
  }
}
```

#### Error Responses:
```json
// 400 - Thiếu email
{
  "success": false,
  "message": "Email là bắt buộc"
}

// 400 - Email không hợp lệ
{
  "success": false,
  "message": "Email không hợp lệ"
}

// 500 - Lỗi gửi email
{
  "success": false,
  "message": "Có lỗi khi gửi email. Vui lòng thử lại sau"
}
```

---

### 2. POST /auth/reset-password/:token
**Mô tả:** Đặt lại password bằng reset token

**URL:** `http://127.0.0.1:3000/auth/reset-password/{TOKEN}`  
**Method:** POST  
**Content-Type:** application/json

#### Request Body:
```json
{
  "newPassword": "NewSecurePassword123"
}
```

#### Success Response (200):
```json
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại thành công",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "user"
    },
    "resetAt": "2025-10-23T10:15:30.000Z"
  }
}
```

#### Error Responses:
```json
// 400 - Token không hợp lệ hoặc hết hạn
{
  "success": false,
  "message": "Token reset password không hợp lệ hoặc đã hết hạn"
}

// 400 - Password quá ngắn
{
  "success": false,
  "message": "Mật khẩu mới phải có ít nhất 6 ký tự"
}
```

---

## 🧪 Testing với Postman

### Test Flow Complete:

**Step 1: Test Forgot Password**
```
POST http://127.0.0.1:3000/auth/forgot-password
Content-Type: application/json

Body:
{
  "email": "admin@example.com"
}
```

**Step 2: Check Email**
- Kiểm tra Gmail inbox
- Copy reset token từ email hoặc từ API response (dev mode)

**Step 3: Test Reset Password** 
```
POST http://127.0.0.1:3000/auth/reset-password/{YOUR_TOKEN}
Content-Type: application/json

Body:
{
  "newPassword": "NewPassword123"
}
```

**Step 4: Test Login với Password Mới**
```
POST http://127.0.0.1:3000/auth/login
Content-Type: application/json

Body:
{
  "email": "admin@example.com",
  "password": "NewPassword123"
}
```

---

## 📧 Email Template Features

**Professional HTML Email Template:**
- 🎨 Responsive design với gradient styling
- 🔗 Clickable reset button
- 📋 Copy-paste token box  
- ⚠️ Security warnings và expiration notice
- 📱 Mobile-friendly layout
- 🌐 Both HTML và plain text versions

**Email Content:**
- Reset link: `{FRONTEND_URL}/reset-password/{token}`
- Token hiển thị trong box để copy
- Expiration: 15 phút
- Security warnings
- Professional branding

---

## 🔒 Security Features

1. **Token Security:**
   - SHA-256 hashed tokens in database
   - 15-minute expiration
   - Single-use tokens (cleared after use)

2. **Rate Limiting:**
   - Express rate limit cho /auth routes
   - Prevent spam requests

3. **Privacy Protection:**
   - Không tiết lộ email có tồn tại hay không
   - Password hashing với bcrypt
   - Secure headers trong email

4. **Error Handling:**
   - Comprehensive validation
   - Descriptive error messages
   - Development/production error modes

---

## 🎯 Integration Notes

**Cho SV2 (Frontend):**
- Tạo form `/forgot-password` với input email
- Tạo page `/reset-password/:token` với password input
- Handle success/error states
- Redirect sau khi reset thành công

**Cho SV3 (Testing):**
- Setup Gmail App Password trong .env
- Test email reception
- Verify token expiration
- Test complete password reset flow

---

## 🚀 Deployment Checklist

- [ ] Gmail SMTP credentials configured
- [ ] Frontend URL updated in .env
- [ ] Rate limiting configured
- [ ] Error logging setup
- [ ] Email template tested
- [ ] Security headers configured
- [ ] Password strength validation