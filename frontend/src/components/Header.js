import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown } from 'lucide-react';
import './Header.css';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, getUserRole, isAdmin, logout } = useAuth();

  const userInfo = user || { name: 'User', email: 'user@cine.com' };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <Link to="/home">
            <img src="https://dynamic.design.com/asset/logo/d6333ac1-12fb-4695-a153-5238580a8ee6/logo-search-grid-2x?logoTemplateVersion=1&v=638909241779300000&text=Cinema&layout=auto" alt="CGV" />
          </Link>
        </div>
        <nav className="navigation">
          <Link to="/movies" className="nav-link">Movies</Link>
          <Link to="/cinemas" className="nav-link">Cinemas</Link>
          <Link to="/showtimes" className="nav-link">Showtimes</Link>
          {isAdmin && (
            <Link to="/admin" className="nav-link admin-link">
              <span style={{ color: '#ffd700', fontWeight: 'bold' }}>⚙️ Admin</span>
            </Link>
          )}
        </nav>
        <div className="header-actions">
          
          
          {/* User Menu */}
          <div className="relative">
            <button 
              className="profile-btn-container flex items-center gap-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="profile-btn">👤</div>
              <ChevronDown size={16} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[9999] overflow-visible">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{userInfo.name}</p>
                      <p className="text-sm text-gray-500">{userInfo.email}</p>
                      <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full mt-1">
                        {getUserRole().toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleProfileClick}
                    className="menu-item"
                    style={{
                      display: 'flex',
                      width: '100%',
                      padding: '0.5rem 1rem',
                      textAlign: 'left',
                      color: '#374151',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <User size={16} />
                    <span>Thông tin cá nhân</span>
                  </button>
                  
                  <Link
                    to="/change-password"
                    className="menu-item"
                    onClick={() => setShowUserMenu(false)}
                    style={{
                      display: 'flex',
                      width: '100%',
                      padding: '0.5rem 1rem',
                      textAlign: 'left',
                      color: '#374151',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    🔒
                    <span>Đổi mật khẩu</span>
                  </Link>
                </div>
                
                {/* Logout */}
                <div className="border-t border-gray-200 pt-2">
                  <button
                    onClick={handleLogout}
                    className="menu-item logout"
                    style={{
                      display: 'flex',
                      width: '100%',
                      padding: '0.5rem 1rem',
                      textAlign: 'left',
                      color: '#dc2626',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Overlay to close menu when clicking outside */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-0"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;
