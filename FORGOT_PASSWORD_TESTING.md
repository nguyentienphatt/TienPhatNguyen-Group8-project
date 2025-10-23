# 🧪 FORGOT PASSWORD TESTING GUIDE

## 🚀 Test Server đang chạy
- **Test Server:** http://127.0.0.1:3002
- **Health Check:** GET http://127.0.0.1:3002/health
- **View Users:** GET http://127.0.0.1:3002/test/users
- **View Sent Emails:** GET http://127.0.0.1:3002/test/sent-emails

## 👥 Test Accounts
```
Email: admin@example.com
Password: Admin@123
Role: admin

Email: user@example.com  
Password: User@123
Role: user
```

---

## 🔄 COMPLETE TESTING FLOW

### Step 1: Test Forgot Password API
```
POST http://127.0.0.1:3002/auth/forgot-password
Content-Type: application/json

{
  "email": "admin@example.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email reset password đã được gửi thành công (Mock mode)",
  "data": {
    "email": "admin@example.com",
    "resetTokenExpires": "2025-10-23T11:00:00.000Z",
    "resetToken": "abc123def456...",
    "mockEmailInfo": {
      "resetUrl": "http://localhost:3000/reset-password/abc123def456...",
      "sentAt": "2025-10-23T10:45:00.000Z",
      "expiresAt": "2025-10-23T11:00:00.000Z"
    }
  }
}
```

### Step 2: Check Sent Emails (Mock)
```
GET http://127.0.0.1:3002/test/sent-emails
```

**Response sẽ hiển thị:**
```json
{
  "success": true,
  "message": "Mock emails sent",
  "data": {
    "totalSent": 1,
    "emails": [
      {
        "to": "admin@example.com",
        "resetToken": "abc123def456...",
        "resetUrl": "http://localhost:3000/reset-password/abc123def456...",
        "sentAt": "2025-10-23T10:45:00.000Z",
        "expiresAt": "2025-10-23T11:00:00.000Z"
      }
    ]
  }
}
```

### Step 3: Copy Reset Token
- Từ response ở Step 1, copy **resetToken**
- Hoặc từ sent emails ở Step 2

### Step 4: Test Reset Password
```
POST http://127.0.0.1:3002/auth/reset-password/{PASTE_TOKEN_HERE}
Content-Type: application/json

{
  "newPassword": "NewPassword123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại thành công",
  "data": {
    "user": {
      "id": "1",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    "resetAt": "2025-10-23T10:50:00.000Z",
    "note": "Password has been updated in mock storage"
  }
}
```

### Step 5: Test Login với Password Mới
```
POST http://127.0.0.1:3002/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "NewPassword123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "1",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    "tokens": {
      "accessToken": "mock-jwt-token",
      "refreshToken": "mock-refresh-token"
    }
  }
}
```

---

## ⚠️ Error Testing Cases

### Case 1: Email không tồn tại
```
POST http://127.0.0.1:3002/auth/forgot-password

{
  "email": "notfound@example.com"
}
```
Response: 200 OK (security: không tiết lộ email có tồn tại)

### Case 2: Token không hợp lệ
```
POST http://127.0.0.1:3002/auth/reset-password/invalid-token

{
  "newPassword": "NewPassword123"
}
```
Response: 400 Bad Request - Token không hợp lệ

### Case 3: Token hết hạn (sau 15 phút)
- Đợi 15 phút hoặc modify code để test
- Response: 400 Bad Request - Token hết hạn

### Case 4: Password quá ngắn
```
POST http://127.0.0.1:3002/auth/reset-password/{valid-token}

{
  "newPassword": "123"
}
```
Response: 400 Bad Request - Password phải có ít nhất 6 ký tự

---

## 🎯 Demo Screenshots Cần Chụp

1. **Postman - Forgot Password Request & Response**
2. **Postman - Sent Emails Endpoint (Mock Email)**  
3. **Postman - Reset Password Request & Response**
4. **Postman - Login với Password Mới**
5. **Terminal Output** - Server logs của email sending

---

## 📧 Real Email Testing (Cho SV3)

Để test với Gmail thật:
1. Update .env với real Gmail credentials:
   ```
   GMAIL_EMAIL=your-gmail@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```
2. Use main server (port 3000) instead of test server
3. Check actual Gmail inbox for reset email
4. Email sẽ có professional HTML template với:
   - Reset button
   - Token để copy-paste
   - Security warnings
   - Expiration notice

---

## ✅ Success Criteria

- [x] Forgot password API hoạt động
- [x] Email được gửi (mock mode)  
- [x] Reset token được tạo và validate
- [x] Password được update thành công
- [x] Login với password mới thành công
- [x] Error cases được handle đúng
- [x] Security best practices áp dụng

**Ready for SV3 testing và SV2 frontend integration!** 🚀