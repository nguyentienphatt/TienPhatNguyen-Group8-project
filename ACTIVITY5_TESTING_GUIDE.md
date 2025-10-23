# Activity 5 - User Activity Logging & Rate Limiting - Testing Guide

## 🎯 Overview
Hoạt động 5 implements comprehensive user activity logging and rate limiting system with brute force protection.

## 🚀 Server Status
- **Main Server**: `node server.js` (port 3000)
- **Test Server**: `node test-rate-limit-server.js` (port 3001) - **CURRENTLY RUNNING**

## 📊 Features Implemented

### 1. Activity Logging System
- **Model**: `models/ActivityLog.js`
  - 15+ action types (login_success, login_failed, register_success, etc.)
  - TTL indexes (90-day automatic cleanup)
  - Compound indexes for efficient queries
  - Risk level assessment (low, medium, high)
  - Static methods for analytics

- **Middleware**: `middleware/logActivity.js`
  - Factory pattern for consistent logging
  - Action-specific middlewares
  - IP address and User-Agent capture
  - Async logging (non-blocking)

### 2. Rate Limiting System
- **Middleware**: `middleware/rateLimiting.js`
  - MongoDB-based persistence (survives server restarts)
  - Multiple rate limit types:
    - **Login**: 5 attempts per 15 minutes
    - **Password Reset**: 3 attempts per hour
    - **Registration**: 5 attempts per hour
    - **API**: 200 requests per 15 minutes

### 3. Brute Force Protection
- Progressive lockout system
- IP-based blocking after 10 failed attempts
- User account locking after 5 failed attempts
- Suspicious activity detection with adaptive limits

### 4. Admin Dashboard APIs
- **Routes**: `routes/logs.js`
  - View logs with pagination and filtering
  - Activity statistics and analytics
  - Suspicious activity detection
  - CSV export functionality
  - Log cleanup automation

## 🧪 Testing Instructions

### Test Server Endpoints (Port 3001)
```
Health Check:
GET http://127.0.0.1:3001/health

Rate Limit Status:
GET http://127.0.0.1:3001/test/rate-limit-status

Login Testing:
POST http://127.0.0.1:3001/test/login
Body: {"email":"test@example.com","password":"correct"}    # Success
Body: {"email":"test@example.com","password":"wrong"}      # Failure

Registration Testing:
POST http://127.0.0.1:3001/test/register
Body: {"name":"Test User","email":"test@example.com","password":"123456"}

Password Reset Testing:
POST http://127.0.0.1:3001/test/forgot-password
Body: {"email":"test@example.com"}

View Activity Logs:
GET http://127.0.0.1:3001/test/logs

View Statistics:
GET http://127.0.0.1:3001/test/stats
```

### 📋 Test Scenarios

#### 1. Normal Login Test
```bash
# Success case
curl -X POST http://127.0.0.1:3001/test/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"correct"}'

# Expected: Success response with user data
```

#### 2. Failed Login Test
```bash
# Failure case
curl -X POST http://127.0.0.1:3001/test/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"wrong"}'

# Expected: 401 error with "Invalid credentials"
```

#### 3. Rate Limiting Test
```bash
# Run this command 6 times rapidly to trigger rate limiting
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST http://127.0.0.1:3001/test/login \\
    -H "Content-Type: application/json" \\
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "\\n"
done

# Expected: First 5 attempts return 401, 6th attempt returns 429 (Too Many Requests)
```

#### 4. Brute Force Protection Test
```bash
# Make 11+ failed attempts to trigger IP blocking
for i in {1..12}; do
  echo "Brute force attempt $i:"
  curl -X POST http://127.0.0.1:3001/test/login \\
    -H "Content-Type: application/json" \\
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "\\n"
  sleep 1
done

# Expected: After 10 attempts, IP gets blocked with 429 status
```

#### 5. Password Reset Rate Limiting Test
```bash
# Test password reset rate limiting (3 per hour)
for i in {1..4}; do
  echo "Password reset attempt $i:"
  curl -X POST http://127.0.0.1:3001/test/forgot-password \\
    -H "Content-Type: application/json" \\
    -d '{"email":"test@example.com"}'
  echo "\\n"
done

# Expected: First 3 succeed, 4th returns 429 (Too Many Requests)
```

