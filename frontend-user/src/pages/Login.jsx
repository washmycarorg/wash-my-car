import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Key, ArrowLeft, CheckCircle2, ShieldCheck, Gift, Phone, AlertCircle, Sparkles, Edit2 } from 'lucide-react';
import { loginWithGoogle, loginWithEmailOtp, sendUserEmailOtp, setUserPhone } from '../api';
import logo from '../assets/wash my car.png';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const Login = ({ setAuth }) => {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Phone modal states (if user logs in with Google and needs to provide phone number)
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [userPhoneInput, setUserPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  // Fallback Google prompt state (if VITE_GOOGLE_CLIENT_ID is not configured yet)
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googlePromptEmail, setGooglePromptEmail] = useState('');
  const [googlePromptName, setGooglePromptName] = useState('');

  const googleBtnContainerRef = useRef(null);
  const navigate = useNavigate();

  // SEO Page Title and Meta Description
  useEffect(() => {
    document.title = "Customer Login | Wash My Car Org - Doorstep Car Wash Vizag";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Sign in to your Wash My Car Org account with Google or email. Track active doorstep car wash slots, vehicle spa technicians, and redeem loyalty coins in Vizag.');
    }
  }, []);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Initialize Google Identity Services if client ID is configured
  useEffect(() => {
    const initGoogleGSI = () => {
      if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnContainerRef.current) {
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 380
            });
          }
        } catch (e) {
          console.warn('Google GSI init warning:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleGSI();
    } else {
      const timer = setTimeout(initGoogleGSI, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle Google OAuth Credential callback from Google Identity Services
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setError('');
    setSuccessMsg('');
    setGoogleLoading(true);

    try {
      const res = await loginWithGoogle({ credential: response.credential });
      if (res.needsPhone) {
        setPendingUser(res.user);
        setShowPhoneModal(true);
      } else {
        setSuccessMsg('Signed in with Google successfully!');
        if (setAuth) setAuth(true);
        setTimeout(() => navigate('/dashboard'), 500);
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again or use email.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Trigger Google Sign-In when clicking the branded button
  const triggerGoogleSignIn = () => {
    setError('');
    if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.prompt();
      } catch (e) {
        setShowGooglePrompt(true);
      }
    } else {
      // Graceful fallback for local development or browsers where Google GSI is not loaded/configured
      setShowGooglePrompt(true);
    }
  };

  // Handle Fallback Google Submit (email/name)
  const handleFallbackGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googlePromptEmail.trim()) {
      setError('Please enter your Google account email');
      return;
    }
    setGoogleLoading(true);
    setError('');
    try {
      const res = await loginWithGoogle({
        email: googlePromptEmail.trim().toLowerCase(),
        name: googlePromptName.trim() || 'Valued Customer',
        googleId: `google_${Date.now()}`
      });
      setShowGooglePrompt(false);
      if (res.needsPhone) {
        setPendingUser(res.user);
        setShowPhoneModal(true);
      } else {
        setSuccessMsg('Signed in successfully!');
        if (setAuth) setAuth(true);
        setTimeout(() => navigate('/dashboard'), 500);
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Step 1: Send Login OTP to Email
  const handleSendEmailOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (otpSending || loading) return;
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setOtpSending(true);
    try {
      const res = await sendUserEmailOtp({ email: cleanEmail, purpose: 'LOGIN' });
      setOtpSent(true);
      setResendTimer(60);
      setSuccessMsg(res.message || `A 6-digit verification code was sent to ${cleanEmail}`);
    } catch (err) {
      setError(err.message || 'No account found with this email. Please register first.');
    } finally {
      setOtpSending(false);
    }
  };

  // Step 2: Verify Login OTP and Authenticate
  const handleVerifyAndLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccessMsg('');

    const cleanOtp = emailOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit verification code sent to your email');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      const res = await loginWithEmailOtp({ email: cleanEmail, otp: cleanOtp });
      if (res.needsPhone) {
        setPendingUser(res.user);
        setShowPhoneModal(true);
      } else {
        setSuccessMsg('Signed in successfully! Redirecting to dashboard...');
        if (setAuth) setAuth(true);
        setTimeout(() => navigate('/dashboard'), 500);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || otpSending) return;
    await handleSendEmailOtp();
  };

  // Handle saving mobile number if user signed in via Google without phone
  const handleSavePhone = async (e) => {
    e.preventDefault();
    const cleanPhone = userPhoneInput.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setSavingPhone(true);
    setPhoneError('');
    try {
      await setUserPhone(cleanPhone);
      setShowPhoneModal(false);
      setSuccessMsg('Mobile number saved! Welcome to Wash My Car.');
      if (setAuth) setAuth(true);
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      setPhoneError(err.message || 'Failed to save phone number. Please try again.');
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* MOBILE INTERACTIVE BRANDED HEADER (< 768px) */}
      <div className="md:hidden" style={{
        background: 'linear-gradient(135deg, #0A0F1D 0%, #0F172A 50%, #0369A1 100%)',
        color: 'white',
        padding: '1.25rem 1.25rem 2.85rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10px', left: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />

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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', padding: '0.28rem 0.65rem', borderRadius: '12px', fontSize: '0.72rem', color: '#F1F5F9', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
              ✨ <strong style={{ color: '#FCD34D' }}>Professional</strong> Service
            </span>
            <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', padding: '0.28rem 0.65rem', borderRadius: '12px', fontSize: '0.72rem', color: '#F1F5F9', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
              <ShieldCheck size={14} color="#38BDF8" /> Google & Email Verified
            </span>
            <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', padding: '0.28rem 0.65rem', borderRadius: '12px', fontSize: '0.72rem', color: '#F1F5F9', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
              💧 100% Spot-Free Care
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Left side branding (>= 768px) */}
      <div className="hidden md:flex flex-col items-center justify-center p-10" style={{ flex: 1, background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
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
            <img src={logo} alt="Wash My Car Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.4)' }} />
          </div>
          <p style={{ fontSize: '1.25rem', marginTop: '0.5rem', opacity: 0.9, fontWeight: 600 }}>Your Car, Cleaned At Your Door.</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', opacity: 0.85, fontSize: '0.95rem' }}>
            <ShieldCheck size={20} /> Secure Google OAuth & Email Authentication
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', top: '10%', left: '-5%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
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
        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
          <Link to="/" className="hidden md:inline-flex items-center gap-2" style={{ color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Homepage
          </Link>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', background: '#F0F9FF', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid #BAE6FD', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <ShieldCheck size={13} /> Secure Customer Portal
            </div>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', color: 'var(--primary-navy)', letterSpacing: '-0.02em' }}>Customer Login</h1>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Sign in to schedule doorstep washes and track your vehicle care technician.</p>
          </div>

          {/* Welcome Offer Banner */}
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
                  Get Flat ₹199 worth Bike Wash FREE on any car wash booking with coupon "WELCOME"!
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
            <div className="badge badge-danger w-full mb-4 py-2 text-center" style={{ padding: '0.75rem', fontSize: '0.9rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="badge badge-success w-full mb-4 py-2 text-center" style={{ padding: '0.75rem', fontSize: '0.9rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* PRIMARY: CONTINUE WITH GOOGLE BUTTON */}
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              disabled={googleLoading || loading}
              onClick={triggerGoogleSignIn}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#1E293B',
                cursor: (googleLoading || loading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#0284C7';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
              }}
            >
              {/* Official Google 4-Color SVG Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
            <div ref={googleBtnContainerRef} style={{ display: 'none' }} />
          </div>

          {/* DIVIDER: OR CONTINUE WITH EMAIL */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {otpSent ? 'Verify Email Code' : 'Or Continue with Email'}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          </div>

          {!otpSent ? (
            /* STEP 1: ENTER EMAIL & REQUEST OTP */
            <form onSubmit={handleSendEmailOtp} className="flex-col flex gap-3.5">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                  Email Address <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    required 
                    disabled={otpSending || googleLoading} 
                    className="form-input" 
                    style={{ paddingLeft: '2.5rem', fontWeight: 600 }} 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={e => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }} 
                  />
                </div>
                <small style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                  We'll send a 6-digit one-time passcode to your email. Password-free secure sign in!
                </small>
              </div>

              <button 
                type="submit" 
                disabled={otpSending || googleLoading} 
                className="btn btn-primary w-full" 
                style={{
                  padding: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  borderRadius: '0.65rem',
                  opacity: otpSending ? 0.8 : 1,
                  cursor: otpSending ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '1rem',
                  marginTop: '0.25rem'
                }}
              >
                {otpSending ? (
                  <>
                    <span className="spinner" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <span>Send Verification Code to Email →</span>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: ENTER OTP & SIGN IN */
            <form onSubmit={handleVerifyAndLogin} className="flex-col flex gap-3.5">
              {/* Account Details Summary */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Login code sent to:</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>{email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setEmailOtp('');
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{
                    background: 'white',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    cursor: 'pointer'
                  }}
                >
                  <Edit2 size={13} />
                  <span>Change Email</span>
                </button>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                  Enter 6-Digit Email Code <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#0284C7' }} />
                  <input 
                    type="text" 
                    inputMode="numeric"
                    required 
                    autoFocus
                    maxLength={6}
                    disabled={loading} 
                    className="form-input" 
                    style={{
                      paddingLeft: '2.5rem',
                      fontWeight: 800,
                      fontSize: '1.35rem',
                      letterSpacing: '0.35em',
                      textAlign: 'center',
                      fontFamily: 'monospace'
                    }} 
                    placeholder="123456" 
                    value={emailOtp} 
                    onChange={e => {
                      setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      if (error) setError('');
                    }} 
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                  <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Valid for 10 minutes. Check spam folder if needed.
                  </small>
                  {resendTimer > 0 ? (
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpSending}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0284C7',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      {otpSending ? 'Resending...' : 'Resend Code'}
                    </button>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || emailOtp.trim().length < 6} 
                className="btn btn-primary w-full" 
                style={{
                  padding: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  borderRadius: '0.65rem',
                  opacity: (loading || emailOtp.trim().length < 6) ? 0.75 : 1,
                  cursor: (loading || emailOtp.trim().length < 6) ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '1rem',
                  marginTop: '0.25rem'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Verify Code & Sign In →</span>
                )}
              </button>
            </form>
          )}

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
            <span><strong>100% Privacy Protected:</strong> We never share your contact information with 3rd parties or send unsolicited spam.</span>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.92rem', color: '#475569' }}>
            <span>Don't have an account? </span>
            <Link to="/register?offer=welcome" className="text-blue" style={{ fontWeight: 800 }}>
              Claim Welcome Offer & Register →
            </Link>
          </div>
        </div>
      </div>

      {/* POPUP MODAL: ASK FOR PHONE NUMBER IF SIGNED IN VIA GOOGLE */}
      {showPhoneModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            maxWidth: '440px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#E0F2FE',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)'
              }}>
                <Phone size={26} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary-navy)', margin: '0 0 0.4rem' }}>
                Almost Done! 📱
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
                {pendingUser?.name ? `Welcome, ${pendingUser.name}! ` : 'Welcome! '}
                Google authentication does not share your phone number. Please enter your unique 10-digit mobile number so our technician can coordinate arrival at your vehicle.
              </p>
            </div>

            {phoneError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.65rem', borderRadius: '8px', color: '#991B1B', fontSize: '0.84rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={15} /> {phoneError}
              </div>
            )}

            <form onSubmit={handleSavePhone} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                  Mobile Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
                    maxLength={10}
                    autoFocus
                    className="form-input"
                    style={{ paddingLeft: '4.8rem', width: '100%', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em' }}
                    placeholder="98765 43210"
                    value={userPhoneInput}
                    onChange={e => {
                      setUserPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10));
                      if (phoneError) setPhoneError('');
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPhone || userPhoneInput.trim().length < 10}
                className="btn btn-primary w-full"
                style={{
                  padding: '0.85rem',
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {savingPhone ? 'Saving Mobile Number...' : 'Save & Continue to Dashboard →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: FALLBACK GOOGLE SELECTOR IF NO VITE_GOOGLE_CLIENT_ID SET */}
      {showGooglePrompt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            maxWidth: '440px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowGooglePrompt(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '50%', background: '#F8FAFC', marginBottom: '0.5rem' }}>
                <svg width="28" height="28" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-navy)', margin: '0 0 0.3rem' }}>
                Sign In with Google Account
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                Enter your Google account email to proceed with Google authentication.
              </p>
            </div>

            <form onSubmit={handleFallbackGoogleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>Full Name (Optional)</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={googlePromptName}
                  onChange={e => setGooglePromptName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>Google Email Address <span style={{ color: '#EF4444' }}>*</span></label>
                <input 
                  type="email"
                  required
                  className="form-input"
                  placeholder="your.google@gmail.com"
                  value={googlePromptEmail}
                  onChange={e => setGooglePromptEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={googleLoading}
                className="btn btn-primary w-full"
                style={{ padding: '0.85rem', fontWeight: 800, borderRadius: '12px' }}
              >
                {googleLoading ? 'Signing In...' : 'Continue with Google →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
