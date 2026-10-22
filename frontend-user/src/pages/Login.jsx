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
  const gsiInitializedRef = useRef(false);
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
      if (gsiInitializedRef.current) return;
      if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: true,
          });
          gsiInitializedRef.current = true;

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
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
            const reason = (notification.getNotDisplayedReason && notification.getNotDisplayedReason()) || 
              (notification.getSkippedReason && notification.getSkippedReason()) || '';
            if (reason && reason !== 'unknown_reason') {
              console.info('Google GSI prompt info:', reason);
            }
            setShowGooglePrompt(true);
          }
        });
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
    <div className="auth-page-root">
      {/* MOBILE INTERACTIVE BRANDED HEADER (< 900px) */}
      <div className="md:hidden auth-mobile-hero">
        <div className="hero-orb-1" />
        <div className="hero-orb-2" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.15rem', position: 'relative', zIndex: 2 }}>
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
              padding: '0.38rem 0.8rem', 
              borderRadius: '20px',
              fontSize: '0.78rem', 
              fontWeight: 700 
            }}
          >
            <ArrowLeft size={14} /> <span>Home</span>
          </Link>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'rgba(16, 185, 129, 0.18)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            color: '#34D399',
            padding: '0.25rem 0.65rem',
            borderRadius: '14px',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.02em'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
            <span>VIZAG LIVE</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{
            background: '#FFFFFF',
            width: '46px',
            height: '46px',
            borderRadius: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            overflow: 'hidden',
            boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
            marginBottom: '0.45rem'
          }}>
            <img src={logo} alt="Wash My Car Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.2)' }} />
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            WASH <span style={{ color: '#38BDF8' }}>MY CAR</span> ORG
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginTop: '2px' }}>
            Doorstep Car Care & Detailing
          </span>
        </div>
      </div>

      {/* Desktop Left side branding (>= 900px) */}
      <div className="hidden md:flex flex-col items-center justify-center p-12" style={{ flex: 1, background: 'linear-gradient(135deg, var(--primary-navy), var(--primary-blue))', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '420px' }}>
          <div style={{
            background: 'white',
            width: '110px',
            height: '110px',
            borderRadius: '1.5rem',
            boxShadow: '0 0 35px rgba(56, 189, 248, 0.65), 0 10px 20px rgba(0,0,0,0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.75rem',
            overflow: 'hidden',
            padding: '8px'
          }}>
            <img src={logo} alt="Wash My Car Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.35)' }} />
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem' }}>Your Car, Cleaned At Your Door.</h2>
          <p style={{ fontSize: '0.95rem', opacity: 0.9, fontWeight: 500, lineHeight: 1.5 }}>
            Doorstep car detailing & bike wash across Visakhapatnam. Track your technician live.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.75rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '20px', backdropFilter: 'blur(10px)', fontSize: '0.85rem' }}>
            <ShieldCheck size={18} color="#34D399" /> <span>Secure Google OAuth & Email Authentication</span>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', top: '10%', left: '-5%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* Right side form */}
      <div className="auth-form-wrapper">
        <div className="auth-floating-card">
          
          {/* TAB SWITCHER: SIGN IN / CREATE ACCOUNT */}
          <div className="auth-pill-switch">
            <Link to="/login" className="auth-pill-tab active">
              <span>Sign In</span>
            </Link>
            <Link to="/register" className="auth-pill-tab inactive">
              <span>Create Account</span>
            </Link>
          </div>

          {/* COMPACT WELCOME OFFER BANNER */}
          <div style={{
            background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
            border: '1px solid #A7F3D0',
            borderRadius: '11px',
            padding: '0.5rem 0.75rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            fontSize: '0.78rem',
            color: '#065F46'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              <span>🎁</span>
              <span>Welcome: <strong>Free ₹199 Bike Wash</strong> on 1st wash</span>
            </div>
            <span style={{ 
              background: '#059669', 
              color: 'white', 
              fontSize: '0.65rem', 
              fontWeight: 800, 
              padding: '2px 7px', 
              borderRadius: '6px',
              letterSpacing: '0.04em' 
            }}>
              WELCOME
            </span>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.35rem', color: '#0F172A', letterSpacing: '-0.02em' }}>
              Welcome Back
            </h1>
            <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: '0.82rem', lineHeight: 1.4 }}>
              Sign in to manage doorstep washes and track your technician.
            </p>
          </div>

          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              color: '#991B1B',
              fontSize: '0.84rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} /> <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              color: '#065F46',
              fontSize: '0.84rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} /> <span>{successMsg}</span>
            </div>
          )}

          {/* PRIMARY: CONTINUE WITH GOOGLE BUTTON */}
          <div style={{ marginBottom: '1.15rem' }}>
            <button
              type="button"
              disabled={googleLoading || loading}
              onClick={triggerGoogleSignIn}
              className="auth-google-button"
            >
              {/* Official Google 4-Color SVG Icon */}
              <svg width="19" height="19" viewBox="0 0 24 24">
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
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.15rem 0', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {otpSent ? 'Verify Email Code' : 'Or Continue with Email'}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          </div>

          {!otpSent ? (
            /* STEP 1: ENTER EMAIL & REQUEST OTP */
            <form onSubmit={handleSendEmailOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="auth-field-box">
                <label className="auth-field-label">
                  <span>Email Address</span>
                  <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input 
                    type="email" 
                    required 
                    disabled={otpSending || googleLoading} 
                    className="auth-text-input" 
                    style={{ paddingLeft: '2.5rem' }} 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={e => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }} 
                  />
                </div>
                <small style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '0.3rem', display: 'block' }}>
                  We'll send a 6-digit one-time passcode. Password-free sign in!
                </small>
              </div>

              <button 
                type="submit" 
                disabled={otpSending || googleLoading} 
                className="auth-primary-btn"
              >
                {otpSending ? (
                  <>
                    <span className="spinner" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Send Verification Code to Email →</span>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: ENTER OTP & SIGN IN */
            <form onSubmit={handleVerifyAndLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Account Details Summary */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '11px',
                padding: '0.75rem 0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Login code sent to:</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>{email}</div>
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
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer'
                  }}
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
              </div>

              <div className="auth-field-box">
                <label className="auth-field-label">
                  <span>Enter 6-Digit Verification Code</span>
                  <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#0284C7' }} />
                  <input 
                    type="text" 
                    inputMode="numeric"
                    required 
                    autoFocus
                    maxLength={6}
                    disabled={loading} 
                    className="auth-text-input" 
                    style={{
                      paddingLeft: '2.5rem',
                      fontWeight: 800,
                      fontSize: '1.25rem',
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
                  <small style={{ fontSize: '0.73rem', color: '#64748B' }}>
                    Valid for 10 minutes. Check spam if needed.
                  </small>
                  {resendTimer > 0 ? (
                    <span style={{ fontSize: '0.73rem', color: '#64748B', fontWeight: 600 }}>
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
                        fontSize: '0.73rem',
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
                className="auth-primary-btn"
                style={{
                  opacity: (loading || emailOtp.trim().length < 6) ? 0.75 : 1,
                  cursor: (loading || emailOtp.trim().length < 6) ? 'not-allowed' : 'pointer'
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
            marginTop: '1.15rem',
            padding: '0.65rem 0.8rem',
            background: '#F8FAFC',
            borderRadius: '11px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            fontSize: '0.75rem',
            color: '#64748B'
          }}>
            <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
            <span><strong>100% Privacy Protected:</strong> We never share your contact details or send unsolicited spam.</span>
          </div>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.88rem', color: '#475569' }}>
            <span>Don't have an account? </span>
            <Link to="/register?offer=welcome" style={{ color: '#0284C7', fontWeight: 800 }}>
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
                <small style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.3rem', display: 'block' }}>
                  🔒 For account security, your phone number cannot be changed once updated.
                </small>
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

              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('pendingUserToken');
                  sessionStorage.removeItem('pendingUser');
                  setShowPhoneModal(false);
                  setPendingUser(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  textDecoration: 'underline',
                  padding: '0.2rem'
                }}
              >
                Cancel and sign in with another method
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
