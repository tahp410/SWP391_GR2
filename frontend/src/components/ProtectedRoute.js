import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Component để bảo vệ các routes cần authentication
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    // Redirect đến login và lưu current location để redirect back sau khi login
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }
  
  return children;
};

// Component để bảo vệ Admin routes
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Component để bảo vệ Employee routes
export const EmployeeRoute = ({ children }) => {
  const { isAuthenticated, getUserRole } = useAuth();
  const isEmployee = isAuthenticated && (getUserRole() === 'employee' || getUserRole() === 'admin');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isEmployee) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};
