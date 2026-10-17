import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, ArrowLeft, Send, RefreshCw, CheckCircle2, ShieldCheck, Gift, Sparkles } from 'lucide-react';
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

  // SEO Page Title and Meta Description for Google Sitelinks
  useEffect(() => {
    document.title = "Customer Login | Wash My Car Org - Doorstep Car Wash Vizag";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Sign in to your Wash My Car Org account with SMS OTP. Track active doorstep car wash slots, vehicle spa technicians, and redeem loyalty coins in Vizag.');
    }
  }, []);

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
    <div className="flex flex-col md:flex-row" style={{minHeight: '100vh', background: 'var(--bg-main)'}}>
      {/* MOBILE INTERACTIVE BRANDED HEADER (< 768px) */}
      <div className="md:hidden" style={{
        background: 'linear-gradient(135deg, #0A0F1D 0%, #0F172A 50%, #0369A1 100%)',
        color: 'white',
        padding: '1.25rem 1.25rem 2.85rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient background glow & elements */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10px', left: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Header Top Bar: Back Link & Live Tag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', position: 'relative', zIndex: 2 }}>
          <Link 
            to="/" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              background: 'rgba(255, 255, 255, 0.12)', 
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              color: '#FFFFFF', 
              textDecoration: 'none', 
              padding: '0.42rem 0.85rem', 
              borderRadius: '20px',
              fontSize: '0.8rem', 
              fontWeight: 700 
            }}
          >
            <ArrowLeft size={14} /> <span>Home</span>
          </Link>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(16, 185, 129, 0.18)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            color: '#34D399',
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.02em'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
            <span>VIZAG DOORSTEP CARE</span>
          </div>
        </div>

        {/* Brand Centerpiece */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{
            background: '#FFFFFF',
            width: '82px',
            height: '82px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 25px rgba(56, 189, 248, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.85rem',
            border: '1.5px solid rgba(255, 255, 255, 0.4)',
            overflow: 'hidden',
            padding: '4px'
          }}>
            <img src={logo} alt="Wash My Car Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.42)', transformOrigin: 'center' }} />
          </div>

          <h1 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0 0 0.3rem', letterSpacing: '-0.02em' }}>
            <span style={{ color: '#FFFFFF' }}>WASH </span>
            <span style={{ color: '#38BDF8' }}>MY </span>
            <span style={{ color: '#FFFFFF' }}>CAR </span>
            <span style={{ color: '#38BDF8' }}>ORG</span>
          </h1>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#CBD5E1', fontWeight: 500 }}>
            Professional Car Detailing & Wash At Your Doorstep
          </p>

          {/* Authentic Trust Badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', padding: '0.28rem 0.65rem', borderRadius: '12px', fontSize: '0.72rem', color: '#F1F5F9', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
              ✨ <strong style={{ color: '#FCD34D' }}>Professional</strong> Service
            </span>
            <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', padding: '0.28rem 0.65rem', borderRadius: '12px', fontSize: '0.72rem', color: '#F1F5F9', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
              <ShieldCheck size={14} color="#38BDF8" /> SMS OTP Verified
            </span>
            <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', padding: '0.28rem 0.65rem', borderRadius: '12px', fontSize: '0.72rem', color: '#F1F5F9', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
              💧 100% Spot-Free Care
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Left side branding (>= 768px) */}
      <div className="hidden md:flex flex-col items-center justify-center p-10" style={{flex: 1, background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))', color: 'white', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'relative', zIndex: 2, textAlign: 'center'}}>
          <div style={{
            background: 'white',
            width: '120px',
            height: '120px',
            borderRadius: '1.5rem',
            boxShadow: '0 0 30px rgba(56, 189, 248, 0.65), 0 10px 20px rgba(0,0,0,0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
            overflow: 'hidden',
            padding: '8px'
          }}>
            <img src={logo} alt="Wash My Car Logo" style={{width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.4)'}} />
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
      <div className="flex flex-col justify-center p-6 md:p-16 auth-card-container" style={{
        flex: 1, 
        background: 'white',
        borderTopLeftRadius: '28px',
        borderTopRightRadius: '28px',
        marginTop: '-1.5rem',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 -10px 30px rgba(0,0,0,0.08)'
      }}>
        <div style={{maxWidth: '420px', width: '100%', margin: '0 auto'}}>
          {/* Back to Homepage Button (Desktop only, mobile has it in header) */}
          <Link to="/" className="hidden md:inline-flex items-center gap-2" style={{ color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Homepage
          </Link>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', background: '#F0F9FF', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid #BAE6FD', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <ShieldCheck size={13} /> SMS OTP Verification
            </div>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', color: 'var(--primary-navy)', letterSpacing: '-0.02em' }}>Customer Login</h1>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Enter your 10-digit mobile number to access your doorstep car care account.</p>
          </div>

          {/* Sitelink-Aligned Claim Welcome Offer Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #EFF6FF 100%)',
            border: '1.5px dashed #0EA5E9',
            borderRadius: '14px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            boxShadow: '0 2px 8px rgba(14, 165, 233, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: 'white',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 3px 8px rgba(2, 132, 199, 0.35)'
              }}>
                <Gift size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Claim Welcome Offer</span>
                  <span style={{ background: '#22C55E', color: 'white', fontSize: '0.62rem', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>NEW</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px', lineHeight: 1.3 }}>
                  Sign up now to get ₹100 discount + 100 reward coins on your 1st wash!
                </div>
              </div>
            </div>
            <Link 
              to="/register?offer=welcome"
              style={{
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: 'white',
                textDecoration: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                flexShrink: 0
              }}
            >
              Claim Offer →
            </Link>
          </div>
          
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
              <label className="form-label" style={{fontWeight: 700, fontSize: '0.86rem'}}>Mobile Number</label>
              <div style={{position: 'relative', display: 'flex', gap: '0.5rem'}}>
                <div style={{position: 'relative', flex: 1, display: 'flex', alignItems: 'center'}}>
                  <div style={{
                    position: 'absolute',
                    left: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: '#475569',
                    borderRight: '1px solid #CBD5E1',
                    paddingRight: '0.5rem',
                    pointerEvents: 'none'
                  }}>
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input 
                    type="tel" 
                    required 
                    disabled={loading || sendingOtp} 
                    className="form-input" 
                    style={{paddingLeft: '4.8rem', opacity: loading ? 0.7 : 1, width: '100%', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em'}} 
                    placeholder="98765 43210" 
                    value={phone} 
                    onChange={e => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
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
                    fontWeight: 700,
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
                  <label className="form-label" style={{margin: 0, fontWeight: 700, fontSize: '0.86rem'}}>Enter Verification OTP</label>
                  {timer > 0 ? (
                    <span style={{fontSize: '0.78rem', color: '#64748B'}}>Resend in {timer}s</span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleSendOtp}
                      style={{background: 'none', border: 'none', color: '#0284C7', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', padding: 0}}
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
                    style={{paddingLeft: '2.5rem', letterSpacing: '0.25em', fontWeight: 800, fontSize: '1.15rem', textAlign: 'center', opacity: loading ? 0.7 : 1}} 
                    placeholder="• • • • • •" 
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
                fontWeight: 700,
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

          {/* Privacy Guarantee Note */}
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem',
            background: '#F8FAFC',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.76rem',
            color: '#64748B'
          }}>
            <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
            <span><strong>100% Privacy Protected:</strong> We never share your phone number with 3rd parties or send unsolicited spam.</span>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.92rem', color: '#475569' }}>
            <span>Don't have an account? </span>
            <Link to="/register?offer=welcome" className="text-blue" style={{ fontWeight: 800 }}>
              Claim Welcome Offer & Register →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Login;
