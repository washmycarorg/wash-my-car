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
import Subscriptions from './pages/Subscriptions';
import TermsAndPrivacy from './pages/TermsAndPrivacy';
import Support from './pages/Support';

// Helper: checks if user has both valid token and a verified 10-digit phone number
const isUserFullyAuthenticated = () => {
  const token = localStorage.getItem('userToken');
  const userInfoStr = localStorage.getItem('userInfo');
  if (!token || !userInfoStr) return false;
  try {
    const user = JSON.parse(userInfoStr);
    const rawDigits = (user?.phone || '').replace(/^\+91/, '').replace(/\D/g, '');
    return rawDigits.length >= 10;
  } catch {
    return false;
  }
};

// Guard wrapper: checks authentication and verified phone on mount and on storage change
const ProtectedRoute = ({ children }) => {
  const isAuth = isUserFullyAuthenticated();
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  const [auth, setAuth] = useState(isUserFullyAuthenticated());

  // Listen for token or userInfo being updated or cleared
  useEffect(() => {
    const syncAuth = () => {
      setAuth(isUserFullyAuthenticated());
    };
    window.addEventListener('storage', syncAuth);
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
      sessionStorage.removeItem('pendingUserToken');
      sessionStorage.removeItem('pendingUser');
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/terms" element={<TermsAndPrivacy defaultTab="terms" />} />
        <Route path="/privacy" element={<TermsAndPrivacy defaultTab="privacy" />} />
        
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
        <Route path="/subscriptions" element={<ProtectedRoute><DashboardLayout><Subscriptions /></DashboardLayout></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><DashboardLayout><Bookings /></DashboardLayout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><DashboardLayout><History /></DashboardLayout></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><DashboardLayout><Support /></DashboardLayout></ProtectedRoute>} />
        <Route path="/contact" element={<Navigate to="/support" replace />} />
        <Route path="/payments" element={<ProtectedRoute><DashboardLayout><div className="card"><h2>Payment Methods (Coming Soon)</h2></div></DashboardLayout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;

