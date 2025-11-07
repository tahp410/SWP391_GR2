import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Khởi tạo user data từ localStorage hoặc sessionStorage
  useEffect(() => {
    try {
      // Kiểm tra localStorage trước (rememberMe = true)
      let token = localStorage.getItem('token');
      let userData = localStorage.getItem('user');
      
      // Nếu không có trong localStorage, kiểm tra sessionStorage (rememberMe = false)
      if (!token) {
        token = sessionStorage.getItem('token');
        userData = sessionStorage.getItem('user');
      }
      
      setIsAuthenticated(!!token);
      
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Kiểm tra authentication trên mỗi lần localStorage hoặc sessionStorage thay đổi
  useEffect(() => {
    const checkAuth = () => {
      // Kiểm tra localStorage trước (rememberMe = true)
      let token = localStorage.getItem('token');
      
      // Nếu không có trong localStorage, kiểm tra sessionStorage (rememberMe = false)
      if (!token) {
        token = sessionStorage.getItem('token');
      }
      
      setIsAuthenticated(!!token);
      
      if (!token) {
        setUser(null);
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', checkAuth);
    
    // Check immediately
    checkAuth();

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const login = (token, userData) => {
    // Token và userData đã được lưu vào localStorage hoặc sessionStorage trong login.js
    // Chỉ cần cập nhật state ở đây
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    // Xóa token và user từ cả localStorage và sessionStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const getUserRole = () => {
    return user?.role || 'customer';
  };

  const isAdmin = isAuthenticated && getUserRole() === 'admin';
  const isEmployee = isAuthenticated && (getUserRole() === 'employee' || getUserRole() === 'admin');

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    getUserRole,
    isAdmin,
    isEmployee,
    isInitialized
  };

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
