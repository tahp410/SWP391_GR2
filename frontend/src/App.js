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
import ShowtimeList from './components/ShowtimeList'; // ✅ Thêm dòng này
import PurchasePage from './components/PurchasePage';
import UserPurchaseHistory from './components/UserPurchaseHistory';
import AdminPurchaseHistory from './components/Admin/AdminPurchaseHistory';
import CheckInPage from './components/Employee/CheckInPage';
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

const AppInner = () => {
  const { isAuthenticated, isAdmin, getUserRole } = useAuth();
  const isEmployee = isAuthenticated && (getUserRole() === 'employee' || getUserRole() === 'admin');

  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route 
          path="/" 
          element={
            isAuthenticated 
              ? (isAdmin ? <Navigate to="/admin" /> : (isEmployee ? <Navigate to="/employee" /> : <Navigate to="/home" />))
              : <Login />
          } 
        />

        {/* Register */}
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/home" /> : <Register />} 
        />

        {/* Home */}
        <Route 
          path="/home" 
          element={isAuthenticated ? <HomePage /> : <Navigate to="/"/>} 
        />

        {/* Profile */}
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
        <Route path="/movies" element={isAuthenticated ? <MoviesPage /> : <Navigate to="/"/>} />
        <Route path="/movies/:id" element={isAuthenticated ? <MovieDetail /> : <Navigate to="/"/>} />
        <Route path="/booking/:movieId" element={isAuthenticated ? <BookingFlow /> : <Navigate to="/"/>} />
        <Route path="/purchase/:bookingId" element={isAuthenticated ? <PurchasePage /> : <Navigate to="/"/>} />
        <Route path="/purchase-history" element={isAuthenticated ? <UserPurchaseHistory /> : <Navigate to="/"/>} />
        <Route path="/cinemas" element={isAuthenticated ? <div>Cinemas Page - Coming Soon</div> : <Navigate to="/"/>} />

        {/* ✅ Sửa route này để hiển thị ShowtimeList thay vì "Coming Soon" */}
        <Route 
          path="/showtimes" 
          element={isAuthenticated ? <ShowtimeList /> : <Navigate to="/"/>} 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={isAdmin ? <AdminDashboard /> : <Navigate to="/home" />} 
        />
        <Route 
          path="/admin/branches" 
          element={isAdmin ? <BranchManagement /> : <Navigate to="/home" />} 
        />
        <Route 
          path="/admin/theaters" 
          element={isAdmin ? <TheaterManagement /> : <Navigate to="/home" />} 
        />
        <Route 
          path="/admin/showtimes" 
          element={isAdmin ? <ShowtimeManagement /> : <Navigate to="/home" />} 
        />
        <Route 
          path="/admin/users" 
          element={isAdmin ? <UserManagement /> : <Navigate to="/home" />} 
        />
        <Route 
          path="/admin/movies" 
          element={isAdmin ?<MovieManagement /> : <Navigate to="/home" />} 
        />
        <Route 
          path="/admin/items" 
          element={isAdmin ? <ItemManagement /> : <Navigate to="/home" />} 
        />
        <Route 
          path="/admin/combos" 
          element={isAdmin ? <ComboManagement /> : <Navigate to="/home" />} 
        />
        <Route 
          path="/admin/bookings" 
          element={isAdmin ? <AdminPurchaseHistory /> : <Navigate to="/home" />} 
        />
        <Route 
          path="/admin/settings" 
          element={isAdmin ? <div>Admin Settings - Coming Soon</div> : <Navigate to="/home" />} 
        />
        <Route 
          path="/admin/vouchers" 
          element={isAdmin ? <VoucherManagement /> : <Navigate to="/home" />} 
        />

        {/* Employee Routes */}
        <Route path="/employee" element={isEmployee ? <EmployeeDashboard /> : <Navigate to="/home" />} >
          <Route index element={<Navigate to="/employee/book-ticket" />} />
          <Route path="book-ticket" element={<EmployeeBookTicket />} />
          <Route path="booking/:movieId" element={<EmployeeBookingFlow />} />
          <Route path="bookings" element={<EmployeeBookings />} />
          <Route path="checkin" element={<CheckInPage />} />
          <Route path="purchase/:bookingId" element={<EmployeePurchase />} />
        </Route>

        {/* Backward-compatible path similar to screenshot */}
        <Route path="/admin/employee-book-ticket" element={isEmployee ? <Navigate to="/employee/book-ticket" /> : <Navigate to="/home" />} />

        {/* 404 Route */}
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
