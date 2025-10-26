import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser } from '../store/authSlice';
import './Navigation.css';

const Navigation = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/">Redux Protected App</Link>
        </div>
        
        <div className="nav-links">
          <Link to="/" className="nav-link">
            Trang chủ
          </Link>
          
          <Link to="/profile" className="nav-link">
            Profile
          </Link>
          
          <Link to="/token-demo" className="nav-link">
            🔒 Token Demo
          </Link>
          
          {user?.role === 'admin' && (
            <Link to="/admin" className="nav-link">
              Admin
            </Link>
          )}
          
          <span className="nav-user">
            Xin chào, {user?.name || user?.email}
          </span>
          
          <button onClick={handleLogout} className="nav-logout">
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;