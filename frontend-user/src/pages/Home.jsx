import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Droplets, CheckCircle, Leaf, Car, Calendar, MapPin, Phone, 
  Mail, Award, Clock, Menu, X, Sparkles, Star, ChevronRight, Check, 
  Compass, Shield, Tag, ChevronDown, MessageCircle, ArrowRight,
  Flame, Bike, Feather, Smartphone, ExternalLink, HelpCircle
} from 'lucide-react';
import { getHomeContent, getServiceAreas, getWashTypes, getAllWashPrices, getCarTypes, getAddons } from '../api';
import logo from '../assets/wash my car.png';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const VIZAG_COORDS = { lat: 17.7042, lng: 83.2980 };

const Home = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Dynamic CMS State with rich defaults
  const [cms, setCms] = useState({
    heroKicker: "WASH MY CAR • DOORSTEP CAR WASH",
    heroTitle: "WE WASH.\nYOU RELAX.",
    heroSubtitle: "Premium vehicle spa and car detailing at your doorstep. Save time, skip the queue, and let trained professionals care for your car.",
    heroImage: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=2200&q=95",
    heroBadgeText: "WATER EFFICIENT & RO CARE",
    heroCtaPrimary: "Book Doorstep Wash",
    heroCtaSecondary: "Explore Packages",

    quickBarLive: "● LIVE DOORSTEP CAR WASH",
    quickBarTitle: "App & Online Booking is Live.",
    quickBarSubtitle: "Book doorstep vehicle detailing in seconds.",

    servicesTitle: "EVERYDAY CARE. PREMIUM SHINE.",
    servicesSubtitle: "One destination for your vehicle's everyday wash, interior deep steam, and premium shine.",

    whyTitle: "SMARTER CAR CARE. BUILT AROUND YOU.",
    whySubtitle: "Convenience-first automotive detailing with professional equipment and RO water efficiency.",
    whyCard1Title: "YOUR CAR STAYS. WE COME TO YOU.",
    whyCard1Text: "No queues. No driving to wash centres. Our technicians arrive at your home or office with high-pressure machines and RO water.",
    whyCard2Title: "Book in Seconds",
    whyCard2Text: "Choose your wash package, select your slot, and track everything live.",
    whyCard3Title: "Trained Specialists",
    whyCard3Text: "Background-verified, trained vehicle care professionals using pH-neutral premium shampoos.",
    whyCard4Title: "Water-Efficient Care",
    whyCard4Text: "Eco-conscious steam & pressure washing saves up to 80% water compared to traditional washing.",

    statCustomers: "10K+",
    statCustomersLabel: "Happy Vehicle Owners",
    statCities: "2+",
    statCitiesLabel: "Service Hubs Live",
    statDuration: "30–90",
    statDurationLabel: "Minutes Service Time",
    statPrice: "₹299+",
    statPriceLabel: "Starting Wash Price",

    partnerTitle: "BUILD THE NEXT CAR CARE BUSINESS",
    partnerSubtitle: "Choose the operating model that fits your city — doorstep franchise partner or fixed branded outlet.",
    doorstepPlanTitle: "Doorstep Franchise Partner",
    doorstepPlanPrice: "₹1.8 LAKH",
    doorstepPlanPerks: "Low investment,No shop required,Proven high margin model,Machinery & launch support",
    outletPlanTitle: "Branded Outlet Partner",
    outletPlanPrice: "₹3.5 LAKH",
    outletPlanPerks: "Storefront branding,Interior setup,High-end pressure equipment,Technology & SOPs",

    contactPhone: "+91 98765 43210",
    contactEmail: "washmycarorg@gmail.com",
    contactAddress: "Sujatha Nagar, Visakhapatnam, Andhra Pradesh",
    whatsappNumber: "+919876543210",

    promoTitle: "Get 20% OFF Your First Doorstep Wash!",
    promoText: "Claim Offer Now",

    faqs: [
      { q: "How do I book a doorstep car wash?", a: "Simply select your vehicle type, pick your package & optional add-ons (like Helmet or Bike wash), choose a date and time slot, and our trained technician will arrive equipped with high-pressure machines and RO water." },
      { q: "Do I need to provide water and electricity?", a: "Our mobile vans carry dedicated water storage and mobile generators. A domestic plug point is helpful, but our units are fully self-sufficient." },
      { q: "Can I add add-on services like Helmet or Bike wash?", a: "Yes! While booking any car wash, you can easily attach add-on services such as Helmet wash, 2-wheeler wash, interior ozone sanitization, and engine bay steam cleaning directly into the checkout total." },
      { q: "Where is Wash My Car currently available?", a: "We are actively serving Visakhapatnam and surrounding neighborhoods, with expanding operations across Andhra Pradesh and Telangana." },
      { q: "How does employee assignment and tracking work?", a: "Once your booking is confirmed, our automated scheduling assigns an on-duty technician in your area. Technicians upload before & after service photos with verified GPS location tracking for complete peace of mind." }
    ]
  });

  const [areas, setAreas] = useState([]);
  const [washTypes, setWashTypes] = useState([]);
  const [washPrices, setWashPrices] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [addons, setAddons] = useState([]);
  const [selectedCarType, setSelectedCarType] = useState(null);
  
  const mapContainerRef = useRef(null);
  const googleMapInstance = useRef(null);

  useEffect(() => {
    getHomeContent()
      .then(res => {
        if (res) {
          let faqsParsed = res.faqs;
          if (typeof faqsParsed === 'string') {
            try {
              faqsParsed = JSON.parse(faqsParsed);
            } catch (e) {
              faqsParsed = null;
            }
          }
          setCms(prev => ({
            ...prev,
            ...res,
            faqs: Array.isArray(faqsParsed) && faqsParsed.length > 0 ? faqsParsed : prev.faqs
          }));
        }
      })
      .catch(err => console.warn("Could not load dynamic CMS contents, using defaults:", err));

    getServiceAreas().then(setAreas).catch(console.warn);
    getWashTypes().then(setWashTypes).catch(console.warn);
    getAllWashPrices().then(setWashPrices).catch(console.warn);
    getCarTypes().then(setCarTypes).catch(console.warn);
    getAddons().then(setAddons).catch(console.warn);
  }, []);

  // Initialize Google Maps showing all active coverage zones
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initMap = () => {
      if (googleMapInstance.current || !window.google) return;
      const maps = window.google.maps;

      const center = areas.length > 0 && areas[0].latitude 
        ? { lat: areas[0].latitude, lng: areas[0].longitude } 
        : VIZAG_COORDS;

      const map = new maps.Map(mapContainerRef.current, {
        center: center,
        zoom: 11,
        disableDefaultUI: false,
        styles: [
          { featureType: "all", elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
        ]
      });
      googleMapInstance.current = map;

      areas.forEach(area => {
        if (area.latitude && area.longitude && area.radius) {
          const circle = new maps.Circle({
            map: map,
            center: { lat: area.latitude, lng: area.longitude },
            radius: area.radius,
            fillColor: '#0EA5E9',
            fillOpacity: 0.25,
            strokeColor: '#38BDF8',
            strokeOpacity: 0.85,
            strokeWeight: 2
          });

          const marker = new maps.Marker({
            position: { lat: area.latitude, lng: area.longitude },
            map: map,
            title: area.name,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: '#38BDF8',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          });

          const infoWindow = new maps.InfoWindow({
            content: `<div style="font-family: Outfit, sans-serif; color: #0F172A; padding: 4px;">
              <strong style="font-size: 0.95rem; color: #0284C7;">${area.name}</strong><br/>
              <span style="font-size: 0.8rem; color: #64748B;">Active Doorstep Car Spa Zone</span>
            </div>`
          });

          marker.addListener('click', () => infoWindow.open(map, marker));
          circle.addListener('click', (e) => {
            infoWindow.setPosition(e.latLng);
            infoWindow.open(map);
          });
        }
      });
    };

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initMap();
        return;
      }

      if (!GOOGLE_MAPS_API_KEY) return;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [areas]);

  const cleanWhatsappNumber = (cms.whatsappNumber || '+919876543210').replace(/\D/g, '');

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A', background: '#F8FAFC', scrollBehavior: 'smooth', overflowX: 'hidden' }}>
      
      {/* 1. ULTRA MODERN GLASS NAVBAR */}
      <nav style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.85rem 6%', 
        background: 'rgba(15, 23, 42, 0.96)', 
        color: 'white', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ 
            background: 'white', 
            padding: '0.2rem', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '42px', 
            height: '42px', 
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' 
          }}>
            <img src={logo} alt="Wash My Car Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.2)' }} />
          </div>
          <div>
            <span style={{ 
              fontWeight: 900, 
              fontSize: '1.35rem', 
              letterSpacing: '0.8px', 
              background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              display: 'block',
              lineHeight: 1
            }}>
              WASH MY CAR
            </span>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '1px' }}>
              DOORSTEP CAR WASH
            </span>
          </div>
        </div>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex" style={{ gap: '2rem', fontWeight: 600, fontSize: '0.9rem', alignItems: 'center' }}>
          <a href="#" style={{ color: '#F8FAFC' }}>Home</a>
          <a href="#packages" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Wash Packages</a>
          <a href="#addons-strip" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Add-ons</a>
          <a href="#why-us" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Why Choose Us</a>
          <a href="#partners" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Franchise</a>
          <a href="#faq" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>FAQ</a>
          <a href="#contact" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Contact</a>
        </div>
        
        {/* CTA Buttons */}
        <div className="hidden md:flex" style={{ gap: '0.85rem', alignItems: 'center' }}>
          <a 
            href={`https://wa.me/${cleanWhatsappNumber}?text=Hi%20Wash%20My%20Car%2C%20I%20want%20to%20book%20a%20doorstep%20wash.`}
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              background: '#22C55E', 
              color: 'white', 
              padding: '0.45rem 1rem', 
              borderRadius: '25px', 
              fontWeight: 700, 
              fontSize: '0.82rem',
              boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)'
            }}
          >
            <MessageCircle size={15} /> WhatsApp
          </a>

          <button 
            onClick={() => navigate('/login')} 
            style={{ 
              background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', 
              color: 'white', 
              border: 'none', 
              padding: '0.55rem 1.4rem', 
              borderRadius: '25px', 
              fontWeight: 700, 
              fontSize: '0.88rem', 
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Book Now ↗
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button onClick={() => navigate('/login')} className="btn btn-teal" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '15px' }}>Book</button>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#0F172A', padding: '1.5rem 6%', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 99, borderTop: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
            <a href="#" onClick={() => setMenuOpen(false)} style={{ color: '#F8FAFC', fontSize: '1rem', fontWeight: 600 }}>Home</a>
            <a href="#packages" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '1rem', fontWeight: 500 }}>Wash Packages</a>
            <a href="#addons-strip" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '1rem', fontWeight: 500 }}>Add-on Services</a>
            <a href="#why-us" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '1rem', fontWeight: 500 }}>Why Choose Us</a>
            <a href="#partners" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '1rem', fontWeight: 500 }}>Franchise Partnership</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '1rem', fontWeight: 500 }}>FAQ</a>
            <a href="#contact" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '1rem', fontWeight: 500 }}>Contact</a>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={() => navigate('/login')} className="btn" style={{ flex: 1, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '15px' }}>Login</button>
              <button onClick={() => navigate('/register')} className="btn btn-teal" style={{ flex: 1, padding: '0.5rem', borderRadius: '15px' }}>Register</button>
            </div>
          </div>
        )}
      </nav>

      {/* 2. SENSATIONAL WASHCARO-STYLE HERO SECTION */}
      <header style={{
        position: 'relative',
        minHeight: '88vh',
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 70%, #F8FAFC 100%)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem 6% 6rem'
      }}>
        {/* Glow ambient background elements */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.18), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.15), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'center',
          gap: '3.5rem',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Left Column: Bold Typography & Actions */}
          <div style={{ color: 'white', textAlign: 'left' }}>
            
            {/* Kicker Pill */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              background: 'rgba(14, 165, 233, 0.15)', 
              color: '#38BDF8', 
              padding: '0.45rem 1.1rem', 
              borderRadius: '30px', 
              fontSize: '0.82rem', 
              fontWeight: 800, 
              letterSpacing: '1.2px', 
              marginBottom: '1.5rem', 
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 4px 15px rgba(14, 165, 233, 0.2)'
            }}>
              <Sparkles size={15} /> {cms.heroKicker}
            </div>

            {/* Giant Hero Title */}
            <h1 style={{ 
              fontSize: 'clamp(2.8rem, 6.2vw, 5rem)', 
              fontWeight: 900, 
              lineHeight: 0.95, 
              color: 'white', 
              letterSpacing: '-1.5px',
              marginBottom: '1.5rem',
              whiteSpace: 'pre-line',
              textShadow: '0 6px 20px rgba(0,0,0,0.5)'
            }}>
              {cms.heroTitle.includes('\n') ? (
                <>
                  {cms.heroTitle.split('\n')[0]}<br/>
                  <span style={{ 
                    background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent' 
                  }}>
                    {cms.heroTitle.split('\n')[1]}
                  </span>
                </>
              ) : (
                <span style={{ 
                  background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent' 
                }}>
                  {cms.heroTitle}
                </span>
              )}
            </h1>

            {/* Subtitle */}
            <p style={{ 
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', 
              color: '#CBD5E1', 
              marginBottom: '2.25rem', 
              lineHeight: 1.65, 
              maxWidth: '540px' 
            }}>
              {cms.heroSubtitle}
            </p>

            {/* App Store & Booking Row */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                onClick={() => navigate('/login')} 
                style={{ 
                  background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '1.05rem 2.4rem', 
                  fontSize: '1.05rem', 
                  fontWeight: 800, 
                  borderRadius: '30px', 
                  boxShadow: '0 12px 25px rgba(14, 165, 233, 0.45)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {cms.heroCtaPrimary} <ChevronRight size={20} />
              </button>

              <a 
                href="#packages" 
                style={{ 
                  background: 'rgba(255,255,255,0.08)', 
                  color: '#F8FAFC', 
                  border: '1px solid rgba(255,255,255,0.25)', 
                  padding: '1.05rem 2rem', 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  borderRadius: '30px', 
                  backdropFilter: 'blur(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                {cms.heroCtaSecondary}
              </a>
            </div>

            {/* Trust Mini Pills */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '2rem' }}>
              <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={14} color="#38BDF8" /> 100% RO Water Used
              </span>
              <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={14} color="#38BDF8" /> Verified Specialists
              </span>
              <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={14} color="#38BDF8" /> No Electricity Required
              </span>
            </div>
          </div>

          {/* Right Column: High-End Vehicle Spa Showcase & Floating Phone Mockup */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '440px' }}>
            
            {/* Hero Main Photo Frame */}
            <div style={{
              width: '100%',
              maxWidth: '520px',
              height: '380px',
              borderRadius: '28px',
              background: `linear-gradient(145deg, rgba(14,165,233,0.2), rgba(15,23,42,0.8)), url(${cms.heroImage}) center/cover no-repeat`,
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Overlay Badge inside photo */}
              <div style={{
                position: 'absolute',
                bottom: '1.25rem',
                left: '1.25rem',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                padding: '0.55rem 1.1rem',
                borderRadius: '30px',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.6px',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                WASH MY CAR • DOORSTEP DETAILING
              </div>
            </div>

            {/* Floating Water Efficiency Circular Badge */}
            <div style={{
              position: 'absolute',
              top: '-15px',
              right: '-10px',
              width: '95px',
              height: '95px',
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 15px 30px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              border: '2px dashed #0EA5E9',
              color: '#0284C7',
              fontSize: '0.65rem',
              fontWeight: 900,
              padding: '0.4rem',
              transform: 'rotate(10deg)',
              zIndex: 10
            }}>
              <Droplets size={22} color="#0EA5E9" style={{ marginBottom: '2px' }} />
              <span>{cms.heroBadgeText}</span>
            </div>

            {/* Interactive Floating Phone Mockup (Washcaro style) */}
            <div style={{
              position: 'absolute',
              bottom: '-25px',
              left: '-20px',
              width: '200px',
              background: 'linear-gradient(155deg, #0F172A, #1E293B)',
              border: '4px solid #334155',
              borderRadius: '24px',
              padding: '0.85rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
              color: 'white',
              zIndex: 10,
              transform: 'rotate(-4deg)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#38BDF8', fontWeight: 800 }}>
                <span>Wash My Car</span>
                <span>4G ●</span>
              </div>
              <div style={{ fontSize: '0.6rem', color: '#94A3B8', marginTop: '0.5rem' }}>Good Day! 👋</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', margin: '0.2rem 0 0.5rem' }}>
                Book Your <span style={{ color: '#38BDF8' }}>Wash</span>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.4rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem', textAlign: 'center', fontSize: '0.55rem' }}>
                <div>🚿<div style={{ fontSize: '0.5rem', color: '#94A3B8' }}>Wash</div></div>
                <div>✨<div style={{ fontSize: '0.5rem', color: '#94A3B8' }}>Detail</div></div>
                <div>🪖<div style={{ fontSize: '0.5rem', color: '#94A3B8' }}>Helmet</div></div>
                <div>💨<div style={{ fontSize: '0.5rem', color: '#94A3B8' }}>Steam</div></div>
              </div>

              <button 
                onClick={() => navigate('/login')}
                style={{ 
                  marginTop: '0.6rem', 
                  width: '100%', 
                  background: '#0EA5E9', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  padding: '0.35rem', 
                  fontSize: '0.65rem', 
                  fontWeight: 800,
                  cursor: 'pointer' 
                }}
              >
                Instant Book →
              </button>
            </div>

            {/* Floating Rating Pill */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '-10px',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#0F172A',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: 800,
              zIndex: 10
            }}>
              <Star size={16} fill="#F59E0B" color="#F59E0B" />
              <span>4.9 / 5</span>
              <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem' }}>(10K+ Clean Rides)</span>
            </div>

          </div>
        </div>

        {/* 4 Bottom Benefits Strip */}
        <div style={{
          maxWidth: '1240px',
          margin: '3.5rem auto 0',
          width: '100%',
          background: 'white',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 35px -10px rgba(0,0,0,0.08)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          overflow: 'hidden',
          zIndex: 5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1.25rem 1.5rem', borderRight: '1px solid #F1F5F9' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', flexShrink: 0 }}>
              <Car size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>Doorstep Service</strong>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>We come to your home or office parking.</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1.25rem 1.5rem', borderRight: '1px solid #F1F5F9' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', flexShrink: 0 }}>
              <Award size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>Trained Specialists</strong>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Background-verified expert detailers.</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1.25rem 1.5rem', borderRight: '1px solid #F1F5F9' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', flexShrink: 0 }}>
              <Droplets size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>Water-Efficient Care</strong>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>100% RO filtered water & high pressure.</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1.25rem 1.5rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', flexShrink: 0 }}>
              <Shield size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>100% Guaranteed</strong>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Photo verification with GPS tracking.</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. DYNAMIC PROMO & QUICK ANNOUNCEMENT BAR */}
      <section style={{
        background: '#0F172A',
        color: 'white',
        padding: '1.25rem 6%',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ 
              background: '#0284C7', 
              color: 'white', 
              padding: '0.35rem 0.85rem', 
              borderRadius: '20px', 
              fontSize: '0.78rem', 
              fontWeight: 800, 
              letterSpacing: '0.5px' 
            }}>
              {cms.quickBarLive}
            </span>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>{cms.quickBarTitle}</strong>
              <span style={{ fontSize: '0.82rem', color: '#94A3B8', marginLeft: '0.5rem' }}>{cms.quickBarSubtitle}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={() => navigate('/register')}
              style={{
                background: '#FACC15',
                color: '#0F172A',
                border: 'none',
                padding: '0.55rem 1.4rem',
                borderRadius: '20px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(250, 204, 21, 0.3)'
              }}
            >
              {cms.promoText}
            </button>
          </div>
        </div>
      </section>

      {/* 4. DOORSTEP WASH PACKAGES MATRIX (SERVICES) */}
      <section id="packages" style={{ padding: '5.5rem 6%', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto 2.5rem' }}>
          <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            {cms.servicesTitle}
          </span>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)', fontWeight: 900, color: '#0F172A', margin: '0.5rem 0 1rem', letterSpacing: '-0.8px' }}>
            Choose Your Doorstep Package
          </h2>
          <p style={{ color: '#64748B', fontSize: '1.1rem', lineHeight: 1.6 }}>
            {cms.servicesSubtitle}
          </p>
        </div>

        {/* Vehicle Type Filter Selector */}
        {carTypes.length > 0 && (
          <div style={{ maxWidth: '820px', margin: '0 auto 3rem', textAlign: 'center' }}>
            <p style={{ color: '#475569', fontSize: '0.92rem', marginBottom: '0.85rem', fontWeight: 600 }}>
              🚗 Select your vehicle type to see accurate pricing:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'center' }}>
              <button
                onClick={() => setSelectedCarType(null)}
                style={{
                  padding: '0.55rem 1.35rem',
                  borderRadius: '30px',
                  border: selectedCarType === null ? '2px solid #0EA5E9' : '1.5px solid #CBD5E1',
                  background: selectedCarType === null ? '#EFF6FF' : 'white',
                  color: selectedCarType === null ? '#0284C7' : '#64748B',
                  fontWeight: selectedCarType === null ? 800 : 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedCarType === null ? '0 4px 12px rgba(14,165,233,0.2)' : 'none'
                }}
              >
                All Vehicles
              </button>
              {carTypes.map(ct => (
                <button
                  key={ct.id}
                  onClick={() => setSelectedCarType(ct)}
                  style={{
                    padding: '0.55rem 1.35rem',
                    borderRadius: '30px',
                    border: selectedCarType?.id === ct.id ? '2px solid #0EA5E9' : '1.5px solid #CBD5E1',
                    background: selectedCarType?.id === ct.id ? '#EFF6FF' : 'white',
                    color: selectedCarType?.id === ct.id ? '#0284C7' : '#64748B',
                    fontWeight: selectedCarType?.id === ct.id ? 800 : 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: selectedCarType?.id === ct.id ? '0 4px 12px rgba(14,165,233,0.2)' : 'none'
                  }}
                >
                  {ct.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Wash Packages Grid */}
        <div style={{ 
          maxWidth: '1240px', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem', 
          alignItems: 'stretch' 
        }}>
          {washTypes.length > 0 ? washTypes.map((wt, idx) => {
            const pricesForType = washPrices.filter(p => p.washTypeId === wt.id);
            const selectedPrice = selectedCarType
              ? (pricesForType.find(p => p.carTypeId === selectedCarType.id)?.price ?? null)
              : null;
            const minPrice = pricesForType.length > 0
              ? Math.min(...pricesForType.map(p => p.price))
              : null;

            const isMostPopular = washTypes.length >= 2 && idx === 1;

            return (
              <div
                key={wt.id}
                style={{
                  borderRadius: '24px',
                  background: 'white',
                  border: isMostPopular ? '2px solid #0EA5E9' : '1px solid #E2E8F0',
                  boxShadow: isMostPopular ? '0 25px 50px -12px rgba(14, 165, 233, 0.25)' : '0 10px 25px -5px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                  transform: isMostPopular ? 'scale(1.03)' : 'scale(1)',
                  transition: 'transform 0.3s, box-shadow 0.3s'
                }}
              >
                {isMostPopular && (
                  <div style={{ background: 'linear-gradient(90deg, #0EA5E9, #0284C7)', color: 'white', padding: '0.45rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    ⭐ MOST POPULAR DETAILING CHOICE
                  </div>
                )}

                {/* Package Header with Washcaro Accent */}
                <div style={{
                  padding: '2rem 2rem 1.5rem',
                  background: isMostPopular 
                    ? 'linear-gradient(135deg, #0F172A, #1E293B)' 
                    : '#F8FAFC',
                  color: isMostPopular ? 'white' : '#0F172A',
                  textAlign: 'left',
                  borderBottom: '1px solid #E2E8F0'
                }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    color: isMostPopular ? '#38BDF8' : '#0284C7',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    PACKAGE #{idx + 1}
                  </span>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0.35rem 0 0.5rem', color: isMostPopular ? 'white' : '#0F172A' }}>
                    {wt.name}
                  </h3>
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    {selectedCarType ? (
                      selectedPrice != null ? (
                        <>
                          <span style={{ fontSize: '2rem', fontWeight: 900, color: isMostPopular ? '#38BDF8' : '#0284C7' }}>
                            ₹{selectedPrice}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: isMostPopular ? '#94A3B8' : '#64748B' }}>for {selectedCarType.name}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: '1rem', color: '#94A3B8', fontWeight: 600 }}>Not priced for this vehicle</span>
                      )
                    ) : (
                      <>
                        <span style={{ fontSize: '1.9rem', fontWeight: 900, color: isMostPopular ? '#38BDF8' : '#0284C7' }}>
                          {minPrice != null ? `₹${minPrice}` : 'Contact Us'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: isMostPopular ? '#94A3B8' : '#64748B' }}>onwards</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Package Body */}
                <div style={{ padding: '1.75rem 2rem', textAlign: 'left', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {wt.description || 'Professional doorstep vehicle spa delivered directly to your home with RO water and high-pressure steam.'}
                  </p>

                  <div style={{ marginBottom: '1.5rem', flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
                      Package Highlights:
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#334155' }}>
                        <Check size={16} color="#0EA5E9" style={{ flexShrink: 0 }} /> High-Pressure Exterior Snow Foam
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#334155' }}>
                        <Check size={16} color="#0EA5E9" style={{ flexShrink: 0 }} /> 100% RO Water Wash & Microfiber Dry
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#334155' }}>
                        <Check size={16} color="#0EA5E9" style={{ flexShrink: 0 }} /> Tyre & Rim Dressing & UV Protectant
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#334155' }}>
                        <Check size={16} color="#0EA5E9" style={{ flexShrink: 0 }} /> Dashboard & Glass Crystal Polish
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      width: '100%',
                      background: isMostPopular ? 'linear-gradient(135deg, #0EA5E9, #0284C7)' : '#0F172A',
                      color: 'white',
                      border: 'none',
                      padding: '0.9rem',
                      borderRadius: '16px',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: isMostPopular ? '0 10px 20px rgba(14,165,233,0.3)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    Book This Package <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          }) : (
            <div style={{ gridColumn: '1/-1', padding: '3rem', color: '#64748B' }}>Loading packages...</div>
          )}
        </div>
      </section>

      {/* 5. ADD-ONS HIGHLIGHT STRIP (Cannot book alone, book with car wash) */}
      <section id="addons-strip" style={{
        background: 'linear-gradient(180deg, #0F172A, #1E293B)',
        color: 'white',
        padding: '5rem 6%',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3rem' }}>
            <span style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              CUSTOMIZE YOUR SERVICE
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: 'white', margin: '0.5rem 0 1rem' }}>
              Convenient Add-on Services
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: 1.6 }}>
              Have a helmet, second bike, or want engine steam? Add these anytime during your vehicle wash checkout.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {addons.map(addon => (
              <div 
                key={addon.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.2s, border-color 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.borderColor = '#38BDF8';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                      <Sparkles size={20} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FACC15' }}>
                      +₹{addon.price}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: '0 0 0.5rem' }}>
                    {addon.name}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
                    {addon.description || 'Specialized detailing extra to enhance your vehicle care experience.'}
                  </p>
                </div>

                <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>
                    ✓ Available on Booking
                  </span>
                  <button 
                    onClick={() => navigate('/login')}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.35rem 0.85rem', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Add to Wash →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2.5rem', textAlign: 'center', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', padding: '1rem', borderRadius: '16px', maxWidth: '650px', margin: '2.5rem auto 0' }}>
            <span style={{ fontSize: '0.88rem', color: '#E0F2FE', fontWeight: 600 }}>
              💡 <strong>Note:</strong> Add-ons can easily be selected during step 2 of booking any car wash!
            </span>
          </div>
        </div>
      </section>

      {/* 6. THE WASH MY CAR DIFFERENCE (WHY CHOOSE US) */}
      <section id="why-us" style={{ padding: '6rem 6%', background: '#F8FAFC' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center', marginBottom: '4rem' }}>
            <div>
              <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                THE DIFFERENCE
              </span>
              <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)', fontWeight: 900, color: '#0F172A', margin: '0.5rem 0 1rem', letterSpacing: '-0.8px' }}>
                {cms.whyTitle}
              </h2>
            </div>
            <p style={{ color: '#64748B', fontSize: '1.1rem', lineHeight: 1.7, margin: 0 }}>
              {cms.whySubtitle}
            </p>
          </div>

          {/* 5-Pillar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Feature Banner Card */}
            <div style={{
              borderRadius: '24px',
              padding: '3rem 2.5rem',
              background: 'linear-gradient(135deg, #0F172A 0%, #0369A1 100%)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              minHeight: '340px',
              gridColumn: 'span 1'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '1px', textTransform: 'uppercase' }}>
                01 / DOORSTEP CONVENIENCE
              </span>
              <h3 style={{ fontSize: '2rem', fontWeight: 900, margin: '0.5rem 0 1rem', lineHeight: 1.15 }}>
                {cms.whyCard1Title}
              </h3>
              <p style={{ color: '#E2E8F0', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                {cms.whyCard1Text}
              </p>
            </div>

            {/* 3 Secondary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', gridColumn: 'span 2' }}>
              <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7' }}>02 / SPEED</span>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.75rem' }}>{cms.whyCard2Title}</h4>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{cms.whyCard2Text}</p>
              </div>

              <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7' }}>03 / SPECIALISTS</span>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.75rem' }}>{cms.whyCard3Title}</h4>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{cms.whyCard3Text}</p>
              </div>

              <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7' }}>04 / ECO-CONSCIOUS</span>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.75rem' }}>{cms.whyCard4Title}</h4>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{cms.whyCard4Text}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. METRICS & IMPACT STATS */}
      <section style={{
        background: '#0F172A',
        color: 'white',
        padding: '3.5rem 6%',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>{cms.statCustomers}</div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cms.statCustomersLabel}</div>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>{cms.statCities}</div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cms.statCitiesLabel}</div>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>{cms.statDuration}</div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cms.statDurationLabel}</div>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>{cms.statPrice}</div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cms.statPriceLabel}</div>
          </div>
        </div>
      </section>

      {/* 8. PARTNER WITH US / FRANCHISE */}
      <section id="partners" style={{ padding: '6rem 6%', background: 'white' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
            <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              BUSINESS OPPORTUNITIES
            </span>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)', fontWeight: 900, color: '#0F172A', margin: '0.5rem 0 1rem' }}>
              {cms.partnerTitle}
            </h2>
            <p style={{ color: '#64748B', fontSize: '1.05rem', lineHeight: 1.6 }}>
              {cms.partnerSubtitle}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            
            {/* Doorstep Partner Card */}
            <div style={{
              borderRadius: '24px',
              padding: '2.5rem',
              background: '#0F172A',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div>
                <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '0.35rem 0.85rem', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 800 }}>
                  MOBILE FRANCHISE
                </span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '1rem 0 0.5rem' }}>
                  {cms.doorstepPlanTitle}
                </h3>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FACC15', margin: '0.5rem 0 1.5rem' }}>
                  {cms.doorstepPlanPrice}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
                  {(cms.doorstepPlanPerks || '').split(',').map((perk, pi) => (
                    <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#CBD5E1' }}>
                      <Check size={15} color="#38BDF8" style={{ flexShrink: 0 }} /> {perk.trim()}
                    </div>
                  ))}
                </div>
              </div>

              <a 
                href={`https://wa.me/${cleanWhatsappNumber}?text=Hi%20Wash%20My%20Car%2C%20I%20am%20interested%20in%20the%20Doorstep%20Franchise%20Partner%20model.`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  background: 'white', 
                  color: '#0F172A', 
                  padding: '0.9rem', 
                  borderRadius: '16px', 
                  fontWeight: 800, 
                  fontSize: '0.95rem', 
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none'
                }}
              >
                Inquire Franchise →
              </a>
            </div>

            {/* Outlet Partner Card */}
            <div style={{
              borderRadius: '24px',
              padding: '2.5rem',
              background: 'linear-gradient(135deg, #0369A1, #0284C7)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 20px 40px rgba(14,165,233,0.25)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div>
                <span style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', padding: '0.35rem 0.85rem', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 800 }}>
                  FIXED DETAILING STUDIO
                </span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '1rem 0 0.5rem' }}>
                  {cms.outletPlanTitle}
                </h3>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FACC15', margin: '0.5rem 0 1.5rem' }}>
                  {cms.outletPlanPrice}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
                  {(cms.outletPlanPerks || '').split(',').map((perk, pi) => (
                    <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#EFF6FF' }}>
                      <Check size={15} color="#FFFFFF" style={{ flexShrink: 0 }} /> {perk.trim()}
                    </div>
                  ))}
                </div>
              </div>

              <a 
                href={`https://wa.me/${cleanWhatsappNumber}?text=Hi%20Wash%20My%20Car%2C%20I%20am%20interested%20in%20the%20Fixed%20Outlet%20Partner%20model.`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  background: '#0F172A', 
                  color: 'white', 
                  padding: '0.9rem', 
                  borderRadius: '16px', 
                  fontWeight: 800, 
                  fontSize: '0.95rem', 
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none'
                }}
              >
                Inquire Studio Model →
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 9. INTERACTIVE FAQ ACCORDION */}
      <section id="faq" style={{ padding: '6rem 6%', background: '#F8FAFC' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              NEED TO KNOW?
            </span>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3rem)', fontWeight: 900, color: '#0F172A', margin: '0.5rem 0 1rem' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cms.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: isOpen ? '1.5px solid #0EA5E9' : '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: isOpen ? '0 10px 25px rgba(14,165,233,0.1)' : '0 2px 5px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s'
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: isOpen ? '#0284C7' : '#0F172A'
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} color={isOpen ? '#0284C7' : '#94A3B8'} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 1.5rem 1.25rem', color: '#64748B', fontSize: '0.92rem', lineHeight: 1.6, borderTop: '1px solid #F1F5F9' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. SERVING COVERAGE & CONTACT HELPDESK */}
      <section id="contact" style={{ padding: '6rem 6%', background: 'white' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            <div>
              <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                GET IN TOUCH
              </span>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0F172A', marginTop: '0.5rem', marginBottom: '1rem' }}>
                We Service Visakhapatnam & Surrounds
              </h2>
              <p style={{ color: '#64748B', marginBottom: '2rem', lineHeight: 1.6 }}>
                Questions about doorstep packages, fleet washes, or custom corporate subscriptions? Reach out anytime.
              </p>
              
              <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', color: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 15px 30px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: 'white', margin: '0 0 1.5rem 0', fontWeight: 800, fontSize: '1.25rem' }}>Help Desk Contacts</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
                      <Phone size={20} color="#38BDF8" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Helpline Hotline</div>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'white' }}>{cms.contactPhone}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
                      <Mail size={20} color="#38BDF8" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Email Support</div>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'white' }}>{cms.contactEmail}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
                      <MapPin size={20} color="#38BDF8" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Headquarters</div>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>{cms.contactAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div 
                ref={mapContainerRef} 
                style={{ 
                  width: '100%', 
                  height: '280px', 
                  borderRadius: '20px', 
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)', 
                  marginBottom: '1.5rem',
                  overflow: 'hidden'
                }} 
              />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <input type="text" placeholder="Your Name" className="form-input" style={{ borderRadius: '10px', padding: '0.85rem 1rem', margin: 0 }} />
                  <input type="tel" placeholder="Phone Number" className="form-input" style={{ borderRadius: '10px', padding: '0.85rem 1rem', margin: 0 }} />
                </div>
                <textarea placeholder="Tell us about your requirement or vehicle model..." className="form-input" style={{ height: '90px', resize: 'none', borderRadius: '10px', padding: '0.85rem 1rem', margin: 0 }}></textarea>
                <button 
                  onClick={() => alert("Message received! Our customer success coordinator will reach out shortly.")}
                  style={{
                    background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                    color: 'white',
                    border: 'none',
                    padding: '0.9rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(14,165,233,0.3)'
                  }}
                >
                  Send Inquiry Message
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 11. PREMIUM FOOTER */}
      <footer style={{
        padding: '3.5rem 6% 2rem', 
        borderTop: '1px solid rgba(255,255,255,0.08)', 
        background: '#0A0F1D',
        color: '#94A3B8'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'white', padding: '0.2rem', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontWeight: 900, color: 'white', fontSize: '1.1rem' }}>WASH MY CAR</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
            <a href="#packages" style={{ color: '#CBD5E1' }}>Services</a>
            <a href="#why-us" style={{ color: '#CBD5E1' }}>Why Wash My Car</a>
            <a href="#partners" style={{ color: '#CBD5E1' }}>Franchise</a>
            <a href="#faq" style={{ color: '#CBD5E1' }}>FAQ</a>
          </div>

          <div style={{ fontSize: '0.82rem' }}>
            © 2026 Wash My Car Doorstep Care. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
