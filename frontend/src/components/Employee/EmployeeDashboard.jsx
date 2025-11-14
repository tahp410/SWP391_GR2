import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import '../../style/employee.css';
import { useAuth } from '../../contexts/AuthContext';

export default function EmployeeDashboard() {
  const location = useLocation();
  const { isEmployee, logout } = useAuth();

  if (!isEmployee) {
    return <Navigate to="/home" />;
  }

  const active = (path) => (location.pathname.startsWith(path) ? 'emp-nav-item active' : 'emp-nav-item');

  return (
    <div className="emp-layout">
      <aside className="emp-sidebar">
        <div className="emp-brand">CineTicket</div>
        <nav className="emp-nav">
          <Link className={active('/employee/book-ticket')} to="/employee/book-ticket">Đặt vé cho khách</Link>
          <Link className={active('/employee/bookings')} to="/employee/bookings">Danh sách vé đã đặt</Link>
          <Link className={active('/employee/checkin')} to="/employee/checkin">Quét mã QR vé</Link>
          <button
            type="button"
            className="emp-nav-item"
            onClick={() => { logout(); window.location.href = '/'; }}
          >
            Đăng xuất
          </button>
        </nav>
        <div className="emp-footer">Employee</div>
      </aside>
      <main className="emp-content">
        <Outlet />
      </main>
    </div>
  );
}


