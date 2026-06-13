import React, { useState, useEffect } from 'react';
import { updateProfile } from '../api';

const Profile = ({ profile, setProfile }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({ name: profile.name || '', email: profile.email || '', phone: profile.phone || '' });
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(formData);
      setProfile({ ...profile, ...formData });
      alert('Profile updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Profile</h3>
        </div>
        <div style={{padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem'}}>Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{borderColor: '#E2E8F0', color: 'var(--primary-navy)'}}
            />
          </div>

          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem'}}>Phone</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              style={{borderColor: '#E2E8F0', color: 'var(--primary-navy)'}}
            />
          </div>

          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem'}}>Email</label>
            <input 
              type="email" 
              className="form-input" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              style={{borderColor: '#E2E8F0', color: 'var(--primary-navy)'}}
            />
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
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '0.5rem',
              alignSelf: 'flex-start'
            }}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
