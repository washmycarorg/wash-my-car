import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';

// Pages to be imported soon
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

const App = () => {
  const [auth, setAuth] = useState(!!localStorage.getItem('userToken'));

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={auth ? <Navigate to="/dashboard"/> : <Login setAuth={setAuth} />} />
        <Route path="/register" element={auth ? <Navigate to="/dashboard"/> : <Register setAuth={setAuth} />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={auth ? <DashboardLayout><Dashboard /></DashboardLayout> : <Navigate to="/"/>} />
        <Route path="/book" element={auth ? <DashboardLayout><BookSlot /></DashboardLayout> : <Navigate to="/"/>} />
        <Route path="/cars" element={auth ? <DashboardLayout><Cars /></DashboardLayout> : <Navigate to="/"/>} />
        <Route path="/services" element={auth ? <DashboardLayout><Services /></DashboardLayout> : <Navigate to="/"/>} />
        <Route path="/profile" element={auth ? <DashboardLayout><Profile /></DashboardLayout> : <Navigate to="/"/>} />
        <Route path="/rewards" element={auth ? <DashboardLayout><Rewards /></DashboardLayout> : <Navigate to="/"/>} />
        <Route path="/bookings" element={auth ? <DashboardLayout><Bookings /></DashboardLayout> : <Navigate to="/"/>} />
        <Route path="/history" element={auth ? <DashboardLayout><History /></DashboardLayout> : <Navigate to="/"/>} />
        <Route path="/payments" element={auth ? <DashboardLayout><div className="card"><h2>Payment Methods (Coming Soon)</h2></div></DashboardLayout> : <Navigate to="/"/>} />
      </Routes>
    </Router>
  );
};

export default App;
