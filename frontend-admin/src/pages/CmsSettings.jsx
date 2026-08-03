import React, { useState, useEffect } from 'react';
import { getCmsSettings, updateCmsSettings } from '../api';
import { Layout, Image, Phone, Mail, MapPin, Tag, Globe, Sparkles } from 'lucide-react';

const CmsSettings = () => {
  const [formData, setFormData] = useState({
    heroTitle: '',
    heroSubtitle: '',
    heroImage: '',
    aboutTitle: '',
    aboutText: '',
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
    promoTitle: '',
    promoText: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCmsSettings()
      .then(res => {
        setFormData(res);
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCmsSettings(formData);
      alert('Homepage CMS updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save homepage configurations: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading CMS Editor...</div>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      
      {/* CMS Form editor */}
      <div className="xl:col-span-3">
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-navy)', marginBottom: '1.5rem' }}>
            <Globe size={22} color="var(--primary-blue)" /> Homepage Content Management (CMS)
          </h3>
          
          <form className="flex-col gap-5" onSubmit={handleSave} style={{ display: 'flex' }}>
            
            {/* HERO SECTION */}
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                <Sparkles size={16} /> Hero Section Banner
              </h4>
              <div className="flex-col gap-3" style={{ display: 'flex' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hero Banner Title</label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    value={formData.heroTitle}
                    onChange={e => setFormData({ ...formData, heroTitle: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hero Sub-title</label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    value={formData.heroSubtitle}
                    onChange={e => setFormData({ ...formData, heroSubtitle: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hero Cover Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', background: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #CBD5E1', boxShadow: 'var(--shadow-sm)' }}>
                      Choose Hero Photo
                      <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    </label>
                    {formData.heroImage && (
                      <img 
                        src={formData.heroImage} 
                        alt="Hero Preview" 
                        style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #E2E8F0' }} 
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ABOUT US SECTION */}
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                <Layout size={16} /> Detailing & Services Info
              </h4>
              <div className="flex-col gap-3" style={{ display: 'flex' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Introductory Section Title</label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    value={formData.aboutTitle}
                    onChange={e => setFormData({ ...formData, aboutTitle: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Introductory Section Body Text</label>
                  <textarea 
                    required 
                    className="form-input" 
                    rows={3}
                    value={formData.aboutText}
                    onChange={e => setFormData({ ...formData, aboutText: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* CONTACT DETAILS SECTION */}
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                <Phone size={16} /> Contact Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Help Desk Phone</label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    value={formData.contactPhone}
                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Help Desk Email</label>
                  <input 
                    required 
                    type="email" 
                    className="form-input" 
                    value={formData.contactEmail}
                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group" style={{ margin: '1rem 0 0 0' }}>
                <label className="form-label">Headquarters Address</label>
                <input 
                  required 
                  type="text" 
                  className="form-input" 
                  value={formData.contactAddress}
                  onChange={e => setFormData({ ...formData, contactAddress: e.target.value })}
                />
              </div>
            </div>

            {/* PROMOTIONAL BANNER */}
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                <Tag size={16} /> Promotional Offer Banner
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Promo Title Text</label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    value={formData.promoTitle}
                    onChange={e => setFormData({ ...formData, promoTitle: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Button Action Text</label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    value={formData.promoText}
                    onChange={e => setFormData({ ...formData, promoText: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={saving}
              style={{ padding: '0.85rem 1.5rem', fontWeight: 'bold', fontSize: '1rem', marginTop: '0.5rem' }}
            >
              {saving ? 'Publishing Changes...' : 'Save & Publish Homepage Content'}
            </button>

          </form>
        </div>
      </div>

      {/* Live Homepage preview mockup */}
      <div className="xl:col-span-2">
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: '2rem' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', background: 'var(--bg-glass)' }}>
            <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '0.95rem', fontWeight: 700 }}>Live Homepage Mock-up</h4>
          </div>
          
          <div style={{ background: '#F1F5F9', padding: '1rem', minHeight: '500px' }}>
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', fontFamily: 'sans-serif' }}>
              
              {/* Header bar mock */}
              <div style={{ background: 'linear-gradient(90deg, #0d2650, #1565c0)', color: 'white', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>WASH MY CAR</span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Book Now</span>
              </div>

              {/* Cover Banner Image mock */}
              <div style={{ 
                height: '140px', 
                background: `linear-gradient(135deg, rgba(13,38,80,0.7), rgba(21,101,192,0.5)), url(${formData.heroImage || '/images/hero_wash.png'}) center/cover no-repeat`, 
                padding: '1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                color: 'white',
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                  {formData.heroTitle || 'Professional Car Wash'}
                </div>
                <div style={{ fontSize: '0.6rem', marginTop: '0.25rem', color: 'rgba(255,255,255,0.9)', textShadow: '1px 1px 2px rgba(0,0,0,0.6)', maxWidth: '80%' }}>
                  {formData.heroSubtitle}
                </div>
              </div>

              {/* Service list section placeholder mock */}
              <div style={{ padding: '0.75rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#0d2650' }}>Our Doorstep Detailing Services</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', marginTop: '0.5rem' }}>
                  <div style={{ background: '#F8FAFC', padding: '0.4rem', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '0.55rem' }}>Basic Wash</div>
                  <div style={{ background: '#F8FAFC', padding: '0.4rem', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '0.55rem' }}>Premium Wash</div>
                  <div style={{ background: '#F8FAFC', padding: '0.4rem', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '0.55rem' }}>Full Detailing</div>
                </div>
              </div>

              {/* Promotion Banner mock */}
              <div style={{ background: 'linear-gradient(90deg, #1565c0, #0d2650)', color: 'white', padding: '0.6rem', fontSize: '0.7rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{formData.promoTitle}</span>
                <span style={{ background: 'var(--accent-teal)', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '3px', fontSize: '0.55rem', fontWeight: 'bold' }}>
                  {formData.promoText}
                </span>
              </div>

              {/* Info text section mock */}
              <div style={{ padding: '0.75rem', textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#0d2650', marginBottom: '0.25rem' }}>
                  {formData.aboutTitle}
                </div>
                <div style={{ fontSize: '0.6rem', color: '#64748B', lineHeight: 1.3 }}>
                  {formData.aboutText}
                </div>
              </div>

              {/* Contact section mock */}
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', fontSize: '0.6rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                  <Phone size={10} color="#1565c0" /> <span>{formData.contactPhone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                  <Mail size={10} color="#1565c0" /> <span>{formData.contactEmail}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={10} color="#1565c0" /> <span>{formData.contactAddress}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CmsSettings;
