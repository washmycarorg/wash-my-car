import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Droplets, CheckCircle, Leaf, Car, Calendar, MapPin, Phone, 
  Mail, Award, Clock, Menu, X, Sparkles, Star, ChevronRight, Check, Compass, Shield, Tag
} from 'lucide-react';
import { getHomeContent, getServiceAreas } from '../api';
import logo from '../assets/wash my car.png';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const VIZAG_COORDS = { lat: 17.7042, lng: 83.2980 };

const Home = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cms, setCms] = useState({
    heroTitle: "Professional Car Wash at Your Doorstep",
    heroSubtitle: "Fast, affordable, and eco-friendly car cleaning in Visakhapatnam.",
    heroImage: "/images/hero_wash.png",
    aboutTitle: "Serving Visakhapatnam & Surrounds",
    aboutText: "We proudly serve all Visakhapatnam neighborhoods with professional care and premium equipment!",
    contactPhone: "+91 98765 43210",
    contactEmail: "washmycarorg@gmail.com",
    contactAddress: "Sujatha Nagar, Vizag",
    promoTitle: "Get 20% OFF Your First Wash!",
    promoText: "Claim Offer"
  });

  const [areas, setAreas] = useState([]);
  const mapContainerRef = useRef(null);
  const googleMapInstance = useRef(null);

  useEffect(() => {
    getHomeContent()
      .then(res => {
        if (res) setCms(res);
      })
      .catch(err => {
        console.warn("Could not load dynamic CMS contents, using premium defaults:", err);
      });

    getServiceAreas()
      .then(setAreas)
      .catch(err => console.warn("Could not load service areas:", err));
  }, []);

  // Initialize public Google Map showing all coverage circles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initMap = () => {
      if (googleMapInstance.current || !window.google) return;
      const maps = window.google.maps;

      // Center Vizag
      const center = areas.length > 0 && areas[0].latitude 
        ? { lat: areas[0].latitude, lng: areas[0].longitude } 
        : VIZAG_COORDS;

      const map = new maps.Map(mapContainerRef.current, {
        center: center,
        zoom: 11,
        disableDefaultUI: false,
      });
      googleMapInstance.current = map;

      areas.forEach(area => {
        if (area.latitude && area.longitude && area.radius) {
          const circle = new maps.Circle({
            map: map,
            center: { lat: area.latitude, lng: area.longitude },
            radius: area.radius,
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            strokeColor: '#2563eb',
            strokeOpacity: 0.7,
            strokeWeight: 1.5
          });

          const infoWindow = new maps.InfoWindow({
            content: `<div style="font-family: Outfit, sans-serif; color: var(--primary-navy); padding: 2px;">
              <strong style="font-size: 0.9rem;">${area.name}</strong><br/>
              Active Doorstep Spa Service Area!
            </div>`
          });

          circle.addListener('click', (e) => {
            infoWindow.setPosition(e.latLng);
            infoWindow.open(map);
          });
        }
      });
    };

    // Load Google Maps dynamically
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [areas]);

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif', color: '#1E293B', background: '#F8FAFC', scrollBehavior: 'smooth' }}>
      
      {/* Dynamic Navbar */}
      <nav style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem 8%', 
        background: 'rgba(15, 23, 42, 0.95)', 
        color: 'white', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'white', padding: '0.2rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', height: '45px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <img src={logo} alt="Wash My Car Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.2)' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '0.7px', background: 'linear-gradient(to right, #38BDF8, #0EA5E9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            WASH MY CAR
          </span>
        </div>
        
        {/* Desktop Links */}
        <div className="hidden md:flex" style={{ gap: '2.5rem', fontWeight: 500, fontSize: '0.95rem' }}>
          <a href="#" style={{ color: '#E2E8F0', transition: 'color 0.2s' }}>Home</a>
          <a href="#services" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Services</a>
          <a href="#about" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Why Choose Us</a>
          <a href="#contact" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Contact</a>
        </div>
        
        {/* Auth Buttons */}
        <div className="hidden md:flex" style={{ gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/login')} 
            className="btn" 
            style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1.25rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/register')} 
            className="btn btn-teal" 
            style={{ padding: '0.5rem 1.5rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}
          >
            Get Started
          </button>
        </div>

        {/* Mobile toggles */}
        <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate('/login')} className="btn btn-teal" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderRadius: '15px' }}>Book Now</button>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#0F172A', padding: '1.5rem 8%', display: 'flex', flexDirection: 'column', gap: '1.25rem', zIndex: 99, borderTop: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 15px rgba(0,0,0,0.2)' }}>
            <a href="#" onClick={() => setMenuOpen(false)} style={{ color: '#E2E8F0', fontSize: '1rem', fontWeight: 500 }}>Home</a>
            <a href="#services" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '1rem', fontWeight: 500 }}>Services</a>
            <a href="#about" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '1rem', fontWeight: 500 }}>Why Choose Us</a>
            <a href="#contact" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '1rem', fontWeight: 500 }}>Contact</a>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={() => navigate('/login')} className="btn" style={{ flex: 1, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '15px' }}>Login</button>
              <button onClick={() => navigate('/register')} className="btn btn-teal" style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '15px' }}>Register</button>
            </div>
          </div>
        )}
      </nav>

      {/* Modern Premium Hero Area */}
      <header style={{
        position: 'relative', 
        padding: '6rem 8%', 
        background: `linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,41,59,0.75)), url(${cms.heroImage}) center center/cover no-repeat`,
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        borderBottom: '4px solid var(--accent-teal)'
      }}>
        <div style={{ maxWidth: '650px', zIndex: 2, color: 'white', textAlign: 'left' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '0.4rem 1rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '1.5rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <Sparkles size={14} /> PREMIUM VEHICLE SPA ON WHEELS
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)', 
            fontWeight: 800, 
            lineHeight: 1.15, 
            color: 'white', 
            marginBottom: '1.25rem',
            textShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            {cms.heroTitle}
          </h1>
          
          <p style={{ 
            fontSize: 'clamp(1rem, 3vw, 1.25rem)', 
            color: '#CBD5E1', 
            marginBottom: '2.5rem', 
            lineHeight: 1.6,
            maxWidth: '560px',
            textShadow: '0 2px 4px rgba(0,0,0,0.4)'
          }}>
            {cms.heroSubtitle}
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/login')} 
              className="btn btn-teal" 
              style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', fontWeight: 700, borderRadius: '30px', boxShadow: '0 10px 20px rgba(14, 165, 233, 0.35)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Book Doorstep Spa <ChevronRight size={18} />
            </button>
            <a 
              href="#services" 
              className="btn" 
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', padding: '1rem 2.25rem', fontSize: '1.05rem', fontWeight: 600, borderRadius: '30px', backdropFilter: 'blur(5px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
            >
              Explore Packages
            </a>
          </div>
        </div>
      </header>

      {/* Dynamic Promo Banner */}
      <section style={{
        background: 'linear-gradient(90deg, #0284C7, #0369A1)',
        color: 'white',
        padding: '1.5rem 8%',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.5rem', borderRadius: '50%' }}>
            <Tag size={20} color="white" />
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{cms.promoTitle}</span>
        </div>
        <button 
          onClick={() => navigate('/register')} 
          style={{ background: '#06B6D4', color: 'white', border: 'none', padding: '0.6rem 1.8rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', letterSpacing: '0.5px', transition: 'transform 0.2s', boxShadow: '0 4px 10px rgba(6,182,212,0.3)' }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          {cms.promoText}
        </button>
      </section>

      {/* Services Grid Section */}
      <section id="services" style={{ padding: '6rem 8%', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto 4rem' }}>
          <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Professional Detailing</span>
          <h2 style={{ fontSize: '2.6rem', fontWeight: 800, color: '#0F172A', marginTop: '0.5rem', marginBottom: '1rem' }}>
            Doorstep Wash Packages
          </h2>
          <p style={{ color: '#64748B', fontSize: '1.1rem' }}>
            We bring premium materials, RO water, and high-pressure steam washers directly to your location.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Card 1 */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #E2E8F0', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s, box-shadow 0.3s' }}
               onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; }}
               onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
            <div style={{ position: 'relative' }}>
              <img src="/images/basic_wash.png" alt="Basic Clean" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: '#0F172A', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>Basic</span>
            </div>
            <div style={{ padding: '1.5rem 1.75rem', textAlign: 'left', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.35rem', color: '#0F172A', fontWeight: 800, marginBottom: '0.5rem' }}>Eco Waterless Wash</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Ideal for regular maintenance. High gloss spray, microfiber cleaning, interior vacuuming & dashboard polish.
              </p>
              <div style={{ marginTop: 'auto', borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284C7' }}>From ₹499</span>
                <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>45 Mins</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '2px solid #0EA5E9', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', position: 'relative', transform: 'scale(1.03)', zIndex: 10, boxShadow: '0 20px 25px -5px rgba(14,165,233,0.15)' }}>
            <div style={{ background: '#0EA5E9', color: 'white', textAlign: 'center', padding: '0.4rem', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
              MOST POPULAR CHOICE
            </div>
            <div style={{ position: 'relative' }}>
              <img src="/images/premium_wash.png" alt="Premium Clean" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: '#0EA5E9', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>Premium</span>
            </div>
            <div style={{ padding: '1.5rem 1.75rem', textAlign: 'left', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.35rem', color: '#0F172A', fontWeight: 800, marginBottom: '0.5rem' }}>Deep Foam & Wax Spa</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Total restoration. High pressure foam wash, alloy wash, underbody clean, tire conditioning, and liquid wax coat.
              </p>
              <div style={{ marginTop: 'auto', borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284C7' }}>From ₹899</span>
                <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>90 Mins</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #E2E8F0', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s, box-shadow 0.3s' }}
               onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; }}
               onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
            <div style={{ position: 'relative' }}>
              <img src="/images/full_detail.png" alt="Ultra Detail" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: '#0F172A', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>Full Detail</span>
            </div>
            <div style={{ padding: '1.5rem 1.75rem', textAlign: 'left', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.35rem', color: '#0F172A', fontWeight: 800, marginBottom: '0.5rem' }}>Complete Internal Spa</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Showroom finish. Deep upholstery shampoo, seat stain removal, dashboard dressing, AC duct sanitization & engine clean.
              </p>
              <div style={{ marginTop: 'auto', borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284C7' }}>From ₹1,499</span>
                <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>120 Mins</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Dynamic Contact / Serving Location CMS data */}
      <section id="contact" style={{ padding: '6rem 8%', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid md:grid-cols-2 gap-12">
          
          <div>
            <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Get in Touch</span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0F172A', marginTop: '0.5rem', marginBottom: '1rem' }}>
              We Service Visakhapatnam & Surrounds
            </h2>
            <p style={{ color: '#64748B', marginBottom: '2.5rem', lineHeight: 1.6 }}>
              Questions about packages or corporate bookings? Reach out and we'll reply shortly.
            </p>
            
            <div className="card" style={{ background: 'linear-gradient(135deg, #0d2650, #1e3a8a)', color: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: 'white', margin: '0 0 1.5rem 0', fontWeight: 800, fontSize: '1.4rem' }}>Help Desk Contacts</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '50%' }}>
                    <Phone size={20} color="#38BDF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Call Hotline</div>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cms.contactPhone}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '50%' }}>
                    <Mail size={20} color="#38BDF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Email Support</div>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cms.contactEmail}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '50%' }}>
                    <MapPin size={20} color="#38BDF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Headquarters</div>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cms.contactAddress}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div 
              ref={mapContainerRef} 
              style={{ 
                width: '100%', 
                height: '240px', 
                borderRadius: '16px', 
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                marginBottom: '2rem',
                zIndex: 1
              }} 
            />
            
            <div className="flex-col gap-4" style={{ display: 'flex' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input type="text" placeholder="Your Name" className="form-input" style={{ borderRadius: '8px', padding: '0.8rem 1rem' }} />
                <input type="tel" placeholder="Phone Number" className="form-input" style={{ borderRadius: '8px', padding: '0.8rem 1rem' }} />
              </div>
              <textarea placeholder="Tell us about your requirements (e.g. SUV compounding, monthly plan query)..." className="form-input" style={{ height: '100px', resize: 'none', borderRadius: '8px', padding: '0.8rem 1rem' }}></textarea>
              <button 
                onClick={() => alert("Message sent! Our support coordinator will get in touch with you shortly.")}
                className="btn btn-teal btn-block" 
                style={{ padding: '0.9rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem' }}
              >
                Send Message
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Styled Footer */}
      <footer style={{
        padding: '3rem 8%', 
        borderTop: '1px solid #E2E8F0', 
        background: '#0F172A',
        color: '#94A3B8',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
          <a href="#" style={{ color: '#E2E8F0' }}>Privacy Policy</a>
          <span>|</span>
          <a href="#" style={{ color: '#E2E8F0' }}>Terms & Conditions</a>
          <span>|</span>
          <a href="#services" style={{ color: '#E2E8F0' }}>Sitemap</a>
        </div>
        <div style={{ fontSize: '0.9rem' }}>
          © 2026 Wash My Car Doorstep Spa. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default Home;
