import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import { loginEmployee, registerEmployee, getServiceAreas } from './api';
import { Eye, EyeOff, Lock, Mail, Phone, User, CheckCircle2, AlertCircle } from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import CompletedSlots from './pages/CompletedSlots';
import Earnings from './pages/Earnings';
import Leaves from './pages/Leaves';
import Profile from './pages/Profile';
import logo from './assets/wash my car.png';

const EmployeeLogin = ({ setAuth }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      return setError('Please enter your email address or phone number.');
    }
    if (!password) {
      return setError('Please enter your password.');
    }

    setLoading(true);
    setError('');

    try {
      await loginEmployee(identifier.trim(), password);
      setAuth(true);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.25rem 2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <img src={logo} alt="Wash My Car Logo" style={{ height: '65px', objectFit: 'contain' }} />
        </div>
        <h2 style={{ color: 'var(--primary-navy)', textAlign: 'center', marginBottom: '0.35rem', fontWeight: 800 }}>Employee Portal</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
          Login to manage your assigned slots
        </p>

        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontSize: '0.86rem',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }} onSubmit={handleLogin}>
          
          {/* Email or Phone Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.45rem', color: 'var(--primary-navy)', fontSize: '0.88rem', fontWeight: 600 }}>
              Email or Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                className="form-input" 
                placeholder="email@example.com or +91 9876543210" 
                required 
                autoComplete="username"
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>

          {/* Password Input with Show/Hide toggle */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label style={{ color: 'var(--primary-navy)', fontSize: '0.88rem', fontWeight: 600 }}>
                Password
              </label>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="form-input" 
                placeholder="Enter your account password" 
                required 
                autoComplete="current-password"
                style={{ paddingRight: '2.75rem', marginBottom: 0, width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: 'var(--primary-blue)', 
              color: 'white', 
              border: 'none', 
              padding: '0.85rem', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: 700, 
              fontSize: '1rem', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              marginTop: '0.5rem',
              transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-blue)', fontWeight: 700, textDecoration: 'none' }}>
              Register Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const EmployeeRegister = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photo, setPhoto] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [address, setAddress] = useState('');
  const [idProofFile, setIdProofFile] = useState('');
  const [serviceAreas, setServiceAreas] = useState([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getServiceAreas()
      .then(setServiceAreas)
      .catch(err => console.error('Error fetching service areas:', err));
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleIdProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setIdProofFile(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAreaToggle = (id) => {
    setSelectedAreaIds(prev => 
      prev.includes(id) ? prev.filter(areaId => areaId !== id) : [...prev, id]
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!password) {
      return setError('Please create a password for your account.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match. Please verify and confirm your password.');
    }
    if (!photo) {
      return setError('Please upload a clear profile photo.');
    }
    if (!idProofFile) {
      return setError('Please upload an ID proof document (PDF or image).');
    }
    if (selectedAreaIds.length === 0) {
      return setError('Please choose at least one serviced region you cover.');
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await registerEmployee(
        name.trim(), 
        phone.trim(), 
        email.trim(), 
        password, 
        confirmPassword, 
        photo, 
        aadhaarNumber.trim(), 
        address.trim(), 
        idProofFile, 
        selectedAreaIds
      );
      setSuccess('Application submitted successfully! Your account password has been registered and is pending admin approval. You can login once approved by administration.');
      setTimeout(() => navigate('/'), 6000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '2rem 1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '2.25rem 2rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <img src={logo} alt="Wash My Car Logo" style={{ height: '65px', objectFit: 'contain' }} />
        </div>
        <h2 style={{ color: 'var(--primary-navy)', textAlign: 'center', marginBottom: '0.35rem', fontWeight: 800 }}>Join the Team</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
          Register as a service technician
        </p>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.86rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div style={{ background: '#ECFDF5', border: '1.5px solid #86EFAC', color: '#065F46', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.88rem', lineHeight: 1.45, display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={20} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Registration Submitted!</strong>
              <div style={{ marginTop: '0.25rem' }}>{success}</div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#047857' }}>Redirecting to login in a few seconds...</div>
            </div>
          </div>
        )}

        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }} onSubmit={handleRegister}>
          
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--primary-navy)', fontSize: '0.88rem', fontWeight: 600 }}>Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="form-input" 
              placeholder="e.g. Rahul Sharma" 
              required 
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Email & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--primary-navy)', fontSize: '0.88rem', fontWeight: 600 }}>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="form-input" 
                placeholder="rahul@example.com" 
                required 
                style={{ marginBottom: 0 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--primary-navy)', fontSize: '0.88rem', fontWeight: 600 }}>Phone Number</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className="form-input" 
                placeholder="+91 98765 43210" 
                required 
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--primary-navy)', fontSize: '0.88rem', fontWeight: 600 }}>
                Create Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="form-input" 
                  placeholder="Min 6 characters" 
                  required 
                  minLength={6}
                  style={{ paddingRight: '2.5rem', marginBottom: 0, width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--primary-navy)', fontSize: '0.88rem', fontWeight: 600 }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  className="form-input" 
                  placeholder="Re-type password" 
                  required 
                  minLength={6}
                  style={{ paddingRight: '2.5rem', marginBottom: 0, width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                  style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Aadhaar and Address */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--primary-navy)', fontSize: '0.88rem', fontWeight: 600 }}>Aadhaar Number</label>
              <input 
                type="text" 
                value={aadhaarNumber} 
                onChange={e => setAadhaarNumber(e.target.value)} 
                className="form-input" 
                placeholder="12-digit UID" 
                required 
                style={{ marginBottom: 0 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--primary-navy)', fontSize: '0.88rem', fontWeight: 600 }}>Residential Address</label>
              <input 
                type="text" 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                className="form-input" 
                placeholder="Street name, City" 
                required 
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>

          {/* Service Areas */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--primary-navy)', fontSize: '0.88rem', fontWeight: 600 }}>
              Choose Serviced Regions
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #CBD5E1', maxHeight: '130px', overflowY: 'auto' }}>
              {serviceAreas.map(sa => {
                const checked = selectedAreaIds.includes(sa.id);
                return (
                  <label key={sa.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" checked={checked} onChange={() => handleAreaToggle(sa.id)} />
                    <span>{sa.name}</span>
                  </label>
                );
              })}
              {serviceAreas.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading regions...</span>}
            </div>
          </div>

          {/* Uploads: Profile Photo & ID Document */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--primary-navy)', fontSize: '0.88rem', fontWeight: 600 }}>Profile Photo</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="form-input" required style={{ fontSize: '0.78rem', marginBottom: 0 }} />
              {photo && (
                <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                  <img src={photo} alt="Preview" style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-blue)' }} />
                </div>
              )}
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--primary-navy)', fontSize: '0.88rem', fontWeight: 600 }}>ID Proof (PDF/Image)</label>
              <input type="file" accept="image/*,application/pdf" onChange={handleIdProofChange} className="form-input" required style={{ fontSize: '0.78rem', marginBottom: 0 }} />
              {idProofFile && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--success)', textAlign: 'center', fontWeight: 700 }}>
                  ✓ ID Document Loaded
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: 'var(--primary-blue)', 
              color: 'white', 
              border: 'none', 
              padding: '0.85rem', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: 700, 
              fontSize: '1rem', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              marginTop: '0.75rem',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/" style={{ color: 'var(--primary-blue)', fontWeight: 700, textDecoration: 'none' }}>
              Login Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const ProtectedEmployeeRoute = ({ children }) => {
  // Only check for employeeToken; does NOT drop on refresh or window blur
  const token = localStorage.getItem('employeeToken');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  // Authentication is persistently saved in localStorage. Only clears on explicit logout button click!
  const [auth, setAuth] = useState(() => !!localStorage.getItem('employeeToken'));

  useEffect(() => {
    // Only synchronize across browser tabs when localStorage is explicitly modified
    const handleStorageChange = (e) => {
      if (e.key === 'employeeToken') {
        setAuth(!!e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={auth ? <Navigate to="/dashboard" replace /> : <EmployeeLogin setAuth={setAuth} />} />
        <Route path="/register" element={auth ? <Navigate to="/dashboard" replace /> : <EmployeeRegister />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedEmployeeRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedEmployeeRoute>} />
        <Route path="/schedule" element={<ProtectedEmployeeRoute><DashboardLayout><Schedule /></DashboardLayout></ProtectedEmployeeRoute>} />
        <Route path="/completed" element={<ProtectedEmployeeRoute><DashboardLayout><CompletedSlots /></DashboardLayout></ProtectedEmployeeRoute>} />
        <Route path="/earnings" element={<ProtectedEmployeeRoute><DashboardLayout><Earnings /></DashboardLayout></ProtectedEmployeeRoute>} />
        <Route path="/leaves" element={<ProtectedEmployeeRoute><DashboardLayout><Leaves /></DashboardLayout></ProtectedEmployeeRoute>} />
        <Route path="/profile" element={<ProtectedEmployeeRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedEmployeeRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
