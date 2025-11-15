import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Film, 
  Ticket, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User,
  Bell,
  Search,
  TicketPercent,
  ShoppingBag,
  Package,
  Monitor,
  Calendar,
  CheckCircle,
  UserPlus,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../style/adminLayout.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const AdminLayout = ({ children, title = 'Dashboard' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, logout } = useAuth();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const userInfo = user || { name: 'Admin', email: 'admin@cine.com', role: 'admin' };

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch recent activities as notifications
  const fetchNotifications = async () => {
    try {
      const headers = { headers: { Authorization: `Bearer ${token}` } };
      const bookingsRes = await axios.get(`${API_BASE}/bookings/history/all`, headers);
      
      // Handle different response structures
      let bookingsData = [];
      if (Array.isArray(bookingsRes.data)) {
        bookingsData = bookingsRes.data;
      } else if (bookingsRes.data?.bookings && Array.isArray(bookingsRes.data.bookings)) {
        bookingsData = bookingsRes.data.bookings;
      } else if (bookingsRes.data?.data && Array.isArray(bookingsRes.data.data)) {
        bookingsData = bookingsRes.data.data;
      }
      
      const recentBookings = bookingsData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(booking => ({
          id: booking._id,
          type: 'booking',
          title: booking.paymentStatus === 'completed' ? 'Đặt vé thành công' : 'Đặt vé mới',
          message: `${booking.userId?.username || 'Khách hàng'} - ${booking.movieId?.title || 'Phim'}`,
          time: formatTimeAgo(booking.createdAt),
          icon: booking.paymentStatus === 'completed' ? 'success' : 'pending',
          isRead: false
        }));

      setNotifications(recentBookings);
      setUnreadCount(recentBookings.length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    return `${Math.floor(seconds / 86400)} ngày trước`;
  };

  // Search functionality with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    try {
      const headers = { headers: { Authorization: `Bearer ${token}` } };
      const [moviesRes, branchesRes, usersRes, bookingsRes] = await Promise.all([
        axios.get(`${API_BASE}/movies`, headers).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/branches`, headers).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/users`, headers).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/bookings/history/all`, headers).catch(() => ({ data: [] }))
      ]);

      const results = [];
      const lowerQuery = query.toLowerCase();

      // Handle different response structures
      const movies = Array.isArray(moviesRes.data) ? moviesRes.data : (moviesRes.data?.movies || []);
      const branches = Array.isArray(branchesRes.data) ? branchesRes.data : (branchesRes.data?.branches || []);
      const users = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.users || []);
      const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : (bookingsRes.data?.bookings || []);

      console.log('Search data:', { movies: movies.length, branches: branches.length, users: users.length, bookings: bookings.length });

      // Search movies
      movies.forEach(item => {
        const title = String(item.title || '').toLowerCase();
        const genre = String(item.genre || '').toLowerCase();
        
        if (title.includes(lowerQuery) || genre.includes(lowerQuery)) {
          results.push({
            id: item._id,
            type: 'movie',
            title: item.title || 'Phim',
            subtitle: item.genre || 'Phim',
            path: '/admin/movies',
            icon: 'film'
          });
        }
      });

      // Search branches
      branches.forEach(item => {
        const name = String(item.name || '').toLowerCase();
        const location = String(item.location || '').toLowerCase();
        const address = String(item.address || '').toLowerCase();
        
        if (name.includes(lowerQuery) || location.includes(lowerQuery) || address.includes(lowerQuery)) {
          results.push({
            id: item._id,
            type: 'branch',
            title: item.name || 'Chi nhánh',
            subtitle: item.location || item.address || 'Chi nhánh',
            path: '/admin/branches',
            icon: 'building'
          });
        }
      });

      // Search users
      users.forEach(item => {
        const username = String(item.username || '').toLowerCase();
        const email = String(item.email || '').toLowerCase();
        const name = String(item.name || '').toLowerCase();
        
        if (username.includes(lowerQuery) || email.includes(lowerQuery) || name.includes(lowerQuery)) {
          results.push({
            id: item._id,
            type: 'user',
            title: item.username || item.name || 'User',
            subtitle: item.email || 'User',
            path: '/admin/users',
            icon: 'user'
          });
        }
      });

      // Search bookings
      bookings.forEach(item => {
        const bookingId = String(item._id || item.id || '');
        const username = String(item.userId?.username || '');
        const movieTitle = String(item.movieId?.title || '');
        const searchText = `${bookingId} ${username} ${movieTitle}`.toLowerCase();
        
        if (searchText.includes(lowerQuery)) {
          results.push({
            id: bookingId,
            type: 'booking',
            title: `Booking #${bookingId.slice(-8)}`,
            subtitle: `${item.userId?.username || 'User'} - ${item.movieId?.title || 'Movie'}`,
            path: '/admin/bookings',
            icon: 'ticket'
          });
        }
      });

      console.log('Search results:', results.length);
      setSearchResults(results.slice(0, 8));
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handleSearchSelect = (result) => {
    // Navigate với ID để filter/highlight item cụ thể
    const path = `${result.path}?id=${result.id}&highlight=true`;
    navigate(path);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notification-dropdown') && !e.target.closest('.notification-btn')) {
        setNotificationsOpen(false);
      }
      if (!e.target.closest('.search-dropdown') && !e.target.closest('.search-container')) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔹 Logout safe
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'branches', label: 'Chi Nhánh', icon: Building2, path: '/admin/branches' },
    { id: 'theaters', label: 'Phòng Chiếu', icon: Monitor, path: '/admin/theaters' },
    { id: 'showtimes', label: 'Lịch Chiếu', icon: Calendar, path: '/admin/showtimes' },
    { id: 'users', label: 'Người Dùng', icon: Users, path: '/admin/users' },
    { id: 'movies', label: 'Phim', icon: Film, path: '/admin/movies' },
    { id: 'items', label: 'Sản Phẩm', icon: ShoppingBag, path: '/admin/items' },
    { id: 'combos', label: 'Combo', icon: Package, path: '/admin/combos' },
    { id: 'vouchers', label: 'Voucher', icon: TicketPercent, path: '/admin/vouchers' }
  ];

  // Get current active tab based on pathname
  const getCurrentTab = () => {
    const currentPath = location.pathname;
    const menuItem = menuItems.find(item => item.path === currentPath);
    return menuItem ? menuItem.id : 'dashboard';
  };

  const activeTab = getCurrentTab();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`admin-sidebar ${!sidebarOpen ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <h1 className="sidebar-title">Admin Panel</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-toggle"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-details">
              <h4>{userInfo.name}</h4>
              <p>{userInfo.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`admin-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="sidebar-toggle"
            >
              <Menu size={20} />
            </button>
            <h1 className="header-title">{title}</h1>
          </div>
          
          <div className="header-right">
            {/* Search */}
            <div className="search-container">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Tìm phim, chi nhánh, user..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
              />
              
              {/* Search Results Dropdown */}
              {searchOpen && searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSearchSelect(result)}
                      className="search-result-item"
                    >
                      <div className="search-result-icon">
                        {result.icon === 'film' && <Film size={16} />}
                        {result.icon === 'building' && <Building2 size={16} />}
                        {result.icon === 'user' && <User size={16} />}
                        {result.icon === 'ticket' && <Ticket size={16} />}
                      </div>
                      <div className="search-result-content">
                        <p className="search-result-title">{result.title}</p>
                        <p className="search-result-subtitle">{result.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {searchOpen && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="search-dropdown">
                  <div className="search-no-results">
                    <p>Không tìm thấy kết quả</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="notification-container">
              <button 
                className="notification-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Thông báo</h3>
                    <button 
                      className="mark-all-read"
                      onClick={() => setUnreadCount(0)}
                    >
                      Đánh dấu đã đọc
                    </button>
                  </div>
                  
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <Bell size={32} />
                        <p>Không có thông báo mới</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="notification-item">
                          <div className={`notification-icon ${notif.icon}`}>
                            {notif.icon === 'success' ? <CheckCircle size={20} /> : <Clock size={20} />}
                          </div>
                          <div className="notification-content">
                            <p className="notification-title">{notif.title}</p>
                            <p className="notification-message">{notif.message}</p>
                            <p className="notification-time">{notif.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="notification-footer">
                      <button onClick={() => navigate('/admin')}>
                        Xem tất cả
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="user-badge">
              <User size={16} />
              <span>{userInfo.name}</span>
              <span className="user-role">ADMIN</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="admin-content">
          {children}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
