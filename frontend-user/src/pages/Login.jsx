import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, ArrowLeft, Send, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { loginUser, sendUserOtp } from '../api';
import logo from '../assets/wash my car.png';

const Login = ({ setAuth }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Resend OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number first');
      return;
    }
    setError('');
    setSuccessMsg('');
    setSendingOtp(true);
    try {
      const res = await sendUserOtp(cleanPhone, 'LOGIN');
      setOtpSent(true);
      setTimer(60);
      setSuccessMsg(res.message || 'OTP sent successfully to your mobile number as SMS.');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccessMsg('');

    if (!otpSent) {
      // First-click convenience: trigger OTP send if user clicked button without sending OTP yet
      await handleSendOtp();
      return;
    }

    if (!otp.trim()) {
      setError('Please enter the OTP sent to your phone');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(phone.trim(), otp.trim());
      localStorage.setItem('userToken', res.token);
      localStorage.setItem('userInfo', JSON.stringify(res.user));
      setAuth(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex" style={{minHeight: '100vh', background: 'var(--bg-main)'}}>
      {/* Left side branding */}
      <div className="hidden md:flex flex-col items-center justify-center p-10" style={{flex: 1, background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))', color: 'white', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'relative', zIndex: 2, textAlign: 'center'}}>
          <div style={{
            background: 'white',
            padding: '1.25rem 2.5rem',
            borderRadius: '1.5rem',
            boxShadow: '0 0 30px rgba(56, 189, 248, 0.65), 0 10px 20px rgba(0,0,0,0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            <img src={logo} alt="Wash My Car Logo" style={{height: '110px', objectFit: 'contain'}} />
          </div>
          <p style={{fontSize: '1.25rem', marginTop: '0.5rem', opacity: 0.9, fontWeight: 600}}>Your Car, Cleaned At Your Door.</p>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', opacity: 0.85, fontSize: '0.95rem'}}>
            <ShieldCheck size={20} /> Instant SMS Verification via Twilio
          </div>
        </div>
        {/* Decorative elements */}
        <div style={{position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)'}}></div>
        <div style={{position: 'absolute', top: '10%', left: '-5%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)'}}></div>
      </div>

      {/* Right side form */}
      <div className="flex flex-col justify-center p-8 md:p-16" style={{flex: 1, background: 'white'}}>
        <div style={{maxWidth: '420px', width: '100%', margin: '0 auto'}}>
          {/* Back to Homepage Button */}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Homepage
          </Link>

          <div className="md:hidden flex justify-center mb-8">
            <div style={{
              background: 'white',
              padding: '0.75rem 1.75rem',
              borderRadius: '1rem',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.4), 0 4px 12px rgba(0,0,0,0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src={logo} alt="Wash My Car Logo" style={{height: '80px', objectFit: 'contain'}} />
            </div>
          </div>
          
          <h2 style={{marginBottom: '0.5rem', fontWeight: 800}}>Welcome Back!</h2>
          <p className="text-muted" style={{marginBottom: '1.75rem'}}>Login to your account securely via SMS OTP.</p>
          
          {error && (
            <div className="badge badge-danger w-full mb-4 py-2 text-center" style={{padding: '0.75rem', fontSize: '0.9rem', borderRadius: '0.5rem'}}>
              {error}
            </div>
          )}

          {successMsg && (
            <div className="badge badge-success w-full mb-4 py-2 text-center" style={{padding: '0.75rem', fontSize: '0.9rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex-col flex gap-4">
            {/* Phone Number Field */}
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label" style={{fontWeight: 600}}>Phone Number</label>
              <div style={{position: 'relative', display: 'flex', gap: '0.5rem'}}>
                <div style={{position: 'relative', flex: 1}}>
                  <Phone size={18} style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
                  <input 
                    type="tel" 
                    required 
                    disabled={loading || sendingOtp} 
                    className="form-input" 
                    style={{paddingLeft: '2.5rem', opacity: loading ? 0.7 : 1, width: '100%'}} 
                    placeholder="9876543210" 
                    value={phone} 
                    onChange={e => {
                      setPhone(e.target.value);
                      if (error) setError('');
                    }} 
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || sendingOtp || timer > 0 || !phone.trim()}
                  className="btn btn-secondary"
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: timer > 0 ? '#F1F5F9' : '#F0F9FF',
                    color: timer > 0 ? '#94A3B8' : '#0284C7',
                    border: '1px solid ' + (timer > 0 ? '#E2E8F0' : '#BAE6FD'),
                    cursor: (timer > 0 || sendingOtp) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {sendingOtp ? (
                    <RefreshCw size={14} className="spin-animation" />
                  ) : timer > 0 ? (
                    `${timer}s`
                  ) : otpSent ? (
                    'Resend'
                  ) : (
                    'Get OTP'
                  )}
                </button>
              </div>
              <small style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block'}}>
                We'll send an instant verification code to this mobile number.
              </small>
            </div>
            
            {/* OTP Input Field */}
            {otpSent && (
              <div className="form-group" style={{margin: 0, animation: 'fadeIn 0.3s ease'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem'}}>
                  <label className="form-label" style={{margin: 0, fontWeight: 600}}>Enter Verification OTP</label>
                  {timer > 0 ? (
                    <span style={{fontSize: '0.78rem', color: '#64748B'}}>Resend in {timer}s</span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleSendOtp}
                      style={{background: 'none', border: 'none', color: '#0284C7', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: 0}}
                    >
                      Resend Code
                    </button>
                  )}
                </div>
                <div style={{position: 'relative'}}>
                  <Lock size={18} style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
                  <input 
                    type="text" 
                    required 
                    maxLength={6}
                    autoFocus
                    disabled={loading} 
                    className="form-input" 
                    style={{paddingLeft: '2.5rem', letterSpacing: '0.15em', fontWeight: 700, fontSize: '1.05rem', opacity: loading ? 0.7 : 1}} 
                    placeholder="Enter 6-digit OTP" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} 
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-1 mb-2">
              <label className="flex items-center gap-2" style={{fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)'}}>
                <input type="checkbox" defaultChecked disabled={loading} /> Keep me signed in
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading || sendingOtp} 
              className="btn btn-primary w-full" 
              style={{
                padding: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                borderRadius: '0.65rem',
                opacity: (loading || sendingOtp) ? 0.8 : 1,
                cursor: (loading || sendingOtp) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Verifying & Signing In...</span>
                </>
              ) : sendingOtp ? (
                <>
                  <span className="spinner" />
                  <span>Sending SMS OTP...</span>
                </>
              ) : otpSent ? (
                <span>Verify OTP & Login</span>
              ) : (
                <span>Get OTP & Login</span>
              )}
            </button>
          </form>

          <p className="text-center mt-6" style={{fontSize: '0.95rem'}}>
            Don't have an account? <Link to="/register" className="text-blue" style={{fontWeight: 600}}>Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
