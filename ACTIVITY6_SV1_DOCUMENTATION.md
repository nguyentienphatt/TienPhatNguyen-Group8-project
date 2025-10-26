# Activity 6 - SV1 Backend Documentation
## Redux & Protected Routes API Support

### 📋 **SV1 Role: Backend Developer**
**Nhiệm vụ**: Backend hỗ trợ API, kiểm thử dữ liệu cho Redux state management và Protected Routes

---

## 🚀 **APIs Implemented**

### **Authentication APIs (Enhanced for Redux)**

#### 1. `POST /auth/verify-token`
**Purpose**: Verify JWT token validity for Redux state persistence
```json
Headers: { "Authorization": "Bearer <token>" }
Response: {
  "valid": true,
  "user": { "id", "email", "role" },
  "message": "Token is valid"
}
```

#### 2. `POST /auth/refresh-token`
**Purpose**: Refresh expired access tokens for seamless UX
```json
Body: { "refreshToken": "<refresh_token>" }
Response: {
  "success": true,
  "accessToken": "<new_token>",
  "user": { "id", "name", "email", "role" }
}
```

#### 3. `GET /auth/user-profile`
**Purpose**: Enhanced profile with permissions for Redux state
```json
Headers: { "Authorization": "Bearer <token>" }
Response: {
  "success": true,
  "user": {
    "id", "name", "email", "role", "createdAt",
    "permissions": {
      "canViewAdmin": boolean,
      "canEditUsers": boolean,
      "canAccessProfile": boolean
    }
  }
}
```

#### 4. `GET /auth/check-admin`
**Purpose**: Role verification for protected route navigation
```json
Headers: { "Authorization": "Bearer <token>" }
Response: {
  "success": true,
  "isAdmin": boolean,
  "role": "admin|user",
  "message": "Admin access granted"
}
```

---

### **Protected Routes APIs**

#### 1. `GET /protected/profile`
**Access**: Any authenticated user
```json
Headers: { "Authorization": "Bearer <token>" }
Response: {
  "success": true,
  "data": {
    "user": { "id", "name", "email", "role" },
    "permissions": { "canEditProfile": true }
  },
  "route": "/protected/profile"
}
```

#### 2. `GET /protected/dashboard`
**Access**: Any authenticated user
```json
Response: {
  "success": true,
  "data": {
    "user": { "name", "role" },
    "navigation": {
      "availableRoutes": [
        { "name": "Profile", "accessible": true },
        { "name": "Admin Panel", "accessible": <based_on_role> }
      ]
    }
  }
}
```

#### 3. `GET /protected/admin`
**Access**: Admin role only
```json
Response: {
  "success": true,
  "data": {
    "stats": { "totalUsers": number, "currentAdmin": "email" },
    "permissions": {
      "canManageUsers": true,
      "canViewLogs": true,
      "canAccessAllData": true
    }
  }
}
```

#### 4. `GET /protected/users`
**Access**: Admin role only
```json
Response: {
  "success": true,
  "data": {
    "users": [
      { "id", "name", "email", "role", "createdAt" }
    ],
    "count": number
  }
}
```

#### 5. `GET /protected/test-routes`
**Access**: Any authenticated user
**Purpose**: Test route accessibility based on user role
```json
Response: {
  "success": true,
  "data": {
    "userRole": "admin|user",
    "routeTests": [
      {
        "route": "/protected/admin",
        "accessible": boolean,
        "reason": "Admin role required"
      }
    ],
    "accessibleRoutes": number,
    "totalRoutes": number
  }
}
```

---

## 🔒 **Middleware Enhancements**

### **Enhanced Auth Middleware (`authActivity6.js`)**

#### `requireAuth`
- Validates JWT token
- Injects user data into `req.user`
- Returns structured error responses for Redux error handling

#### `requireAdmin`
- Combines `requireAuth` + role checking
- Specific admin access control

#### `requireRole(roles)`
- Flexible role-based access control
- Supports multiple roles: `requireRole(['admin', 'moderator'])`

#### `validateFields(fields)`
- Request body validation
- Returns missing fields for frontend form validation

---

