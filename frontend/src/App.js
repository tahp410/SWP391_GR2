import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import Homepage from './Homepage';
import ChangePassword from './changePassword';

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
          element={isAuthenticated ? <Homepage /> : <Navigate to="/" />} 
        />
        <Route 
          path="/change-password" 
          element={isAuthenticated ? <ChangePassword /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;