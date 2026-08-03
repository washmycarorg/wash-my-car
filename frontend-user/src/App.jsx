import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BookSlot from './pages/BookSlot';
import Cars from './pages/Cars';
import Services from './pages/Services';
import Profile from './pages/Profile';
import Rewards from './pages/Rewards';
import History from './pages/History';
import Bookings from './pages/Bookings';

// Guard wrapper: checks token and user info on mount and on storage change
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  const userInfo = localStorage.getItem('userInfo');
  if (!token || !userInfo) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  const [auth, setAuth] = useState(!!localStorage.getItem('userToken') && !!localStorage.getItem('userInfo'));

  // Listen for token or userInfo being cleared (logout from another tab, or manually)
  useEffect(() => {
    const syncAuth = () => {
      const hasAuth = !!localStorage.getItem('userToken') && !!localStorage.getItem('userInfo');
      setAuth(hasAuth);
    };
    window.addEventListener('storage', syncAuth);
    // Also poll on focus in case the same tab cleared the credentials
    window.addEventListener('focus', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('focus', syncAuth);
    };
  }, []);

  const handleSetAuth = (val) => {
    setAuth(val);
    if (!val) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={auth ? <Navigate to="/dashboard" /> : <Login setAuth={handleSetAuth} />} />
        <Route path="/register" element={auth ? <Navigate to="/dashboard" /> : <Register setAuth={handleSetAuth} />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/book" element={<ProtectedRoute><DashboardLayout><BookSlot /></DashboardLayout></ProtectedRoute>} />
        <Route path="/cars" element={<ProtectedRoute><DashboardLayout><Cars /></DashboardLayout></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><DashboardLayout><Services /></DashboardLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute><DashboardLayout><Rewards /></DashboardLayout></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><DashboardLayout><Bookings /></DashboardLayout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><DashboardLayout><History /></DashboardLayout></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><DashboardLayout><div className="card"><h2>Payment Methods (Coming Soon)</h2></div></DashboardLayout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;

