import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
<<<<<<< HEAD
  Package,
  Monitor,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../style/adminLayout.css';
=======
  Package
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import "../../style/adminLayout.css";
>>>>>>> 80ee36a12f6b9e328efe78abd7495ca0366aecf2

const AdminLayout = ({ children, title = "Dashboard" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { user, logout } = useAuth();
  const userInfo =
    user || { name: "Admin", email: "admin@cine.com", role: "admin" };

  // 🔹 Logout safe
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // 🔹 Menu items
  const menuItems = [
<<<<<<< HEAD
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'branches', label: 'Chi Nhánh', icon: Building2, path: '/admin/branches' },
    { id: 'theaters', label: 'Phòng Chiếu', icon: Monitor, path: '/admin/theaters' },
    { id: 'showtimes', label: 'Lịch Chiếu', icon: Calendar, path: '/admin/showtimes' },
    { id: 'users', label: 'Người Dùng', icon: Users, path: '/admin/users' },
    { id: 'movies', label: 'Phim', icon: Film, path: '/admin/movies' },
=======
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { id: "branches", label: "Chi Nhánh", icon: Building2, path: "/admin/branches" },
    { id: "users", label: "Người Dùng", icon: Users, path: "/admin/users" },
    { id: "movies", label: "Phim", icon: Film, path: "/admin/movies" },
>>>>>>> 80ee36a12f6b9e328efe78abd7495ca0366aecf2
    { id: 'items', label: 'Sản Phẩm', icon: ShoppingBag, path: '/admin/items' },
    { id: 'combos', label: 'Combo', icon: Package, path: '/admin/combos' },
    { id: "bookings", label: "Đặt Vé", icon: Ticket, path: "/admin/bookings" },
    { id: "vouchers", label: "Voucher", icon: TicketPercent, path: "/admin/vouchers" },
    { id: "settings", label: "Cài Đặt", icon: Settings, path: "/admin/settings" },
  ];

  // 🔹 Active tab highlight (support params)
  const getCurrentTab = () => {
    const currentPath = location.pathname;
    const menuItem = menuItems.find((item) =>
      currentPath.startsWith(item.path)
    );
    return menuItem ? menuItem.id : "dashboard";
  };
  const activeTab = getCurrentTab();

  // 🔹 Reusable Logout Button
  const LogoutButton = ({ className = "" }) => (
    <button onClick={handleLogout} className={`logout-btn ${className}`}>
      <LogOut size={16} />
      <span>Đăng xuất</span>
    </button>
  );

  // 🔹 Reusable User Badge
  const UserBadge = () => (
    <div className="user-badge">
      <User size={16} />
      <span>{userInfo.name}</span>
      <span className="user-role">{userInfo.role?.toUpperCase() || "ADMIN"}</span>
    </div>
  );

  // 🔹 Sidebar
  const Sidebar = () => (
    <div
      className={`admin-sidebar ${sidebarOpen ? "open" : "collapsed"}`}
    >
      {/* Header */}
      <div className="sidebar-header">
        <h1 className="sidebar-title">Admin Panel</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle">
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
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
        <LogoutButton />
      </div>
    </div>
  );

  // 🔹 Header
  const Header = () => (
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
            placeholder="Tìm kiếm..."
            className="search-input"
          />
        </div>

        {/* Notifications */}
        <button className="notification-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>

        {/* User */}
        <UserBadge />

        {/* Logout */}
        <LogoutButton className="header-logout" />
      </div>
    </header>
  );

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className={`admin-main ${!sidebarOpen ? "sidebar-collapsed" : ""}`}>
        <Header />
        <div className="admin-content">{children}</div>
      </div>

      {/* Mobile Overlay */}
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
