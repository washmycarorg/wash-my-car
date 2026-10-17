import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, FileText, Droplets, RefreshCw, Car, 
  Lock, CheckCircle2, AlertTriangle, Phone, Mail, Award, Clock
} from 'lucide-react';
import { getSettings } from '../api';
import logo from '../assets/wash my car.png';

const DEFAULT_TERMS = `1. DOORSTEP ACCESS & SERVICE REQUIREMENTS
- Customer Water & Power Access: The customer agrees to provide accessible domestic water tap connection and a standard 220V/16A electric plug point within a reasonable distance (20-25 meters) for our technician to operate high-pressure washing machines, vacuum cleaners, and steam detailing equipment safely.
- Vehicle Parking Clearance: The vehicle must be parked in a safe, legal, and adequately illuminated space with at least 2 to 3 feet of clearance on all sides to allow complete exterior and interior detailing without obstruction.
- Personal Belongings & Valuables: Customers are strictly requested to remove all personal belongings, cash, jewelry, electronic items, and important documents from inside the car before service starts. Wash My Car Org and its technicians are not responsible for unattended personal valuables.

2. CANCELLATION, RESCHEDULE & REFUND POLICY
- 9-Hour Full Refund Window: Customers can cancel an upcoming booking up to 9 hours prior to the scheduled slot arrival time on the booking date to receive a 100% full refund. The refund is automatically initiated to your original payment method.
- Non-Refundable Within 9 Hours: If not cancelled at least 9 hours prior to the scheduled slot time, bookings are strictly non-refundable and no refund will be initiated, as our service technician equipped on scooty/bike with professional wash & detailing kits and complete vehicle care amenities (floor papers, car fresheners, cleaning liquids & detailing supplies) is reserved exclusively for your vehicle.
- Easy Slot Rescheduling: Customers can reschedule any upcoming service slot free of charge up to 9 hours before the scheduled appointment time.
- Doorstep Rejection / Non-Refund Policy: If not cancelled at least 9 hours prior to slot time, or if any doorstep rejection is found upon technician arrival (including customer refusal, lack of domestic water/electricity access, gated community denial, or customer unavailability after 20 minutes of waiting), NO refund will be initiated under any circumstances.
- Bad Weather Policy: In case of sudden torrential monsoon rain or hazardous weather, washes will be placed on hold and rescheduled to the earliest convenient dry time slot with customer consent.

3. PRICING, PROMOTIONS & VIP PASSES
- All prices displayed are inclusive of professional detailing labor and premium pH-neutral cleaning chemicals.
- Promotional coupon codes and referral wallet discounts are applicable as per individual offer rules.
- VIP monthly subscription passes are non-transferable and tied to the registered vehicle plate number.`;

const DEFAULT_PRIVACY = `1. INFORMATION WE COLLECT & PURPOSE
- Mobile Number & SMS OTP: Collected exclusively for secure account registration, login verification, passwordless SMS authentication via Twilio, and instant transactional booking updates (booking confirmation, technician arrival alert, and digital invoice).
- Vehicle Registration Plate Number & Model: Collected strictly to instruct the assigned service technician on exactly which vehicle to wash and detail at your doorstep, guaranteeing service authenticity and preventing wrong-car washing.
- Service Address & Location: Used solely for navigation and smart dispatch routing of our doorstep mobile detailing technician (arriving on scooty/bike equipped with complete wash & detailing kit and vehicle care amenities) to your home or office parking.

2. BEFORE & AFTER WASH VERIFICATION PHOTOS
- Purpose of Vehicle Photos: Our field technicians take high-resolution before-and-after photographs of the vehicle exterior, tyres, and cabin. These photos are taken solely for service completion verification, job quality audit, and internal technician authenticity evaluation.
- Absolute Confidentiality: Vehicle photos are strictly private and stored securely. They will NEVER be sold, shared, published, or distributed to any third party or public social media without your prior explicit consent.

3. COMMUNICATIONS & PROMOTIONAL NOTIFICATIONS
- Service Communications: We send essential transactional SMS, WhatsApp updates, and call reminders regarding your active wash appointment and arrival timings.
- Promotional Messages: We may occasionally notify you about exclusive seasonal discounts, monsoon specials, or loyalty point bonuses. You can opt out of promotional messages anytime by contacting support.

4. STRICT ZERO THIRD-PARTY DATA SHARING GUARANTEE
- We respect your privacy. Wash My Car Org has a strict zero-tolerance data monetisation policy: we NEVER sell, rent, lease, trade, or share your personal information, phone numbers, or vehicle details with third-party advertisers or external marketing brokers.`;

