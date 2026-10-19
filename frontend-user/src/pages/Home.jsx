import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Droplets, CheckCircle, Leaf, Car, Calendar, MapPin, Phone, 
  Mail, Award, Clock, Menu, X, Sparkles, Star, ChevronRight, Check, 
  Compass, Shield, Tag, ChevronDown, MessageCircle, ArrowRight,
  Flame, Bike, Feather, Smartphone, ExternalLink, HelpCircle,
  ChevronLeft, Copy, Send, User, Gift, Zap, Image, Upload, Trash2, Crown,
  RefreshCw, AlertCircle, Search, Navigation, ShieldCheck
} from 'lucide-react';
import { getHomeContent, getServiceAreas, getWashTypes, getAllWashPrices, getCarTypes, getAddons, getActiveCoupons, submitInquiry, getSettings } from '../api';

import logo from '../assets/wash my car.png';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const VIZAG_COORDS = { lat: 17.7042, lng: 83.2980 };

const FALLBACK_SLIDE = [
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
  }
];

const FALLBACK_FAQS = [
  {
    q: "Where can I find the best doorstep car wash near me in Visakhapatnam (Vizag)?",
    a: "Wash My Car Org is Visakhapatnam's #1 doorstep vehicle wash and detailing service. Our trained mobile technicians arrive directly at your home, apartment parking, or workplace with high-pressure machines, snow foam wash, interior vacuuming, and dashboard polish anywhere in Vizag."
  },
  {
    q: "Do you provide doorstep car wash in Pendurthi and Sujatha Nagar?",
    a: "Yes! Pendurthi and Sujatha Nagar are fully covered under our active doorstep service zones. Whether you live in an apartment complex, gated community, or independent house, our mobile technician arrives on time to clean your hatchback, sedan, or SUV right at your doorstep."
  },
  {
    q: "Is doorstep car wash available in NAD Junction, NAD and Gopalapatnam?",
    a: "Absolutely! We provide fast doorstep car wash across NAD Junction, NAD flyover area, Gopalapatnam, Simhachalam, Marripalem, and Kancharapalem. You can select your preferred morning or evening arrival window when booking online."
  },
  {
    q: "Can I book home car wash in Gajuwaka and Old Gajuwaka?",
    a: "Yes, Gajuwaka and Old Gajuwaka have dedicated service teams. We serve residential colonies, Steel Plant township, Kurmannapalem, Sheela Nagar, and Auto Nagar with complete exterior spot-free foam cleaning and interior cabin sanitization."
  },
  {
    q: "Do you offer doorstep car wash in Maddilapalem and MVP Colony?",
    a: "Yes, Maddilapalem, MVP Colony, Seethammadhara, Resapuvanipalem, Isukathota, and Venkojipalem are among our most active service hubs. We offer spot-free water-efficient car wash, tyre dressing, interior steam cleaning, and monthly VIP care passes."
  },
  {
    q: "How to book a doorstep car wash in Madhurawada and PM Palem?",
    a: "Booking in Madhurawada, PM Palem, Kommadi, Yendada, and Rushikonda takes less than 60 seconds! Just choose your car model, pick your wash package, enter your doorstep address, and confirm your preferred time slot online."
  },
  {
    q: "What facilities do I need to provide for a doorstep car wash at home in Vizag?",
    a: "All you need to provide is a standard domestic water tap connection and an ordinary electrical socket (within reach of an extension board). Our team brings all the detailing machinery, pressure hoses, foam canons, vacuum cleaners, and microfiber materials."
  },
  {
    q: "Can I get recurring monthly car wash subscriptions in Visakhapatnam?",
    a: "Yes! Wash My Car Org offers VIP Monthly Passes with up to 40% discount, priority dispatch, and complimentary perks (like free 2-wheeler wash or visor clean). Passes are bound to your car number for guaranteed regular care."
  }
];

const VIZAG_LOCALITY_HUBS = [
  {
    id: 'pendurthi-sujatha',
    name: 'Pendurthi & Sujatha Nagar',
    region: 'west',
    badge: 'WEST VIZAG HUB',
    description: 'Doorstep snow foam wash, interior cabin vacuuming & detailing for independent houses, villas & apartments across Pendurthi, Sujatha Nagar & Vepagunta.',
    keywords: 'car wash pendurthi, car wash sujatha nagar, doorstep car wash pendurthi, home car wash sujatha nagar',
    popularLocalities: ['Sujatha Nagar Main Road', 'Pendurthi Junction', 'Chinnamushidiwada', 'Vepagunta', 'Sontyam Road']
  },
  {
    id: 'nad-gopalapatnam',
    name: 'NAD & NAD Junction',
    region: 'west',
    badge: 'CENTRAL-WEST HUB',
    description: 'Fast mobile car wash and vehicle spa arrival near NAD Junction, NAD flyover, Gopalapatnam, Simhachalam, Marripalem & Kancharapalem.',
    keywords: 'car wash nad, car wash nad junction, card wash nad junction, car wash near nad vizag, car wash gopalapatnam',
    popularLocalities: ['NAD Kotha Road', 'Gopalapatnam Bus Stand', 'Simhachalam Road', 'Marripalem VUDA Layout', 'Kakani Nagar']
  },
  {
    id: 'gajuwaka-oldgajuwaka',
    name: 'Gajuwaka & Old Gajuwaka',
    region: 'south',
    badge: 'SOUTH VIZAG HUB',
    description: 'Complete vehicle detailing, heavy dust removal, foam washing & interior sanitization across Gajuwaka, Old Gajuwaka, Kurmannapalem & Steel Plant.',
    keywords: 'car wash gajuwaka, car wash old gajuwaka, doorstep car wash gajuwaka, car cleaning gajuwaka',
    popularLocalities: ['Old Gajuwaka Junction', 'New Gajuwaka', 'Kurmannapalem', 'Steel Plant Township', 'Auto Nagar', 'BHPV']
  },
  {
    id: 'maddilapalem-mvp',
    name: 'Maddilapalem & MVP Colony',
    region: 'central',
    badge: 'CENTRAL VIZAG HUB',
    description: 'Doorstep car cleaning, luxury foam bath, dashboard polish & tyre gloss near Maddilapalem, MVP Colony, Seethammadhara & Andhra University.',
    keywords: 'car wash maddilapalem, car wash mvp colony, doorstep car wash maddilapalem, car wash seethammadhara',
    popularLocalities: ['Maddilapalem Bus Depot', 'MVP Sector 1-12', 'Seethammadhara North Ext.', 'Resapuvanipalem', 'Isukathota']
  },
  {
    id: 'madhurawada-pmpalem',
    name: 'Madhurawada & PM Palem',
    region: 'north',
    badge: 'NORTH VIZAG HUB',
    description: 'Premier doorstep car wash for gated communities, IT SEZ, apartments and villas in Madhurawada, PM Palem, Kommadi, Yendada & Rushikonda.',
    keywords: 'car wash madhurawada, carsh madhurawada, car wash pm palem, doorstep car wash madhurawada, car wash near me',
    popularLocalities: ['PM Palem Stadium Road', 'Mithilapuri VUDA Colony', 'Kommadi Junction', 'Car Shed Junction', 'Yendada Gated Villas']
  },
  {
    id: 'dwarakanagar-central',
    name: 'Dwaraka Nagar & Siripuram',
    region: 'central',
    badge: 'HEART OF VIZAG',
    description: 'Executive doorstep vehicle detailing at your home or corporate parking in Dwaraka Nagar, Siripuram, Asilmetta, Jagadamba & Daba Gardens.',
    keywords: 'car wash dwaraka nagar, car wash siripuram, home car wash at visakhapatnam, doorstep car wash vizag',
    popularLocalities: ['Dwaraka Nagar 1st-5th Lane', 'Siripuram Circle', 'Asilmetta Junction', 'Daba Gardens', 'Waltair Uplands']
  }
];

