import React, { useState, useEffect } from 'react';
import { Trash2, MapPin, User as UserIcon, Lock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getProfile, updateProfile, getSavedAddresses, deleteSavedAddress } from '../api';

const Profile = () => {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [initialData, setInitialData] = useState({ name: '', email: '', phone: '' });
  const [addresses, setAddresses] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [addrLoading, setAddrLoading] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    getProfile()
      .then(res => {
        const loaded = {
          name: res.name || '',
          email: res.email || '',
          phone: res.phone || ''
        };
        setProfile(loaded);
        setInitialData(loaded);
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

  const isPhoneLocked = Boolean(
    initialData.phone && 
    initialData.phone.replace(/^\+91/, '').replace(/\D/g, '').length >= 10
  );

  const isEmailLocked = Boolean(
    initialData.email && 
    initialData.email.trim().length > 0 && 
    initialData.email.includes('@')
  );

  const handleSaveProfile = async () => {
    if (!profile.name || !profile.name.trim()) {
      return alert('Full Name is required.');
    }
    if (!isPhoneLocked && !profile.phone?.trim()) {
      return alert('Phone Number is required.');
    }
    
    setProfileLoading(true);
    setSaveSuccessMsg('');
    try {
      const payload = {
        name: profile.name.trim(),
        phone: isPhoneLocked ? undefined : profile.phone.trim(),
        email: isEmailLocked ? undefined : (profile.email ? profile.email.trim() : '')
      };

      const updated = await updateProfile(payload);
      if (updated) {
        const nextData = {
          name: updated.name || '',
          email: updated.email || '',
          phone: updated.phone || ''
        };
        setProfile(nextData);
        setInitialData(nextData);
        localStorage.setItem('userInfo', JSON.stringify(updated));
      }
      setSaveSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      alert('Profile updated successfully');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update profile');
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
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserIcon size={20} color="var(--primary-blue)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)' }}>Personal Information</h3>
          </div>
          {(isPhoneLocked || isEmailLocked) && (
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontSize: '0.75rem', 
              color: '#475569', 
              background: '#F1F5F9', 
              padding: '0.25rem 0.6rem', 
              borderRadius: '9999px',
              border: '1px solid #E2E8F0',
              fontWeight: 600
            }}>
              <ShieldCheck size={13} color="var(--primary-blue)" /> Verified Account
            </span>
          )}
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Security Notice */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 0.9rem',
            fontSize: '0.8rem',
            color: '#475569',
            lineHeight: 1.45
          }}>
            <ShieldCheck size={17} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary-blue)' }} />
            <span>
              <strong>Security Policy:</strong> Phone number and email address once updated are permanently bound to your account and cannot be changed.
            </span>
          </div>

          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>

          {/* Phone Number */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 600, color: 'var(--primary-navy)' }}>
                Phone Number
              </label>
              {isPhoneLocked ? (
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.25rem', 
                  fontSize: '0.72rem', 
                  fontWeight: 600, 
                  color: '#64748B', 
                  background: '#F1F5F9', 
                  padding: '0.2rem 0.55rem', 
                  borderRadius: '9999px',
                  border: '1px solid #CBD5E1'
                }}>
                  <Lock size={11} color="#64748B" /> Permanent (Locked)
                </span>
              ) : (
                <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 500 }}>
                  Can be set once
                </span>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                value={profile.phone}
                readOnly={isPhoneLocked}
                disabled={isPhoneLocked}
                onChange={e => !isPhoneLocked && setProfile({ ...profile, phone: e.target.value })}
                placeholder="+91..."
                style={isPhoneLocked ? {
                  background: '#F8FAFC',
                  color: '#475569',
                  borderColor: '#E2E8F0',
                  cursor: 'not-allowed',
                  paddingRight: '2.5rem',
                  fontWeight: 500
                } : {}}
              />
              {isPhoneLocked && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <Lock size={16} color="#94A3B8" />
                </div>
              )}
            </div>
            
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.76rem', color: isPhoneLocked ? '#64748B' : '#D97706', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {isPhoneLocked ? (
                <>🔒 Phone number once updated cannot be changed.</>
              ) : (
                <>⚠️ Phone number once updated and saved cannot be changed.</>
              )}
            </p>
          </div>

          {/* Email Address */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 600, color: 'var(--primary-navy)' }}>
                Email Address
              </label>
              {isEmailLocked ? (
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.25rem', 
                  fontSize: '0.72rem', 
                  fontWeight: 600, 
                  color: '#64748B', 
                  background: '#F1F5F9', 
                  padding: '0.2rem 0.55rem', 
                  borderRadius: '9999px',
                  border: '1px solid #CBD5E1'
                }}>
                  <Lock size={11} color="#64748B" /> Permanent (Locked)
                </span>
              ) : (
                <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 500 }}>
                  Can be set once
                </span>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                className="form-input" 
                value={profile.email}
                readOnly={isEmailLocked}
                disabled={isEmailLocked}
                onChange={e => !isEmailLocked && setProfile({ ...profile, email: e.target.value })}
                placeholder="name@example.com"
                style={isEmailLocked ? {
                  background: '#F8FAFC',
                  color: '#475569',
                  borderColor: '#E2E8F0',
                  cursor: 'not-allowed',
                  paddingRight: '2.5rem',
                  fontWeight: 500
                } : {}}
              />
              {isEmailLocked && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <Lock size={16} color="#94A3B8" />
                </div>
              )}
            </div>

            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.76rem', color: isEmailLocked ? '#64748B' : '#D97706', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {isEmailLocked ? (
                <>🔒 Email address once updated cannot be changed.</>
              ) : (
                <>⚠️ Email address once updated and saved cannot be changed.</>
              )}
            </p>
          </div>

          {saveSuccessMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#065F46',
              background: '#D1FAE5',
              padding: '0.6rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 500
            }}>
              <CheckCircle2 size={16} color="#059669" />
              {saveSuccessMsg}
            </div>
          )}

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
              cursor: profileLoading ? 'wait' : 'pointer',
              marginTop: '0.5rem',
              alignSelf: 'flex-start',
              opacity: profileLoading ? 0.7 : 1,
              transition: 'opacity 0.2s'
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
