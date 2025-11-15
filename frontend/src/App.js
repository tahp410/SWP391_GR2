import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import ChangePassword from './changePassword';
import HomePage from "./components/HomePage";
import Profile from "./components/Profile";
import MoviesPage from "./components/MoviesPage";
import MovieDetail from "./components/MovieDetail";
import BookingFlow from "./components/BookingFlow";
import BranchManagement from "./components/Admin/BranchManagement";
import AdminDashboard from "./components/Admin/AdminDashboard";
import VoucherManagement from "./components/Admin/VoucherManagement";
import Register from './Register';
import ForgotPassword from './forgotPassword';
import ResetPassword from './resetPassword';
import MovieManagement from './components/Admin/MovieManagement';
import ItemManagement from './components/Admin/ItemManagement';
import ComboManagement from './components/Admin/ComboManagement';
import TheaterManagement from './components/Admin/TheaterManagement';
import ShowtimeManagement from './components/Admin/ShowtimeManagement';
import UserManagement from './components/Admin/UserManagement';
import ShowtimeList from './components/ShowtimeList';
import PurchasePage from './components/PurchasePage';
import UserPurchaseHistory from './components/UserPurchaseHistory';
import CheckInPage from './components/Employee/CheckInPage';
import PaymentReturn from './components/PaymentReturn';
import PaymentCancel from './components/PaymentCancel';
import EmployeeDashboard from './components/Employee/EmployeeDashboard';
import EmployeeBookTicket from './components/Employee/EmployeeBookTicket';
import EmployeeBookings from './components/Employee/EmployeeBookings';
import EmployeeBookingFlow from './components/Employee/EmployeeBookingFlow';
import EmployeePurchase from './components/Employee/EmployeePurchase';
import './style/homepage.css';
import './style/profile.css';
import './style/changePassword.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ProtectedRoute, AdminRoute, EmployeeRoute } from './components/ProtectedRoute';

const AppInner = () => {
  const { isAuthenticated, isAdmin, getUserRole } = useAuth();
  const isEmployee = isAuthenticated && (getUserRole() === 'employee' || getUserRole() === 'admin');

  return (
    <Router>
      <Routes>
        {/* Home - Public Route (Guest có thể truy cập) */}
        <Route path="/" element={<HomePage />} />

        {/* Login */}
        <Route 
          path="/login" 
          element={
            isAuthenticated 
              ? (isAdmin ? <Navigate to="/admin" /> : (isEmployee ? <Navigate to="/employee" /> : <Navigate to="/" />))
              : <Login />
          } 
        />

        {/* Register */}
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" /> : <Register />} 
        />

        {/* Forgot Password */}
        <Route 
          path="/forgot-password" 
          element={isAuthenticated ? <Navigate to="/" /> : <ForgotPassword />} 
        />

        {/* Reset Password */}
        <Route 
          path="/reset-password/:token" 
          element={<ResetPassword />} 
        />

        {/* Public Routes - Guest có thể xem */}
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/showtimes" element={<ShowtimeList />} />

        {/* Protected Routes - Cần đăng nhập */}
        <Route 
          path="/profile" 
          element={<ProtectedRoute><Profile /></ProtectedRoute>} 
        />
        <Route 
          path="/change-password" 
          element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} 
        />
        <Route 
          path="/booking/:movieId" 
          element={<ProtectedRoute><BookingFlow /></ProtectedRoute>} 
        />
        <Route 
          path="/purchase/:bookingId" 
          element={<ProtectedRoute><PurchasePage /></ProtectedRoute>} 
        />
        <Route 
          path="/purchase-history" 
          element={<ProtectedRoute><UserPurchaseHistory /></ProtectedRoute>} 
        />
        <Route 
          path="/payment/return" 
          element={<ProtectedRoute><PaymentReturn /></ProtectedRoute>} 
        />
        <Route 
          path="/payment/cancel" 
          element={<ProtectedRoute><PaymentCancel /></ProtectedRoute>} 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={<AdminRoute><AdminDashboard /></AdminRoute>} 
        />
        <Route 
          path="/admin/branches" 
          element={<AdminRoute><BranchManagement /></AdminRoute>} 
        />
        <Route 
          path="/admin/theaters" 
          element={<AdminRoute><TheaterManagement /></AdminRoute>} 
        />
        <Route 
          path="/admin/showtimes" 
          element={<AdminRoute><ShowtimeManagement /></AdminRoute>} 
        />
        <Route 
          path="/admin/users" 
          element={<AdminRoute><UserManagement /></AdminRoute>} 
        />
        <Route 
          path="/admin/movies" 
          element={<AdminRoute><MovieManagement /></AdminRoute>} 
        />
        <Route 
          path="/admin/items" 
          element={<AdminRoute><ItemManagement /></AdminRoute>} 
        />
        <Route 
          path="/admin/combos" 
          element={<AdminRoute><ComboManagement /></AdminRoute>} 
        />
        <Route 
          path="/admin/vouchers" 
          element={<AdminRoute><VoucherManagement /></AdminRoute>} 
        />

        {/* Employee Routes */}
        <Route path="/employee" element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>} >
          <Route index element={<Navigate to="/employee/book-ticket" />} />
          <Route path="book-ticket" element={<EmployeeBookTicket />} />
          <Route path="booking/:movieId" element={<EmployeeBookingFlow />} />
          <Route path="bookings" element={<EmployeeBookings />} />
          <Route path="checkin" element={<CheckInPage />} />
          <Route path="purchase/:bookingId" element={<EmployeePurchase />} />
        </Route>

        {/* Standalone Check-in Route for Employees */}
        <Route path="/checkin" element={<EmployeeRoute><CheckInPage /></EmployeeRoute>} />

        {/* 404 Route */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Trang không tồn tại</p>
                <button 
                  onClick={() => window.location.href = '/'}
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
