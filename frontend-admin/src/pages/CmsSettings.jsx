import React, { useState, useEffect } from 'react';
import { getCmsSettings, updateCmsSettings } from '../api';
import { 
  Layout, Image, Phone, Mail, MapPin, Tag, Globe, Sparkles, 
  HelpCircle, BarChart3, Briefcase, Plus, Trash2, Check, ArrowRight, MessageSquare
} from 'lucide-react';

const CmsSettings = () => {
  const [formData, setFormData] = useState({
    heroKicker: 'WASH MY CAR • DOORSTEP CAR WASH',
    heroTitle: 'WE WASH.\nYOU RELAX.',
    heroSubtitle: 'Premium vehicle spa and car detailing at your doorstep. Save time, skip the queue, and let trained professionals care for your car.',
    heroImage: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=2200&q=95',
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
    whySubtitle: 'Convenience-first automotive detailing with professional equipment and RO water efficiency.',
    whyCard1Title: 'YOUR CAR STAYS. WE COME TO YOU.',
    whyCard1Text: 'No queues. No driving to wash centres. Our technicians arrive at your home or office with high-pressure machines and RO water.',
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
      { q: 'Where is Wash My Car currently available?', a: 'We are actively serving Visakhapatnam and surrounding neighborhoods, with expansion across Andhra Pradesh and Telangana.' }
    ]
  });

  const [activeSection, setActiveSection] = useState('hero'); // 'hero', 'quickbar', 'why', 'stats', 'franchise', 'faqs', 'contact', 'promo'
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
          setFormData(prev => ({
            ...prev,
            ...res,
            faqs: Array.isArray(faqsParsed) && faqsParsed.length > 0 ? faqsParsed : prev.faqs
          }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, heroImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCmsSettings(formData);
      alert('Homepage CMS updated & published successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save homepage configurations: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading CMS Editor...</div>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in">
      
      {/* CMS Form Editor (Left Columns) */}
      <div className="xl:col-span-7 flex flex-col gap-5">
        <div className="card" style={{ padding: '1.75rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-navy)' }}>
              <Globe size={22} color="var(--primary-blue)" /> Homepage CMS Manager
            </h3>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem', fontWeight: 700 }}
            >
              {saving ? 'Publishing...' : 'Save & Publish'}
            </button>
          </div>

          {/* Section Selector Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {[
              { id: 'hero', label: 'Hero Banner', icon: Sparkles },
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
                    gap: '0.35rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: isActive ? '1.5px solid var(--primary-blue)' : '1px solid #CBD5E1',
                    background: isActive ? '#EFF6FF' : 'white',
                    color: isActive ? 'var(--primary-blue)' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* 1. HERO BANNER */}
            {activeSection === 'hero' && (
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '0.95rem', fontWeight: 700 }}>
                  ✨ Hero Banner Content
                </h4>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hero Kicker Tagline</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.heroKicker}
                    onChange={e => setFormData({ ...formData, heroKicker: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hero Title (Use \n or line breaks)</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={formData.heroTitle}
                    onChange={e => setFormData({ ...formData, heroTitle: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hero Subtitle Paragraph</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    value={formData.heroSubtitle}
                    onChange={e => setFormData({ ...formData, heroSubtitle: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Primary CTA Button</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.heroCtaPrimary}
                      onChange={e => setFormData({ ...formData, heroCtaPrimary: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Secondary CTA Button</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.heroCtaSecondary}
                      onChange={e => setFormData({ ...formData, heroCtaSecondary: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Floating Water Efficiency Badge</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.heroBadgeText}
                    onChange={e => setFormData({ ...formData, heroBadgeText: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hero Background Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', background: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                      Choose Hero Photo
                      <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    </label>
                    {formData.heroImage && (
                      <img 
                        src={formData.heroImage} 
                        alt="Hero Preview" 
                        style={{ width: '90px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }} 
                      />
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Or enter image URL" 
                    className="form-input" 
                    style={{ marginTop: '0.5rem' }}
                    value={formData.heroImage} 
                    onChange={e => setFormData({ ...formData, heroImage: e.target.value })} 
                  />
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
                  🛡️ The Wash My Car Difference (Why Choose Us)
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px dashed #CBD5E1', paddingTop: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-navy)' }}>Doorstep Franchise Format</span>
                    <input
                      type="text"
                      className="form-input"
                      style={{ marginTop: '0.25rem' }}
                      value={formData.doorstepPlanTitle}
                      onChange={e => setFormData({ ...formData, doorstepPlanTitle: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ marginTop: '0.35rem' }}
                      placeholder="e.g. ₹1.8 LAKH"
                      value={formData.doorstepPlanPrice}
                      onChange={e => setFormData({ ...formData, doorstepPlanPrice: e.target.value })}
                    />
                    <textarea
                      rows={2}
                      className="form-input"
                      style={{ marginTop: '0.35rem' }}
                      placeholder="Comma separated perks"
                      value={formData.doorstepPlanPerks}
                      onChange={e => setFormData({ ...formData, doorstepPlanPerks: e.target.value })}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-navy)' }}>Fixed Outlet Format</span>
                    <input
                      type="text"
                      className="form-input"
                      style={{ marginTop: '0.25rem' }}
                      value={formData.outletPlanTitle}
                      onChange={e => setFormData({ ...formData, outletPlanTitle: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ marginTop: '0.35rem' }}
                      placeholder="e.g. ₹3.5 LAKH"
                      value={formData.outletPlanPrice}
                      onChange={e => setFormData({ ...formData, outletPlanPrice: e.target.value })}
                    />
                    <textarea
                      rows={2}
                      className="form-input"
                      style={{ marginTop: '0.35rem' }}
                      placeholder="Comma separated perks"
                      value={formData.outletPlanPerks}
                      onChange={e => setFormData({ ...formData, outletPlanPerks: e.target.value })}
                    />
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
              <Sparkles size={14} color="#38BDF8" /> Live Homepage Preview
            </span>
            <span style={{ fontSize: '0.7rem', background: '#0EA5E9', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
              Real-Time
            </span>
          </div>

          <div style={{ background: '#F8FAFC', padding: '0.75rem', maxHeight: '82vh', overflowY: 'auto', fontSize: '0.8rem' }}>
            
            {/* Header Mock */}
            <div style={{ background: '#0F172A', color: 'white', padding: '0.6rem 0.85rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.75rem', color: '#38BDF8' }}>WASH MY CAR</span>
              <span style={{ background: '#0EA5E9', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700 }}>Book Doorstep</span>
            </div>

            {/* Hero Mock */}
            <div style={{
              borderRadius: '12px',
              padding: '1.25rem 1rem',
              background: `linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.85)), url(${formData.heroImage}) center/cover no-repeat`,
              color: 'white',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px' }}>
                {formData.heroKicker}
              </span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0.35rem 0', whiteSpace: 'pre-line', lineHeight: 1.15 }}>
                {formData.heroTitle}
              </h2>
              <p style={{ fontSize: '0.68rem', color: '#CBD5E1', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                {formData.heroSubtitle}
              </p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#0EA5E9', color: 'white', padding: '0.3rem 0.7rem', borderRadius: '15px', fontSize: '0.65rem', fontWeight: 700 }}>
                  {formData.heroCtaPrimary} →
                </span>
                <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.3rem 0.6rem', borderRadius: '15px', fontSize: '0.65rem', fontWeight: 600 }}>
                  {formData.heroCtaSecondary}
                </span>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.4rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.4rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700 }}>{formData.doorstepPlanTitle}</div>
                  <div style={{ color: '#FACC15', fontWeight: 800, fontSize: '0.8rem' }}>{formData.doorstepPlanPrice}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.4rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700 }}>{formData.outletPlanTitle}</div>
                  <div style={{ color: '#FACC15', fontWeight: 800, fontSize: '0.8rem' }}>{formData.outletPlanPrice}</div>
                </div>
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