const TermsAndPrivacy = ({ defaultTab = 'terms' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(true);
  const [termsText, setTermsText] = useState(DEFAULT_TERMS);
  const [privacyText, setPrivacyText] = useState(DEFAULT_PRIVACY);

  useEffect(() => {
    // If route is /privacy, set active tab
    if (location.pathname.includes('privacy')) {
      setActiveTab('privacy');
    } else {
      setActiveTab('terms');
    }
  }, [location.pathname]);

  useEffect(() => {
    getSettings()
      .then(res => {
        if (res) {
          if (res.termsAndConditionsText && res.termsAndConditionsText.trim()) {
            setTermsText(res.termsAndConditionsText);
          }
          if (res.privacyPolicyText && res.privacyPolicyText.trim()) {
            setPrivacyText(res.privacyPolicyText);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn('Could not load custom terms/privacy settings:', err);
        setLoading(false);
      });
  }, []);

  const renderContentBlocks = (rawText) => {
    if (!rawText) return null;
    const sections = rawText.split(/\n\s*\n/).filter(Boolean);

    return sections.map((sec, sIdx) => {
      const lines = sec.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return null;

      const titleLine = lines[0];
      const isHeader = /^\d+\./.test(titleLine) || titleLine.toUpperCase() === titleLine;
      const bodyLines = isHeader ? lines.slice(1) : lines;

      return (
        <div 
          key={sIdx}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.25rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
          {isHeader && (
            <h3 style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--primary-navy)',
              margin: '0 0 0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#0284C7'
              }} />
              {titleLine}
            </h3>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {bodyLines.map((line, lIdx) => {
              const isBullet = line.startsWith('-') || line.startsWith('•');
              const cleanLine = isBullet ? line.replace(/^[-•]\s*/, '') : line;
              const hasColon = cleanLine.includes(':');
              const [boldPart, restPart] = hasColon ? cleanLine.split(/:\s*(.+)/) : [null, cleanLine];

              return (
                <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
                  {isBullet && (
                    <span style={{ color: '#0EA5E9', fontWeight: 800, marginTop: '2px', flexShrink: 0 }}>•</span>
                  )}
                  <div>
                    {boldPart ? (
                      <>
                        <strong style={{ color: '#0F172A', fontWeight: 700 }}>{boldPart}:</strong>{' '}
                        <span>{restPart}</span>
                      </>
                    ) : (
                      <span>{cleanLine}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: 'var(--text-main)', paddingBottom: '4rem' }}>
      
      {/* Top Branded Hero Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #0A0F1D 0%, #0F172A 60%, #0284C7 100%)',
        color: 'white',
        padding: '2rem 6% 3rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient background glows */}
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          {/* Top Bar with Back Link */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <Link 
              to="/" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.45rem', 
                background: 'rgba(255, 255, 255, 0.12)', 
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF', 
                textDecoration: 'none', 
                padding: '0.45rem 1rem', 
                borderRadius: '20px',
                fontSize: '0.82rem', 
                fontWeight: 700 
              }}
            >
              <ArrowLeft size={16} /> <span>Back to Homepage</span>
            </Link>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              color: '#34D399',
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.02em'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
              <span>OFFICIAL SERVICE POLICIES • WASH MY CAR ORG</span>
            </div>
          </div>

          {/* Header Title with Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{
              background: '#FFFFFF',
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              padding: '6px',
              flexShrink: 0
            }}>
              <img 
                src={logo} 
                alt="Wash My Car Org Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  transform: 'scale(1.4)'
                }} 
              />
            </div>

            <div>
              <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', fontWeight: 900, margin: '0 0 0.35rem', letterSpacing: '-0.02em', color: 'white' }}>
                Terms of Service & Privacy Policy
              </h1>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#CBD5E1', lineHeight: 1.5 }}>
                Clear doorstep service guidelines, transparent refund rules, vehicle data usage, and photo audit privacy.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Container with Floating Elevated Card */}
      <div style={{ maxWidth: '960px', margin: '-1.5rem auto 0', padding: '0 1rem', position: 'relative', zIndex: 10 }}>
        
        {/* Navigation Tabs Bar */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '0.45rem',
          display: 'flex',
          gap: '0.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #E2E8F0',
          marginBottom: '1.75rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            style={{
              flex: 1,
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'terms' ? 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' : 'transparent',
              color: activeTab === 'terms' ? '#FFFFFF' : '#64748B',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'terms' ? '0 4px 15px rgba(14,165,233,0.3)' : 'none'
            }}
          >
            <FileText size={18} />
            <span>Terms & Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            style={{
              flex: 1,
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'privacy' ? 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' : 'transparent',
              color: activeTab === 'privacy' ? '#FFFFFF' : '#64748B',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'privacy' ? '0 4px 15px rgba(14,165,233,0.3)' : 'none'
            }}
          >
            <Lock size={18} />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* 4 Core Principles Highlights Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', marginBottom: '0.65rem' }}>
              <Droplets size={18} />
            </div>
            <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block', marginBottom: '4px' }}>Water & Power Tap</strong>
            <span style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4, display: 'block' }}>Customer provides domestic tap and standard 16A plug access for detailing machines.</span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', marginBottom: '0.65rem' }}>
              <RefreshCw size={18} />
            </div>
            <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block', marginBottom: '4px' }}>Fair Refund System</strong>
            <span style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4, display: 'block' }}>100% full refund if cancelled up to 9 hours prior to slot time. If not cancelled before 9 hours or if any doorstep rejection is found, no refund will be initiated.</span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', marginBottom: '0.65rem' }}>
              <Car size={18} />
            </div>
            <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block', marginBottom: '4px' }}>Car Plate Authentication</strong>
            <span style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4, display: 'block' }}>Car numbers are taken strictly to guide the employee to the right vehicle for accurate service.</span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', marginBottom: '0.65rem' }}>
              <ShieldCheck size={18} />
            </div>
            <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block', marginBottom: '4px' }}>Photo Audit Privacy</strong>
            <span style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4, display: 'block' }}>Detailing photos are strictly used for staff quality audit. Never shared with third parties.</span>
          </div>
        </div>

        {/* Dynamic Policy Text Content */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 0.75rem' }} />
            <div>Loading policy content...</div>
          </div>
        ) : (
          <div>
            {activeTab === 'terms' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
                    Doorstep Service Terms & Operating Rules
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Version 2.4 • Current</span>
                </div>
                {renderContentBlocks(termsText)}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
                    Customer Privacy & Vehicle Data Protection Policy
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Version 2.4 • Current</span>
                </div>
                {renderContentBlocks(privacyText)}
              </div>
            )}
          </div>
        )}

        {/* Contact Help Desk Card */}
        <div style={{
          marginTop: '2rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '16px',
          padding: '1.75rem',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#FFFFFF' }}>
              Have Questions or Feedback Regarding Service Terms?
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8' }}>
              Our dedicated customer support and grievance desk is available daily 8:00 AM – 8:00 PM.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a 
              href="tel:919876543210"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#0284C7',
                color: 'white',
                padding: '0.55rem 1.1rem',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.84rem'
              }}
            >
              <Phone size={15} /> <span>Call Support</span>
            </a>
            <a 
              href="mailto:washmycarorg@gmail.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '0.55rem 1.1rem',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.84rem'
              }}
            >
              <Mail size={15} /> <span>Email Us</span>
            </a>
          </div>
        </div>

      </div>

    </div>
  );
};

export default TermsAndPrivacy;
