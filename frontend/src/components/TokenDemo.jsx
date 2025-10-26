import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getUserProfile } from '../store/authSlice';
import axios from 'axios';
import './TokenDemo.css';

const TokenDemo = () => {
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [refreshToken, setRefreshToken] = useState('');

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(getUserProfile());
    }
    
    // Lấy refresh token từ localStorage nếu có
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (storedRefreshToken) {
      setRefreshToken(storedRefreshToken);
    }
  }, [dispatch, user, isAuthenticated]);

  const handleRefreshToken = async () => {
    try {
      const response = await axios.post('http://localhost:5000/auth/refresh', {
        refreshToken: refreshToken
      });
      
      if (response.data.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
        alert('Refresh token thành công!');
      }
    } catch (error) {
      alert('Refresh token thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleGetNewToken = async () => {
    try {
      const response = await axios.post('http://localhost:5000/auth/refresh-token', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.refreshToken) {
        setRefreshToken(response.data.refreshToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        alert('Tạo refresh token mới thành công!');
      }
    } catch (error) {
      alert('Tạo refresh token thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      alert('Logout thành công!');
      window.location.href = '/login';
    } catch (error) {
      alert('Logout thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="token-demo-container">
        <div className="not-authenticated">
          <h2>🔒 Bạn chưa đăng nhập</h2>
          <p>Vui lòng đăng nhập để xem Token Test & Demo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="token-demo-container">
      <div className="token-demo-card">
        <div className="demo-header">
          <h2>🔒 Token Test & Demo</h2>
        </div>

        <div className="token-info-section">
          <h3>📋 Thông tin Token hiện tại</h3>
          
          <div className="info-row">
            <span className="info-label">👤 User:</span>
            <span className="info-value">{user?.email || 'N/A'}</span>
          </div>

          <div className="info-row">
            <span className="info-label">🎫 Access Token:</span>
            <div className="token-display">
              <code className="token-text">
                {token ? `${token.substring(0, 50)}...` : 'Không có token'}
              </code>
              <button 
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(token);
                  alert('Đã copy access token!');
                }}
              >
                Copy
              </button>
            </div>
          </div>

          <div className="info-row">
            <span className="info-label">🔄 Refresh Token:</span>
            <div className="token-display">
              <code className="token-text">
                {refreshToken ? `${refreshToken.substring(0, 50)}...` : 'Không có refresh token'}
              </code>
              <button 
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(refreshToken);
                  alert('Đã copy refresh token!');
                }}
              >
                Copy
              </button>
            </div>
          </div>

          <div className="info-row">
            <span className="info-label">⏰ Ngày tạo:</span>
            <span className="info-value">
              {user?.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : 'N/A'}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">🕒 Thời gian còn lại:</span>
            <span className="info-value status-active">Đang hoạt động</span>
          </div>
        </div>

        <div className="demo-actions">
          <h3>⚡ Chức năng Test</h3>
          
          <div className="action-buttons">
            <button className="btn btn-refresh" onClick={handleRefreshToken}>
              🔄 Manual Refresh
            </button>
            
            <button className="btn btn-new-token" onClick={handleGetNewToken}>
              🆕 Tạo mới Token
            </button>
            
            <button className="btn btn-logout" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>

        <div className="demo-info">
          <h4>ℹ️ Hướng dẫn sử dụng:</h4>
          <ul>
            <li><strong>Manual Refresh:</strong> Làm mới access token bằng refresh token</li>
            <li><strong>Tạo mới Token:</strong> Tạo refresh token mới</li>
            <li><strong>Logout:</strong> Đăng xuất và xóa tất cả token</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TokenDemo;