import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import ChangePassword from './changePassword';
import HomePage from "./component/HomePage";
import Profile from "./component/Profile";
import './style/homepage.css';
import './style/profile.css';
import Register from './Register';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/home" /> : <Login />} 
        />
        <Route 
          path="/home" 
          element={isAuthenticated ? <HomePage /> : <Navigate to="/"/>} 
        />
        <Route 
          path="/change-password" 
          element={isAuthenticated ? <ChangePassword /> : <Navigate to="/" />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Profile /> : <Navigate to="/" />} 
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/home" /> : <Register />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