## 📊 **Error Response Format**
All APIs return consistent error format for Redux error handling:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": { /* additional context */ }
}
```

**Error Codes**:
- `NO_TOKEN`: Missing authorization header
- `TOKEN_EXPIRED`: JWT token expired
- `INVALID_TOKEN`: Malformed or invalid token
- `USER_NOT_FOUND`: User doesn't exist
- `INSUFFICIENT_ROLE`: User lacks required role
- `MISSING_FIELDS`: Required request fields missing

---

## 🧪 **Testing Data & Scenarios**

### **Test Users Created**
```javascript
// Admin User
email: "admin@example.com"
password: "123456"
role: "admin"

// Regular User  
email: "user@example.com"
password: "123456"
role: "user"
```

### **Test Scenarios**

#### **Scenario 1: Successful Redux Flow**
1. Login → Get access token
2. Store token in Redux state
3. Use token for protected route access
4. Verify token on app refresh
5. Navigate based on user role

#### **Scenario 2: Token Expiration Handling**
1. Login with valid credentials
2. Wait for token expiration
3. Attempt protected route access
4. Receive `TOKEN_EXPIRED` error
5. Use refresh token to get new access token

#### **Scenario 3: Role-based Access Control**
1. Login as regular user
2. Access `/protected/profile` → ✅ Success
3. Access `/protected/dashboard` → ✅ Success
4. Access `/protected/admin` → ❌ 403 Forbidden
5. Login as admin
6. Access `/protected/admin` → ✅ Success

#### **Scenario 4: Unauthorized Access**
1. No token provided
2. Access any protected route
3. Receive `NO_TOKEN` error
4. Invalid token provided
5. Receive `INVALID_TOKEN` error

---

## 🔗 **Postman Testing**

### **Collection**: `Activity6_Postman_Collection.json`

**Test Order**:
1. **Authentication** folder:
   - Login (auto-saves token)
   - Verify Token
   - User Profile
   - Check Admin Access

2. **Protected Routes** folder:
   - All protected endpoints with token

3. **Security Tests** folder:
   - No token (should fail)
   - Invalid token (should fail)
   - User accessing admin route (should fail)

### **Environment Variables**:
- `baseUrl`: http://127.0.0.1:3000
- `accessToken`: Auto-populated from login

---

## 📈 **Redux Integration Support**

### **State Structure Supported**:
```javascript
// Redux Auth State
authState: {
  isAuthenticated: boolean,
  user: {
    id: string,
    name: string,
    email: string,
    role: 'admin' | 'user',
    permissions: {
      canViewAdmin: boolean,
      canEditUsers: boolean,
      canAccessProfile: boolean
    }
  },
  token: string,
  loading: boolean,
  error: string | null
}
```

### **Redux Actions Supported**:
- `login()` → POST /auth/login
- `logout()` → Clear state
- `verifyToken()` → POST /auth/verify-token
- `refreshToken()` → POST /auth/refresh-token
- `fetchProfile()` → GET /auth/user-profile
- `checkAdminAccess()` → GET /auth/check-admin

### **Protected Route Navigation**:
```javascript
// Route Guard Logic
const ProtectedRoute = ({ component: Component, requireAdmin }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  if (requireAdmin && user.role !== 'admin') {
    return <Redirect to="/unauthorized" />;
  }
  
  return <Component />;
};
```

---

## ✅ **SV1 Completion Checklist**

- [x] Enhanced authentication middleware
- [x] Token verification APIs
- [x] Protected routes implementation
- [x] Role-based access control
- [x] Error handling for Redux
- [x] Test data creation
- [x] Postman collection
- [x] API documentation
- [x] Security testing scenarios
- [x] Redux state support

---

## 🔄 **Git Workflow**

```bash
git checkout -b feature/redux-protected
git add .
git commit -m "SV1: Backend APIs hỗ trợ Redux & Protected Routes

- Enhanced auth middleware với error codes
- Token verification & refresh endpoints  
- Protected routes với role-based access
- Postman collection cho testing
- Documentation đầy đủ cho SV2"
git push origin feature/redux-protected
```

---

**Ready for SV2 Frontend Implementation!** 🚀

SV2 có thể sử dụng APIs này để implement Redux Toolkit store, Protected Routes, và state management cho frontend React application.