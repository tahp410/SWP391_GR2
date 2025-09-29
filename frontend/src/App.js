import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import ChangePassword from './changePassword';
import HomePage from "./component/HomePage";
import Profile from "./component/Profile";
import Register from './Register';
import ForgotPassword from './forgotPassword';
import ResetPassword from './resetPassword';

import './style/homepage.css';
import './style/profile.css';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

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

        {/* Change Password (chỉ cho người đã login) */}
        <Route 
          path="/change-password" 
          element={isAuthenticated ? <ChangePassword /> : <Navigate to="/" />} 
        />

        {/* Forgot Password (cho người chưa login) */}
        <Route 
          path="/forgot-password" 
          element={isAuthenticated ? <Navigate to="/home" /> : <ForgotPassword />} 
        />

        {/* Reset Password (sử dụng token trong URL, ai cũng có thể vào từ email) */}
        <Route 
          path="/reset-password/:token" 
          element={<ResetPassword />} 
        />
      </Routes>
    </Router>
  );
}

export default App;

