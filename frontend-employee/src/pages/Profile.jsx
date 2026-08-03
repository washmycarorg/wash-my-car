import React, { useState, useEffect } from 'react';
import { updateProfile, getServiceAreas, getInventory } from '../api';
import { MapPin, User as UserIcon, Shield, CreditCard, FileText, Droplet, Wrench, Package } from 'lucide-react';

const Profile = ({ profile, setProfile }) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    photo: '',
    aadhaarNumber: '',
    address: '',
    idProofFile: ''
  });
  const [areas, setAreas] = useState([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getServiceAreas()
      .then(setAreas)
      .catch(err => console.error(err));

    getInventory()
      .then(setInventory)
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        photo: profile.photo || '',
        aadhaarNumber: profile.aadhaarNumber || '',
        address: profile.address || '',
        idProofFile: profile.idProofFile || ''
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

  const handleIdProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, idProofFile: reader.result }));
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

  // Helper to determine format of base64 document
  const isPdf = formData.idProofFile && formData.idProofFile.startsWith('data:application/pdf');

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
                Upload Profile Photo
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </label>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG. Max 2MB.</p>
            </div>
          </div>

          {/* Core Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                disabled
                style={{ background: '#F1F5F9', cursor: 'not-allowed' }}
              />
            </div>
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

          {/* Verification credentials */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.95rem' }}>
              <Shield size={16} /> ID & Verification Details
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Aadhaar Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.aadhaarNumber}
                  onChange={e => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Residential Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Update ID Proof (PDF/Image)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', background: '#F1F5F9', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                  Choose Document File
                  <input type="file" accept="image/*,application/pdf" onChange={handleIdProofChange} style={{ display: 'none' }} />
                </label>
                {formData.idProofFile && (
                  <div>
                    {isPdf ? (
                      <a 
                        href={formData.idProofFile} 
                        download="id-proof.pdf"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--primary-blue)', fontWeight: 600 }}
                      >
                        <FileText size={16} /> Download current PDF Proof
                      </a>
                    ) : (
                      <a 
                        href={formData.idProofFile} 
                        download="id-proof.png"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--primary-blue)', fontWeight: 600 }}
                      >
                        <img src={formData.idProofFile} alt="ID proof" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #CBD5E1' }} />
                        Download current Image Proof
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
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

          {/* Allocated Inventory */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>
              <Package size={16} /> My Allocated Stock & Tools
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {inventory.map(alloc => {
                const maxWashes = alloc.quantity * alloc.inventoryItem.washesPerUnit;
                const remainingWashes = Math.max(0, maxWashes - alloc.washesUsed);
                const isDepleted = alloc.washesUsed >= maxWashes;
                
                return (
                  <div key={alloc.id} style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {alloc.inventoryItem.type === 'CHEMICAL' ? <Droplet size={16} color="#10B981" /> : alloc.inventoryItem.type === 'EQUIPMENT' ? <Wrench size={16} color="#3B82F6" /> : <Package size={16} color="#64748B" />}
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{alloc.inventoryItem.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Qty: {alloc.quantity} • Washes done: {alloc.washesUsed}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isDepleted ? '#EF4444' : '#10B981' }}>
                        {isDepleted ? 'Depleted' : `${remainingWashes.toFixed(0)} wash(es) left`}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Est. Remaining</div>
                    </div>
                  </div>
                );
              })}
              {inventory.length === 0 && (
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem', textAlign: 'left' }}>No inventory allocated to you yet.</p>
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
