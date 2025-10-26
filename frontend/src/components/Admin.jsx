import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Lấy token từ localStorage nếu Redux không có
      const authToken = token || localStorage.getItem('token');
      
      if (!authToken) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }
      
      console.log('Using token:', authToken); // Debug log
      
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      setUsers(response.data.users || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Lỗi khi tải danh sách người dùng');
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    try {
      const authToken = token || localStorage.getItem('token');
      
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      // Cập nhật danh sách sau khi xóa
      setUsers(users.filter(u => u._id !== userId));
      alert('Đã xóa người dùng thành công');
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xóa người dùng');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/role`, 
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Cập nhật danh sách sau khi thay đổi role
      setUsers(users.map(u => 
        u._id === userId ? { ...u, role: newRole } : u
      ));
      alert('Đã cập nhật vai trò thành công');
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi cập nhật vai trò');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div>Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Quản trị hệ thống</h2>
        <div className="admin-actions">
          <button 
            className="back-btn" 
            onClick={() => navigate('/profile')}
          >
            Quay lại Profile
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-info">
          <h3>Xin chào, {user?.name || user?.email}</h3>
          <p>Bạn đang truy cập với quyền quản trị viên</p>
        </div>

        <div className="users-section">
          <h3>Quản lý người dùng ({users.length})</h3>
          
          {error && (
            <div className="error-message">
              {error}
              <button onClick={fetchUsers}>Thử lại</button>
            </div>
          )}

          {users.length === 0 ? (
            <div className="no-users">
              <p>Không có người dùng nào</p>
              <button onClick={fetchUsers}>Tải lại</button>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Tên</th>
                    <th>Vai trò</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userData) => (
                    <tr key={userData._id}>
                      <td>{userData.email}</td>
                      <td>{userData.name || 'Chưa cập nhật'}</td>
                      <td>
                        <select
                          value={userData.role}
                          onChange={(e) => handleUpdateRole(userData._id, e.target.value)}
                          disabled={userData._id === user?._id}
                          className="role-select"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        {userData.createdAt 
                          ? new Date(userData.createdAt).toLocaleDateString('vi-VN')
                          : 'Không rõ'
                        }
                      </td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteUser(userData._id)}
                          disabled={userData._id === user?._id}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="admin-stats">
          <div className="stat-card">
            <h4>Thống kê</h4>
            <p>Tổng người dùng: {users.length}</p>
            <p>Admin: {users.filter(u => u.role === 'admin').length}</p>
            <p>User: {users.filter(u => u.role === 'user').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;