# 🚀 Activity 6 - Postman Testing Guide
## Redux & Protected Routes API Testing

### 📋 **Setup Postman Environment**

1. **Mở Postman**
2. **Tạo Environment mới**:
   - Name: `Activity 6 - Redux APIs`
   - Variables:
     ```
     baseUrl = http://127.0.0.1:3000
     accessToken = (để trống, sẽ auto-fill)
     ```

---

## 🔐 **Step 1: Authentication Testing**

### **1.1 Login API (Lấy Token)**
```
Method: POST
URL: {{baseUrl}}/auth/login
Headers: Content-Type: application/json
Body (raw JSON):
{
  "email": "admin@example.com",
  "password": "123456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "accessToken": "eyJ0eXAiOiJKV1Q...",
  "user": {
    "id": "...",
    "name": "Admin Test",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**📝 Postman Script (Tests tab):**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.success && jsonData.accessToken) {
        pm.environment.set('accessToken', jsonData.accessToken);
        console.log('✅ Token saved:', jsonData.accessToken.substring(0, 20) + '...');
    }
}
```

### **1.2 Verify Token API**
```
Method: POST
URL: {{baseUrl}}/auth/verify-token
Headers: Authorization: Bearer {{accessToken}}
Body: (empty)
```

**Expected Response:**
```json
{
  "valid": true,
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "role": "admin"
  },
  "message": "Token is valid"
}
```

### **1.3 Enhanced User Profile**
```
Method: GET
URL: {{baseUrl}}/auth/user-profile
Headers: Authorization: Bearer {{accessToken}}
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Admin Test",
    "email": "admin@example.com",
    "role": "admin",
    "permissions": {
      "canViewAdmin": true,
      "canEditUsers": true,
      "canAccessProfile": true
    }
  },
  "message": "Profile retrieved successfully"
}
```

### **1.4 Check Admin Access**
```
Method: GET
URL: {{baseUrl}}/auth/check-admin
Headers: Authorization: Bearer {{accessToken}}
```

**Expected Response:**
```json
{
  "success": true,
  "isAdmin": true,
  "role": "admin",
  "message": "Admin access granted"
}
```

---

## 🛡️ **Step 2: Protected Routes Testing**

### **2.1 Protected Profile**
```
Method: GET
URL: {{baseUrl}}/protected/profile
Headers: Authorization: Bearer {{accessToken}}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Protected profile accessed",
  "data": {
    "user": {
      "id": "...",
      "name": "Admin Test",
      "email": "admin@example.com",
      "role": "admin"
    },
    "permissions": {
      "canEditProfile": true,
      "canViewAdmin": true
    }
  },
  "route": "/protected/profile",
  "timestamp": "2025-10-24T..."
}
```

### **2.2 Protected Dashboard**
```
Method: GET
URL: {{baseUrl}}/protected/dashboard
Headers: Authorization: Bearer {{accessToken}}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Dashboard accessed",
  "data": {
    "user": {
      "name": "Admin Test",
      "role": "admin"
    },
    "navigation": {
      "availableRoutes": [
        { "name": "Profile", "path": "/profile", "accessible": true },
        { "name": "Dashboard", "path": "/dashboard", "accessible": true },
        { "name": "Admin Panel", "path": "/admin", "accessible": true },
        { "name": "User Management", "path": "/users", "accessible": true }
      ]
    }
  },
  "route": "/protected/dashboard"
}
```

### **2.3 Protected Admin (Admin Only)**
```
Method: GET
URL: {{baseUrl}}/protected/admin
Headers: Authorization: Bearer {{accessToken}}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin panel accessed",
  "data": {
    "stats": {
      "totalUsers": 2,
      "currentAdmin": "admin@example.com"
    },
    "permissions": {
      "canManageUsers": true,
      "canViewLogs": true,
      "canAccessAllData": true
    }
  },
  "route": "/protected/admin"
}
```

### **2.4 Protected Users (Admin Only)**
```
Method: GET
URL: {{baseUrl}}/protected/users
Headers: Authorization: Bearer {{accessToken}}
```

### **2.5 Route Accessibility Test**
```
Method: GET
URL: {{baseUrl}}/protected/test-routes
Headers: Authorization: Bearer {{accessToken}}
```

---

## 🚫 **Step 3: Security Testing**

### **3.1 No Token Test (Should Fail)**
```
Method: GET
URL: {{baseUrl}}/protected/profile
Headers: (no Authorization header)
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Access token required",
  "code": "NO_TOKEN"
}
```

### **3.2 Invalid Token Test (Should Fail)**
```
Method: GET
URL: {{baseUrl}}/protected/profile
Headers: Authorization: Bearer invalid-token-123
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

### **3.3 User Access Admin Route (Should Fail)**

**First - Login as User:**
```
Method: POST
URL: {{baseUrl}}/auth/login
Headers: Content-Type: application/json
Body:
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Then - Try Admin Route with User Token:**
```
Method: GET
URL: {{baseUrl}}/protected/admin
Headers: Authorization: Bearer {{userToken}}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Admin access required",
  "code": "INSUFFICIENT_ROLE"
}
```

---

## 📊 **Step 4: Testing Checklist**

### ✅ **Authentication Tests**
- [ ] Login successful (200) với admin credentials
- [ ] Login successful (200) với user credentials  
- [ ] Login failed (401) với wrong credentials
- [ ] Token verification successful (200)
- [ ] Enhanced profile retrieval (200)
- [ ] Admin check successful (200) cho admin user
- [ ] Admin check failed (403) cho regular user

### ✅ **Protected Routes Tests**
- [ ] Protected profile accessible (200) với valid token
- [ ] Protected dashboard accessible (200) với valid token
- [ ] Protected admin accessible (200) với admin token
- [ ] Protected users accessible (200) với admin token
- [ ] Route test shows correct accessibility

### ✅ **Security Tests**
- [ ] No token returns 401 NO_TOKEN
- [ ] Invalid token returns 401 INVALID_TOKEN  
- [ ] User accessing admin route returns 403 INSUFFICIENT_ROLE
- [ ] All error responses have proper structure

---

## 🎯 **Expected Results Summary**

| Test Case | Admin Token | User Token | No Token |
|-----------|-------------|------------|----------|
| `/protected/profile` | ✅ 200 | ✅ 200 | ❌ 401 |
| `/protected/dashboard` | ✅ 200 | ✅ 200 | ❌ 401 |
| `/protected/admin` | ✅ 200 | ❌ 403 | ❌ 401 |
| `/protected/users` | ✅ 200 | ❌ 403 | ❌ 401 |

---

## 🔗 **Import Postman Collection**

1. **Download**: `Activity6_Postman_Collection.json`
2. **Import vào Postman**:
   - File → Import → Upload Files
   - Chọn `Activity6_Postman_Collection.json`
3. **Set Environment**: Activity 6 - Redux APIs
4. **Run Collection**: Chạy từng request theo thứ tự

---

**🎉 Activity 6 SV1 Backend Testing Complete!**

Sau khi test xong, bạn sẽ có:
- ✅ Verified authentication APIs hoạt động
- ✅ Confirmed protected routes security
- ✅ Validated role-based access control
- ✅ Screenshots cho documentation

**Ready cho SV2 implement Redux frontend!** 🚀