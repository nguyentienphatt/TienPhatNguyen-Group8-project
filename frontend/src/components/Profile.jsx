import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, logoutUser } from '../store/authSlice';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, token, isLoading, error } = useSelector((state) => state.auth);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    // Lấy thông tin user profile khi component mount
    if (!user) {
      dispatch(getUserProfile());
    }
  }, [dispatch, user]);

  // Initialize edit form when user data is available
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const navigateToAdmin = () => {
    navigate('/admin');
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setUpdateError('');
    // Reset form if canceling
    if (isEditing) {
      setEditForm({
        name: user.name || '',
        email: user.email || ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError('');

    try {
      const authToken = token || localStorage.getItem('token');
      
      if (!authToken) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const response = await axios.put('http://localhost:5000/api/user/profile', editForm, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      // Update Redux store with new user data
      dispatch(getUserProfile());
      setIsEditing(false);
      alert('Cập nhật thông tin thành công!');
      
    } catch (error) {
      setUpdateError(error.response?.data?.message || 'Lỗi khi cập nhật thông tin');
      console.error('Error updating profile:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div>Đang tải thông tin...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">Lỗi: {error}</div>
        <button onClick={() => dispatch(getUserProfile())}>
          Thử lại
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="error-container">
        <div className="error-message">Không tìm thấy thông tin người dùng</div>
        <button onClick={() => dispatch(getUserProfile())}>
          Tải lại
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>Thông tin cá nhân</h2>
          <button className="logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
        
        {isEditing ? (
          <form className="edit-form" onSubmit={handleUpdateProfile}>
            {updateError && (
              <div className="error-message">{updateError}</div>
            )}
            
            <div className="form-group">
              <label htmlFor="name">Tên:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editForm.name}
                onChange={handleInputChange}
                required
                placeholder="Nhập tên của bạn"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={editForm.email}
                onChange={handleInputChange}
                required
                placeholder="Nhập email của bạn"
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="save-btn"
                disabled={updateLoading}
              >
                {updateLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={handleEditToggle}
                disabled={updateLoading}
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-row">
              <label>Tên:</label>
              <span>{user.name || 'Chưa cập nhật'}</span>
            </div>
            
            <div className="info-row">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>
            
            <div className="info-row">
              <label>Vai trò:</label>
              <span className={`role-badge ${user.role}`}>
                {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </span>
            </div>
            
            <div className="info-row">
              <label>Ngày tạo:</label>
              <span>
                {user.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                  : 'Không rõ'
                }
              </span>
            </div>
          </div>
        )}

        <div className="profile-actions">
          {user.role === 'admin' && (
            <button className="admin-btn" onClick={navigateToAdmin}>
              Truy cập trang Admin
            </button>
          )}
          
          {!isEditing && (
            <button className="edit-btn" onClick={handleEditToggle}>
              Chỉnh sửa thông tin
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;