const ALL_VIZAG_LOCALITIES = [
  'Pendurthi', 'Sujatha Nagar', 'NAD Junction', 'NAD', 'Gajuwaka', 'Old Gajuwaka', 
  'Maddilapalem', 'Madhurawada', 'MVP Colony', 'Seethammadhara', 'Dwaraka Nagar', 
  'Siripuram', 'Gopalapatnam', 'Simhachalam', 'Rushikonda', 'PM Palem', 'Yendada', 
  'Kommadi', 'Kurmannapalem', 'Marripalem', 'Kancharapalem', 'Akkayyapalem', 
  'Sagar Nagar', 'Sheela Nagar', 'Steel Plant', 'Auto Nagar', 'Beach Road', 
  'Lawson\'s Bay', 'Waltair Uplands', 'Peda Waltair', 'Maharani Peta', 'Vepagunta', 
  'Resapuvanipalem', 'Isukathota', 'Venkojipalem', 'Hanumanthawaka', 'Arilova', 'Bheemili'
];


const parsePackageHighlights = (desc, quickByte, name) => {
  if (!desc) {
    return {
      summary: quickByte ? quickByte.trim() : '',
      points: []
    };
  }

  // Strip invisible unicode zero-width spaces / soft hyphens
  const cleanDesc = desc.replace(/[\u200B-\u200D\uFEFF\u2060\u00A0]/g, ' ').trim();
  const hasBullets = cleanDesc.includes('-') || cleanDesc.includes('•') || cleanDesc.includes('–') || cleanDesc.includes('—');
  let summary = quickByte ? quickByte.trim() : '';
  let points = [];

  if (hasBullets) {
    const rawParts = cleanDesc.split(/[-•–—]/).map(p => p.trim()).filter(Boolean);
    const startsWithBullet = cleanDesc.startsWith('-') || cleanDesc.startsWith('•') || cleanDesc.startsWith('–') || cleanDesc.startsWith('—');

    if (!startsWithBullet && rawParts.length > 1) {
      const first = rawParts[0].toLowerCase();
      const n = (name || '').toLowerCase();
      // If the first part is a plan title/intro like "Basic plan" or matches the name
      if (first.includes('plan') || first === n || first.includes(n) || (first.length < 25 && !first.includes('wash') && !first.includes('clean') && !first.includes('polish'))) {
        if (!summary) summary = rawParts[0];
        points = rawParts.slice(1);
      } else {
        // First part is actually a service point (e.g. "Exterior foam wash")
        points = rawParts;
      }
    } else {
      points = rawParts;
    }
  } else if (cleanDesc.includes('\n')) {
    const rawLines = cleanDesc.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (rawLines.length > 1) {
      if (!summary) summary = rawLines[0];
      points = rawLines.slice(1);
    } else {
      points = rawLines;
    }
  } else {
    if (cleanDesc.toLowerCase().trim() !== (name || '').toLowerCase().trim()) {
      points = [cleanDesc];
    }
  }

  const formattedPoints = points.map(p => {
    const cleaned = p.replace(/^[-•*–—\s]+/, '').trim();
    if (!cleaned) return '';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }).filter(Boolean);

  return {
    summary: summary,
    points: formattedPoints
  };
};

