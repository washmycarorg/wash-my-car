import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import { loginEmployee, registerEmployee } from './api';

// Pages
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Earnings from './pages/Earnings';
import Leaves from './pages/Leaves';
import Profile from './pages/Profile';
import logo from './assets/wash my car.png';

const EmployeeLogin = ({ setAuth }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginEmployee(phone, otp);
      setAuth(true);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)'}}>
      <div className="card" style={{width: '100%', maxWidth: '400px', padding: '2rem'}}>
        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1rem'}}>
          <img src={logo} alt="Logo" style={{height: '60px'}} />
        </div>
        <h2 style={{color: 'var(--primary-navy)', textAlign: 'center', marginBottom: '0.5rem'}}>Employee Portal</h2>
        <p style={{color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem'}}>Login to your account</p>
        {error && <div style={{background: '#FEF2F2', color: '#991B1B', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}
        <form style={{display: 'flex', flexDirection: 'column', gap: '1rem'}} onSubmit={handleLogin}>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem'}}>Phone Number</label>
            <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="form-input" placeholder="+91 98765 43210" required />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem'}}>OTP (1234)</label>
            <input type="text" value={otp} onChange={e=>setOtp(e.target.value)} className="form-input" placeholder="1234" required />
          </div>
          <button type="submit" style={{
            background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '0.875rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem'
          }}>Login</button>
        </form>
        <div style={{textAlign: 'center', marginTop: '1.5rem'}}>
          <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Don't have an account? <Link to="/register" style={{color: 'var(--primary-blue)', fontWeight: 600}}>Register</Link></p>
        </div>
      </div>
    </div>
  );
};

const EmployeeRegister = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerEmployee(name, phone, email);
      setSuccess('Registration successful! You can now log in.');
      setError('');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed');
      setSuccess('');
    }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)'}}>
      <div className="card" style={{width: '100%', maxWidth: '400px', padding: '2rem'}}>
        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1rem'}}>
          <img src={logo} alt="Logo" style={{height: '60px'}} />
        </div>
        <h2 style={{color: 'var(--primary-navy)', textAlign: 'center', marginBottom: '0.5rem'}}>Join the Team</h2>
        <p style={{color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem'}}>Register as an employee</p>
        {error && <div style={{background: '#FEF2F2', color: '#991B1B', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}
        {success && <div style={{background: '#D1FAE5', color: '#065F46', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center'}}>{success}</div>}
        <form style={{display: 'flex', flexDirection: 'column', gap: '1rem'}} onSubmit={handleRegister}>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem'}}>Full Name</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} className="form-input" placeholder="John Doe" required />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem'}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="form-input" placeholder="john@example.com" required />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem'}}>Phone Number</label>
            <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="form-input" placeholder="+91 98765 43210" required />
          </div>
          <button type="submit" style={{
            background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '0.875rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem'
          }}>Register</button>
        </form>
        <div style={{textAlign: 'center', marginTop: '1.5rem'}}>
          <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Already have an account? <Link to="/" style={{color: 'var(--primary-blue)', fontWeight: 600}}>Login</Link></p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [auth, setAuth] = useState(!!localStorage.getItem('employeeToken'));
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={auth ? <Navigate to="/dashboard"/> : <EmployeeLogin setAuth={setAuth} />} />
        <Route path="/register" element={auth ? <Navigate to="/dashboard"/> : <EmployeeRegister />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={auth ? <DashboardLayout><Dashboard /></DashboardLayout> : <Navigate to="/"/>} />
        <Route path="/schedule" element={auth ? <DashboardLayout><Schedule /></DashboardLayout> : <Navigate to="/"/>} />
        <Route path="/earnings" element={auth ? <DashboardLayout><Earnings /></DashboardLayout> : <Navigate to="/"/>} />
        <Route path="/leaves" element={auth ? <DashboardLayout><Leaves /></DashboardLayout> : <Navigate to="/"/>} />
        <Route path="/profile" element={auth ? <DashboardLayout><Profile /></DashboardLayout> : <Navigate to="/"/>} />
      </Routes>
    </Router>
  );
};

export default App;
