import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import ChangePassword from './changePassword';
import HomePage from "./component/HomePage"
import Profile from "./component/Profile"
import './style/homepage.css';
import './style/profile.css';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to={<HomePage />} /> : <Login />} 
        />
        <Route 
          path="/home" 
          element={isAuthenticated ? <HomePage /> : <Navigate to={<HomePage />}/>} 
        />
        <Route 
          path="/change-password" 
          element={isAuthenticated ? <ChangePassword /> : <Navigate to="/" />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Profile /> : <Navigate to={<Profile/>} />} 
        />
      </Routes>
    </Router>
  );
}

export default App;