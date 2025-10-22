# Testing Guide - RBAC Implementation (SV3)

## ✅ Công việc đã hoàn thành

### 1. Cập nhật Schema User
- ✅ Thêm role: `'user'`, `'admin'`, `'moderator'`
- ✅ Default role: `'user'`
- File: `models/User.js`

### 2. Tạo dữ liệu mẫu
- ✅ Script seed: `scripts/seedUsers.js`
- ✅ Đã chạy và tạo 4 users mẫu thành công
- ✅ Thêm npm script: `npm run seed:users`

### 3. Git workflow
- ✅ Tạo branch: `feature/rbac`
- ✅ Commit: "Thêm phân quyền RBAC - SV3: Cập nhật schema User và tạo dữ liệu mẫu"
- ✅ Push lên GitHub

## 📝 Dữ liệu mẫu đã tạo

| Role | Email | Password | Name |
|------|-------|----------|------|
| admin | admin@example.com | Admin@123 | Admin User |
| moderator | moderator@example.com | Moderator@123 | Moderator User |
| user | user1@example.com | User@123 | Regular User 1 |
| user | user2@example.com | User@123 | Regular User 2 |

## 🧪 Hướng dẫn Test

### Test 1: Kiểm tra schema trong MongoDB
```bash
# Kết nối MongoDB và kiểm tra
use your_database_name
db.users.find({}, { name: 1, email: 1, role: 1 })
```

Kết quả mong đợi:
```json
[
  { "_id": "...", "name": "Admin User", "email": "admin@example.com", "role": "admin" },
  { "_id": "...", "name": "Moderator User", "email": "moderator@example.com", "role": "moderator" },
  { "_id": "...", "name": "Regular User 1", "email": "user1@example.com", "role": "user" },
  { "_id": "...", "name": "Regular User 2", "email": "user2@example.com", "role": "user" }
]
```

### Test 2: Đăng nhập với từng role
Sau khi SV1 hoàn thành API login, test với:

**Admin:**
```bash
POST /auth/login
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

**Moderator:**
```bash
POST /auth/login
{
  "email": "moderator@example.com",
  "password": "Moderator@123"
}
```

**User:**
```bash
POST /auth/login
{
  "email": "user1@example.com",
  "password": "User@123"
}
```

### Test 3: Kiểm tra role trong response
Response từ login API nên chứa thông tin role:
```json
{
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  "token": "..."
}
```

### Test 4: Chạy lại script seed (nếu cần)
```bash
# Xóa và tạo lại dữ liệu mẫu
node scripts/seedUsers.js
```

## 📸 Screenshots cần chụp để nộp

1. **Schema User trong code** (`models/User.js`)
   - Chụp phần định nghĩa trường `role`

2. **Script seedUsers.js**
   - Chụp file `scripts/seedUsers.js`
   - Chụp output sau khi chạy script

3. **Dữ liệu trong MongoDB**
   - Chụp kết quả query `db.users.find()`
   - Hoặc chụp MongoDB Compass/Atlas

4. **GitHub**
   - Chụp commit history
   - Chụp link PR: https://github.com/nguyentienphatt/TienPhatNguyen-Group8-project/pull/new/feature/rbac

## 🔗 Link PR GitHub
```
https://github.com/nguyentienphatt/TienPhatNguyen-Group8-project/pull/new/feature/rbac
```

## 📦 Files đã thay đổi

1. ✅ `models/User.js` - Cập nhật enum role
2. ✅ `scripts/seedUsers.js` - Script tạo dữ liệu mẫu
3. ✅ `package.json` - Thêm script `seed:users`
4. ✅ `RBAC_README.md` - Tài liệu hướng dẫn
5. ✅ `TESTING_GUIDE_SV3.md` - File này

## 🤝 Tích hợp với SV1 và SV2

- **SV1** sẽ tạo middleware `checkRole(['admin', 'moderator'])` để kiểm tra quyền
- **SV2** sẽ sử dụng role từ response để hiển thị UI khác nhau

## ✨ Tips cho demo

1. Chuẩn bị 3 tab browser/Postman với 3 role khác nhau
2. Đăng nhập với mỗi account và lưu token
3. Test API với các token khác nhau
4. Demo rằng role được trả về chính xác sau khi login
5. Sau khi SV1 hoàn thành middleware, demo phân quyền hoạt động

---
**Người thực hiện:** Sinh viên 3
**Ngày hoàn thành:** 22/10/2025
**Status:** ✅ Completed
