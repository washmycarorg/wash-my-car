import React, { useState, useEffect } from 'react';
import { updateProfile, getServiceAreas } from '../api';
import { MapPin, User as UserIcon } from 'lucide-react';

const Profile = ({ profile, setProfile }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', photo: '' });
  const [areas, setAreas] = useState([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getServiceAreas()
      .then(setAreas)
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        photo: profile.photo || ''
      });
      setSelectedAreaIds((profile.serviceAreas || []).map(a => a.id));
    }
  }, [profile]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAreaToggle = (id) => {
    setSelectedAreaIds(prev => 
      prev.includes(id) ? prev.filter(areaId => areaId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) return alert('Name and Phone are required.');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        serviceAreaIds: selectedAreaIds
      };
      const updated = await updateProfile(payload);
      setProfile(updated);
      alert('Profile updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserIcon size={20} color="var(--primary-blue)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)' }}>Employee Profile</h3>
        </div>
        
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Avatar Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              {formData.photo ? (
                <img 
                  src={formData.photo} 
                  alt="Avatar" 
                  style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-blue)' }} 
                />
              ) : (
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: '#64748B' }}>
                  {(formData.name[0] || 'E').toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-blue)', cursor: 'pointer', background: '#F0F9FF', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px dashed var(--primary-blue)' }}>
                Upload Profile/ID Image
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </label>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG. Max 2MB.</p>
            </div>
          </div>

          {/* Core Info */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone Number</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Service Areas */}
          <div style={{ marginTop: '0.5rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.75rem' }}>
              <MapPin size={16} /> Choose Serviced Regions
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              {areas.map(area => {
                const checked = selectedAreaIds.includes(area.id);
                return (
                  <label key={area.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>
                    <input 
                      type="checkbox" 
                      checked={checked}
                      onChange={() => handleAreaToggle(area.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    {area.name}
                  </label>
                );
              })}
              {areas.length === 0 && (
                <p style={{ color: 'var(--text-muted)', gridColumn: 'span 2', margin: 0, fontSize: '0.85rem' }}>No service areas configured by admin.</p>
              )}
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem', 
              background: 'var(--primary-blue)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '0.5rem',
              alignSelf: 'flex-start'
            }}
          >
            {loading ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
