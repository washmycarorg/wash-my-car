import React, { useState, useEffect } from 'react';
import { getCmsSettings, updateCmsSettings } from '../api';
import { 
  Layout, Image, Phone, Mail, MapPin, Tag, Globe, Sparkles, 
  HelpCircle, BarChart3, Briefcase, Plus, Trash2, Check, ArrowRight, 
  Layers, Upload, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Eye
} from 'lucide-react';

const DEFAULT_HERO_SLIDES = [
  {
    id: 'slide-1',
    kicker: 'WASH MY CAR ORG • DOORSTEP CAR WASH',
    title: 'WE WASH.\nYOU RELAX.',
    subtitle: 'Premium vehicle spa and car detailing at your doorstep. Save time, skip the queue, and let trained professionals care for your car.',
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=2200&q=95',
    badgeText: 'WATER EFFICIENT & RO CARE',
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

const CURATED_PRESETS = [
  { label: 'Foam Wash', url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=2200&q=95' },
  { label: 'Interior Spa', url: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=2200&q=95' },
  { label: 'Ceramic Coating', url: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=2200&q=95' },
  { label: 'Luxury Gloss', url: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=2200&q=95' },
  { label: 'Waterless Polish', url: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=2200&q=95' }
];

const CmsSettings = () => {
  const [formData, setFormData] = useState({
    heroSlides: DEFAULT_HERO_SLIDES,
    heroKicker: 'WASH MY CAR ORG • DOORSTEP CAR WASH',
    heroTitle: 'WE WASH.\nYOU RELAX.',
    heroSubtitle: 'Premium vehicle spa and car detailing at your doorstep. Save time, skip the queue, and let trained professionals care for your car.',
    heroImage: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=2200&q=95',
    heroBadgeText: 'WATER EFFICIENT & RO CARE',
    heroCtaPrimary: 'Book Doorstep Wash',
    heroCtaSecondary: 'Explore Packages',

    quickBarLive: '● LIVE DOORSTEP SPA',
    quickBarTitle: 'App & Online Booking is Live.',
    quickBarSubtitle: 'Book doorstep vehicle detailing in seconds.',

    servicesTitle: 'EVERYDAY CARE. PREMIUM SHINE.',
    servicesSubtitle: 'One destination for your vehicle\'s everyday wash, interior deep steam, and premium shine.',
    aboutTitle: 'Serving Visakhapatnam & Surrounds',
    aboutText: 'We proudly serve all Visakhapatnam neighborhoods with professional care and premium equipment!',

    whyTitle: 'SMARTER CAR CARE. BUILT AROUND YOU.',
    whySubtitle: 'Convenience-first automotive detailing with professional high-pressure equipment and deionized spot-free water.',
    whyCard1Title: 'YOUR CAR STAYS. WE COME TO YOU.',
    whyCard1Text: 'No queues. No driving to wash centres. Our technicians arrive at your home or office with high-pressure machines and spot-free deionized water.',
    whyCard2Title: 'Book in Seconds',
    whyCard2Text: 'Choose your wash package, select your slot, and track everything live.',
    whyCard3Title: 'Trained Specialists',
    whyCard3Text: 'Background-verified, trained vehicle care professionals using pH-neutral premium shampoos.',
    whyCard4Title: 'Water-Efficient Care',
    whyCard4Text: 'Eco-conscious steam & pressure washing saves up to 80% water compared to traditional washing.',

    statCustomers: '10K+',
    statCustomersLabel: 'Happy Vehicle Owners',
    statCities: '2+',
    statCitiesLabel: 'Service Hubs Live',
    statDuration: '30–90',
    statDurationLabel: 'Minutes Service Time',
    statPrice: '₹299+',
    statPriceLabel: 'Starting Wash Price',

    partnerTitle: 'BUILD THE NEXT CAR CARE BUSINESS',
    partnerSubtitle: 'Choose the operating model that fits your city — doorstep franchise partner or fixed branded outlet.',
    doorstepPlanTitle: 'Doorstep Franchise Partner',
    doorstepPlanPrice: '₹1.8 LAKH',
    doorstepPlanPerks: 'Low investment,No shop required,Proven high margin model,Machinery & launch support',
    outletPlanTitle: 'Branded Outlet Partner',
    outletPlanPrice: '₹3.5 LAKH',
    outletPlanPerks: 'Storefront branding,Interior setup,High-end pressure equipment,Technology & SOPs',
    franchisePlans: [
      {
        id: 'plan-1',
        title: 'Doorstep Franchise Partner',
        price: '₹1.8 LAKH',
        badge: 'MOBILE DETAILING',
        perks: 'Low investment,No shop required,Proven high margin model,Machinery & launch support'
      },
      {
        id: 'plan-2',
        title: 'Branded Outlet Partner',
        price: '₹3.5 LAKH',
        badge: 'PHYSICAL STUDIO',
        perks: 'Storefront branding,Interior setup,High-end pressure equipment,Technology & SOPs'
      }
    ],

    contactPhone: '+91 98765 43210',
    contactEmail: 'washmycarorg@gmail.com',
    contactAddress: 'Sujatha Nagar, Visakhapatnam, Andhra Pradesh',
    whatsappNumber: '+919876543210',

    promoTitle: 'Get 20% OFF Your First Doorstep Wash!',
    promoText: 'Claim Offer Now',

    faqs: [
      { q: 'How do I book a doorstep car wash?', a: 'Simply select your vehicle type, pick your package & add-ons, choose a convenient date and time slot, and our trained technician will arrive with full equipment.' },
      { q: 'Do I need to provide water and electricity?', a: 'Our mobile units are equipped with water tanks and compact generators for maximum convenience, though access to a standard domestic point is welcome.' },
      { q: 'Can I book add-on services like Helmet or Bike wash?', a: 'Yes! You can add Helmet wash, 2-wheeler wash, interior steam cleaning, and engine bay cleaning directly during your car wash booking checkout.' },
      { q: 'Where is Wash My Car Org currently available?', a: 'We are actively serving Visakhapatnam and surrounding neighborhoods, with expansion across Andhra Pradesh and Telangana.' }
    ]
  });

  const [activeSection, setActiveSection] = useState('slides'); // 'slides', 'quickbar', 'why', 'stats', 'franchise', 'faqs', 'contact', 'promo'
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCmsSettings()
      .then(res => {
        if (res) {
          let faqsParsed = [];
          if (res.faqs) {
            try {
              faqsParsed = typeof res.faqs === 'string' ? JSON.parse(res.faqs) : res.faqs;
            } catch (e) {
              faqsParsed = [];
            }
          }

          let slidesParsed = null;
          if (res.heroSlides) {
            try {
              slidesParsed = typeof res.heroSlides === 'string' ? JSON.parse(res.heroSlides) : res.heroSlides;
            } catch (e) {
              slidesParsed = null;
            }
          }

          let franchiseParsed = [];
          if (res.franchisePlans) {
            try {
              franchiseParsed = typeof res.franchisePlans === 'string' ? JSON.parse(res.franchisePlans) : res.franchisePlans;
            } catch (e) {
              franchiseParsed = [];
            }
          }
          if (!Array.isArray(franchiseParsed) || franchiseParsed.length === 0) {
            franchiseParsed = [
              {
                id: 'plan-1',
                title: res.doorstepPlanTitle || 'Doorstep Franchise Partner',
                price: res.doorstepPlanPrice || '₹1.8 LAKH',
                badge: 'MOBILE DETAILING',
                perks: res.doorstepPlanPerks || 'Low investment,No shop required,Proven high margin model,Machinery & launch support'
              },
              {
                id: 'plan-2',
                title: res.outletPlanTitle || 'Branded Outlet Partner',
                price: res.outletPlanPrice || '₹3.5 LAKH',
                badge: 'PHYSICAL STUDIO',
                perks: res.outletPlanPerks || 'Storefront branding,Interior setup,High-end pressure equipment,Technology & SOPs'
              }
            ];
          }

          const resolvedSlides = Array.isArray(slidesParsed) && slidesParsed.length > 0
            ? slidesParsed
            : DEFAULT_HERO_SLIDES;

          setFormData(prev => ({
            ...prev,
            ...res,
            heroSlides: resolvedSlides,
            franchisePlans: franchiseParsed,
            faqs: Array.isArray(faqsParsed) && faqsParsed.length > 0 ? faqsParsed : prev.faqs
          }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // --- SLIDE EDITING HANDLERS ---
  const currentSlides = Array.isArray(formData.heroSlides) && formData.heroSlides.length > 0
    ? formData.heroSlides
    : DEFAULT_HERO_SLIDES;

  const activeSlide = currentSlides[selectedSlideIndex] || currentSlides[0] || DEFAULT_HERO_SLIDES[0];

  const handleSlideFieldChange = (field, value) => {
    setFormData(prev => {
      const slides = [...(prev.heroSlides || DEFAULT_HERO_SLIDES)];
      slides[selectedSlideIndex] = {
        ...slides[selectedSlideIndex],
        [field]: value
      };
      return { ...prev, heroSlides: slides };
    });
  };

  const handleSlideImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSlideFieldChange('image', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSlide = () => {
    const newSlide = {
      id: `slide-${Date.now()}`,
      kicker: 'WASH MY CAR ORG • DOORSTEP SPECIAL',
      title: 'LUXURY VEHICLE SPA.\nRIGHT AT YOUR DOOR.',
      subtitle: 'Experience doorstep vehicle detailing with spot-free deionized water, snow foam treatment, and interior steam rejuvenation.',
      image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=2200&q=95',
      badgeText: 'SPOT-FREE PURIFIED WATER',
      ctaPrimary: 'Book Doorstep Wash',
      ctaSecondary: 'Explore Packages',
      primaryLink: '/login',
      secondaryLink: '#packages'
    };

    setFormData(prev => ({
      ...prev,
      heroSlides: [...(prev.heroSlides || DEFAULT_HERO_SLIDES), newSlide]
    }));
    setSelectedSlideIndex(currentSlides.length);
    setPreviewSlideIndex(currentSlides.length);
  };

  const handleRemoveSlide = (idxToRemove) => {
    if (currentSlides.length <= 1) {
      alert('You must keep at least 1 slide for the hero section.');
      return;
    }
    const filtered = currentSlides.filter((_, i) => i !== idxToRemove);
    setFormData(prev => ({ ...prev, heroSlides: filtered }));
    if (selectedSlideIndex >= filtered.length) {
      setSelectedSlideIndex(filtered.length - 1);
    }
    if (previewSlideIndex >= filtered.length) {
      setPreviewSlideIndex(filtered.length - 1);
    }
  };

  const handleMoveSlide = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= currentSlides.length) return;
    const reordered = [...currentSlides];
    const temp = reordered[idx];
    reordered[idx] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setFormData(prev => ({ ...prev, heroSlides: reordered }));
    setSelectedSlideIndex(targetIdx);
    setPreviewSlideIndex(targetIdx);
  };

  // --- FAQ HANDLERS ---
  const handleAddFaq = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { q: 'New Question', a: 'Detailed answer goes here...' }]
    }));
  };

  const handleFaqChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.faqs];
      updated[index][field] = value;
      return { ...prev, faqs: updated };
    });
  };

  const handleRemoveFaq = (index) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  // --- FRANCHISE PLANS HANDLERS ---
  const handleAddFranchisePlan = () => {
    const newPlan = {
      id: `plan-${Date.now()}`,
      title: 'New Franchise Model',
      price: '₹2.0 LAKH',
      badge: 'FRANCHISE OPTION',
      perks: 'Complete machinery & van kit,Staff training,Dedicated territory,Live digital dispatch'
    };
    setFormData(prev => ({
      ...prev,
      franchisePlans: [...(prev.franchisePlans || []), newPlan]
    }));
  };

  const handleFranchisePlanChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev.franchisePlans || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, franchisePlans: updated };
    });
  };

  const handleRemoveFranchisePlan = (index) => {
    if ((formData.franchisePlans || []).length <= 1) {
      alert('You must configure at least one franchise plan card.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      franchisePlans: (prev.franchisePlans || []).filter((_, i) => i !== index)
    }));
  };

  // --- SAVE & PUBLISH ---
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        franchisePlans: JSON.stringify(formData.franchisePlans || []),
        doorstepPlanTitle: formData.franchisePlans?.[0]?.title || formData.doorstepPlanTitle,
        doorstepPlanPrice: formData.franchisePlans?.[0]?.price || formData.doorstepPlanPrice,
        doorstepPlanPerks: formData.franchisePlans?.[0]?.perks || formData.doorstepPlanPerks,
        outletPlanTitle: formData.franchisePlans?.[1]?.title || formData.outletPlanTitle,
        outletPlanPrice: formData.franchisePlans?.[1]?.price || formData.outletPlanPrice,
        outletPlanPerks: formData.franchisePlans?.[1]?.perks || formData.outletPlanPerks,
      };
      await updateCmsSettings(payload);
      alert('Homepage CMS & Slides updated successfully! Changes are live on the user website.');
    } catch (err) {
      console.error(err);
      alert('Failed to save homepage configurations: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading CMS Editor...</div>;

  const previewSlide = currentSlides[previewSlideIndex] || currentSlides[0] || DEFAULT_HERO_SLIDES[0];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in">
      
      {/* CMS Form Editor (Left Columns) */}
      <div className="xl:col-span-7 flex flex-col gap-5">
        <div className="card" style={{ padding: '1.75rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-navy)', fontSize: '1.25rem' }}>
                <Globe size={22} color="var(--primary-blue)" /> Homepage CMS Manager
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                Alter front page slides, images, taglines, and marketing content.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.4rem', fontSize: '0.9rem', fontWeight: 800, borderRadius: '25px', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)' }}
            >
              {saving ? 'Publishing...' : 'Save & Publish Live'}
            </button>
          </div>

          {/* Section Selector Pills */}
          <div className="tabs-scrollable" style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
            {[
              { id: 'slides', label: `Front Slides (${currentSlides.length})`, icon: Layers, isSpecial: true },
              { id: 'quickbar', label: 'Announcement Bar', icon: Tag },
              { id: 'why', label: 'Why Choose Us', icon: Layout },
              { id: 'stats', label: 'Impact Stats', icon: BarChart3 },
              { id: 'franchise', label: 'Partner Plans', icon: Briefcase },
              { id: 'faqs', label: 'FAQs', icon: HelpCircle },
              { id: 'contact', label: 'Contact & Helpdesk', icon: Phone },
              { id: 'promo', label: 'Promo Banner', icon: Tag }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '20px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: isActive ? '2px solid var(--primary-blue)' : '1px solid #CBD5E1',
                    background: isActive ? '#EFF6FF' : tab.isSpecial ? '#F0FDF4' : 'white',
                    color: isActive ? 'var(--primary-blue)' : tab.isSpecial ? '#15803D' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <Icon size={15} /> {tab.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* 1. HERO SLIDES MANAGER (PEXA CAR CARE CAROUSEL) */}
            {activeSection === 'slides' && (
              <div style={{ background: '#F8FAFC', padding: '1.35rem', borderRadius: '14px', border: '1.5px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Header Strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={18} color="#0EA5E9" /> Pexa-Style Hero Carousel Slides
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Add, delete, or alter images and text for each slide in the auto-playing front page carousel.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSlide}
                    className="btn btn-outline"
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#FFFFFF', borderColor: '#0EA5E9', color: '#0284C7' }}
                  >
                    <Plus size={15} /> Add New Slide
                  </button>
                </div>

                {/* Horizontal Slide Selector Bar */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                    Select Slide to Edit ({currentSlides.length} total)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.65rem' }}>
                    {currentSlides.map((slide, sIdx) => {
                      const isSelected = selectedSlideIndex === sIdx;
                      return (
                        <div
                          key={slide.id || sIdx}
                          onClick={() => {
                            setSelectedSlideIndex(sIdx);
                            setPreviewSlideIndex(sIdx);
                          }}
                          style={{
                            background: isSelected ? '#EFF6FF' : 'white',
                            border: isSelected ? '2px solid #0EA5E9' : '1px solid #CBD5E1',
                            borderRadius: '12px',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            position: 'relative',
                            transition: 'all 0.15s',
                            boxShadow: isSelected ? '0 4px 12px rgba(14,165,233,0.2)' : 'none'
                          }}
                        >
                          {/* Mini Thumbnail */}
                          <div style={{ width: '100%', height: '54px', borderRadius: '6px', background: '#1E293B', overflow: 'hidden', position: 'relative' }}>
                            <img
                              src={slide.image}
                              alt={`Slide ${sIdx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span style={{ position: 'absolute', bottom: '2px', left: '4px', fontSize: '0.65rem', fontWeight: 800, background: 'rgba(0,0,0,0.65)', color: 'white', padding: '1px 5px', borderRadius: '4px' }}>
                              #{sIdx + 1}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? '#0284C7' : '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {slide.title?.replace('\n', ' ') || `Slide ${sIdx + 1}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Slide Editing Card */}
                <div style={{ background: 'white', border: '1.5px solid #CBD5E1', borderRadius: '14px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  
                  {/* Slide Control Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: '#0EA5E9', color: 'white', padding: '0.2rem 0.65rem', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 800 }}>
                        Editing Slide #{selectedSlideIndex + 1}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                        {activeSlide.id || `slide-${selectedSlideIndex + 1}`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(selectedSlideIndex, -1)}
                        disabled={selectedSlideIndex === 0}
                        title="Move Slide Earlier"
                        style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.35rem 0.55rem', borderRadius: '8px', cursor: selectedSlideIndex === 0 ? 'not-allowed' : 'pointer', opacity: selectedSlideIndex === 0 ? 0.4 : 1 }}
                      >
                        <ArrowUp size={14} color="#0F172A" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveSlide(selectedSlideIndex, 1)}
                        disabled={selectedSlideIndex === currentSlides.length - 1}
                        title="Move Slide Later"
                        style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.35rem 0.55rem', borderRadius: '8px', cursor: selectedSlideIndex === currentSlides.length - 1 ? 'not-allowed' : 'pointer', opacity: selectedSlideIndex === currentSlides.length - 1 ? 0.4 : 1 }}
                      >
                        <ArrowDown size={14} color="#0F172A" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveSlide(selectedSlideIndex)}
                        title="Delete Slide"
                        style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.35rem 0.55rem', borderRadius: '8px', cursor: 'pointer', color: '#DC2626' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 1. IMAGE ALTERATION SECTION */}
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <Image size={16} color="#0EA5E9" /> Slide Background Image (Alter Image)
                    </label>

                    {/* Image Preview Banner */}
                    <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #CBD5E1', marginBottom: '0.85rem', background: '#0F172A' }}>
                      <img
                        src={activeSlide.image}
                        alt="Slide Background Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 60%, transparent 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1rem', color: 'white' }}>
                        <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 800 }}>{activeSlide.kicker || 'TAGLINE'}</span>
                        <h4 style={{ margin: '0.2rem 0', fontSize: '1rem', fontWeight: 900, whiteSpace: 'pre-line' }}>{activeSlide.title || 'Slide Title'}</h4>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '10px', width: 'fit-content' }}>
                          {activeSlide.badgeText || 'Badge Text'}
                        </span>
                      </div>
                    </div>

                    {/* Image Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                          Upload from Computer:
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: 'white', border: '1.5px dashed #0EA5E9', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', color: '#0284C7' }}>
                          <Upload size={15} /> Choose Photo File
                          <input type="file" accept="image/*" onChange={handleSlideImageUpload} style={{ display: 'none' }} />
                        </label>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                          Or Paste Image URL:
                        </label>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/..."
                          className="form-input"
                          style={{ margin: 0, padding: '0.55rem 0.75rem', fontSize: '0.82rem' }}
                          value={activeSlide.image || ''}
                          onChange={e => handleSlideFieldChange('image', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Quick Image Presets */}
                    <div style={{ marginTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, marginRight: '0.5rem' }}>
                        Curated Presets:
                      </span>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                        {CURATED_PRESETS.map((preset, pi) => (
                          <button
                            key={pi}
                            type="button"
                            onClick={() => handleSlideFieldChange('image', preset.url)}
                            style={{
                              background: activeSlide.image === preset.url ? '#EFF6FF' : 'white',
                              border: activeSlide.image === preset.url ? '1px solid #0EA5E9' : '1px solid #CBD5E1',
                              color: activeSlide.image === preset.url ? '#0284C7' : '#334155',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* 2. SLIDE TEXT CUSTOMIZATION */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Kicker Tagline (Top Tag)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={activeSlide.kicker || ''}
                          onChange={e => handleSlideFieldChange('kicker', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Floating Badge Text</label>
                        <input
                          type="text"
                          className="form-input"
                          value={activeSlide.badgeText || ''}
                          onChange={e => handleSlideFieldChange('badgeText', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Slide Headline / Title (Use \n or Enter for 2-line impact)</label>
                      <textarea
                        rows={2}
                        className="form-input"
                        value={activeSlide.title || ''}
                        onChange={e => handleSlideFieldChange('title', e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Slide Subtitle Paragraph</label>
                      <textarea
                        rows={2}
                        className="form-input"
                        value={activeSlide.subtitle || ''}
                        onChange={e => handleSlideFieldChange('subtitle', e.target.value)}
                      />
                    </div>

                    {/* CTA Buttons Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>Primary Action Button</span>
                        <input
                          type="text"
                          placeholder="Button Text"
                          className="form-input"
                          style={{ marginBottom: '0.35rem' }}
                          value={activeSlide.ctaPrimary || ''}
                          onChange={e => handleSlideFieldChange('ctaPrimary', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Link (e.g. /login or #packages)"
                          className="form-input"
                          style={{ margin: 0, fontSize: '0.78rem' }}
                          value={activeSlide.primaryLink || ''}
                          onChange={e => handleSlideFieldChange('primaryLink', e.target.value)}
                        />
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>Secondary Action Button</span>
                        <input
                          type="text"
                          placeholder="Button Text"
                          className="form-input"
                          style={{ marginBottom: '0.35rem' }}
                          value={activeSlide.ctaSecondary || ''}
                          onChange={e => handleSlideFieldChange('ctaSecondary', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Link (e.g. #packages)"
                          className="form-input"
                          style={{ margin: 0, fontSize: '0.78rem' }}
                          value={activeSlide.secondaryLink || ''}
                          onChange={e => handleSlideFieldChange('secondaryLink', e.target.value)}
                        />
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* 2. QUICK BAR */}
            {activeSection === 'quickbar' && (
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '0.95rem', fontWeight: 700 }}>
                  📢 Quick Announcement Bar
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Live Pill Tag</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.quickBarLive}
                      onChange={e => setFormData({ ...formData, quickBarLive: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Headline Text</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.quickBarTitle}
                      onChange={e => setFormData({ ...formData, quickBarTitle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Sub-headline Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.quickBarSubtitle}
                    onChange={e => setFormData({ ...formData, quickBarSubtitle: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* 3. WHY CHOOSE US / THE DIFFERENCE */}
            {activeSection === 'why' && (
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '0.95rem', fontWeight: 700 }}>
                  🛡️ The Wash My Car Org Difference (Why Choose Us)
                </h4>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Section Heading</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.whyTitle}
                    onChange={e => setFormData({ ...formData, whyTitle: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Section Subtitle</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.whySubtitle}
                    onChange={e => setFormData({ ...formData, whySubtitle: e.target.value })}
                  />
                </div>

                <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-navy)' }}>Pillar 1 (Featured Banner Card)</span>
                  <input
                    type="text"
                    placeholder="Card 1 Title"
                    className="form-input"
                    value={formData.whyCard1Title}
                    onChange={e => setFormData({ ...formData, whyCard1Title: e.target.value })}
                  />
                  <textarea
                    rows={2}
                    placeholder="Card 1 Text"
                    className="form-input"
                    value={formData.whyCard1Text}
                    onChange={e => setFormData({ ...formData, whyCard1Text: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px dashed #CBD5E1', paddingTop: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-navy)' }}>Pillar 2</span>
                    <input
                      type="text"
                      className="form-input"
                      style={{ marginTop: '0.25rem' }}
                      value={formData.whyCard2Title}
                      onChange={e => setFormData({ ...formData, whyCard2Title: e.target.value })}
                    />
                    <textarea
                      rows={2}
                      className="form-input"
                      style={{ marginTop: '0.25rem' }}
                      value={formData.whyCard2Text}
                      onChange={e => setFormData({ ...formData, whyCard2Text: e.target.value })}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-navy)' }}>Pillar 3</span>
                    <input
                      type="text"
                      className="form-input"
                      style={{ marginTop: '0.25rem' }}
                      value={formData.whyCard3Title}
                      onChange={e => setFormData({ ...formData, whyCard3Title: e.target.value })}
                    />
                    <textarea
                      rows={2}
                      className="form-input"
                      style={{ marginTop: '0.25rem' }}
                      value={formData.whyCard3Text}
                      onChange={e => setFormData({ ...formData, whyCard3Text: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-navy)' }}>Pillar 4 (Eco/Water)</span>
                  <input
                    type="text"
                    className="form-input"
                    style={{ marginTop: '0.25rem' }}
                    value={formData.whyCard4Title}
                    onChange={e => setFormData({ ...formData, whyCard4Title: e.target.value })}
                  />
                  <textarea
                    rows={2}
                    className="form-input"
                    style={{ marginTop: '0.25rem' }}
                    value={formData.whyCard4Text}
                    onChange={e => setFormData({ ...formData, whyCard4Text: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* 4. STATS & METRICS */}
            {activeSection === 'stats' && (
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '0.95rem', fontWeight: 700 }}>
                  📊 Highlight Metrics (Stats Strip)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Stat 1 Value</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.statCustomers}
                      onChange={e => setFormData({ ...formData, statCustomers: e.target.value })}
                    />
                    <label className="form-label" style={{ marginTop: '0.35rem' }}>Stat 1 Label</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.statCustomersLabel}
                      onChange={e => setFormData({ ...formData, statCustomersLabel: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Stat 2 Value</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.statCities}
                      onChange={e => setFormData({ ...formData, statCities: e.target.value })}
                    />
                    <label className="form-label" style={{ marginTop: '0.35rem' }}>Stat 2 Label</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.statCitiesLabel}
                      onChange={e => setFormData({ ...formData, statCitiesLabel: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Stat 3 Value</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.statDuration}
                      onChange={e => setFormData({ ...formData, statDuration: e.target.value })}
                    />
                    <label className="form-label" style={{ marginTop: '0.35rem' }}>Stat 3 Label</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.statDurationLabel}
                      onChange={e => setFormData({ ...formData, statDurationLabel: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Stat 4 Value</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.statPrice}
                      onChange={e => setFormData({ ...formData, statPrice: e.target.value })}
                    />
                    <label className="form-label" style={{ marginTop: '0.35rem' }}>Stat 4 Label</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.statPriceLabel}
                      onChange={e => setFormData({ ...formData, statPriceLabel: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. FRANCHISE & PARTNER */}
            {activeSection === 'franchise' && (
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '0.95rem', fontWeight: 700 }}>
                  🤝 Partner With Us & Franchise
                </h4>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Section Heading</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.partnerTitle}
                    onChange={e => setFormData({ ...formData, partnerTitle: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Section Subtitle</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.partnerSubtitle}
                    onChange={e => setFormData({ ...formData, partnerSubtitle: e.target.value })}
                  />
                </div>

                <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                        Franchise Model Cards ({(formData.franchisePlans || []).length})
                      </span>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                        Configure 1, 2, 3 or more franchise partnership tiers. These cards will dynamically display on the homepage.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFranchisePlan}
                      className="btn btn-outline"
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.4rem 0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: 'var(--primary-blue)',
                        borderColor: 'var(--primary-blue)'
                      }}
                    >
                      <Plus size={15} /> Add Franchise Card
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(formData.franchisePlans || []).map((plan, pIdx) => (
                      <div
                        key={plan.id || pIdx}
                        style={{
                          background: 'white',
                          border: '1.5px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '1.1rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                          <span style={{ fontWeight: 800, color: 'var(--primary-navy)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ background: '#E0F2FE', color: '#0369A1', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                              {pIdx + 1}
                            </span>
                            {plan.title || `Franchise Plan #${pIdx + 1}`}
                          </span>
                          {(formData.franchisePlans || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFranchisePlan(pIdx)}
                              style={{
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.3rem 0.6rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                              title="Delete this franchise card"
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                              Plan Title
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Doorstep Franchise Partner"
                              value={plan.title || ''}
                              onChange={e => handleFranchisePlanChange(pIdx, 'title', e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                              Investment / Price
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. ₹1.8 LAKH"
                              value={plan.price || ''}
                              onChange={e => handleFranchisePlanChange(pIdx, 'price', e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ marginTop: '0.65rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                            Badge / Tagline (e.g. MOBILE DETAILING, PHYSICAL STUDIO, EXPRESS KIOSK)
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. MOBILE DETAILING"
                            value={plan.badge || ''}
                            onChange={e => handleFranchisePlanChange(pIdx, 'badge', e.target.value)}
                          />
                        </div>

                        <div style={{ marginTop: '0.65rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                            Perks & Inclusions (Comma separated)
                          </label>
                          <textarea
                            rows={2}
                            className="form-input"
                            placeholder="e.g. Low investment, No shop required, High profit margins, Full machinery & launch support"
                            value={plan.perks || ''}
                            onChange={e => handleFranchisePlanChange(pIdx, 'perks', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. FAQS */}
            {activeSection === 'faqs' && (
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '0.95rem', fontWeight: 700 }}>
                    ❓ Frequently Asked Questions (FAQ)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={14} /> Add Question
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {formData.faqs.map((faq, idx) => (
                    <div key={idx} style={{ background: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Question Title"
                          className="form-input"
                          style={{ margin: 0, fontWeight: 600 }}
                          value={faq.q}
                          onChange={e => handleFaqChange(idx, 'q', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(idx)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Answer description"
                        className="form-input"
                        style={{ margin: 0, fontSize: '0.88rem' }}
                        value={faq.a}
                        onChange={e => handleFaqChange(idx, 'a', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. CONTACT & HELPDESK */}
            {activeSection === 'contact' && (
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '0.95rem', fontWeight: 700 }}>
                  📞 Helpdesk & Location Contacts
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Helpline Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.contactPhone}
                      onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Support Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.contactEmail}
                      onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">WhatsApp Direct Booking Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. +919876543210"
                      value={formData.whatsappNumber}
                      onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Serving Headquarters Address</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.contactAddress}
                      onChange={e => setFormData({ ...formData, contactAddress: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 8. PROMO BANNER */}
            {activeSection === 'promo' && (
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '0.95rem', fontWeight: 700 }}>
                  🎁 Promotional Offer Strip
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Promo Headline</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.promoTitle}
                      onChange={e => setFormData({ ...formData, promoTitle: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">CTA Action Text</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.promoText}
                      onChange={e => setFormData({ ...formData, promoText: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-block"
              style={{ padding: '0.9rem', fontWeight: 800, fontSize: '1rem', marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)' }}
            >
              {saving ? 'Publishing Changes...' : 'Save & Publish All Homepage Updates'}
            </button>
          </form>

        </div>
      </div>

      {/* Live Homepage Mockup (Right Columns) */}
      <div className="xl:col-span-5">
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#0F172A', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} color="#38BDF8" /> Real-Time Slider Preview
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                Slide {previewSlideIndex + 1}/{currentSlides.length}
              </span>
              <span style={{ fontSize: '0.7rem', background: '#0EA5E9', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                Pexa Carousel
              </span>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '0.75rem', maxHeight: '82vh', overflowY: 'auto', fontSize: '0.8rem' }}>
            
            {/* Header Mock */}
            <div style={{ background: '#0F172A', color: 'white', padding: '0.6rem 0.85rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.75rem', color: '#38BDF8' }}>WASH MY CAR ORG</span>
              <span style={{ background: '#0EA5E9', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700 }}>Book Doorstep</span>
            </div>

            {/* LIVE CAROUSEL HERO MOCK */}
            <div style={{
              borderRadius: '14px',
              padding: '1.25rem 1rem 2.25rem',
              background: `linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.7) 60%, rgba(15,23,42,0.3) 100%), url(${previewSlide.image}) center/cover no-repeat`,
              color: 'white',
              marginBottom: '0.5rem',
              position: 'relative',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              overflow: 'hidden'
            }}>
              {/* Floating Badge in Mock */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px' }}>
                  {previewSlide.kicker}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', padding: '0.15rem 0.45rem', borderRadius: '12px', fontSize: '0.58rem', fontWeight: 700, color: '#F8FAFC' }}>
                  {previewSlide.badgeText}
                </span>
              </div>

              {/* Title in Mock */}
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0.35rem 0', whiteSpace: 'pre-line', lineHeight: 1.15, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {previewSlide.title}
              </h2>

              {/* Subtitle in Mock */}
              <p style={{ fontSize: '0.68rem', color: '#CBD5E1', margin: '0 0 0.85rem 0', lineHeight: 1.4 }}>
                {previewSlide.subtitle}
              </p>

              {/* CTA Buttons in Mock */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ background: '#0EA5E9', color: 'white', padding: '0.35rem 0.8rem', borderRadius: '15px', fontSize: '0.68rem', fontWeight: 800, boxShadow: '0 2px 8px rgba(14,165,233,0.4)' }}>
                  {previewSlide.ctaPrimary || 'Book Now'} →
                </span>
                <span style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)', padding: '0.35rem 0.65rem', borderRadius: '15px', fontSize: '0.65rem', fontWeight: 600 }}>
                  {previewSlide.ctaSecondary || 'Explore'}
                </span>
              </div>

              {/* Carousel Arrows in Mock */}
              <button
                type="button"
                onClick={() => setPreviewSlideIndex(prev => (prev === 0 ? currentSlides.length - 1 : prev - 1))}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '6px',
                  transform: 'translateY(-50%)',
                  background: 'rgba(15,23,42,0.65)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={14} />
              </button>

              <button
                type="button"
                onClick={() => setPreviewSlideIndex(prev => (prev === currentSlides.length - 1 ? 0 : prev + 1))}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '6px',
                  transform: 'translateY(-50%)',
                  background: 'rgba(15,23,42,0.65)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={14} />
              </button>

              {/* Carousel Indicator Dots in Mock */}
              <div style={{ position: 'absolute', bottom: '8px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                {currentSlides.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setPreviewSlideIndex(dotIdx)}
                    style={{
                      width: previewSlideIndex === dotIdx ? '16px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      background: previewSlideIndex === dotIdx ? '#38BDF8' : 'rgba(255,255,255,0.4)',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Quick Bar Mock */}
            <div style={{ background: '#0284C7', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{formData.quickBarTitle}</span>
                <div style={{ fontSize: '0.58rem', opacity: 0.9 }}>{formData.quickBarSubtitle}</div>
              </div>
              <span style={{ background: '#06B6D4', padding: '0.2rem 0.5rem', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 800 }}>
                {formData.quickBarLive}
              </span>
            </div>

            {/* Stats Mock */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', background: '#0F172A', color: 'white', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#38BDF8', fontSize: '0.85rem' }}>{formData.statCustomers}</div>
                <div style={{ fontSize: '0.55rem', color: '#94A3B8' }}>{formData.statCustomersLabel}</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#38BDF8', fontSize: '0.85rem' }}>{formData.statCities}</div>
                <div style={{ fontSize: '0.55rem', color: '#94A3B8' }}>{formData.statCitiesLabel}</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#38BDF8', fontSize: '0.85rem' }}>{formData.statDuration}</div>
                <div style={{ fontSize: '0.55rem', color: '#94A3B8' }}>{formData.statDurationLabel}</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#38BDF8', fontSize: '0.85rem' }}>{formData.statPrice}</div>
                <div style={{ fontSize: '0.55rem', color: '#94A3B8' }}>{formData.statPriceLabel}</div>
              </div>
            </div>

            {/* Why Us Mock */}
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#0F172A' }}>{formData.whyTitle}</div>
              <div style={{ fontSize: '0.62rem', color: '#64748B', marginBottom: '0.5rem' }}>{formData.whySubtitle}</div>
              <div style={{ background: '#EFF6FF', padding: '0.4rem', borderRadius: '6px', fontSize: '0.62rem' }}>
                <strong>{formData.whyCard1Title}</strong>
                <p style={{ margin: '0.15rem 0 0', color: '#475569' }}>{formData.whyCard1Text}</p>
              </div>
            </div>

            {/* Franchise / Partner Mock */}
            <div style={{ background: '#0F172A', color: 'white', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8' }}>{formData.partnerTitle}</div>
              <div style={{ display: 'grid', gridTemplateColumns: (formData.franchisePlans || []).length > 2 ? 'repeat(auto-fit, minmax(90px, 1fr))' : '1fr 1fr', gap: '0.4rem', marginTop: '0.4rem' }}>
                {(formData.franchisePlans || []).map((p, pI) => (
                  <div key={p.id || pI} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.4rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.62rem', color: '#38BDF8', fontWeight: 800 }}>{p.badge || 'FRANCHISE'}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                    <div style={{ color: '#FACC15', fontWeight: 800, fontSize: '0.78rem' }}>{p.price}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo Banner Mock */}
            <div style={{ background: 'linear-gradient(90deg, #0284C7, #0369A1)', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>{formData.promoTitle}</span>
              <span style={{ background: '#06B6D4', padding: '0.2rem 0.5rem', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 800 }}>
                {formData.promoText}
              </span>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default CmsSettings;