const Home = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Loading & Error States
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cms, setCms] = useState(null);

  // Slider State (Pexa Car Care Carousel - Continuously Auto-scrolling)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const [isSwipingActive, setIsSwipingActive] = useState(false);

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
  const [selectedSeoRegion, setSelectedSeoRegion] = useState('all');
  const [seoAreaSearch, setSeoAreaSearch] = useState('');
  
  const mapContainerRef = useRef(null);
  const googleMapInstance = useRef(null);

  const loadHomePageData = async () => {
    setPageLoading(true);
    setLoadError(false);

    try {
      const [cmsRes, areasRes, typesRes, pricesRes, carsRes, addonsRes, couponsRes, settingsRes] = await Promise.all([
        getHomeContent().catch(err => { console.warn("Could not load dynamic CMS contents:", err); return null; }),
        getServiceAreas().catch(err => { console.warn("Could not load areas:", err); return []; }),
        getWashTypes().catch(err => { console.warn("Could not load wash types:", err); return []; }),
        getAllWashPrices().catch(err => { console.warn("Could not load prices:", err); return []; }),
        getCarTypes().catch(err => { console.warn("Could not load car types:", err); return []; }),
        getAddons().catch(err => { console.warn("Could not load addons:", err); return []; }),
        getActiveCoupons().catch(err => { console.warn("Could not load coupons:", err); return []; }),
        getSettings().catch(err => { console.warn("Could not load settings:", err); return null; })
      ]);

      if (!cmsRes && (!typesRes || typesRes.length === 0)) {
        setLoadError(true);
        setPageLoading(false);
        return;
      }

      let faqsParsed = cmsRes?.faqs;
      if (typeof faqsParsed === 'string') {
        try {
          faqsParsed = JSON.parse(faqsParsed);
        } catch (e) {
          faqsParsed = null;
        }
      }

      let slidesParsed = cmsRes?.heroSlides;
      if (typeof slidesParsed === 'string') {
        try {
          slidesParsed = JSON.parse(slidesParsed);
        } catch (e) {
          slidesParsed = null;
        }
      }

      let franchiseParsed = cmsRes?.franchisePlans;
      if (typeof franchiseParsed === 'string') {
        try {
          franchiseParsed = JSON.parse(franchiseParsed);
        } catch (e) {
          franchiseParsed = null;
        }
      }
      if (!Array.isArray(franchiseParsed) || franchiseParsed.length === 0) {
        if (cmsRes?.doorstepPlanTitle) {
          franchiseParsed = [
            {
              id: 'plan-1',
              title: cmsRes.doorstepPlanTitle,
              price: cmsRes.doorstepPlanPrice || "₹1.8 LAKH",
              badge: "MOBILE DETAILING",
              perks: cmsRes.doorstepPlanPerks || "Low investment,No shop required,High profit margins,Full machinery & launch support"
            }
          ];
          if (cmsRes?.outletPlanTitle && cmsRes.outletPlanTitle.trim()) {
            franchiseParsed.push({
              id: 'plan-2',
              title: cmsRes.outletPlanTitle,
              price: cmsRes.outletPlanPrice || "₹3.5 LAKH",
              badge: "PHYSICAL STUDIO",
              perks: cmsRes.outletPlanPerks || "Storefront branding,Interior setup,High-end pressure equipment,Technology & SOPs"
            });
          }
        } else {
          franchiseParsed = [];
        }
      }

      let resolvedSlides = [];
      if (Array.isArray(slidesParsed) && slidesParsed.length > 0) {
        resolvedSlides = slidesParsed;
      } else if (cmsRes?.heroTitle) {
        resolvedSlides = [
          {
            id: 'slide-1',
            kicker: cmsRes.heroKicker || "WASH MY CAR ORG • DOORSTEP CAR WASH",
            title: cmsRes.heroTitle || "WE WASH.\nYOU RELAX.",
            subtitle: cmsRes.heroSubtitle || "Fast, affordable, and eco-friendly car cleaning in Visakhapatnam.",
            image: cmsRes.heroImage || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=2200&q=95",
            badgeText: cmsRes.heroBadgeText || "WATER EFFICIENT & SPOT-FREE CARE",
            ctaPrimary: cmsRes.heroCtaPrimary || "Book Doorstep Wash",
            ctaSecondary: cmsRes.heroCtaSecondary || "Explore Packages",
            primaryLink: "/login",
            secondaryLink: "#packages"
          }
        ];
      } else {
        resolvedSlides = FALLBACK_SLIDE;
      }

      setCms({
        ...cmsRes,
        heroSlides: resolvedSlides,
        franchisePlans: franchiseParsed,
        faqs: Array.isArray(faqsParsed) && faqsParsed.length > 0 ? faqsParsed : FALLBACK_FAQS
      });

      setAreas(areasRes || []);
      setWashTypes(typesRes || []);
      setWashPrices(pricesRes || []);
      setCarTypes(carsRes || []);
      setAddons(addonsRes || []);
      setCoupons(couponsRes || []);
      setSettings(settingsRes || null);
      setPageLoading(false);
    } catch (err) {
      console.error("Failed to load home page data:", err);
      setLoadError(true);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadHomePageData();
  }, []);

  const slides = Array.isArray(cms?.heroSlides) && cms.heroSlides.length > 0
    ? cms.heroSlides
    : FALLBACK_SLIDE;

  const activeSlide = slides[currentSlideIndex] || slides[0] || FALLBACK_SLIDE[0];

  const socialLinks = React.useMemo(() => {
    if (!settings?.socialLinks) {
      return [
        { id: 'instagram', platform: 'Instagram', enabled: true, name: '@washmycarorg', url: 'https://instagram.com/' },
        { id: 'facebook', platform: 'Facebook', enabled: true, name: 'Wash My Car Org', url: 'https://facebook.com/' },
        { id: 'whatsapp', platform: 'WhatsApp', enabled: true, name: '+91 98765 43210', url: 'https://wa.me/919876543210' },
        { id: 'linkedin', platform: 'LinkedIn', enabled: false, name: 'Wash My Car Org', url: 'https://linkedin.com/' },
        { id: 'twitter', platform: 'Twitter (X)', enabled: false, name: '@washmycarorg', url: 'https://x.com/' }
      ];
    }
    try {
      const parsed = typeof settings.socialLinks === 'string' ? JSON.parse(settings.socialLinks) : settings.socialLinks;
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn('Could not parse social links:', e);
    }
    return [];
  }, [settings?.socialLinks]);

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


  // Swipe Gestures for Mobile Touch and Desktop Drag
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;
    // Only trigger horizontal slide change if horizontal swipe delta is larger than vertical scrolling delta
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button, a, input, select, textarea')) return;
    isDragging.current = true;
    dragStartX.current = e.clientX;
    setIsSwipingActive(true);
  };

  const handleMouseUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsSwipingActive(false);
    const diffX = dragStartX.current - e.clientX;
    if (Math.abs(diffX) > 45) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const handleMouseLeave = () => {
    if (isDragging.current) {
      isDragging.current = false;
      setIsSwipingActive(false);
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

  const cleanWhatsappNumber = (cms?.whatsappNumber || '+919876543210').replace(/\D/g, '');

  // 1. SUPER BEAUTIFUL CAR-WASH THEMED LUXURY LOADING SCREEN
  if (pageLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 35%, #0B1E3F 0%, #081329 45%, #04091A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Outfit, sans-serif',
        color: '#FFFFFF',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated ambient water ripples & glows */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '25%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
          animation: 'washPulseGlow 4s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '25%',
          right: '25%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
          filter: 'blur(25px)',
          pointerEvents: 'none',
          animation: 'washPulseGlow 5s ease-in-out infinite 1s'
        }} />

        {/* Central Logo & Orbital Wash Ring */}
        <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.75rem' }}>
          {/* Rotating Outer Foam Ring */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2.5px solid transparent',
            borderTopColor: '#38BDF8',
            borderRightColor: '#0EA5E9',
            animation: 'washSpin 1.4s linear infinite',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
          }} />

          {/* Counter-rotating dashed accent ring */}
          <div style={{
            position: 'absolute',
            inset: '-8px',
            borderRadius: '50%',
            border: '1.5px dashed rgba(56, 189, 248, 0.45)',
            animation: 'washSpinReverse 6s linear infinite'
          }} />

          {/* Floating water droplet micro-badge */}
          <div style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(14, 165, 233, 0.6)',
            animation: 'washBubbleFloat 3s ease-in-out infinite',
            zIndex: 3
          }}>
            <Droplets size={15} color="#FFFFFF" />
          </div>

          {/* Center Brand Logo Card */}
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '22px',
            background: '#FFFFFF',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(14, 165, 233, 0.35)',
            position: 'relative',
            zIndex: 2,
            animation: 'washPulseScale 2.5s ease-in-out infinite'
          }}>
            <img src={logo} alt="Wash My Car Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Brand Name Typography */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem', zIndex: 2 }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            letterSpacing: '1px',
            lineHeight: 1.2
          }}>
            <span style={{ color: '#FFFFFF' }}>WASH </span>
            <span style={{ color: '#38BDF8' }}>MY </span>
            <span style={{ color: '#FFFFFF' }}>CAR </span>
            <span style={{ color: '#38BDF8' }}>ORG</span>
          </div>
          <div style={{
            fontSize: '0.72rem',
            color: '#94A3B8',
            fontWeight: 800,
            letterSpacing: '2px',
            marginTop: '0.35rem'
          }}>
            DOORSTEP VEHICLE SPA & DETAILING
          </div>
        </div>

        {/* Dynamic Status / Progress Bar */}
        <div style={{ width: '220px', zIndex: 2, textAlign: 'center' }}>
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '40%',
              background: 'linear-gradient(90deg, #0284C7, #38BDF8, #4ADE80)',
              borderRadius: '999px',
              animation: 'washProgressBar 1.6s ease-in-out infinite'
            }} />
          </div>

          <div style={{
            fontSize: '0.82rem',
            color: '#CBD5E1',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}>
            <Sparkles size={14} color="#FACC15" />
            <span>Connecting to Doorstep Hub...</span>
          </div>
        </div>

        {/* Bottom Feature Pill */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.45rem 1rem',
          borderRadius: '20px',
          fontSize: '0.74rem',
          color: '#94A3B8',
          fontWeight: 700
        }}>
          <span>💧 Spot-Free Pure Water</span>
          <span>•</span>
          <span>⚡ High-Pressure Foam</span>
        </div>

        {/* Injected Animations */}
        <style>{`
          @keyframes washSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes washSpinReverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes washPulseScale {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.04); }
          }
          @keyframes washPulseGlow {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.1); }
          }
          @keyframes washProgressBar {
            0% { left: -40%; width: 30%; }
            50% { width: 55%; }
            100% { left: 110%; width: 30%; }
          }
          @keyframes washBubbleFloat {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-4px) scale(1.1); }
          }
        `}</style>
      </div>
    );
  }

  // 2. ERROR / OFFLINE CONNECTION SCREEN
  if (loadError || !cms) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Outfit, sans-serif',
        color: '#FFFFFF',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1.5px solid rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#EF4444',
          marginBottom: '1.25rem'
        }}>
          <AlertCircle size={32} />
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.5rem', color: '#FFFFFF' }}>
          Unable to Connect to Wash Server
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.95rem', maxWidth: '420px', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
          We could not load real-time wash packages and admin settings. Please verify your internet connection or server status.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => loadHomePageData()}
            style={{
              background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.6rem',
              borderRadius: '25px',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={16} />
            <span>Retry Connection</span>
          </button>

          <a
            href={`https://wa.me/${cleanWhatsappNumber}?text=Hi%20Wash%20My%20Car%20Org%2C%20I%20have%20an%20inquiry.`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#22C55E',
              color: 'white',
              padding: '0.75rem 1.4rem',
              borderRadius: '25px',
              fontWeight: 700,
              fontSize: '0.92rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <MessageCircle size={16} /> WhatsApp Support
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A', background: '#F8FAFC', scrollBehavior: 'smooth', overflowX: 'hidden' }}>
      
      {/* 0. GOOGLE SITELINK PROMOTION: TOP ANNOUNCEMENT BAR */}
      <div style={{
        background: 'linear-gradient(90deg, #0A0F1D 0%, #0369A1 50%, #0A0F1D 100%)',
        color: '#FFFFFF',
        padding: '0.45rem 6%',
        fontSize: '0.8rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
        zIndex: 101,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ 
            background: 'linear-gradient(135deg, #10B981, #059669)', 
            color: 'white', 
            fontSize: '0.65rem', 
            fontWeight: 800, 
            padding: '2px 8px', 
            borderRadius: '10px',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
          }}>
            WELCOME OFFER
          </span>
          <span style={{ color: '#F0F9FF' }}>
            New to Wash My Car? Get Flat <strong>₹199 worth Bike Wash FREE</strong> on any car wash booking! Use coupon <strong style={{ color: '#FDE047', background: 'rgba(253, 224, 71, 0.15)', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.04em' }}>"WELCOME"</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={() => navigate('/register?offer=welcome')}
            style={{
              background: '#FCD34D',
              color: '#0F172A',
              border: 'none',
              padding: '0.22rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              boxShadow: '0 2px 6px rgba(252, 211, 77, 0.4)'
            }}
          >
            Claim Welcome Offer 🎁
          </button>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
          <button 
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent',
              color: '#E0F2FE',
              border: 'none',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0.2rem 0.35rem'
            }}
          >
            Customer Login
          </button>
          <button 
            onClick={() => navigate('/register')}
            style={{
              background: 'transparent',
              color: '#38BDF8',
              border: 'none',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0.2rem 0.35rem'
            }}
          >
            Register
          </button>
        </div>
      </div>

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
        <div className="hidden lg:flex" style={{ gap: '1.5rem', fontWeight: 600, fontSize: '0.88rem', alignItems: 'center' }}>
          <a href="#" style={{ color: '#F8FAFC' }}>Home</a>
          <a href="#welcome-offer" style={{ color: '#FCD34D', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Gift size={14} /> Welcome Offer
          </a>
          <a href="#packages" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Wash Packages</a>
          <a href="#service-areas" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Vizag Localities</a>
          <a href="#addons-strip" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Add-ons</a>
          <a href="#why-us" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Why Us</a>
          <a href="#faq" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>FAQ</a>
          <a href="#contact" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#38BDF8'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>Contact</a>
        </div>
        
        {/* CTA Buttons */}
        <div className="hidden md:flex" style={{ gap: '0.65rem', alignItems: 'center' }}>
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
              padding: '0.42rem 0.85rem', 
              borderRadius: '25px', 
              fontWeight: 700, 
              fontSize: '0.8rem',
              boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)'
            }}
          >
            <MessageCircle size={14} /> WhatsApp
          </a>

          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              padding: '0.45rem 0.95rem',
              borderRadius: '25px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
          >
            Customer Login
          </button>

          <button
            onClick={() => navigate('/register?offer=welcome')}
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none',
              color: '#FFFFFF',
              padding: '0.45rem 1rem',
              borderRadius: '25px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Gift size={14} /> Claim Offer
          </button>

          <button 
            onClick={() => navigate('/login')} 
            style={{ 
              background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', 
              color: 'white', 
              border: 'none', 
              padding: '0.45rem 1.15rem', 
              borderRadius: '25px', 
              fontWeight: 700, 
              fontSize: '0.82rem', 
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
        <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={() => navigate('/register?offer=welcome')} 
            className="btn btn-teal" 
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.74rem', borderRadius: '15px', background: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Gift size={12} /> Claim Offer
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#0F172A', padding: '1.25rem 6%', display: 'flex', flexDirection: 'column', gap: '0.85rem', zIndex: 99, borderTop: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(14, 165, 233, 0.2))',
              border: '1px solid #10B981',
              borderRadius: '12px',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <strong style={{ color: '#34D399', fontSize: '0.86rem', display: 'block' }}>🎁 Welcome Offer</strong>
                <span style={{ color: '#E2E8F0', fontSize: '0.74rem' }}>Free ₹199 Bike Wash with coupon "WELCOME"</span>
              </div>
              <button 
                onClick={() => { setMenuOpen(false); navigate('/register?offer=welcome'); }}
                style={{
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Claim Now
              </button>
            </div>

            <a href="#" onClick={() => setMenuOpen(false)} style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 600 }}>Home</a>
            <a href="#welcome-offer" onClick={() => setMenuOpen(false)} style={{ color: '#FCD34D', fontSize: '0.95rem', fontWeight: 700 }}>🎁 Claim Welcome Offer</a>
            <a href="#packages" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '0.95rem', fontWeight: 500 }}>Wash Packages</a>
            <a href="#service-areas" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '0.95rem', fontWeight: 500 }}>Vizag Localities</a>
            <a href="#addons-strip" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '0.95rem', fontWeight: 500 }}>Add-on Services</a>
            <a href="#why-us" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '0.95rem', fontWeight: 500 }}>Why Choose Us</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '0.95rem', fontWeight: 500 }}>FAQ</a>
            <a href="#contact" onClick={() => setMenuOpen(false)} style={{ color: '#94A3B8', fontSize: '0.95rem', fontWeight: 500 }}>Contact</a>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button onClick={() => { setMenuOpen(false); navigate('/login'); }} className="btn" style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.55rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>Customer Login</button>
              <button onClick={() => { setMenuOpen(false); navigate('/register?offer=welcome'); }} className="btn btn-teal" style={{ padding: '0.55rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, background: '#10B981' }}>Register / Sign Up</button>
            </div>
          </div>
        )}
      </nav>

      {/* 2. PEXA CAR CARE-STYLE HERO CAROUSEL (SLIDER FRONT PAGE) */}
      <header
        className="hero-carousel-header"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          minHeight: '88vh',
          background: '#0F172A',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4rem 6% 6rem',
          userSelect: 'none',
          touchAction: 'pan-y',
          cursor: isSwipingActive ? 'grabbing' : 'default'
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

        {/* Slide Content Box */}
        <div className="hero-content-grid" style={{
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

          {/* Right Column: High-End Vehicle Spa Showcase with Clean Non-Overlapping Layout */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '520px', gap: '0.85rem' }}>
            
            {/* 1. Hero Main Photo Frame (100% Full Unobstructed Car Image) */}
            <div 
              className="hero-mockup-frame" 
              style={{
                width: '100%',
                height: '280px',
                borderRadius: '24px',
                backgroundImage: `url(${activeSlide.image || cms?.heroImage || 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=2200&q=95'})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                boxShadow: '0 20px 45px -10px rgba(0,0,0,0.65), 0 0 35px rgba(14,165,233,0.18)',
                border: '1.5px solid rgba(255,255,255,0.22)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background-image 0.6s ease-in-out'
              }}
            >
              {/* Subtle top pill tags */}
              <div style={{
                position: 'absolute',
                top: '0.85rem',
                left: '0.85rem',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#FFFFFF',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                <span>DOORSTEP DETAILING</span>
              </div>

              {activeSlide.badgeText && (
                <div style={{
                  position: 'absolute',
                  top: '0.85rem',
                  right: '0.85rem',
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.95), rgba(2, 132, 199, 0.95))',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 12px rgba(14,165,233,0.35)'
                }}>
                  <Droplets size={12} color="#FFFFFF" />
                  <span>{activeSlide.badgeText}</span>
                </div>
              )}
            </div>

            {/* 2. Interactive Booking & Details Card (Cleanly BELOW the Image, ZERO Overlapping!) */}
            <div 
              className="hero-hud-card" 
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '20px',
                padding: '0.9rem 1.15rem',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>Wash My Car Org</span>
                    <span style={{ 
                      background: 'rgba(34,197,94,0.18)', 
                      color: '#4ADE80', 
                      fontSize: '0.62rem', 
                      fontWeight: 700, 
                      padding: '0.12rem 0.45rem', 
                      borderRadius: '8px',
                      border: '1px solid rgba(74,222,128,0.3)'
                    }}>
                      ✓ Verified
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: '#38BDF8', fontWeight: 700 }}>★ Professional Service</span>
                    <span>•</span>
                    <span>Visakhapatnam Doorstep Care</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.52rem 1.05rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 4px 15px rgba(14,165,233,0.4)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(14,165,233,0.6)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(14,165,233,0.4)';
                  }}
                >
                  <span>Instant Book</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Quick Service Categories Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.35rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                padding: '0.35rem 0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem' }}>🚿</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#E2E8F0', marginLeft: '3px' }}>Wash</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem' }}>✨</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#E2E8F0', marginLeft: '3px' }}>Detail</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem' }}>🪖</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#E2E8F0', marginLeft: '3px' }}>Helmet</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem' }}>💨</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#E2E8F0', marginLeft: '3px' }}>Steam</span>
                </div>
              </div>
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

          {/* Subtle Swipe Guide */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.74rem',
            fontWeight: 700,
            letterSpacing: '0.5px'
          }}>
            <span>‹</span>
            <span>Swipe to explore</span>
            <span>›</span>
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

      {/* 3.5 GOOGLE SITELINK LANDING: CLAIM WELCOME OFFER HUB */}
      <section 
        id="welcome-offer" 
        style={{ 
          padding: '2.5rem 6%', 
          maxWidth: '1280px', 
          margin: '1.5rem auto 2.5rem auto',
          position: 'relative'
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #0A192F 0%, #0F172A 40%, #064E3B 100%)',
          borderRadius: '28px',
          padding: 'clamp(2rem, 4vw, 3.25rem)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(16, 185, 129, 0.25), 0 10px 30px rgba(0,0,0,0.3)',
          border: '1.5px solid rgba(52, 211, 153, 0.35)'
        }}>
          {/* Ambient Glow Orbs */}
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(52, 211, 153, 0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '10%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Header Row */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(52, 211, 153, 0.16)',
              border: '1px solid rgba(52, 211, 153, 0.45)',
              color: '#34D399',
              padding: '0.35rem 0.95rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              <Gift size={14} />
              <span>OFFICIAL WELCOME OFFER • VISAKHAPATNAM</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 900,
              margin: '0.25rem 0 0',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              color: '#FFFFFF'
            }}>
              Claim Your Welcome Offer –{' '}
              <span style={{ 
                background: 'linear-gradient(135deg, #34D399, #38BDF8)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}>
                Free ₹199 Bike Wash
              </span>
            </h2>

            <p style={{
              fontSize: 'clamp(0.92rem, 1.6vw, 1.05rem)',
              color: '#CBD5E1',
              maxWidth: '750px',
              margin: '0.2rem 0 0',
              lineHeight: 1.5
            }}>
              New customer in Vizag? Book any car wash service and get an add-on Bike / Scooter Foam Wash worth ₹199 absolutely FREE using coupon code <strong>"WELCOME"</strong>!
            </p>
          </div>

          {/* 3 Value Pillars Cards */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.25rem'
          }}>
            {/* Pillar 1 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}>
                <Tag size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Flat ₹199 Free Bike Wash</h3>
              <p style={{ fontSize: '0.86rem', color: '#CBD5E1', margin: 0, lineHeight: 1.45 }}>
                Book any doorstep car wash package and get a full two-wheeler / bike foam wash worth ₹199 completely free.
              </p>
            </div>

            {/* Pillar 2 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
              }}>
                <Sparkles size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Coupon Code: "WELCOME"</h3>
              <p style={{ fontSize: '0.86rem', color: '#CBD5E1', margin: 0, lineHeight: 1.45 }}>
                Simply apply coupon code "WELCOME" during booking checkout to automatically activate your ₹0 free bike wash.
              </p>
            </div>

            {/* Pillar 3 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
              }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Doorstep Dual Shine</h3>
              <p style={{ fontSize: '0.86rem', color: '#CBD5E1', margin: 0, lineHeight: 1.45 }}>
                Our technician arrives at your door with specialized car & bike wash kits, pressure pumps, and spot-free foam.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={() => navigate('/register?offer=welcome')}
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: 'white',
                border: 'none',
                padding: '0.85rem 1.85rem',
                borderRadius: '30px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.45)';
              }}
            >
              <span>Claim Welcome Offer & Register Now</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                padding: '0.85rem 1.65rem',
                borderRadius: '30px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'background 0.2s, border-color 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = '#38BDF8';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <User size={16} />
              <span>Already a Customer? Login Here</span>
            </button>
          </div>
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
                {settings?.subscriptionBannerSubtitle || 'Save up to 40% every month with doorstep vehicle wash passes, zero booking fees & complimentary add-on services!'}
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
                    <Shield size={18} color="#38BDF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F8FAFC' }}>Dedicated Care</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Exclusive to your vehicle</div>
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
            const parsedDetails = parsePackageHighlights(wt.description, wt.quickByte, wt.name);

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
                  {parsedDetails.summary && 
                   parsedDetails.summary.toLowerCase() !== wt.name?.toLowerCase() && 
                   parsedDetails.summary.toLowerCase() !== `${wt.name?.toLowerCase()} plan` && (
                    <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                      {parsedDetails.summary}
                    </p>
                  )}

                  <div style={{ marginBottom: '1.5rem', flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
                      Package Highlights:
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {parsedDetails.points.length > 0 ? (
                        parsedDetails.points.map((pointText, pIdx) => (
                          <li key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.88rem', color: '#334155', lineHeight: 1.4 }}>
                            <Check size={16} color="#0EA5E9" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{pointText}</span>
                          </li>
                        ))
                      ) : (
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.88rem', color: '#334155', lineHeight: 1.4 }}>
                          <Check size={16} color="#0EA5E9" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{parsedDetails.summary || wt.name || 'Doorstep vehicle wash & detailing'}</span>
                        </li>
                      )}
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

      {/* 5.5 REFER & EARN ADVERTISEMENT BANNER (SHORT & SWEET, DYNAMIC ADMIN CONFIGURED) */}
      {settings?.referralEnabled !== false && (() => {
        const basePoints = Number(settings?.referralRewardPoints) >= 0 ? Number(settings.referralRewardPoints) : 50;
        const cashRatio = Number(settings?.pointsToCashRatio) > 0 ? Number(settings.pointsToCashRatio) : 1;
        const cashValue = Math.round(basePoints / cashRatio);
        const hasToken = !!localStorage.getItem('userToken');

        return (
          <section id="refer-earn" style={{ padding: '2rem 6% 3.5rem', maxWidth: '1240px', margin: '2rem auto 0' }}>
            <div style={{
              background: 'linear-gradient(135deg, #070F26 0%, #0F172A 50%, #081B38 100%)',
              borderRadius: '24px',
              border: '1.5px solid rgba(56, 189, 248, 0.3)',
              padding: '2.25rem 2rem',
              boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.45)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Subtle ambient glow */}
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div className="referral-container-grid" style={{ position: 'relative', zIndex: 1, alignItems: 'center' }}>
                {/* Left Content: Concise & High Impact */}
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(250, 204, 21, 0.12)',
                    border: '1px solid rgba(250, 204, 21, 0.3)',
                    padding: '0.3rem 0.85rem',
                    borderRadius: '999px',
                    color: '#FACC15',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    marginBottom: '0.85rem',
                    textTransform: 'uppercase'
                  }}>
                    <Sparkles size={14} />
                    Referral Program
                  </div>

                  <h2 style={{
                    fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    margin: '0 0 0.65rem',
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em'
                  }}>
                    Refer Friends & Earn <span style={{ background: 'linear-gradient(135deg, #38BDF8, #FACC15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>+₹{cashValue} Off Washes</span>
                  </h2>

                  <p style={{ color: '#94A3B8', fontSize: '0.94rem', lineHeight: 1.55, margin: '0 0 1.25rem', maxWidth: '520px' }}>
                    Share your invite code. When a friend books and completes their first doorstep wash, you instantly get <strong>+{basePoints} points (₹{cashValue} discount)</strong> into your wallet to redeem directly at checkout ({cashRatio} pt{cashRatio > 1 ? 's' : ''} = ₹1.00)!
                  </p>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      onClick={() => navigate(hasToken ? '/rewards' : '/login')}
                      style={{
                        background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.4rem',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(14, 165, 233, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <span>Start Earning</span>
                      <ArrowRight size={16} />
                    </button>
                    <Link
                      to="/rewards"
                      style={{
                        color: '#38BDF8',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        padding: '0.7rem 1.1rem',
                        borderRadius: '12px',
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
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
                      <span>View Rewards & Rules</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* Right: Short & Sweet Single Hero Metric Card */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '20px',
                  padding: '1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.1))',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38BDF8'
                      }}>
                        <Gift size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Per Friend's 1st Wash</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>Instant Reward</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#10B981',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      DIRECT DISCOUNT
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', padding: '0.2rem 0' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>
                      +{basePoints} <span style={{ fontSize: '1rem', fontWeight: 700, color: '#94A3B8' }}>pts</span>
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FACC15', lineHeight: 1 }}>
                      = ₹{cashValue} Off
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.65rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>CHECKOUT VALUE</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                        {cashRatio} pt{cashRatio > 1 ? 's' : ''} = ₹1.00
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>INVITE LIMIT</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                        {settings?.referralMaxLimit > 0 ? `Max ${settings.referralMaxLimit}` : 'Unlimited'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
        );
      })()}

      {/* 6. THE WASH MY CAR ORG DIFFERENCE (WHY CHOOSE US) */}
      <section id="why-us" className="why-us-section" style={{ padding: '3.5rem 6%', background: '#F8FAFC' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div className="why-us-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                THE DIFFERENCE
              </span>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)', fontWeight: 900, color: '#0F172A', margin: '0.35rem 0 0.4rem', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                {cms.whyTitle}
              </h2>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.98rem', lineHeight: 1.6, margin: 0 }}>
              {cms.whySubtitle}
            </p>
          </div>

          {/* Responsive 4-Step Cards Grid */}
          <div className="why-cards-grid">
            
            {/* Card 01 - Featured Mobile-Ready Hero Card */}
            <div className="why-card why-card-featured" style={{
              borderRadius: '20px',
              padding: '1.5rem 1.35rem',
              background: 'linear-gradient(145deg, #0B132B 0%, #0F172A 60%, #0369A1 100%)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '210px',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 800, 
                    color: '#38BDF8', 
                    letterSpacing: '0.8px', 
                    textTransform: 'uppercase',
                    background: 'rgba(56, 189, 248, 0.15)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    01 • CONVENIENCE
                  </span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                    <Car size={18} />
                  </div>
                </div>

                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 900, 
                  margin: '0 0 0.5rem', 
                  lineHeight: 1.25, 
                  color: '#FFFFFF' 
                }}>
                  {cms.whyCard1Title}
                </h3>
              </div>

              <p style={{ color: '#CBD5E1', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                {cms.whyCard1Text}
              </p>
            </div>

            {/* Card 02 */}
            <div className="why-card" style={{
              borderRadius: '20px',
              padding: '1.5rem 1.35rem',
              background: 'white',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '210px',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 800, 
                    color: '#0284C7', 
                    letterSpacing: '0.8px', 
                    textTransform: 'uppercase',
                    background: '#EFF6FF',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    border: '1px solid #BAE6FD'
                  }}>
                    02 • SPEED
                  </span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                    <Clock size={18} />
                  </div>
                </div>

                <h3 style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  margin: '0 0 0.5rem', 
                  lineHeight: 1.25 
                }}>
                  {cms.whyCard2Title}
                </h3>
              </div>

              <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                {cms.whyCard2Text}
              </p>
            </div>

            {/* Card 03 */}
            <div className="why-card" style={{
              borderRadius: '20px',
              padding: '1.5rem 1.35rem',
              background: 'white',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '210px',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 800, 
                    color: '#0284C7', 
                    letterSpacing: '0.8px', 
                    textTransform: 'uppercase',
                    background: '#EFF6FF',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    border: '1px solid #BAE6FD'
                  }}>
                    03 • SPECIALISTS
                  </span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                    <Award size={18} />
                  </div>
                </div>

                <h3 style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  margin: '0 0 0.5rem', 
                  lineHeight: 1.25 
                }}>
                  {cms.whyCard3Title}
                </h3>
              </div>

              <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                {cms.whyCard3Text}
              </p>
            </div>

            {/* Card 04 */}
            <div className="why-card" style={{
              borderRadius: '20px',
              padding: '1.5rem 1.35rem',
              background: 'white',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '210px',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 800, 
                    color: '#0284C7', 
                    letterSpacing: '0.8px', 
                    textTransform: 'uppercase',
                    background: '#EFF6FF',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    border: '1px solid #BAE6FD'
                  }}>
                    04 • ECO-CONSCIOUS
                  </span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                    <Droplets size={18} />
                  </div>
                </div>

                <h3 style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  margin: '0 0 0.5rem', 
                  lineHeight: 1.25 
                }}>
                  {cms.whyCard4Title}
                </h3>
              </div>

              <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
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

      {/* 9. VISAKHAPATNAM (VIZAG) DOORSTEP SERVICE AREAS & LOCALITY SEO HUB */}
      <section id="service-areas" style={{ padding: '5.5rem 6%', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          {/* Section Header */}
          <div style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto 3rem' }}>
            <span style={{ 
              color: '#0284C7', 
              fontWeight: 800, 
              fontSize: '0.82rem', 
              letterSpacing: '1.4px', 
              textTransform: 'uppercase',
              background: '#EFF6FF',
              padding: '0.35rem 0.95rem',
              borderRadius: '20px',
              border: '1px solid #BAE6FD',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.75rem'
            }}>
              <MapPin size={15} color="#0284C7" /> DOORSTEP COVERAGE ACROSS VISAKHAPATNAM (VIZAG)
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4.2vw, 3rem)', fontWeight: 900, color: '#0F172A', margin: '0.35rem 0 1rem', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
              Doorstep Car Wash in Vizag – Every Locality, Directly at Your Home
            </h2>
            <p style={{ color: '#64748B', fontSize: '1.02rem', lineHeight: 1.6, margin: 0 }}>
              Searching for <strong>"car wash near me"</strong> in Vizag? Whether you reside in <strong>Pendurthi</strong>, <strong>Sujatha Nagar</strong>, <strong>NAD Junction</strong>, <strong>Gajuwaka</strong>, <strong>Old Gajuwaka</strong>, <strong>Maddilapalem</strong>, or <strong>Madhurawada</strong>, our certified mobile technicians bring pure spot-free water washing, high-pressure foam, and interior steam vacuuming directly to your doorstep.
            </p>
          </div>

          {/* Interactive Locality Search & Availability Checker */}
          <div style={{
            background: 'linear-gradient(145deg, #0B132B 0%, #0F172A 70%, #0369A1 100%)',
            borderRadius: '24px',
            padding: '2rem 2.25rem',
            color: 'white',
            marginBottom: '3rem',
            boxShadow: '0 15px 35px -5px rgba(15, 23, 42, 0.25)',
            border: '1.5px solid rgba(56, 189, 248, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Search size={20} color="#38BDF8" /> Find Doorstep Car Wash Near Me in Vizag
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '0.3rem 0 0' }}>
                  Check technician arrival availability in your colony, apartment, or street
                </p>
              </div>

              {/* Live Status Badge */}
              <div style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#4ADE80',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 8px #22C55E' }} />
                <span>Mobile Detailing Units Active in Vizag</span>
              </div>
            </div>

            {/* Search Input Bar */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Type your area (e.g. Pendurthi, Sujatha Nagar, NAD, Gajuwaka, Maddilapalem, Madhurawada...)"
                value={seoAreaSearch}
                onChange={e => setSeoAreaSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.9rem 3.5rem 0.9rem 2.9rem',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backdropFilter: 'blur(8px)',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#38BDF8'}
                onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
              {seoAreaSearch && (
                <button
                  onClick={() => setSeoAreaSearch('')}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    color: '#CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Region Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700, marginRight: '0.25rem' }}>Filter Zones:</span>
              {[
                { id: 'all', label: 'All Vizag Areas (38+)' },
                { id: 'west', label: 'West Vizag (Pendurthi, NAD, Sujatha Nagar)' },
                { id: 'south', label: 'South Vizag (Gajuwaka, Steel Plant)' },
                { id: 'central', label: 'Central Vizag (Maddilapalem, MVP, Dwaraka Nagar)' },
                { id: 'north', label: 'North Vizag (Madhurawada, PM Palem, Rushikonda)' }
              ].map(tab => {
                const isActive = selectedSeoRegion === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedSeoRegion(tab.id);
                      setSeoAreaSearch('');
                    }}
                    style={{
                      background: isActive ? '#0284C7' : 'rgba(255, 255, 255, 0.06)',
                      border: isActive ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isActive ? '#FFFFFF' : '#CBD5E1',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Instant Locality Search Match Confirmation */}
            {seoAreaSearch.trim() && (() => {
              const queryLower = seoAreaSearch.toLowerCase().trim();
              const matchedHubs = VIZAG_LOCALITY_HUBS.filter(h => 
                h.name.toLowerCase().includes(queryLower) ||
                h.description.toLowerCase().includes(queryLower) ||
                h.keywords.toLowerCase().includes(queryLower) ||
                h.popularLocalities.some(l => l.toLowerCase().includes(queryLower))
              );
              const matchedLocalities = ALL_VIZAG_LOCALITIES.filter(l => l.toLowerCase().includes(queryLower));
              const isFound = matchedHubs.length > 0 || matchedLocalities.length > 0;

              return (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1rem 1.25rem',
                  borderRadius: '16px',
                  background: isFound ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: isFound ? '1.5px solid #22C55E' : '1.5px solid #EF4444',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isFound ? '#22C55E' : '#EF4444',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isFound ? <Check size={18} strokeWidth={3} /> : <AlertCircle size={18} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: isFound ? '#86EFAC' : '#FCA5A5' }}>
                        {isFound 
                          ? `✅ Doorstep Service Active in "${seoAreaSearch.trim()}"!` 
                          : `Coverage expanding to "${seoAreaSearch.trim()}"`}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '0.15rem' }}>
                        {isFound 
                          ? `Mobile technicians are actively dispatched in this zone. You can schedule an arrival slot right now!` 
                          : `We serve all adjoining areas across Visakhapatnam. Select an area nearby or contact support.`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      background: isFound ? '#22C55E' : '#0284C7',
                      color: 'white',
                      border: 'none',
                      padding: '0.55rem 1.25rem',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  >
                    <span>{isFound ? `Book in ${seoAreaSearch.trim()}` : 'Book Doorstep Slot'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Featured Locality Hub Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            {VIZAG_LOCALITY_HUBS
              .filter(hub => {
                if (selectedSeoRegion !== 'all' && hub.region !== selectedSeoRegion) return false;
                if (!seoAreaSearch.trim()) return true;
                const q = seoAreaSearch.toLowerCase().trim();
                return hub.name.toLowerCase().includes(q) ||
                  hub.description.toLowerCase().includes(q) ||
                  hub.keywords.toLowerCase().includes(q) ||
                  hub.popularLocalities.some(l => l.toLowerCase().includes(q));
              })
              .map(hub => (
                <div
                  key={hub.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    border: '1.5px solid #E2E8F0',
                    padding: '1.65rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                    transition: 'all 0.22s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = '#38BDF8';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(14, 165, 233, 0.12)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.04)';
                  }}
                >
                  <div>
                    {/* Header & Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <span style={{
                        background: '#EFF6FF',
                        color: '#0284C7',
                        border: '1px solid #BAE6FD',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.65rem',
                        borderRadius: '20px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {hub.badge}
                      </span>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#059669',
                        background: '#ECFDF5',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px'
                      }}>
                        <Check size={12} strokeWidth={3} /> Doorstep Ready
                      </span>
                    </div>

                    {/* H3 Heading targeting Search Query */}
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem', lineHeight: 1.25 }}>
                      {hub.name}
                    </h3>

                    {/* Crawlable Description */}
                    <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.55, margin: '0 0 1rem' }}>
                      {hub.description}
                    </p>

                    {/* Popular Covered Landmarks in this Zone */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.45rem' }}>
                        Key Localities Served:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {hub.popularLocalities.map(loc => (
                          <span
                            key={loc}
                            onClick={() => setSeoAreaSearch(loc)}
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              color: '#334155',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.73rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            title={`Search car wash in ${loc}`}
                          >
                            📍 {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <span>Book Doorstep Wash in {hub.name.split('&')[0].trim()}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              ))}
          </div>

          {/* Complete 38+ Neighborhoods Keyword Tag Cloud */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '24px',
            padding: '2rem 2.25rem',
            textAlign: 'center'
          }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem' }}>
              Full Visakhapatnam Doorstep Coverage Neighborhoods (A to Z)
            </h4>
            <p style={{ color: '#64748B', fontSize: '0.85rem', maxWidth: '680px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
              Our mobile car cleaning scooties &amp; detailers travel to all residential colonies, gated apartments, and independent houses across Vizag:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', justifyContent: 'center' }}>
              {ALL_VIZAG_LOCALITIES.map(area => (
                <button
                  key={area}
                  onClick={() => {
                    setSeoAreaSearch(area);
                    const el = document.getElementById('service-areas');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '20px',
                    padding: '0.35rem 0.8rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#0284C7';
                    e.currentTarget.style.color = '#0284C7';
                    e.currentTarget.style.background = '#F0F9FF';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    e.currentTarget.style.color = '#1E293B';
                    e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  <span>✓ Car Wash {area}</span>
                </button>
              ))}
            </div>

            {/* Quick 4-Pill Guarantees Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1.75rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #E2E8F0',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', flexShrink: 0 }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>Save 2+ Hours</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>No queues or traffic in Vizag</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', flexShrink: 0 }}>
                  <Droplets size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>Pure Spot-Free Foam</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>pH-neutral scratch-free wash</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', flexShrink: 0 }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>Trained Detailers</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Equipped mobile professionals</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', flexShrink: 0 }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>Live Slot Windows</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Instant online booking confirmation</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 10. INTERACTIVE FAQ ACCORDION */}
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
                  {(areas.length > 0 ? areas.map(a => a.name) : ['Nad Junction', 'Old Gajuwaka', 'Pendurthi', 'Maddilapalem', 'Madhurawada']).map((zone, zi) => (
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
        padding: '3.5rem 6% 2.5rem', 
        borderTop: '1px solid rgba(255,255,255,0.08)', 
        background: '#0A0F1D',
        color: '#94A3B8'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Top Footer Row: Large Logo Badge & Follow Us On Links */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
            
            {/* Enlarged Logo in White Box & Brand Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ 
                background: '#FFFFFF', 
                width: '58px',
                height: '58px', 
                borderRadius: '14px', 
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 16px rgba(56, 189, 248, 0.25)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1.5px solid rgba(255,255,255,0.4)',
                overflow: 'hidden',
                padding: '4px',
                flexShrink: 0
              }}>
                <img 
                  src={logo} 
                  alt="Wash My Car Org Logo" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain', 
                    transform: 'scale(1.42)', 
                    transformOrigin: 'center' 
                  }} 
                />
              </div>

              <div>
                <div style={{ fontWeight: 900, fontSize: '1.3rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  <span style={{ color: '#FFFFFF' }}>WASH </span>
                  <span style={{ color: '#38BDF8' }}>MY </span>
                  <span style={{ color: '#FFFFFF' }}>CAR </span>
                  <span style={{ color: '#38BDF8' }}>ORG</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '4px', fontWeight: 500 }}>
                  Doorstep Vehicle Detailing & Steam Spa • Visakhapatnam
                </div>
              </div>
            </div>

            {/* "Follow Us On" Dynamic Social Media Links (Configured by Admin in Settings) */}
            {socialLinks.filter(s => s.enabled && s.url).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#38BDF8',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}>
                  <span>Follow Us On</span>
                  <span style={{ width: '24px', height: '2px', background: 'linear-gradient(90deg, #38BDF8, transparent)', borderRadius: '2px' }} />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', alignItems: 'center' }}>
                  {socialLinks.filter(s => s.enabled && s.url).map((s, idx) => (
                    <a
                      key={s.id || idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Visit our ${s.platform}: ${s.name || s.platform}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '24px',
                        padding: '0.45rem 0.95rem',
                        color: '#F1F5F9',
                        textDecoration: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        transition: 'all 0.25s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(14, 165, 233, 0.2)';
                        e.currentTarget.style.borderColor = '#38BDF8';
                        e.currentTarget.style.color = '#38BDF8';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(14,165,233,0.3)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.color = '#F1F5F9';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {s.id === 'instagram' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#E1306C' }}>
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                          </svg>
                        )}
                        {s.id === 'facebook' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#1877F2' }}>
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        )}
                        {s.id === 'whatsapp' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#22C55E' }}>
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                          </svg>
                        )}
                        {s.id === 'linkedin' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0EA5E9' }}>
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                            <rect x="2" y="9" width="4" height="12"/>
                            <circle cx="4" cy="4" r="2"/>
                          </svg>
                        )}
                        {s.id === 'twitter' && (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#FFFFFF' }}>
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        )}
                      </span>
                      <span>{s.name || s.platform}</span>
                      <ExternalLink size={12} style={{ opacity: 0.6 }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Divider Row: Navigation Links & Copyright */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
              <a href="#welcome-offer" style={{ color: '#FCD34D', textDecoration: 'none', fontWeight: 700 }}>🎁 Claim Welcome Offer</a>
              <Link to="/login" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Customer Login</Link>
              <Link to="/register" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Register / Sign Up</Link>
              <a href="#packages" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Services</a>
              <a href="#service-areas" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Vizag Localities</a>
              <a href="#why-us" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Why Wash My Car Org</a>
              <a href="#partners" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Franchise</a>
              <a href="#faq" style={{ color: '#CBD5E1', textDecoration: 'none' }}>FAQ</a>
              <Link to="/terms" style={{ color: '#38BDF8', textDecoration: 'none' }}>Terms & Conditions</Link>
              <Link to="/privacy" style={{ color: '#38BDF8', textDecoration: 'none' }}>Privacy Policy</Link>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
              © 2026 Wash My Car Org Doorstep Care. All rights reserved.
            </div>
          </div>

        </div>
      </footer>


    </div>
  );
};

export default Home;
