import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const getStoredAuth = () => {
  try {
    const localToken = localStorage.getItem('token');
    const localUser = localStorage.getItem('user');
    if (localToken && localUser) {
      return { token: localToken, user: JSON.parse(localUser), remember: true };
    }

    const sessionToken = sessionStorage.getItem('token');
    const sessionUser = sessionStorage.getItem('user');
    if (sessionToken && sessionUser) {
      return { token: sessionToken, user: JSON.parse(sessionUser), remember: false };
    }
  } catch (err) {
    console.error('Error parsing stored auth:', err);
  }
  return { token: null, user: null, remember: false };
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Khởi tạo user data từ localStorage
  useEffect(() => {
    try {
      const stored = getStoredAuth();
      setIsAuthenticated(Boolean(stored.token));
      if (stored.user) {
        setUser(stored.user);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Kiểm tra authentication trên mỗi lần localStorage thay đổi
  useEffect(() => {
    const checkAuth = () => {
      const stored = getStoredAuth();
      setIsAuthenticated(Boolean(stored.token));
      
      if (!stored.token) {
        setUser(null);
      } else if (stored.user) {
        setUser(stored.user);
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

  const login = (token, userData, remember = false) => {
    const storage = remember ? localStorage : sessionStorage;
    const opposite = remember ? sessionStorage : localStorage;

    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(userData));

    opposite.removeItem('token');
    opposite.removeItem('user');

    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
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
