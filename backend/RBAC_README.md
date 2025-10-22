# RBAC - Role-Based Access Control

## Cấu trúc Roles

Hệ thống hỗ trợ 3 loại role:
- **user**: Người dùng thông thường
- **moderator**: Người điều hành (có quyền cao hơn user)
- **admin**: Quản trị viên (có toàn quyền)

## Schema User đã cập nhật

Trường `role` trong model User:
```javascript
role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' }
```

## Dữ liệu mẫu

Đã tạo sẵn 4 users mẫu với các role khác nhau:

### Admin
- Email: `admin@example.com`
- Password: `Admin@123`
- Role: `admin`

### Moderator
- Email: `moderator@example.com`
- Password: `Moderator@123`
- Role: `moderator`

### Users
1. Email: `user1@example.com` / Password: `User@123` / Role: `user`
2. Email: `user2@example.com` / Password: `User@123` / Role: `user`

## Cách sử dụng

### Tạo dữ liệu mẫu lại
```bash
node scripts/seedUsers.js
```
hoặc
```bash
npm run seed:users
```

### Kiểm tra trong MongoDB
Sau khi seed, bạn có thể kiểm tra trong MongoDB:
```javascript
db.users.find({}, { name: 1, email: 1, role: 1 })
```

## Tích hợp với middleware

Middleware `checkRole` sẽ được tạo bởi SV1 để kiểm tra quyền truy cập dựa trên role này.

Ví dụ sử dụng:
```javascript
// Chỉ admin mới truy cập được
router.delete('/users/:id', auth, checkRole(['admin']), deleteUser);

// Admin và Moderator đều truy cập được
router.put('/posts/:id', auth, checkRole(['admin', 'moderator']), updatePost);

// Tất cả role đều truy cập được (chỉ cần đăng nhập)
router.get('/profile', auth, getProfile);
```

## Testing

Bạn có thể test bằng cách:
1. Đăng nhập với các tài khoản khác nhau
2. Gọi các API có phân quyền khác nhau
3. Kiểm tra response trả về

---
**Sinh viên 3** - Phần việc: Cập nhật schema User và tạo dữ liệu mẫu ✅
