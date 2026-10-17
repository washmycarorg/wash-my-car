import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Headphones, Phone, Mail, MapPin, MessageSquare, Clock, 
  CheckCircle, AlertCircle, FileText, Lock, ShieldCheck, 
  ChevronDown, Search, ArrowRight, ExternalLink, Image, X,
  Sparkles, RefreshCw, HelpCircle, Car
} from 'lucide-react';
import { 
  getHomeContent, 
  getServiceAreas, 
  getSettings, 
  getProfile, 
  submitInquiry 
} from '../api';

const DEFAULT_FAQS = [
  {
    q: 'How does doorstep mobile car wash work?',
    a: 'Our certified detailing technician arrives directly at your home or apartment parking with commercial equipment including high-pressure jet washers, industrial vacuum machines, pH-neutral car shampoos, and microfiber detailing cloths to wash and pamper your vehicle on site.'
  },
  {
    q: 'What do I need to provide for the doorstep wash?',
    a: 'We require access to a standard domestic water tap connection and a standard 220V/16A electrical socket within 20-25 meters of your vehicle parking. The car should be parked with 2 to 3 feet of clearance on all sides.'
  },
  {
    q: 'What is your cancellation and refund policy?',
    a: 'We operate a transparent refund policy. If you cancel your booking at least 9 hours prior to your scheduled slot arrival time on the booking date, a 100% full refund is automatically initiated to your original payment method. If not cancelled before 9 hours, or if any doorstep rejection is found upon technician arrival (including customer refusal, inaccessible water/electricity, or gated entry denial), no refund will be initiated under any circumstances.'
  },
  {
    q: 'How long does a doorstep car wash take?',
    a: 'Depending on the package selected, an Exterior Foam Wash takes approximately 30-45 minutes. A Deep Interior Steam Spa or Complete Detail Spa takes 60-90 minutes of meticulous cleaning.'
  },
  {
    q: 'Can I reschedule my appointment slot?',
    a: 'Yes, you can reschedule any upcoming service slot free of charge up to 9 hours prior to your scheduled slot time directly from your My Bookings tab or by reaching out to support.'
  },
  {
    q: 'Are your technician staff verified and safe?',
    a: 'Yes! All Wash My Car Org field technicians undergo comprehensive identity background checks, police verification, and intensive multi-step professional automobile detailing training before deployment.'
  },
  {
    q: 'What payment methods are supported?',
    a: 'We accept all major online payment options via Razorpay including UPI (Google Pay, PhonePe, Paytm), Credit Cards, Debit Cards, Net Banking, and Wash My Car Royalty Points.'
  }
];

