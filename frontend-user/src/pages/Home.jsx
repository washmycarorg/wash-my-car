import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Droplets, CheckCircle, Leaf, Car, Calendar, MapPin, Phone, 
  Mail, Award, Clock, Menu, X, Sparkles, Star, ChevronRight, Check, 
  Compass, Shield, Tag, ChevronDown, MessageCircle, ArrowRight,
  Flame, Bike, Feather, Smartphone, ExternalLink, HelpCircle,
  ChevronLeft, Copy, Send, User, Gift, Zap, Image, Upload, Trash2, Crown
} from 'lucide-react';
import { getHomeContent, getServiceAreas, getWashTypes, getAllWashPrices, getCarTypes, getAddons, getActiveCoupons, submitInquiry, getSettings } from '../api';

import logo from '../assets/wash my car.png';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const VIZAG_COORDS = { lat: 17.7042, lng: 83.2980 };

const DEFAULT_HERO_SLIDES = [
  {
    id: 'slide-1',
    kicker: 'WASH MY CAR ORG • DOORSTEP CAR WASH',
    title: 'WE WASH.\nYOU RELAX.',
    subtitle: 'Premium vehicle spa and car detailing at your doorstep. Save time, skip the queue, and let trained professionals care for your car.',
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=2200&q=95',
    badgeText: 'WATER EFFICIENT & SPOT-FREE CARE',
    ctaPrimary: 'Book Doorstep Wash',
    ctaSecondary: 'Explore Packages',
    primaryLink: '/login',
    secondaryLink: '#packages'
  },
  {
    id: 'slide-2',
    kicker: 'DEEP INTERIOR & STEAM DETAILING',
    title: 'SHOWROOM SHINE.\nAT YOUR DOORSTEP.',
    subtitle: 'High-pressure snow foam wash, germ-free steam disinfection, and deep microfiber rejuvenation for cars and bikes.',
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=2200&q=95',
    badgeText: 'ANTI-BACTERIAL STEAM',
    ctaPrimary: 'Book Interior Spa',
    ctaSecondary: 'View Packages',
    primaryLink: '/login',
    secondaryLink: '#packages'
  },
  {
    id: 'slide-3',
    kicker: 'CERAMIC & PAINT SHIELD',
    title: '9H CERAMIC &\nPOLYMER COATING',
    subtitle: 'Ultra-gloss paint correction and protective nanotech coating that shields against UV rays, swirl marks, and hard water spots.',
    image: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=2200&q=95',
    badgeText: '3-YEAR PROTECTION',
    ctaPrimary: 'Get Ceramic Quote',
    ctaSecondary: 'Explore Plans',
    primaryLink: '/login',
    secondaryLink: '#packages'
  },
  {
    id: 'slide-4',
    kicker: 'SPECIAL LAUNCH OFFER',
    title: 'FLAT 20% OFF\nYOUR FIRST SERVICE',
    subtitle: 'Join over 10,000 happy vehicle owners across Visakhapatnam enjoying doorstep mobile car spa at unbeatable prices.',
    image: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=2200&q=95',
    badgeText: 'LIMITED TIME OFFER',
    ctaPrimary: 'Claim 20% Off',
    ctaSecondary: 'Why Wash My Car Org',
    primaryLink: '/register',
    secondaryLink: '#why-us'
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Dynamic CMS State with rich defaults
  const [cms, setCms] = useState({
    heroSlides: DEFAULT_HERO_SLIDES,
    heroKicker: "WASH MY CAR ORG • DOORSTEP CAR WASH",
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
    whySubtitle: "Convenience-first automotive detailing with professional high-pressure equipment and deionized spot-free water.",
    whyCard1Title: "YOUR CAR STAYS. WE COME TO YOU.",
    whyCard1Text: "No queues. No driving to wash centres. Our technicians arrive at your home or office with high-pressure machines and spot-free deionized water.",
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
    franchisePlans: [
      {
        id: "plan-1",
        title: "Doorstep Franchise Partner",
        price: "₹1.8 LAKH",
        badge: "MOBILE DETAILING",
        perks: "Low investment,No shop required,Proven high margin model,Machinery & launch support"
      },
      {
        id: "plan-2",
        title: "Branded Outlet Partner",
        price: "₹3.5 LAKH",
        badge: "PHYSICAL STUDIO",
        perks: "Storefront branding,Interior setup,High-end pressure equipment,Technology & SOPs"
      }
    ],

    contactPhone: "+91 98765 43210",
    contactEmail: "washmycarorg@gmail.com",
    contactAddress: "Sujatha Nagar, Visakhapatnam, Andhra Pradesh",
    whatsappNumber: "+919876543210",

    promoTitle: "Get 20% OFF Your First Doorstep Wash!",
    promoText: "Claim Offer Now",

    faqs: [
      { q: "How do I book a doorstep car wash?", a: "Simply select your vehicle type, pick your package & optional add-ons (like Helmet or Bike wash), choose a date and time slot, and our trained technician will arrive equipped with high-pressure machines and spot-free deionized water." },
      { q: "Do I need to provide water and electricity?", a: "Our mobile vans carry dedicated water storage and mobile generators. A domestic plug point is helpful, but our units are fully self-sufficient." },
      { q: "Can I add add-on services like Helmet or Bike wash?", a: "Yes! While booking any car wash, you can easily attach add-on services such as Helmet wash, 2-wheeler wash, interior ozone sanitization, and engine bay steam cleaning directly into the checkout total." },
      { q: "Where is Wash My Car Org currently available?", a: "We are actively serving Visakhapatnam and surrounding neighborhoods, with expanding operations across Andhra Pradesh and Telangana." },
      { q: "How does employee assignment and tracking work?", a: "Once your booking is confirmed, our automated scheduling assigns an on-duty technician in your area. Technicians upload before & after service photos with verified GPS location tracking for complete peace of mind." }
    ]
  });

  // Slider State (Pexa Car Care Carousel - Continuously Auto-scrolling)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  const [coupons, setCoupons] = useState([]);
  const [copiedCoupon, setCopiedCoupon] = useState('');

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Doorstep Car Wash',
    message: '',
    otherReason: ''
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [settings, setSettings] = useState(null);

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

          let slidesParsed = res.heroSlides;
          if (typeof slidesParsed === 'string') {
            try {
              slidesParsed = JSON.parse(slidesParsed);
            } catch (e) {
              slidesParsed = null;
            }
          }

          let franchiseParsed = res.franchisePlans;
          if (typeof franchiseParsed === 'string') {
            try {
              franchiseParsed = JSON.parse(franchiseParsed);
            } catch (e) {
              franchiseParsed = null;
            }
          }
          if (!Array.isArray(franchiseParsed) || franchiseParsed.length === 0) {
            franchiseParsed = [
              {
                id: 'plan-1',
                title: res.doorstepPlanTitle || "Doorstep Franchise Partner",
                price: res.doorstepPlanPrice || "₹1.8 LAKH",
                badge: "MOBILE DETAILING",
                perks: res.doorstepPlanPerks || "Low investment,No shop required,Proven high margin model,Machinery & launch support"
              },
              {
                id: 'plan-2',
                title: res.outletPlanTitle || "Branded Outlet Partner",
                price: res.outletPlanPrice || "₹3.5 LAKH",
                badge: "PHYSICAL STUDIO",
                perks: res.outletPlanPerks || "Storefront branding,Interior setup,High-end pressure equipment,Technology & SOPs"
              }
            ];
          }

          const resolvedSlides = Array.isArray(slidesParsed) && slidesParsed.length > 0
            ? slidesParsed
            : DEFAULT_HERO_SLIDES;

          setCms(prev => ({
            ...prev,
            ...res,
            heroSlides: resolvedSlides,
            franchisePlans: franchiseParsed,
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
    getActiveCoupons().then(setCoupons).catch(console.warn);
    getSettings().then(setSettings).catch(console.warn);
  }, []);

  const slides = Array.isArray(cms.heroSlides) && cms.heroSlides.length > 0
    ? cms.heroSlides
    : DEFAULT_HERO_SLIDES;

  const activeSlide = slides[currentSlideIndex] || slides[0] || DEFAULT_HERO_SLIDES[0];

  const nextSlide = () => {
    setCurrentSlideIndex(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlideIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (idx) => {
    setCurrentSlideIndex(idx);
  };

  // Carousel Continuous Autoplay (automatically scrolls without pausing)
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleCopyCoupon = (code) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(''), 3000);
  };

  const getCouponBadgeText = (coupon) => {
    if (!coupon) return '';
    const freeAddonObj = coupon.freeAddon || addons.find(a => Number(a.id) === Number(coupon.freeAddonId));
    const discAddonObj = coupon.discountAddon || addons.find(a => Number(a.id) === Number(coupon.discountAddonId));

    if (coupon.freeAddonId && (coupon.discountType === 'NONE' || (Number(coupon.discountAmount) <= 1 && Number(coupon.discountPct || 0) === 0))) {
      return freeAddonObj ? `🎁 FREE ${freeAddonObj.name.toUpperCase()}` : '🎁 FREE ADD-ON';
    }

    if (coupon.discountType === 'NONE') {
      if (coupon.freeAddonId) {
        return freeAddonObj ? `🎁 FREE ${freeAddonObj.name.toUpperCase()}` : '🎁 FREE ADD-ON';
      }
      if (coupon.discountAddonId) {
        if (coupon.addonDiscountType === 'FREE') {
          return freeAddonObj ? `🎁 FREE ${freeAddonObj.name.toUpperCase()}` : '🎁 FREE ADD-ON';
        }
        if (coupon.addonDiscountType === 'FLAT') {
          return `⚡ ₹${coupon.addonDiscountValue} OFF ${discAddonObj ? discAddonObj.name.toUpperCase() : 'ADD-ON'}`;
        }
        return `⚡ ${coupon.addonDiscountValue}% OFF ${discAddonObj ? discAddonObj.name.toUpperCase() : 'ADD-ON'}`;
      }
      return '🎁 SPECIAL OFFER';
    }

    const washDisc = coupon.discountType === 'FLAT' 
      ? `₹${coupon.discountAmount} FLAT OFF` 
      : `${coupon.discountPct}% OFF`;

    if (coupon.freeAddonId) {
      const addonTitle = freeAddonObj ? ` + FREE ${freeAddonObj.name.toUpperCase()}` : ' + FREE ADD-ON';
      return `${washDisc}${addonTitle}`;
    }
    if (coupon.discountAddonId) {
      return `${washDisc} + ADD-ON DEAL`;
    }
    return washDisc;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (selectedImages.length + files.length > 3) {
      alert('You can upload a maximum of 3 images.');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('Only image files (JPG, PNG, WEBP, etc.) are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Each image must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        setSelectedImages(prev => {
          if (prev.length >= 3) return prev;
          return [...prev, loadEvt.target.result];
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setSelectedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      setContactError('Please enter your Name and Phone Number so our team can reach you.');
      return;
    }
    if (contactForm.service === 'Other' && !contactForm.otherReason?.trim()) {
      setContactError('Please specify the reason or issue for your inquiry.');
      return;
    }
    setContactError('');
    setIsSubmittingContact(true);
    try {
      const finalService = contactForm.service === 'Other' && contactForm.otherReason?.trim()
        ? `Other: ${contactForm.otherReason.trim()}`
        : (contactForm.service || 'Doorstep Car Wash');

      const finalMessage = contactForm.message?.trim()
        ? contactForm.message.trim()
        : (contactForm.otherReason?.trim() ? `Reason: ${contactForm.otherReason.trim()}` : 'Inquiry submitted from home page');

      await submitInquiry({
        name: contactForm.name.trim(),
        phone: contactForm.phone.trim(),
        email: contactForm.email ? contactForm.email.trim() : null,
        service: finalService,
        message: finalMessage,
        images: selectedImages,
        type: contactForm.service && contactForm.service.includes('Franchise') ? 'FRANCHISE' : 'INQUIRY'
      });
      setContactSubmitted(true);
    } catch (err) {
      console.error('Failed to submit inquiry:', err);
      setContactError(err.message || 'Could not submit inquiry. Please try again.');
    } finally {
      setIsSubmittingContact(false);
    }
  };


  // Touch Swipe for Mobile
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ 
            background: 'white', 
            padding: '3px', 
            borderRadius: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '52px', 
            height: '52px', 
            boxShadow: '0 6px 18px rgba(14, 165, 233, 0.35), 0 0 0 1.5px rgba(255, 255, 255, 0.25)',
            flexShrink: 0
          }}>
            <img src={logo} alt="Wash My Car Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.2)' }} />
          </div>
          <div>
            <span style={{ 
              fontWeight: 900, 
              fontSize: '1.35rem', 
              letterSpacing: '0.8px', 
              display: 'block',
              lineHeight: 1
            }}>
              <span style={{ color: '#FFFFFF' }}>WASH </span>
              <span style={{ color: '#38BDF8' }}>MY </span>
              <span style={{ color: '#FFFFFF' }}>CAR </span>
              <span style={{ color: '#38BDF8' }}>ORG</span>
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
            href={`https://wa.me/${cleanWhatsappNumber}?text=Hi%20Wash%20My%20Car%20Org%2C%20I%20want%20to%20book%20a%20doorstep%20wash.`}
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

      {/* 2. PEXA CAR CARE-STYLE HERO CAROUSEL (SLIDER FRONT PAGE) */}
      <header
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          minHeight: '88vh',
          background: '#0F172A',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4rem 6% 6rem'
        }}
      >
        {/* Dynamic Background Slides with Smooth Crossfade */}
        {slides.map((slide, sIdx) => {
          const isCurrent = sIdx === currentSlideIndex;
          return (
            <div
              key={slide.id || sIdx}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: isCurrent ? 1 : 0,
                transform: isCurrent ? 'scale(1)' : 'scale(1.05)',
                transition: 'opacity 0.85s ease-in-out, transform 7s ease-out',
                pointerEvents: 'none',
                zIndex: 1
              }}
            />
          );
        })}

        {/* Dual High-Contrast Cinematic Gradient Overlays */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.86) 45%, rgba(15,23,42,0.45) 100%)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15,23,42,0.6) 0%, transparent 60%, rgba(15,23,42,0.95) 100%)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />

        {/* Glow ambient background elements */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.22), transparent 70%)', pointerEvents: 'none', zIndex: 2 }} />
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.18), transparent 70%)', pointerEvents: 'none', zIndex: 2 }} />

        {/* PEXA-STYLE PREV / NEXT ARROW CONTROLS */}
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          style={{
            position: 'absolute',
            top: '50%',
            left: '1.25rem',
            transform: 'translateY(-50%)',
            zIndex: 20,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            color: 'white',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#0EA5E9';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            e.currentTarget.style.borderColor = '#38BDF8';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          }}
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next Slide"
          style={{
            position: 'absolute',
            top: '50%',
            right: '1.25rem',
            transform: 'translateY(-50%)',
            zIndex: 20,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            color: 'white',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#0EA5E9';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            e.currentTarget.style.borderColor = '#38BDF8';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          }}
        >
          <ChevronRight size={24} />
        </button>

        {/* Slide Content Box */}
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'center',
          gap: '3.5rem',
          position: 'relative',
          zIndex: 5
        }}>
          {/* Left Column: Bold Typography & Actions */}
          <div key={`slide-content-${currentSlideIndex}`} style={{ color: 'white', textAlign: 'left', animation: 'fadeIn 0.5s ease-out' }}>
            
            {/* Kicker Pill */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              background: 'rgba(14, 165, 233, 0.2)', 
              color: '#38BDF8', 
              padding: '0.45rem 1.1rem', 
              borderRadius: '30px', 
              fontSize: '0.82rem', 
              fontWeight: 800, 
              letterSpacing: '1.2px', 
              marginBottom: '1.5rem', 
              border: '1px solid rgba(56, 189, 248, 0.35)',
              boxShadow: '0 4px 15px rgba(14, 165, 233, 0.25)',
              backdropFilter: 'blur(8px)'
            }}>
              <Sparkles size={15} /> {activeSlide.kicker || cms.heroKicker}
            </div>

            {/* Giant Hero Title */}
            <h1 style={{ 
              fontSize: 'clamp(2.6rem, 5.8vw, 4.8rem)', 
              fontWeight: 900, 
              lineHeight: 1.02, 
              color: 'white', 
              letterSpacing: '-1.5px',
              marginBottom: '1.5rem',
              whiteSpace: 'pre-line',
              textShadow: '0 6px 25px rgba(0,0,0,0.6)'
            }}>
              {(activeSlide.title || cms.heroTitle).includes('\n') ? (
                <>
                  {(activeSlide.title || cms.heroTitle).split('\n')[0]}<br/>
                  <span style={{ 
                    background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent' 
                  }}>
                    {(activeSlide.title || cms.heroTitle).split('\n')[1]}
                  </span>
                </>
              ) : (
                <span style={{ 
                  background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent' 
                }}>
                  {activeSlide.title || cms.heroTitle}
                </span>
              )}
            </h1>

            {/* Subtitle */}
            <p style={{ 
              fontSize: 'clamp(1rem, 2.3vw, 1.18rem)', 
              color: '#CBD5E1', 
              marginBottom: '2.25rem', 
              lineHeight: 1.65, 
              maxWidth: '540px',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}>
              {activeSlide.subtitle || cms.heroSubtitle}
            </p>

            {/* App Store & Booking Row */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                onClick={() => {
                  const target = activeSlide.primaryLink || '/login';
                  if (target.startsWith('#')) {
                    const el = document.querySelector(target);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate(target);
                  }
                }} 
                style={{ 
                  background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '1.05rem 2.4rem', 
                  fontSize: '1.05rem', 
                  fontWeight: 800, 
                  borderRadius: '30px', 
                  boxShadow: '0 12px 25px rgba(14, 165, 233, 0.5)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {activeSlide.ctaPrimary || cms.heroCtaPrimary} <ChevronRight size={20} />
              </button>

              <a 
                href={activeSlide.secondaryLink || '#packages'} 
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  color: '#F8FAFC', 
                  border: '1.5px solid rgba(255,255,255,0.3)', 
                  padding: '1.05rem 2rem', 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  borderRadius: '30px', 
                  backdropFilter: 'blur(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'background 0.2s, border-color 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.22)';
                  e.currentTarget.style.borderColor = '#38BDF8';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                }}
              >
                {activeSlide.ctaSecondary || cms.heroCtaSecondary}
              </a>
            </div>

            {/* Trust Mini Pills */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '2rem' }}>
              <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.4rem', backdropFilter: 'blur(6px)' }}>
                <CheckCircle size={14} color="#38BDF8" /> Spot-Free Pure Water Rinse
              </span>
              <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.4rem', backdropFilter: 'blur(6px)' }}>
                <CheckCircle size={14} color="#38BDF8" /> Verified Specialists
              </span>
              <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.4rem', backdropFilter: 'blur(6px)' }}>
                <CheckCircle size={14} color="#38BDF8" /> 100% Scratch-Free Care
              </span>
            </div>
          </div>

          {/* Right Column: High-End Vehicle Spa Showcase & Floating Phone Mockup */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '440px' }}>
            
            {/* Hero Main Photo Frame showing Active Slide */}
            <div style={{
              width: '100%',
              maxWidth: '520px',
              height: '380px',
              borderRadius: '28px',
              background: `linear-gradient(145deg, rgba(14,165,233,0.2), rgba(15,23,42,0.85)), url(${activeSlide.image || cms.heroImage}) center/cover no-repeat`,
              boxShadow: '0 30px 60px rgba(0,0,0,0.55)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'background-image 0.5s ease-in-out'
            }}>
              {/* Overlay Badge inside photo */}
              <div style={{
                position: 'absolute',
                bottom: '1.25rem',
                left: '1.25rem',
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '0.55rem 1.1rem',
                borderRadius: '30px',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.6px',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                WASH MY CAR ORG • DOORSTEP DETAILING
              </div>
            </div>

            {/* Floating Water Efficiency Circular Badge */}
            <div style={{
              position: 'absolute',
              top: '-15px',
              right: '-10px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 15px 30px rgba(0,0,0,0.3)',
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
              <span>{activeSlide.badgeText || cms.heroBadgeText}</span>
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
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              color: 'white',
              zIndex: 10,
              transform: 'rotate(-4deg)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#38BDF8', fontWeight: 800 }}>
                <span>Wash My Car Org</span>
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

          </div>
        </div>

        {/* PEXA-STYLE SLIDE PROGRESS & INDICATOR TRACK */}
        <div style={{
          maxWidth: '1240px',
          margin: '2rem auto 0',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
          padding: '0 0.5rem'
        }}>
          {/* Slide Numeric Counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            color: 'white',
            fontSize: '0.82rem',
            fontWeight: 800
          }}>
            <span style={{ color: '#38BDF8' }}>0{currentSlideIndex + 1}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <span style={{ color: '#94A3B8' }}>0{slides.length}</span>
          </div>

          {/* Clickable Indicator Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {slides.map((_, sIdx) => {
              const isActive = sIdx === currentSlideIndex;
              return (
                <button
                  key={sIdx}
                  onClick={() => goToSlide(sIdx)}
                  aria-label={`Go to slide ${sIdx + 1}`}
                  style={{
                    width: isActive ? '36px' : '10px',
                    height: '8px',
                    borderRadius: '4px',
                    background: isActive ? 'linear-gradient(90deg, #38BDF8, #0EA5E9)' : 'rgba(255,255,255,0.3)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? '0 0 10px rgba(56,189,248,0.7)' : 'none'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* 4 Bottom Benefits Strip */}
        <div style={{
          maxWidth: '1240px',
          margin: '2rem auto 0',
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
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Deionized spot-free water & high pressure.</span>
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

      {/* 3. DYNAMIC PROMO & ACTIVE COUPONS BAR */}
      <section style={{
        background: 'linear-gradient(90deg, #070F26 0%, #0B1736 50%, #06152B 100%)',
        color: 'white',
        padding: '1rem 6%',
        borderTop: '1px solid rgba(56, 189, 248, 0.25)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 4px 25px rgba(0,0,0,0.3)'
      }}>
        <div style={{ 
          maxWidth: '1240px', 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          {/* Top Row: Live Status Pill & Section Title & Quick CTA */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <span style={{ 
                background: 'linear-gradient(135deg, #0284C7, #0EA5E9)', 
                color: 'white', 
                padding: '0.35rem 0.95rem', 
                borderRadius: '25px', 
                fontSize: '0.78rem', 
                fontWeight: 800, 
                letterSpacing: '0.6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }} />
                LIVE DOORSTEP CAR WASH
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Tag size={16} color="#38BDF8" />
                <strong style={{ fontSize: '0.92rem', color: '#F8FAFC' }}>
                  {coupons.length === 1 ? 'Featured Active Deal:' : 'Active Coupons & Deals:'}
                </strong>
              </div>
            </div>

            {/* Right Quick CTA */}
            <button 
              onClick={() => navigate('/login')}
              style={{
                background: 'linear-gradient(135deg, #FACC15, #EAB308)',
                color: '#0F172A',
                border: 'none',
                padding: '0.45rem 1.25rem',
                borderRadius: '20px',
                fontWeight: 900,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(250, 204, 21, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(250, 204, 21, 0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(250, 204, 21, 0.35)';
              }}
            >
              <span>Book with Coupon</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Bottom Area: Dynamic Coupon Render (1 vs Multiple) */}
          {coupons.length === 1 ? (
            /* Single Coupon: Centered, Beautifully Sized, Complete Info */
            (() => {
              const coupon = coupons[0];
              const isCopied = copiedCoupon === coupon.code;
              const badgeText = getCouponBadgeText(coupon);

              return (
                <div
                  onClick={() => handleCopyCoupon(coupon.code)}
                  title="Click to copy coupon code"
                  style={{
                    background: isCopied ? 'rgba(74, 222, 128, 0.12)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%)',
                    border: isCopied ? '1.5px solid #4ADE80' : '1.5px dashed rgba(56, 189, 248, 0.6)',
                    borderRadius: '16px',
                    padding: '0.8rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    boxShadow: isCopied ? '0 0 20px rgba(74, 222, 128, 0.25)' : '0 4px 16px rgba(0,0,0,0.25)',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#38BDF8';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isCopied ? '#4ADE80' : 'rgba(56, 189, 248, 0.6)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap', flex: 1, minWidth: '220px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #F59E0B, #EAB308)',
                      color: '#0F172A',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)',
                      whiteSpace: 'nowrap'
                    }}>
                      {badgeText}
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>
                        USE COUPON: <strong style={{ color: '#38BDF8', letterSpacing: '1px' }}>{coupon.code}</strong>
                      </span>
                      {coupon.title && (
                        <span style={{ fontSize: '0.8rem', color: '#CBD5E1', marginTop: '0.2rem', fontWeight: 600 }}>
                          {coupon.title}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    color: isCopied ? '#4ADE80' : '#38BDF8',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: isCopied ? 'rgba(74, 222, 128, 0.15)' : 'rgba(56, 189, 248, 0.12)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    border: isCopied ? '1px solid #4ADE80' : '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    {isCopied ? (
                      <>
                        <Check size={15} color="#4ADE80" />
                        <span>COPIED TO CLIPBOARD!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        <span>CLICK TO COPY CODE</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })()
          ) : coupons.length > 1 ? (
            /* Multiple Coupons: Smooth Continuous Auto-Scrolling Ticker (Pauses on Hover/Touch) */
            <div className="coupon-ticker-wrap">
              <div className="coupon-ticker-track">
                {[...coupons, ...coupons].map((coupon, idx) => {
                  const badgeText = getCouponBadgeText(coupon);
                  const isCopied = copiedCoupon === coupon.code;

                  return (
                    <div
                      key={`${coupon.id || coupon.code}-${idx}`}
                      onClick={() => handleCopyCoupon(coupon.code)}
                      title="Click to copy coupon code"
                      style={{
                        background: isCopied ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        border: isCopied ? '1.5px solid #4ADE80' : '1.5px dashed rgba(56, 189, 248, 0.5)',
                        borderRadius: '12px',
                        padding: '0.5rem 0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                        boxShadow: isCopied ? '0 0 12px rgba(74, 222, 128, 0.3)' : '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(14, 165, 233, 0.15)';
                        e.currentTarget.style.borderColor = '#38BDF8';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = isCopied ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.borderColor = isCopied ? '#4ADE80' : 'rgba(56, 189, 248, 0.5)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span style={{
                        background: 'linear-gradient(135deg, #F59E0B, #EAB308)',
                        color: '#0F172A',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 900,
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap'
                      }}>
                        {badgeText}
                      </span>

                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>
                          USE: <strong style={{ color: '#38BDF8' }}>{coupon.code}</strong>
                        </span>
                        {coupon.title && (
                          <span style={{ fontSize: '0.72rem', color: '#CBD5E1', whiteSpace: 'nowrap', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                            {coupon.title}
                          </span>
                        )}
                      </div>

                      <div style={{
                        marginLeft: '0.35rem',
                        color: isCopied ? '#4ADE80' : '#38BDF8',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {isCopied ? (
                          <>
                            <Check size={14} color="#4ADE80" />
                            <span style={{ color: '#4ADE80' }}>COPIED!</span>
                          </>
                        ) : (
                          <Copy size={14} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#CBD5E1', fontSize: '0.85rem', padding: '0.4rem 0' }}>
              <Sparkles size={16} color="#FACC15" />
              <span>Special discounts available on first booking!</span>
            </div>
          )}
        </div>
      </section>


      {/* VIP SUBSCRIPTION ADVERTISEMENT BANNER SECTION */}
      {settings?.subscriptionsEnabled && (
        <section style={{ padding: '0 6%', margin: '2rem auto 3.5rem auto', maxWidth: '1280px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #311042 100%)',
            borderRadius: '28px',
            overflow: 'hidden',
            padding: 'clamp(2rem, 4vw, 3.5rem)',
            color: 'white',
            boxShadow: '0 25px 60px -15px rgba(245, 158, 11, 0.25), 0 10px 30px rgba(0, 0, 0, 0.4)',
            border: '2px solid rgba(245, 158, 11, 0.35)',
            position: 'relative'
          }}>
            {/* Background Image Overlay with Gradient */}
            {settings?.subscriptionBannerImage && (
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '55%',
                backgroundImage: `url(${settings.subscriptionBannerImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.18,
                mixBlendMode: 'luminosity',
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, transparent 100%)',
                pointerEvents: 'none'
              }} />
            )}

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '680px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
                border: '1.5px solid #F59E0B',
                color: '#FCD34D',
                padding: '6px 16px',
                borderRadius: '30px',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}>
                <Crown size={16} color="#FBBF24" /> VIP PASS & SUBSCRIPTIONS NOW LIVE
              </div>

              <h2 style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
                fontWeight: 900,
                lineHeight: 1.2,
                color: '#FFFFFF',
                margin: '0 0 1rem 0',
                letterSpacing: '-0.02em',
                textShadow: '0 2px 10px rgba(0,0,0,0.35)'
              }}>
                {settings?.subscriptionBannerTitle || 'Unlimited Doorstep Shine with Wash My Car VIP Club'}
              </h2>

              <p style={{
                fontSize: '1rem',
                color: '#CBD5E1',
                lineHeight: 1.6,
                margin: '0 0 1.75rem 0'
              }}>
                {settings?.subscriptionBannerSubtitle || 'Save up to 40% every month with doorstep vehicle wash passes, zero booking fees, priority slots & complimentary add-on services!'}
              </p>

              {/* Perks Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Car size={18} color="#FCD34D" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F8FAFC' }}>4 Monthly Washes</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Doorstep foam & vacuum</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gift size={18} color="#FCD34D" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F8FAFC' }}>Free Add-ons</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Bike wash & sanitization</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} color="#38BDF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F8FAFC' }}>VIP Dispatch</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Priority morning slots</div>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <Link
                  to="/subscriptions"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white',
                    padding: '0.9rem 2rem',
                    borderRadius: '16px',
                    fontWeight: 800,
                    fontSize: '1rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.45)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Crown size={20} /> Explore VIP Passes & Join <ArrowRight size={18} />
                </Link>

                <a
                  href="#packages"
                  style={{
                    color: '#E2E8F0',
                    padding: '0.9rem 1.5rem',
                    borderRadius: '16px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  Single Wash Packages
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

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
                    {wt.description || 'Professional doorstep vehicle spa delivered directly to your home with spot-free purified water and high-pressure steam.'}
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
                        <Check size={16} color="#0EA5E9" style={{ flexShrink: 0 }} /> Spot-Free Water Rinse & Microfiber Dry
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

      {/* 5.5 REFER & EARN ADVERTISEMENT BANNER (ADMIN CONFIGURED - HIDDEN IF DISABLED) */}
      {settings?.referralEnabled !== false && (() => {
        const isTieredStreak = settings?.referralStreakBonus === 'TIERED';
        const basePoints = settings?.referralRewardPoints ?? 50;
        const cashRatio = settings?.pointsToCashRatio || 4.0;
        const cashValue = Math.round(basePoints / cashRatio);

        return (
          <section id="refer-earn" style={{ padding: '2rem 6% 4.5rem', maxWidth: '1240px', margin: '3rem auto 0' }}>
            <div style={{
              background: 'linear-gradient(135deg, #070F26 0%, #111E3D 50%, #07152E 100%)',
              borderRadius: '28px',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              padding: '3rem 2.5rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.5), 0 0 35px rgba(14, 165, 233, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Ambient background glow */}
              <div style={{
                position: 'absolute',
                top: '-60px',
                right: '-60px',
                width: '280px',
                height: '280px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-80px',
                left: '10%',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(250, 204, 21, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div className="referral-container-grid" style={{ position: 'relative', zIndex: 1 }}>
                {/* Left Content */}
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(250, 204, 21, 0.12)',
                    border: '1px solid rgba(250, 204, 21, 0.35)',
                    padding: '0.4rem 1.1rem',
                    borderRadius: '30px',
                    color: '#FACC15',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    letterSpacing: '0.6px',
                    marginBottom: '1.25rem'
                  }}>
                    <Sparkles size={15} />
                    OFFICIAL REFERRAL PROGRAM
                  </div>

                  <h2 style={{
                    fontSize: 'clamp(2rem, 3.8vw, 2.9rem)',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    margin: '0 0 1rem',
                    lineHeight: 1.18,
                    letterSpacing: '-0.5px'
                  }}>
                    Refer Friends & Get <span style={{ background: 'linear-gradient(135deg, #38BDF8, #FACC15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{isTieredStreak ? 'Free Doorstep Washes' : `+${basePoints} Reward Points`}</span>
                  </h2>

                  <p style={{ color: '#94A3B8', fontSize: '1.02rem', lineHeight: 1.65, margin: '0 0 1.5rem', maxWidth: '520px' }}>
                    {isTieredStreak
                      ? 'Share your personal invite code with friends & neighbors. When they complete their first doorstep wash, you both unlock reward points redeemable for 100% free car & bike detailing!'
                      : `Share your invite code with friends & neighbors. For every friend who completes their first doorstep wash, you instantly earn +${basePoints} points (equal to ₹${cashValue} discount) with no tier restrictions!`}
                  </p>

                  {/* Feature highlights checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#E2E8F0', fontSize: '0.88rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={13} color="#38BDF8" />
                      </div>
                      <span>Zero cash needed — redeem points directly at checkout (4 pts = ₹1)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#E2E8F0', fontSize: '0.88rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={13} color="#38BDF8" />
                      </div>
                      <span>Instant automatic wallet credit upon friend's first completed wash</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#E2E8F0', fontSize: '0.88rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={13} color="#38BDF8" />
                      </div>
                      <span>
                        {isTieredStreak
                          ? 'Bonus streak multipliers unlocked with each active consecutive referral'
                          : `Same flat reward points: exactly +${basePoints} pts for every successful referral`}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      onClick={() => navigate('/login')}
                      style={{
                        background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                        color: 'white',
                        border: 'none',
                        padding: '0.85rem 1.8rem',
                        borderRadius: '16px',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        boxShadow: '0 10px 25px rgba(14, 165, 233, 0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 14px 28px rgba(14, 165, 233, 0.5)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(14, 165, 233, 0.4)';
                      }}
                    >
                      <span>Start Earning Rewards</span>
                      <ArrowRight size={17} />
                    </button>
                    <Link
                      to="/rewards"
                      style={{
                        color: '#38BDF8',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        padding: '0.8rem 1.25rem',
                        borderRadius: '14px',
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                        e.currentTarget.style.borderColor = '#38BDF8';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                      }}
                    >
                      <span>{isTieredStreak ? 'View Rewards & Tiers' : 'View Rewards & Wallet'}</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>

                {/* Right: Modern Aesthetic Metrics Grid */}
                <div className="referral-stats-grid">
                  {/* Stat 1: Referral Base Points */}
                  <div className="referral-stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.1))',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38BDF8'
                      }}>
                        <Gift size={20} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', background: 'rgba(56, 189, 248, 0.12)', padding: '0.2rem 0.55rem', borderRadius: '20px' }}>
                        {isTieredStreak ? 'BASE PERK' : 'PER REFERRAL'}
                      </span>
                    </div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1, letterSpacing: '-0.5px' }}>
                      +{basePoints}
                    </div>
                    <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.95rem', marginTop: '0.5rem' }}>
                      Points Per Referral
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '0.25rem', lineHeight: 1.4 }}>
                      Credited on friend's 1st completed doorstep wash
                    </div>
                  </div>

                  {/* Stat 2: Streak Bonus Multiplier OR Flat Value */}
                  {isTieredStreak ? (
                    <div className="referral-stat-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.2), rgba(234, 179, 8, 0.1))',
                          border: '1px solid rgba(250, 204, 21, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FACC15'
                        }}>
                          <Zap size={20} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FACC15', background: 'rgba(250, 204, 21, 0.12)', padding: '0.2rem 0.55rem', borderRadius: '20px' }}>
                          MULTIPLIER
                        </span>
                      </div>
                      <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FACC15', lineHeight: 1, letterSpacing: '-0.5px' }}>
                        +{Number(settings?.referralStreakBonus) > 0 ? Number(settings.referralStreakBonus) : 25}
                      </div>
                      <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.95rem', marginTop: '0.5rem' }}>
                        Streak Bonus Points
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '0.25rem', lineHeight: 1.4 }}>
                        Bonus multiplier for active consecutive invites
                      </div>
                    </div>
                  ) : (
                    <div className="referral-stat-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.2), rgba(234, 179, 8, 0.1))',
                          border: '1px solid rgba(250, 204, 21, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FACC15'
                        }}>
                          <Check size={20} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FACC15', background: 'rgba(250, 204, 21, 0.12)', padding: '0.2rem 0.55rem', borderRadius: '20px' }}>
                          FLAT REWARD
                        </span>
                      </div>
                      <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FACC15', lineHeight: 1, letterSpacing: '-0.5px' }}>
                        ₹{cashValue}
                      </div>
                      <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.95rem', marginTop: '0.5rem' }}>
                        Cash Value Per Invite
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '0.25rem', lineHeight: 1.4 }}>
                        Flat points for every single referral with zero tiers
                      </div>
                    </div>
                  )}

                  {/* Stat 3: Full Width Milestone Card */}
                  <div className="referral-stat-card referral-full-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15))',
                          border: '1px solid rgba(52, 211, 153, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#34D399',
                          flexShrink: 0
                        }}>
                          <Award size={22} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span>100% Cashless Doorstep Detailing</span>
                            <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>
                              • {settings?.referralMaxLimit ? `Max ${settings.referralMaxLimit} Referrals/Month` : 'Unlimited Referrals'}
                            </span>
                          </div>
                          <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0.2rem 0 0', lineHeight: 1.4 }}>
                            Redeem earned wallet points at checkout for free exterior foam wash, deep steam & bike care.
                          </p>
                        </div>
                      </div>
                      <span style={{
                        background: 'linear-gradient(135deg, #059669, #10B981)',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '20px',
                        letterSpacing: '0.5px'
                      }}>
                        4 POINTS = ₹1 CASH
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
        );
      })()}

      {/* 6. THE WASH MY CAR ORG DIFFERENCE (WHY CHOOSE US) */}
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

          {/* Responsive 4-Step Cards Grid */}
          <div className="why-cards-grid">
            
            {/* Card 01 - Featured Mobile-Ready Hero Card */}
            <div style={{
              borderRadius: '24px',
              padding: '2.25rem 2rem',
              background: 'linear-gradient(145deg, #0B132B 0%, #0F172A 60%, #0369A1 100%)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '280px',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              boxShadow: '0 15px 35px -5px rgba(15, 23, 42, 0.35)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    color: '#38BDF8', 
                    letterSpacing: '1px', 
                    textTransform: 'uppercase',
                    background: 'rgba(56, 189, 248, 0.15)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    01 • CONVENIENCE
                  </span>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                    <Car size={22} />
                  </div>
                </div>

                <h3 style={{ 
                  fontSize: '1.45rem', 
                  fontWeight: 900, 
                  margin: '0 0 0.85rem', 
                  lineHeight: 1.25, 
                  color: '#FFFFFF' 
                }}>
                  {cms.whyCard1Title}
                </h3>
              </div>

              <p style={{ color: '#E2E8F0', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                {cms.whyCard1Text}
              </p>
            </div>

            {/* Card 02 */}
            <div style={{
              borderRadius: '24px',
              padding: '2.25rem 2rem',
              background: 'white',
              border: '1px solid #E2E8F0',
              boxShadow: '0 8px 25px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '280px',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    color: '#0284C7', 
                    letterSpacing: '1px', 
                    textTransform: 'uppercase',
                    background: '#EFF6FF',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid #BAE6FD'
                  }}>
                    02 • SPEED
                  </span>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                    <Clock size={22} />
                  </div>
                </div>

                <h3 style={{ 
                  fontSize: '1.35rem', 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  margin: '0 0 0.85rem', 
                  lineHeight: 1.3 
                }}>
                  {cms.whyCard2Title}
                </h3>
              </div>

              <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                {cms.whyCard2Text}
              </p>
            </div>

            {/* Card 03 */}
            <div style={{
              borderRadius: '24px',
              padding: '2.25rem 2rem',
              background: 'white',
              border: '1px solid #E2E8F0',
              boxShadow: '0 8px 25px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '280px',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    color: '#0284C7', 
                    letterSpacing: '1px', 
                    textTransform: 'uppercase',
                    background: '#EFF6FF',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid #BAE6FD'
                  }}>
                    03 • SPECIALISTS
                  </span>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                    <Award size={22} />
                  </div>
                </div>

                <h3 style={{ 
                  fontSize: '1.35rem', 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  margin: '0 0 0.85rem', 
                  lineHeight: 1.3 
                }}>
                  {cms.whyCard3Title}
                </h3>
              </div>

              <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                {cms.whyCard3Text}
              </p>
            </div>

            {/* Card 04 */}
            <div style={{
              borderRadius: '24px',
              padding: '2.25rem 2rem',
              background: 'white',
              border: '1px solid #E2E8F0',
              boxShadow: '0 8px 25px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '280px',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    color: '#0284C7', 
                    letterSpacing: '1px', 
                    textTransform: 'uppercase',
                    background: '#EFF6FF',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid #BAE6FD'
                  }}>
                    04 • ECO-CONSCIOUS
                  </span>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                    <Droplets size={22} />
                  </div>
                </div>

                <h3 style={{ 
                  fontSize: '1.35rem', 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  margin: '0 0 0.85rem', 
                  lineHeight: 1.3 
                }}>
                  {cms.whyCard4Title}
                </h3>
              </div>

              <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                {cms.whyCard4Text}
              </p>
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
            {(cms.franchisePlans && cms.franchisePlans.length > 0 ? cms.franchisePlans : [
              {
                id: 'plan-1',
                title: cms.doorstepPlanTitle || 'Doorstep Franchise Partner',
                price: cms.doorstepPlanPrice || '₹1.8 LAKH',
                badge: 'MOBILE DETAILING',
                perks: cms.doorstepPlanPerks || 'Low investment,No shop required,Proven high margin model,Machinery & launch support'
              },
              {
                id: 'plan-2',
                title: cms.outletPlanTitle || 'Branded Outlet Partner',
                price: cms.outletPlanPrice || '₹3.5 LAKH',
                badge: 'PHYSICAL STUDIO',
                perks: cms.outletPlanPerks || 'Storefront branding,Interior setup,High-end pressure equipment,Technology & SOPs'
              }
            ]).map((plan, pIdx) => {
              const isEven = pIdx % 2 === 1;
              const cardBg = isEven
                ? 'linear-gradient(135deg, #0369A1, #0284C7)'
                : '#0F172A';
              const badgeBg = isEven
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(56, 189, 248, 0.2)';
              const badgeColor = isEven ? 'white' : '#38BDF8';
              const btnBg = isEven ? '#0F172A' : 'white';
              const btnColor = isEven ? 'white' : '#0F172A';

              return (
                <div
                  key={plan.id || pIdx}
                  style={{
                    borderRadius: '24px',
                    padding: '2.5rem',
                    background: cardBg,
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isEven ? '0 20px 40px rgba(14,165,233,0.25)' : '0 20px 40px rgba(0,0,0,0.15)',
                    border: isEven ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div>
                    <span style={{ background: badgeBg, color: badgeColor, padding: '0.35rem 0.85rem', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {plan.badge || `MODEL OPTION ${pIdx + 1}`}
                    </span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '1rem 0 0.5rem', color: '#FFFFFF' }}>
                      {plan.title}
                    </h3>
                    <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FACC15', margin: '0.5rem 0 1.5rem' }}>
                      {plan.price}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '2rem' }}>
                      {(plan.perks || '').split(',').map((perk, pi) => (
                        <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: isEven ? '#EFF6FF' : '#CBD5E1' }}>
                          <Check size={16} color={isEven ? '#FFFFFF' : '#38BDF8'} style={{ flexShrink: 0 }} />
                          <span>{perk.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <a 
                    href={`https://wa.me/${cleanWhatsappNumber}?text=Hi%20Wash%20My%20Car%20Org%2C%20I%20am%20interested%20in%20the%20${encodeURIComponent(plan.title)}%20model.`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      background: btnBg, 
                      color: btnColor, 
                      padding: '0.95rem', 
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
                    Inquire {plan.title} →
                  </a>
                </div>
              );
            })}
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
      <section id="contact" style={{ padding: '6rem 6%', background: '#F8FAFC' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Left Column: Direct Info & Service Areas */}
            <div>
              <span style={{ 
                color: '#0284C7', 
                fontWeight: 800, 
                fontSize: '0.85rem', 
                letterSpacing: '1.2px', 
                textTransform: 'uppercase',
                background: '#EFF6FF',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                border: '1px solid #BAE6FD'
              }}>
                GET IN TOUCH
              </span>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: '#0F172A', marginTop: '0.85rem', marginBottom: '1rem', lineHeight: 1.15 }}>
                We Service Visakhapatnam & Surrounds
              </h2>
              <p style={{ color: '#64748B', marginBottom: '2rem', lineHeight: 1.6, fontSize: '1.02rem' }}>
                Questions about doorstep packages, fleet washes, special requirements, or custom corporate subscriptions? Reach out anytime.
              </p>
              
              <div style={{ 
                background: 'linear-gradient(135deg, #0F172A, #1E293B)', 
                color: 'white', 
                padding: '2rem', 
                borderRadius: '24px', 
                boxShadow: '0 15px 35px rgba(15,23,42,0.15)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <h3 style={{ color: 'white', margin: '0 0 1.5rem 0', fontWeight: 800, fontSize: '1.25rem' }}>Help Desk Contacts</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  <a 
                    href={`tel:${(cms.contactPhone || '+919876543210').replace(/\s+/g, '')}`} 
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'white' }}
                  >
                    <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.7rem', borderRadius: '14px', border: '1px solid rgba(56,189,248,0.3)' }}>
                      <Phone size={20} color="#38BDF8" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Helpline Hotline (Call anytime)</div>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>{cms.contactPhone}</span>
                    </div>
                  </a>

                  <a 
                    href={`mailto:${cms.contactEmail || 'washmycarorg@gmail.com'}`} 
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'white' }}
                  >
                    <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.7rem', borderRadius: '14px', border: '1px solid rgba(56,189,248,0.3)' }}>
                      <Mail size={20} color="#38BDF8" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Email Support</div>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'white' }}>{cms.contactEmail}</span>
                    </div>
                  </a>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.7rem', borderRadius: '14px', border: '1px solid rgba(56,189,248,0.3)' }}>
                      <MapPin size={20} color="#38BDF8" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Headquarters</div>
                      <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'white' }}>{cms.contactAddress}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <a
                    href={`https://wa.me/${cleanWhatsappNumber}?text=Hi%20Wash%20My%20Car%20Org%2C%20I%20have%20an%20inquiry%20regarding%20car%20wash.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#22C55E',
                      color: 'white',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '16px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      textDecoration: 'none',
                      boxShadow: '0 4px 15px rgba(34, 197, 94, 0.35)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <MessageCircle size={18} /> Chat with Us on WhatsApp Directly
                  </a>
                </div>
              </div>

              {/* Service Areas Coverage Pills */}
              <div style={{ marginTop: '2rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={15} color="#0EA5E9" /> Active Doorstep Service Zones:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Sujatha Nagar', 'MVP Colony', 'Gajuwaka', 'Madhurawada', 'Siripuram', 'Rushikonda', 'Pendurthi', 'NAD Junction', 'Akkayyapalem'].map((zone, zi) => (
                    <span 
                      key={zi}
                      style={{
                        background: 'white',
                        border: '1px solid #CBD5E1',
                        borderRadius: '20px',
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#334155'
                      }}
                    >
                      ✓ {zone}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: High-End Contact Form Card */}
            <div style={{
              background: 'white',
              borderRadius: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 20px 45px -10px rgba(0,0,0,0.07)',
              padding: '2.5rem',
              position: 'relative'
            }}>
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
                  Send Inquiry Message
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                  Leave your requirement and vehicle details. Our customer success coordinator will call you back within 15 minutes.
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
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16A34A',
                    margin: '0 auto 1.25rem'
                  }}>
                    <CheckCircle size={32} />
                  </div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#166534', margin: '0 0 0.5rem 0' }}>
                    Inquiry Received Successfully!
                  </h4>
                  <p style={{ color: '#15803D', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                    Thank you, <strong>{contactForm.name}</strong>! Our representative will call you at <strong>{contactForm.phone}</strong> shortly to discuss your vehicle wash requirements.
                  </p>
                  <button
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactForm({ name: '', phone: '', email: '', service: 'Doorstep Car Wash', message: '' });
                      setSelectedImages([]);
                    }}
                    style={{
                      background: '#16A34A',
                      color: 'white',
                      border: 'none',
                      padding: '0.65rem 1.5rem',
                      borderRadius: '20px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {contactError && (
                    <div style={{
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      color: '#B91C1C',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      ⚠️ {contactError}
                    </div>
                  )}

                  {/* Name and Phone */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                        Your Name *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} color="#94A3B8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={contactForm.name}
                          onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.85rem 1rem 0.85rem 2.6rem',
                            borderRadius: '14px',
                            border: '1.5px solid #CBD5E1',
                            fontSize: '0.92rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                          onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                        Phone Number *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={16} color="#94A3B8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +91 98765 43210"
                          value={contactForm.phone}
                          onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.85rem 1rem 0.85rem 2.6rem',
                            borderRadius: '14px',
                            border: '1.5px solid #CBD5E1',
                            fontSize: '0.92rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                          onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email & Preferred Service */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                        Email (Optional)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="email"
                          placeholder="e.g. rahul@gmail.com"
                          value={contactForm.email}
                          onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.85rem 1rem 0.85rem 2.6rem',
                            borderRadius: '14px',
                            border: '1.5px solid #CBD5E1',
                            fontSize: '0.92rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                          onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                        Service Interested In
                      </label>
                      <select
                        value={contactForm.service}
                        onChange={e => setContactForm({ ...contactForm, service: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          borderRadius: '14px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '0.92rem',
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

                    {/* Conditional Input Column for "Other" Reason */}
                    {contactForm.service === 'Other' && (
                      <div style={{ gridColumn: '1 / -1', marginTop: '0.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                          Specify Your Reason / Topic <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rescheduling query, payment status, commercial corporate booking..."
                          value={contactForm.otherReason || ''}
                          onChange={e => setContactForm({ ...contactForm, otherReason: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.85rem 1rem',
                            borderRadius: '14px',
                            border: '1.5px solid #0EA5E9',
                            fontSize: '0.92rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                            background: '#F0F9FF'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Message / Vehicle Details */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                      Tell us about your requirement or vehicle model
                    </label>
                    <textarea
                      placeholder="e.g. Hyundai Creta located at Sujatha Nagar, looking for deep interior steam and exterior foam wash this weekend..."
                      value={contactForm.message}
                      onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      style={{
                        width: '100%',
                        height: '110px',
                        padding: '0.85rem 1rem',
                        borderRadius: '14px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.92rem',
                        outline: 'none',
                        resize: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                      onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                      onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                    />
                  </div>

                  {/* Image Attachments Upload (Images Only, Max 3) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Image size={15} color="#0EA5E9" />
                        Attach Photos (Optional - Max 3 Images)
                      </label>
                      <span style={{ fontSize: '0.74rem', color: selectedImages.length >= 3 ? '#DC2626' : '#64748B', fontWeight: 700 }}>
                        {selectedImages.length}/3 photos added
                      </span>
                    </div>

                    {/* Previews Grid */}
                    {selectedImages.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        {selectedImages.map((img, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #CBD5E1', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                            <img src={img} alt={`Upload ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(220, 38, 38, 0.9)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0
                              }}
                              title="Remove image"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Trigger Button if under 3 images */}
                    {selectedImages.length < 3 && (
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        border: '1.5px dashed #94A3B8',
                        background: '#F8FAFC',
                        color: '#475569',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#0EA5E9';
                        e.currentTarget.style.background = '#F0F9FF';
                        e.currentTarget.style.color = '#0284C7';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#94A3B8';
                        e.currentTarget.style.background = '#F8FAFC';
                        e.currentTarget.style.color = '#475569';
                      }}
                      >
                        <Upload size={16} />
                        <span>Upload photo / screenshot (Images only, max 3)</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingContact}
                    style={{
                      background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                      color: 'white',
                      border: 'none',
                      padding: '1rem',
                      borderRadius: '16px',
                      fontWeight: 800,
                      fontSize: '1rem',
                      cursor: isSubmittingContact ? 'not-allowed' : 'pointer',
                      opacity: isSubmittingContact ? 0.7 : 1,
                      boxShadow: '0 8px 20px rgba(14,165,233,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      marginTop: '0.5rem',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={e => {
                      if (!isSubmittingContact) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 25px rgba(14,165,233,0.45)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSubmittingContact) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(14,165,233,0.35)';
                      }
                    }}
                  >
                    <Send size={18} />
                    <span>{isSubmittingContact ? 'Sending Inquiry...' : 'Send Inquiry Message'}</span>
                  </button>
                </form>
              )}
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
            <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>
              <span style={{ color: '#FFFFFF' }}>WASH </span>
              <span style={{ color: '#38BDF8' }}>MY </span>
              <span style={{ color: '#FFFFFF' }}>CAR </span>
              <span style={{ color: '#38BDF8' }}>ORG</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
            <a href="#packages" style={{ color: '#CBD5E1' }}>Services</a>
            <a href="#why-us" style={{ color: '#CBD5E1' }}>Why Wash My Car Org</a>
            <a href="#partners" style={{ color: '#CBD5E1' }}>Franchise</a>
            <a href="#faq" style={{ color: '#CBD5E1' }}>FAQ</a>
          </div>

          <div style={{ fontSize: '0.82rem' }}>
            © 2026 Wash My Car Org Doorstep Care. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
