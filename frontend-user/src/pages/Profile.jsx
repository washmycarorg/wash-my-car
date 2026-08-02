import React, { useState, useEffect } from 'react';
import { Trash2, MapPin, User as UserIcon } from 'lucide-react';
import { getProfile, updateProfile, getSavedAddresses, deleteSavedAddress } from '../api';

const Profile = () => {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [addresses, setAddresses] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [addrLoading, setAddrLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then(res => {
        setProfile({ name: res.name || '', email: res.email || '', phone: res.phone || '' });
      })
      .catch(err => console.error(err));

    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const addrs = await getSavedAddresses();
      setAddresses(addrs);
    } catch (err) {
      console.error(err);
    } finally {
      setAddrLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile.name || !profile.phone) return alert('Name and phone are required.');
    setProfileLoading(true);
    try {
      await updateProfile(profile);
      alert('Profile updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteSavedAddress(id);
      fetchAddresses();
    } catch (err) {
      console.error(err);
      alert('Failed to delete address');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Profile Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserIcon size={20} color="var(--primary-blue)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)' }}>Personal Information</h3>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone Number</label>
            <input 
              type="text" 
              className="form-input" 
              value={profile.phone}
              onChange={e => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              value={profile.email}
              onChange={e => setProfile({ ...profile, email: e.target.value })}
            />
          </div>

          <button 
            onClick={handleSaveProfile}
            disabled={profileLoading}
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
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Saved Addresses Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={20} color="var(--primary-blue)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)' }}>Saved Addresses</h3>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {addrLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading saved addresses...</p>
          ) : addresses.map(addr => (
            <div 
              key={addr.id} 
              style={{
                padding: '1rem',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'white'
              }}
            >
              <div style={{ flex: 1, paddingRight: '1rem' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary-navy)', fontSize: '0.95rem', fontWeight: 600 }}>
                  {addr.name}
                </h4>
                <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: 1.3 }}>
                  {addr.address}
                </p>
                <span style={{ fontSize: '0.75rem', background: 'var(--accent-teal-light)', color: 'var(--primary-navy)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
                  Region: {addr.serviceArea?.name || 'Local'}
                </span>
              </div>
              <button 
                onClick={() => handleDeleteAddress(addr.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}
                title="Delete Address"
              >
                <Trash2 size={18} color="var(--danger)" />
              </button>
            </div>
          ))}
          {!addrLoading && addresses.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>No saved addresses. Add them during your next booking!</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default Profile;
