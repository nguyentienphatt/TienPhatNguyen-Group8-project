import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return (
      <div className="home-container">
        <div className="home-content">
          <h1>Chào mừng bạn quay lại!</h1>
          <p>Xin chào, {user?.name || user?.email}</p>
          
          <div className="home-actions">
            <Link to="/profile" className="btn btn-primary">
              Xem Profile
            </Link>
            
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn btn-secondary">
                Quản trị
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Chào mừng đến với ứng dụng Redux Protected Routes</h1>
        <p>Đây là demo cho Hoạt động 6 - Frontend Redux & Protected Routes</p>
        
        <div className="features">
          <div className="feature">
            <h3>🔒 Protected Routes</h3>
            <p>Routes được bảo vệ bằng authentication</p>
          </div>
          
          <div className="feature">
            <h3>🔄 Redux State Management</h3>
            <p>Quản lý state với Redux Toolkit</p>
          </div>
          
          <div className="feature">
            <h3>👤 User Authentication</h3>
            <p>Đăng nhập và quản lý phiên làm việc</p>
          </div>
          
          <div className="feature">
            <h3>⚡ Real-time Navigation</h3>
            <p>Điều hướng thông minh dựa trên quyền</p>
          </div>
        </div>
        
        <div className="home-actions">
          <Link to="/login" className="btn btn-primary">
            Đăng nhập
          </Link>
        </div>
        
        <div className="test-info">
          <h4>Tài khoản thử nghiệm:</h4>
          <p><strong>Admin:</strong> admin@example.com / password</p>
          <p><strong>User:</strong> user@example.com / password</p>
        </div>
      </div>
    </div>
  );
};

export default Home;