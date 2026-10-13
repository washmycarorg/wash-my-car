import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User as UserIcon, Phone, ArrowLeft, Gift, Lock, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { registerUser, sendUserOtp, getSettings } from '../api';
import logo from '../assets/wash my car.png';

const Register = ({ setAuth }) => {
  const [searchParams] = useSearchParams();
  const refFromUrl = searchParams.get('ref') || '';
  const [formData, setFormData] = useState({ name: '', phone: '', referralCode: refFromUrl });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getSettings()
      .then(res => {
        if (res && res.referralEnabled !== undefined) {
          setReferralEnabled(!!res.referralEnabled);
        }
      })
      .catch(console.warn);
  }, []);

  useEffect(() => {
    if (refFromUrl) {
      setFormData(prev => ({ ...prev, referralCode: refFromUrl }));
    }
  }, [refFromUrl]);

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
    const cleanPhone = formData.phone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number first');
      return;
    }
    if (!formData.name.trim()) {
      setError('Please enter your full name first');
      return;
    }

    setError('');
    setSuccessMsg('');
    setSendingOtp(true);
    try {
      const res = await sendUserOtp(cleanPhone, 'REGISTER');
      setOtpSent(true);
      setTimer(60);
      setSuccessMsg(res.message || 'Verification code sent to your phone via SMS!');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }

    const cleanPhone = formData.phone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code sent to your phone');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({ ...formData, phone: cleanPhone, otp: otp.trim() });
      setSuccessMsg('Account created successfully! Welcome to Wash My Car.');
      
      // Auto-authenticate if token returned
      if (res.token) {
        localStorage.setItem('userToken', res.token);
        if (res.user) localStorage.setItem('userInfo', JSON.stringify(res.user));
        if (setAuth) setAuth(true);
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
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
          <p style={{fontSize: '1.25rem', marginTop: '0.5rem', opacity: 0.9, fontWeight: 600}}>Professional Car Wash at Your Doorstep</p>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', opacity: 0.85, fontSize: '0.95rem'}}>
            <ShieldCheck size={20} /> Verified SMS Phone Authentication
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex flex-col justify-center p-8 md:p-16" style={{flex: 1, background: 'white'}}>
        <div style={{maxWidth: '450px', width: '100%', margin: '0 auto'}}>
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
          
          <h2 style={{marginBottom: '0.5rem', fontWeight: 800}}>Create Your Account</h2>
          <p className="text-muted" style={{marginBottom: '1.75rem'}}>Join us with verified mobile number for hassle-free doorstep car care.</p>
          
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

          <form onSubmit={handleRegister} className="flex-col flex gap-4">
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label" style={{fontWeight: 600}}>Full Name</label>
              <div style={{position: 'relative'}}>
                <UserIcon size={18} style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
                <input 
                  type="text" 
                  required 
                  disabled={loading || sendingOtp} 
                  className="form-input" 
                  style={{paddingLeft: '2.5rem', opacity: loading ? 0.7 : 1}} 
                  placeholder="Rahul Mehta" 
                  value={formData.name} 
                  onChange={e => {
                    setFormData({...formData, name: e.target.value});
                    if (error) setError('');
                  }} 
                />
              </div>
            </div>

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
                    value={formData.phone} 
                    onChange={e => {
                      setFormData({...formData, phone: e.target.value});
                      if (error) setError('');
                    }} 
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || sendingOtp || timer > 0 || !formData.phone.trim()}
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
                We verify your account with an SMS verification code.
              </small>
            </div>

            {/* OTP Input Field shown once OTP requested */}
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

            {referralEnabled && (
              <div className="form-group" style={{margin: 0}}>
                <label className="form-label" style={{fontWeight: 600}}>
                  Referral Code <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <div style={{position: 'relative'}}>
                  <Gift size={18} style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#0284C7'}} />
                  <input 
                    type="text" 
                    disabled={loading}
                    className="form-input" 
                    style={{paddingLeft: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, opacity: loading ? 0.7 : 1}} 
                    placeholder="e.g. WMC7X89" 
                    value={formData.referralCode} 
                    onChange={e => setFormData({...formData, referralCode: e.target.value.toUpperCase()})} 
                  />
                </div>
                {formData.referralCode && (
                  <small style={{ color: '#0369A1', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                    🎁 Referral code applied! Your friend will receive reward points upon your first wash.
                  </small>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mt-1 mb-2">
              <input type="checkbox" required disabled={loading} id="terms" defaultChecked /> 
              <label htmlFor="terms" style={{fontSize: '0.88rem', cursor: 'pointer', color: 'var(--text-muted)'}}>
                I agree to the <a href="#" className="text-blue">Terms & Conditions</a>
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
                  <span>Creating Account... Please wait</span>
                </>
              ) : sendingOtp ? (
                <>
                  <span className="spinner" />
                  <span>Sending SMS OTP...</span>
                </>
              ) : otpSent ? (
                <span>Verify OTP & Register</span>
              ) : (
                <span>Get OTP & Register</span>
              )}
            </button>
          </form>

          <p className="text-center mt-6" style={{fontSize: '0.95rem'}}>
            Already have an account? <Link to="/login" className="text-blue" style={{fontWeight: 600}}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
