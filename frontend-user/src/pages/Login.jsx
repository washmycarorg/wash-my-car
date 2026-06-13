import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplets, Mail, Lock } from 'lucide-react';
import { loginUser } from '../api';

const Login = ({ setAuth }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(phone, otp);
      localStorage.setItem('userToken', res.token);
      setAuth(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex" style={{minHeight: '100vh', background: 'var(--bg-main)'}}>
      {/* Left side branding */}
      <div className="hidden md:flex flex-col items-center justify-center p-10" style={{flex: 1, background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))', color: 'white', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'relative', zIndex: 2, textAlign: 'center'}}>
          <Droplets size={80} color="var(--accent-teal)" style={{margin: '0 auto 1.5rem'}} />
          <h1>Wash My Car</h1>
          <p style={{fontSize: '1.25rem', marginTop: '1rem', opacity: 0.9}}>Your Car, Cleaned At Your Door.</p>
        </div>
        {/* Decorative elements */}
        <div style={{position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)'}}></div>
        <div style={{position: 'absolute', top: '10%', left: '-5%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)'}}></div>
      </div>

      {/* Right side form */}
      <div className="flex flex-col justify-center p-8 md:p-16" style={{flex: 1, background: 'white'}}>
        <div style={{maxWidth: '400px', width: '100%', margin: '0 auto'}}>
          <div className="md:hidden flex items-center gap-2 mb-8">
             <Droplets size={32} color="var(--primary-blue)"/>
             <h2 style={{fontSize: '1.5rem', color: 'var(--primary-navy)'}}>Wash My Car</h2>
          </div>
          
          <h2 style={{marginBottom: '0.5rem'}}>Welcome Back!</h2>
          <p className="text-muted" style={{marginBottom: '2rem'}}>Login to your account to continue.</p>
          
          {error && <div className="badge badge-danger w-full mb-4 py-2 text-center" style={{padding: '0.75rem'}}>{error}</div>}

          <form onSubmit={handleLogin} className="flex-col flex gap-4">
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label">Phone Number</label>
              <div style={{position: 'relative'}}>
                <Mail size={18} style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
                <input type="tel" required className="form-input" style={{paddingLeft: '2.5rem'}} placeholder="+91 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label">OTP (Use 1234)</label>
              <div style={{position: 'relative'}}>
                <Lock size={18} style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
                <input type="text" required className="form-input" style={{paddingLeft: '2.5rem'}} placeholder="1234" value={otp} onChange={e => setOtp(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 mb-4">
              <label className="flex items-center gap-2" style={{fontSize: '0.9rem', cursor: 'pointer'}}>
                <input type="checkbox" /> Remember Me
              </label>
              <a href="#" className="text-blue" style={{fontSize: '0.9rem', fontWeight: 500}}>Forgot Password?</a>
            </div>

            <button type="submit" className="btn btn-primary w-full" style={{padding: '1rem'}}>Login</button>
          </form>

          <p className="text-center mt-6" style={{fontSize: '0.95rem'}}>
            Don't have an account? <Link to="/register" className="text-blue" style={{fontWeight: 600}}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
