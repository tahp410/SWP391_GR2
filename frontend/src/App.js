import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import ChangePassword from './changePassword';
import HomePage from "./components/HomePage";
import Profile from "./components/Profile";
import BranchManagement from "./components/Admin/BranchManagement";
import AdminDashboard from "./components/Admin/AdminDashboard";
import VoucherPage from "./components/Admin/VoucherPage";
import Register from './Register';
import ForgotPassword from './forgotPassword';
import ResetPassword from './resetPassword';

import './style/homepage.css';
import './style/profile.css';
import './style/changePassword.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const AppInner = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/home" /> : <Login />} 
        />

        {/* Register */}
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/home" /> : <Register />} 
        />

        {/* Home (chỉ cho người đã login) */}
        <Route 
          path="/home" 
          element={isAuthenticated ? <HomePage /> : <Navigate to="/"/>} 
        />

        {/* Profile (chỉ cho người đã login) */}
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Profile /> : <Navigate to="/" />} 
        />

        {/* Change Password */}
        <Route 
          path="/change-password" 
          element={isAuthenticated ? <ChangePassword /> : <Navigate to="/" />} 
        />

        {/* Forgot Password */}
        <Route 
          path="/forgot-password" 
          element={isAuthenticated ? <Navigate to="/home" /> : <ForgotPassword />} 
        />

        {/* Reset Password */}
        <Route 
          path="/reset-password/:token" 
          element={<ResetPassword />} 
        />

        {/* Public Routes */}
        <Route path="/movies" element={isAuthenticated ? <div>Movies Page - Coming Soon</div> : <Navigate to="/"/>} />
        <Route path="/cinemas" element={isAuthenticated ? <div>Cinemas Page - Coming Soon</div> : <Navigate to="/"/>} />
        <Route path="/showtimes" element={isAuthenticated ? <div>Showtimes Page - Coming Soon</div> : <Navigate to="/"/>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/home" />} />
        <Route path="/admin/branches" element={isAdmin ? <BranchManagement /> : <Navigate to="/home" />} />
        <Route path="/admin/users" element={isAdmin ? <div>User Management - Coming Soon</div> : <Navigate to="/home" />} />
        <Route path="/admin/movies" element={isAdmin ? <div>Movie Management - Coming Soon</div> : <Navigate to="/home" />} />
        <Route path="/admin/bookings" element={isAdmin ? <div>Booking Management - Coming Soon</div> : <Navigate to="/home" />} />
        <Route path="/admin/settings" element={isAdmin ? <div>Admin Settings - Coming Soon</div> : <Navigate to="/home" />} />
        <Route path="/admin/vouchers" element={isAdmin ? <VoucherPage /> : <Navigate to="/home" />} /> {/* 👈 Thêm Voucher route */}

        {/* 404 */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Trang không tồn tại</p>
                <button 
                  onClick={() => window.location.href = '/home'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Về trang chủ
                </button>
              </div>
            </div>
          } 
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