const Support = () => {
  const [profile, setProfile] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [contactEmail, setContactEmail] = useState('washmycarorg@gmail.com');
  const [contactAddress, setContactAddress] = useState('Visakhapatnam, Andhra Pradesh, India');
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Doorstep Car Wash',
    otherReason: '',
    message: ''
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1. Fetch user profile for pre-filling contact form
    getProfile()
      .then(prof => {
        if (prof) {
          setProfile(prof);
          setContactForm(prev => ({
            ...prev,
            name: prof.name || prev.name,
            phone: prof.phone || prev.phone,
            email: prof.email || prev.email
          }));
        }
      })
      .catch(() => {});

    // 2. Fetch CMS content & Contact Info & FAQs
    getHomeContent()
      .then(cms => {
        if (cms) {
          if (cms.contactPhone) setContactPhone(cms.contactPhone);
          if (cms.contactEmail) setContactEmail(cms.contactEmail);
          if (cms.contactAddress) setContactAddress(cms.contactAddress);

          let parsedFaqs = cms.faqs;
          if (typeof parsedFaqs === 'string') {
            try { parsedFaqs = JSON.parse(parsedFaqs); } catch (e) { parsedFaqs = null; }
          }
          if (Array.isArray(parsedFaqs) && parsedFaqs.length > 0) {
            setFaqs(parsedFaqs);
          }
        }
      })
      .catch(() => {});

    // 3. Fetch Service Areas
    getServiceAreas()
      .then(areas => {
        if (Array.isArray(areas)) setServiceAreas(areas);
      })
      .catch(() => {});
  }, []);

  // Handle Image Uploads (up to 3 images)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (selectedImages.length + files.length > 3) {
      alert('You can upload a maximum of 3 photos with your support inquiry.');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('Please select valid image files only.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Each photo must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSelectedImages(prev => {
          if (prev.length >= 3) return prev;
          return [...prev, uploadEvent.target.result];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit Contact Form
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      setContactError('Please enter your Name and Phone Number so our support team can reach you.');
      return;
    }
    if (contactForm.service === 'Other' && !contactForm.otherReason?.trim()) {
      setContactError('Please specify the topic or reason for your inquiry.');
      return;
    }

    setContactError('');
    setIsSubmitting(true);

    try {
      const finalService = contactForm.service === 'Other' && contactForm.otherReason?.trim()
        ? `Other: ${contactForm.otherReason.trim()}`
        : (contactForm.service || 'Doorstep Car Wash');

      const finalMessage = contactForm.message?.trim()
        ? contactForm.message.trim()
        : (contactForm.otherReason?.trim() ? `Reason: ${contactForm.otherReason.trim()}` : 'Support inquiry submitted from dashboard');

      await submitInquiry({
        name: contactForm.name.trim(),
        phone: contactForm.phone.trim(),
        email: contactForm.email ? contactForm.email.trim() : null,
        service: finalService,
        message: finalMessage,
        images: selectedImages,
        type: contactForm.service && contactForm.service.includes('Franchise') ? 'FRANCHISE' : 'SUPPORT'
      });

      setContactSubmitted(true);
    } catch (err) {
      console.error('Failed to submit support inquiry:', err);
      setContactError(err.message || 'Could not send inquiry. Please try calling or emailing us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanPhone = (contactPhone || '').replace(/[^\d+]/g, '');
  const cleanWhatsapp = (contactPhone || '').replace(/\D/g, '');

  const filteredFaqs = faqs.filter(faq => {
    if (!faqSearchQuery) return true;
    const q = (faq.q || '').toLowerCase();
    const a = (faq.a || '').toLowerCase();
    const term = faqSearchQuery.toLowerCase();
    return q.includes(term) || a.includes(term);
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '5rem' }}>
      
      {/* 1. Header / Hero Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #0A0F1D 0%, #0F172A 60%, #0284C7 100%)',
        color: 'white',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(2, 132, 199, 0.15)'
      }}>
        {/* Glows */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '750px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'rgba(56, 189, 248, 0.18)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#7DD3FC',
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            fontSize: '0.74rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            marginBottom: '1rem'
          }}>
            <Headphones size={13} />
            <span>CUSTOMER SUPPORT & HELP DESK • 24/7 ASSISTANCE</span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, color: 'white', margin: '0 0 0.6rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            How Can We Assist You Today?
          </h1>

          <p style={{ fontSize: '0.96rem', color: '#CBD5E1', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
            Have a question about your doorstep booking, refund status, vehicle package, or service terms? Send an inquiry message below or connect with our support desk instantly.
          </p>

          {/* Quick Contact Buttons Row */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href={`tel:${cleanPhone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#0284C7',
                color: 'white',
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.86rem',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              <Phone size={16} /> <span>Call Helpline: {contactPhone}</span>
            </a>

            <a
              href={`https://wa.me/${cleanWhatsapp}?text=Hi%20Wash%20My%20Car%20Org%2C%20I%20need%20support%20with%20my%20booking.`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#10B981',
                color: 'white',
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.86rem',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              <MessageSquare size={16} /> <span>WhatsApp Chat</span>
            </a>

            <a
              href={`mailto:${contactEmail}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: 'white',
                padding: '0.65rem 1.15rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.86rem',
                textDecoration: 'none'
              }}
            >
              <Mail size={16} /> <span>Email Desk</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Policy Quick Cards (Terms & Conditions, 9-Hour Refund, Privacy Policy) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 0.2rem' }}>
              Service Policies & Legal Protections
            </h2>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Transparent terms, doorstep water/power rules, and verified refund guidelines
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', background: '#E0F2FE', color: '#0369A1', padding: '0.2rem 0.65rem', borderRadius: '12px', fontWeight: 800 }}>
            Policy v2.4 Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          
          {/* Card 1: Terms & Conditions with 9-Hour Refund Policy */}
          <div style={{
            background: 'white',
            border: '1.5px solid #BAE6FD',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(2, 132, 199, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                    Terms of Service & Cancellation Policy
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 700 }}>
                    Official Doorstep Operating Rules
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55, margin: '0 0 1rem' }}>
                Complete details on domestic water tap access, 16A electric plug connection, 2-3 feet vehicle parking clearance, personal valuables advisory, and our <strong>9-Hour 100% Refund & Doorstep Rejection Policy</strong>.
              </p>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.75rem 0.85rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: '#334155', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 800, color: '#0284C7', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <RefreshCw size={13} /> 9-Hour Cancellation & Rejection Rule:
                </div>
                <div>• Cancellations ≥ 9 hours before slot: <strong>100% full refund</strong> allocated.</div>
                <div>• Within 9 hours or doorstep rejection: <strong>Strictly no refund initiated</strong>.</div>
              </div>
            </div>

            <Link
              to="/terms"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: 'white',
                padding: '0.7rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.85rem',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
              }}
            >
              <span>View Terms & Conditions Page</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Card 2: Privacy Policy */}
          <div style={{
            background: 'white',
            border: '1.5px solid #BBF7D0',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                  <Lock size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                    Customer Privacy & Vehicle Data Policy
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700 }}>
                    Strict Zero Data Monetisation
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55, margin: '0 0 1rem' }}>
                Your privacy is paramount. Learn how mobile OTP credentials, vehicle registration plates, doorstep addresses, and before-and-after vehicle audit photographs are stored and protected.
              </p>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.75rem 0.85rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: '#334155', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 800, color: '#16A34A', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} /> Zero Third-Party Sharing Guarantee:
                </div>
                <div>• Vehicle photos are strictly used for staff quality audit.</div>
                <div>• Personal numbers and vehicle details are NEVER sold or leased.</div>
              </div>
            </div>

            <Link
              to="/privacy"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                padding: '0.7rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.85rem',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              <span>View Privacy Policy Page</span>
              <ArrowRight size={15} />
            </Link>
          </div>

        </div>
      </div>

      {/* 3. Contact Form & Direct Help Desk Grid (Same as Home Page) */}
      <div style={{ marginBottom: '3rem' }}>
        <div className="grid lg:grid-cols-2 gap-8 items-start" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
          
          {/* Left Column: Direct Info & Hubs */}
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '24px',
              boxShadow: '0 15px 35px rgba(15, 23, 42, 0.15)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <span style={{ 
                color: '#38BDF8', 
                fontWeight: 800, 
                fontSize: '0.75rem', 
                letterSpacing: '1.2px', 
                textTransform: 'uppercase',
                background: 'rgba(56, 189, 248, 0.15)',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'inline-block',
                marginBottom: '1rem'
              }}>
                DIRECT HELPDESK
              </span>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: '0 0 0.85rem' }}>
                We're Here at Your Service
              </h2>

              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
                Our customer grievance and support desk is operational daily from <strong>8:00 AM to 8:00 PM</strong> to handle active wash tracking, slot changes, and payment queries.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <a 
                  href={`tel:${cleanPhone}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none', color: 'white' }}
                >
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.65rem', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.3)' }}>
                    <Phone size={18} color="#38BDF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Hotline Phone</div>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>{contactPhone}</span>
                  </div>
                </a>

                <a 
                  href={`mailto:${contactEmail}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none', color: 'white' }}
                >
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.65rem', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.3)' }}>
                    <Mail size={18} color="#38BDF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Support Email</div>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'white' }}>{contactEmail}</span>
                  </div>
                </a>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.65rem', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.3)' }}>
                    <MapPin size={18} color="#38BDF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Headquarters</div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'white' }}>{contactAddress}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.65rem', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.3)' }}>
                    <Clock size={18} color="#38BDF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Working Hours</div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'white' }}>Monday – Sunday (8:00 AM – 8:00 PM)</span>
                  </div>
                </div>
              </div>

              {/* Active Service Zones Chips */}
              <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Doorstep Service Zones:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(serviceAreas.length > 0 ? serviceAreas.map(a => a.name) : ['Maddilapalem', 'Madhurawada', 'NAD Junction', 'Old Gajuwaka', 'Pendurthi']).map((zone, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: '#7DD3FC',
                        border: '1px solid rgba(56,189,248,0.25)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.73rem',
                        fontWeight: 600
                      }}
                    >
                      ✓ {zone}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-End Contact Form Card (Same as Home Page) */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 45px -10px rgba(0,0,0,0.07)',
            padding: '2rem',
            position: 'relative'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.35rem 0' }}>
                Send Support Inquiry
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.86rem', margin: 0, lineHeight: 1.5 }}>
                Submit your query below. Our support coordinator will get in touch with you shortly.
              </p>
            </div>

            {contactSubmitted ? (
              <div style={{
                background: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: '20px',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                animation: 'fadeIn 0.4s ease-out'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16A34A',
                  margin: '0 auto 1rem'
                }}>
                  <CheckCircle size={32} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', margin: '0 0 0.5rem 0' }}>
                  Inquiry Submitted Successfully!
                </h4>
                <p style={{ color: '#15803D', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                  Thank you, <strong>{contactForm.name}</strong>! Our representative will contact you at <strong>{contactForm.phone}</strong> shortly to resolve your query.
                </p>
                <button
                  onClick={() => {
                    setContactSubmitted(false);
                    setContactForm({ name: profile?.name || '', phone: profile?.phone || '', email: profile?.email || '', service: 'Doorstep Car Wash', otherReason: '', message: '' });
                    setSelectedImages([]);
                  }}
                  style={{
                    background: '#16A34A',
                    color: 'white',
                    border: 'none',
                    padding: '0.65rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {contactError && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#B91C1C',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 600
                  }}>
                    ⚠️ {contactError}
                  </div>
                )}

                {/* Name and Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                      Your Name <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                      onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                      Phone Number <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98765 43210"
                      value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                      onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                    />
                  </div>
                </div>

                {/* Email and Service Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@gmail.com"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                      onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                      Topic / Service Type
                    </label>
                    <select
                      value={contactForm.service}
                      onChange={e => setContactForm({ ...contactForm, service: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: 'white'
                      }}
                      onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                      onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                    >
                      <option value="Doorstep Car Wash">Doorstep Car Wash</option>
                      <option value="Booking related issue">Booking related issue</option>
                      <option value="Refund issue">Refund issue</option>
                      <option value="Deep Interior & Steam Spa">Deep Interior & Steam Spa</option>
                      <option value="Full Vehicle Detailing Spa">Full Vehicle Detailing Spa</option>
                      <option value="9H Ceramic & Paint Protection">9H Ceramic & Paint Protection</option>
                      <option value="Bike & Helmet Wash Add-on">Bike & Helmet Wash Add-on</option>
                      <option value="Franchise Partnership">Franchise Partnership</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Conditional "Other" topic input */}
                {contactForm.service === 'Other' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                      Specify Your Topic / Issue <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Subscription transfer, custom corporate wash, rescheduled timing..."
                      value={contactForm.otherReason || ''}
                      onChange={e => setContactForm({ ...contactForm, otherReason: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        border: '1.5px solid #0EA5E9',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#F0F9FF'
                      }}
                    />
                  </div>
                )}

                {/* Message TextArea */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    Requirement Details or Vehicle Model
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your request, appointment issue, or questions here..."
                    value={contactForm.message}
                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                    onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                    onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                  />
                </div>

                {/* Photo Uploads (Max 3 Images) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Image size={14} color="#0EA5E9" />
                      Attach Photos (Optional - Max 3 Images)
                    </label>
                    <span style={{ fontSize: '0.72rem', color: selectedImages.length >= 3 ? '#DC2626' : '#64748B', fontWeight: 700 }}>
                      {selectedImages.length}/3 photos added
                    </span>
                  </div>

                  {selectedImages.length < 3 && (
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{
                        width: '100%',
                        fontSize: '0.78rem',
                        color: '#64748B',
                        padding: '0.5rem 0',
                        cursor: 'pointer'
                      }}
                    />
                  )}

                  {selectedImages.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      {selectedImages.map((imgSrc, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                          <img src={imgSrc} alt={`Attachment ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              background: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.85rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="spin-animation" />
                      <span>Sending Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Support Inquiry</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* 4. Interactive FAQs (Same as in Home Page) */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '2.5rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 2rem' }}>
          <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            NEED QUICK ANSWERS?
          </span>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)', fontWeight: 900, color: '#0F172A', margin: '0.4rem 0 0.6rem' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
            Common questions regarding doorstep requirements, 9-hour cancellation policy, arrival windows, and subscription perks.
          </p>

          {/* Search Bar for FAQs */}
          <div style={{ position: 'relative', marginTop: '1.25rem' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search questions (e.g. refund, water, cancellation)..."
              value={faqSearchQuery}
              onChange={e => setFaqSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.6rem',
                borderRadius: '12px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#0EA5E9'}
              onBlur={e => e.target.style.borderColor = '#CBD5E1'}
            />
            {faqSearchQuery && (
              <button
                type="button"
                onClick={() => setFaqSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '850px', margin: '0 auto' }}>
          {filteredFaqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
              No matching questions found for "{faqSearchQuery}". Feel free to submit an inquiry above!
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    border: isOpen ? '1.5px solid #0EA5E9' : '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: isOpen ? '0 8px 20px rgba(14,165,233,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s'
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.1rem 1.35rem',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: isOpen ? '#0284C7' : '#0F172A',
                      gap: '0.75rem'
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} color={isOpen ? '#0284C7' : '#94A3B8'} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 1.35rem 1.15rem', color: '#475569', fontSize: '0.88rem', lineHeight: 1.6, borderTop: '1px solid #F1F5F9' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default Support;
