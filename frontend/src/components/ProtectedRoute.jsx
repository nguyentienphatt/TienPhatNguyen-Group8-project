import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  // Kiểm tra authentication
  if (!isAuthenticated) {
    // Lưu trang hiện tại để redirect sau khi login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra quyền admin nếu cần
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default ProtectedRoute;