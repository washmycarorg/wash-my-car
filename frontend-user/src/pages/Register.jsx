import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplets, Mail, Lock, User as UserIcon, Phone } from 'lucide-react';
import { registerUser } from '../api';

const Register = ({ setAuth }) => {
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerUser(formData);
      setSuccessMsg('Registration successful! Please login with your phone and OTP (1234).');
      // Clear form
      setFormData({ name: '', phone: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="flex" style={{minHeight: '100vh', background: 'var(--bg-main)'}}>
      {/* Left side branding */}
      <div className="hidden md:flex flex-col items-center justify-center p-10" style={{flex: 1, background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))', color: 'white', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'relative', zIndex: 2, textAlign: 'center'}}>
          <Droplets size={80} color="var(--accent-teal)" style={{margin: '0 auto 1.5rem'}} />
          <h1>Wash My Car</h1>
          <p style={{fontSize: '1.25rem', marginTop: '1rem', opacity: 0.9}}>Professional Car Wash at Your Doorstep</p>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex flex-col justify-center p-8 md:p-16" style={{flex: 1, background: 'white'}}>
        <div style={{maxWidth: '450px', width: '100%', margin: '0 auto'}}>
          <div className="md:hidden flex items-center gap-2 mb-8">
             <Droplets size={32} color="var(--primary-blue)"/>
             <h2 style={{fontSize: '1.5rem', color: 'var(--primary-navy)'}}>Wash My Car</h2>
          </div>
          
          <h2 style={{marginBottom: '0.5rem'}}>Create Your Account</h2>
          <p className="text-muted" style={{marginBottom: '2rem'}}>Join us to get your car cleaned hassle-free.</p>
          
          {error && <div className="badge badge-danger w-full mb-4 py-2 text-center" style={{padding: '0.75rem'}}>{error}</div>}
          {successMsg && <div className="badge badge-success w-full mb-4 py-2 text-center" style={{padding: '0.75rem'}}>{successMsg}</div>}

          <form onSubmit={handleRegister} className="flex-col flex gap-4">
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label">Full Name</label>
              <div style={{position: 'relative'}}>
                <UserIcon size={18} style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
                <input type="text" required className="form-input" style={{paddingLeft: '2.5rem'}} placeholder="Rahul Mehta" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>

            <div className="form-group" style={{margin: 0}}>
              <label className="form-label">Phone Number</label>
              <div style={{position: 'relative'}}>
                <Phone size={18} style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
                <input type="tel" required className="form-input" style={{paddingLeft: '2.5rem'}} placeholder="+91 9876543210" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 mb-4">
              <input type="checkbox" required id="terms" /> 
              <label htmlFor="terms" style={{fontSize: '0.9rem'}}>I agree to the <a href="#" className="text-blue">Terms & Conditions</a></label>
            </div>

            <button type="submit" className="btn btn-primary w-full" style={{padding: '1rem'}}>Register</button>
          </form>

          <p className="text-center mt-6" style={{fontSize: '0.95rem'}}>
            Already have an account? <Link to="/" className="text-blue" style={{fontWeight: 600}}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