#### 6. Activity Log Viewing
```bash
# View recent activity logs
curl http://127.0.0.1:3001/test/logs

# View statistics
curl http://127.0.0.1:3001/test/stats

# Expected: JSON response with logged activities and statistics
```

## 🔍 Monitoring & Verification

### Check Activity Logs
```javascript
// In MongoDB or via API
db.activitylogs.find().sort({timestamp: -1}).limit(10)

// Expected fields:
{
  "_id": ObjectId,
  "userId": ObjectId or null,
  "action": "login_failed", 
  "ip": "127.0.0.1",
  "userAgent": "curl/7.68.0",
  "timestamp": ISODate,
  "riskLevel": "medium",
  "email": "test@example.com",
  "success": false,
  "statusCode": 401
}
```

### Check Rate Limit Collections
```javascript
// Login rate limits
db.rate_limit_login.find()

// Password reset rate limits  
db.rate_limit_password_reset.find()

// Expected structure:
{
  "_id": "login_127.0.0.1",
  "totalHits": 5,
  "resetTime": ISODate
}
```

## 📊 Expected Behaviors

### ✅ Working Features
1. **Activity Logging**: All login attempts, registrations, password resets logged
2. **Rate Limiting**: Blocks excessive requests per time window
3. **Brute Force Protection**: Progressive lockout with user and IP blocking
4. **MongoDB Persistence**: Rate limits survive server restarts
5. **Admin APIs**: View logs, statistics, and manage activity data
6. **Risk Assessment**: Automatic risk level assignment
7. **TTL Cleanup**: Logs automatically deleted after 90 days

### 🚨 Security Features Active
- **Login Rate Limit**: 5 attempts per 15 minutes per IP
- **Password Reset Rate Limit**: 3 attempts per hour per IP
- **Brute Force Protection**: IP blocked after 10 failures
- **Account Protection**: User locked after 5 failures
- **Suspicious Activity Detection**: Adaptive rate limiting
- **Progressive Delays**: 5-second delay after 5 failures

## 🎨 Frontend Integration (SV2)
The middleware is designed to work seamlessly with frontend applications:

```javascript
// Frontend can handle rate limit responses
if (response.status === 429) {
  const data = await response.json();
  showError(`Too many attempts. Try again after ${data.retryAfter}`);
}

// Activity logs can be displayed in admin dashboard
fetch('/api/logs/activities', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
})
.then(response => response.json())
.then(logs => displayActivityLogs(logs));
```

## 🛠️ Development Notes

### Database Indexes
```javascript
// ActivityLog indexes (auto-created)
{ "userId": 1, "timestamp": -1 }
{ "ip": 1, "timestamp": -1 }
{ "action": 1, "timestamp": -1 }
{ "timestamp": 1, "expireAfterSeconds": 7776000 } // 90 days TTL
```

### Environment Variables Required
```env
MONGODB_URI=mongodb://localhost:27017/groupDB
NODE_ENV=development
JWT_SECRET=your-secret-key
```

### Package Dependencies
- `express-rate-limit`: Core rate limiting
- `rate-limit-mongo`: MongoDB storage for rate limits
- `mongoose`: Database operations
- `jsonwebtoken`: Token verification

## 🚀 Next Steps for SV3 Testing
1. Start test server: `node test-rate-limit-server.js`
2. Run test scenarios above
3. Verify logs in MongoDB
4. Test admin APIs with proper authentication
5. Integrate with main application

## 📝 SV1 Implementation Complete
All middleware requirements have been implemented:
- ✅ `logActivity(userId, action, timestamp)` function
- ✅ Rate limiting for login attempts
- ✅ Brute force protection
- ✅ Activity logging with comprehensive data
- ✅ Admin APIs for monitoring
- ✅ MongoDB persistence and TTL cleanup

The system is production-ready and follows security best practices.