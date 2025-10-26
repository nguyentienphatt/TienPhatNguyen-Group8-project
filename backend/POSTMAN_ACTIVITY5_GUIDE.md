# 🧪 Activity 5 - Postman Testing Guide

## Server Status
✅ **Server is running on http://127.0.0.1:3000**

## 📋 Postman Test Collection

### 1. **Health Check** ✅
```
GET http://127.0.0.1:3000/health
```
**Expected Response:**
```json
{
  "ok": true
}
```

### 2. **Test Registration** (SV1 Middleware: logRegister)
```
POST http://127.0.0.1:3000/auth/register
Content-Type: application/json

{
  "name": "Test User Activity5",
  "email": "activity5@test.com", 
  "password": "123456"
}
```
**Expected Response:**
```json
{
  "message": "Đăng ký thành công",
  "user": {
    "id": "...",
    "name": "Test User Activity5",
    "email": "activity5@test.com",
    "role": "user"
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### 3. **Test Successful Login** (SV1 Middleware: logLoginAttempt)
```
POST http://127.0.0.1:3000/auth/login
Content-Type: application/json

{
  "email": "activity5@test.com",
  "password": "123456"
}
```

### 4. **Test Failed Login** (Rate Limiting Test)
```
POST http://127.0.0.1:3000/auth/login
Content-Type: application/json

{
  "email": "activity5@test.com",
  "password": "wrongpassword"
}
```
**Run this 6 times rapidly to trigger rate limiting!**

**After 5 attempts, you'll get:**
```json
{
  "error": "Too many login attempts",
  "message": "You have exceeded the maximum number of login attempts. Please try again after 15 minutes.",
  "retryAfter": "15 minutes",
  "maxAttempts": 5
}
```

### 5. **Test Password Reset Rate Limiting**
```
POST http://127.0.0.1:3000/auth/forgot-password
Content-Type: application/json

{
  "email": "activity5@test.com"
}
```
**Run this 4 times rapidly to trigger rate limiting!**

### 6. **Create Admin User for Log Viewing**
```
POST http://127.0.0.1:3000/auth/register
Content-Type: application/json

{
  "name": "Admin Activity5",
  "email": "admin.activity5@test.com",
  "password": "admin123",
  "role": "admin"
}
```

### 7. **Login as Admin**
```
POST http://127.0.0.1:3000/auth/login
Content-Type: application/json

{
  "email": "admin.activity5@test.com",
  "password": "admin123"
}
```
**Copy the accessToken from response for next requests**

### 8. **View Activity Logs** (Admin Only)
```
GET http://127.0.0.1:3000/api/logs/activities
Authorization: Bearer <admin_access_token>
```
**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "action": "login_failed",
      "ip": "::1",
      "userAgent": "PostmanRuntime/7.32.3",
      "timestamp": "2025-10-23T...",
      "riskLevel": "high",
      "email": "activity5@test.com",
      "success": false,
      "statusCode": 401
    }
  ],
  "pagination": {...}
}
```

### 9. **View Activity Statistics**
```
GET http://127.0.0.1:3000/api/logs/statistics
Authorization: Bearer <admin_access_token>
```

### 10. **View Suspicious Activities**
```
GET http://127.0.0.1:3000/api/logs/suspicious
Authorization: Bearer <admin_access_token>
```

## 🚨 Rate Limiting Demo

### Login Rate Limiting Test
1. **Setup**: Make sure you have a user account
2. **Test**: Make 6 failed login attempts rapidly
3. **Expected**: First 5 attempts return 401, 6th returns 429
4. **Wait**: 15 minutes or restart server to reset

### Brute Force Protection Test  
1. **Setup**: Use different invalid passwords
2. **Test**: Make 11+ failed attempts
3. **Expected**: Progressive delays, then IP blocking

## 📊 Middleware Functions (SV1 Implementation)

### ✅ `logActivity(userId, action, timestamp)` 
- **Location**: `middleware/logActivity.js:7`
- **Usage**: Logs all user activities to MongoDB
- **Data Captured**: userId, action, IP, User-Agent, timestamp, risk level

### ✅ Rate Limit Login
- **Location**: `middleware/rateLimiting.js:25`
- **Limit**: 5 attempts per 15 minutes per IP
- **Storage**: MongoDB (persistent across restarts)

### ✅ Brute Force Protection
- **Location**: `middleware/rateLimiting.js:95`
- **Features**: Progressive lockout, IP blocking, user account protection

## 🔍 MongoDB Verification

Check the collections:
```javascript
// View activity logs
db.activitylogs.find().sort({timestamp: -1}).limit(10)

// View rate limit data
db.rate_limit_login.find()
```

## 📸 Screenshots for Submission

**Required Screenshots:**
1. ✅ Successful registration with activity logged
2. ✅ Failed login attempts (show multiple)
3. ✅ Rate limiting triggered (429 status)
4. ✅ Activity logs view (admin API)
5. ✅ MongoDB collections showing data
6. ✅ Statistics dashboard

## 🎯 SV1 Deliverables Complete

- ✅ **Middleware logActivity(userId, action, timestamp)** - Fully implemented
- ✅ **Rate limit login** - 5 attempts per 15 minutes  
- ✅ **Brute force protection** - Progressive lockout system
- ✅ **MongoDB integration** - Activity logs and rate limiting data
- ✅ **Admin APIs** - View logs, statistics, suspicious activities

## 🚀 Ready for Git Submission

The implementation is ready for:
```bash
git add .
git commit -m "Thêm logging và rate limiting"
git push origin feature/log-rate-limit
```

**All SV1 requirements completed successfully!** 🎉