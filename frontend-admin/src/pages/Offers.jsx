import React, { useState, useEffect } from 'react';
import { getOffers, createOffer, updateOffer, deleteOffer, getUsers, getCarTypes, getWashTypes, getAddons } from '../api';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [users, setUsers] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [washTypes, setWashTypes] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = {
    code: '',
    title: '',
    description: '',
    discountType: 'PERCENTAGE', // PERCENTAGE or FLAT
    discountPct: '',
    discountAmount: '',
    limitOption: 'UNLIMITED', // UNLIMITED or UP_TO
    maxDiscountAmount: '',
    applicableCarTypeIds: [], // array of ids
    applicableWashTypeIds: [], // array of ids
    addonPerkType: 'NONE', // 'NONE', 'FREE', 'DISCOUNT'
    freeAddonId: '',
    discountAddonId: '',
    addonDiscountType: 'PERCENTAGE',
    addonDiscountValue: '',
    validUntil: '',
    userType: 'ALL',
    usageLimit: 0,
    rotation: 'UNLIMITED',
    eligibleUserIds: [],
    active: true
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    try {
      const [offersRes, usersRes, ctRes, wtRes, addonsRes] = await Promise.all([
        getOffers(),
        getUsers(),
        getCarTypes().catch(() => []),
        getWashTypes().catch(() => []),
        getAddons().catch(() => [])
      ]);
      setOffers(offersRes);
      setUsers(usersRes);
      setCarTypes(ctRes);
      setWashTypes(wtRes);
      setAddons(addonsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.discountType === 'NONE' && formData.addonPerkType === 'NONE') {
        alert('Please select either a Free or Discounted Add-on perk, or choose a car wash discount type.');
        return;
      }

      const payload = {
        ...formData,
        discountType: formData.discountType,
        discountPct: formData.discountType === 'PERCENTAGE' ? Number(formData.discountPct || 0) : 0,
        discountAmount: formData.discountType === 'FLAT' ? Number(formData.discountAmount || 0) : 0,
        maxDiscountAmount: (formData.discountType === 'PERCENTAGE' && formData.limitOption === 'UP_TO') ? Number(formData.maxDiscountAmount || 0) : null,
        applicableCarTypeIds: formData.applicableCarTypeIds.join(','),
        applicableWashTypeIds: formData.applicableWashTypeIds.join(','),
        freeAddonId: formData.addonPerkType === 'FREE' && formData.freeAddonId ? Number(formData.freeAddonId) : null,
        discountAddonId: formData.addonPerkType === 'DISCOUNT' && formData.discountAddonId ? Number(formData.discountAddonId) : null,
        addonDiscountType: formData.addonPerkType === 'DISCOUNT' ? formData.addonDiscountType : null,
        addonDiscountValue: formData.addonPerkType === 'DISCOUNT' && formData.addonDiscountValue ? Number(formData.addonDiscountValue) : null,
        usageLimit: formData.rotation === 'UNLIMITED' ? 0 : Number(formData.usageLimit),
        eligibleUserIds: formData.userType === 'SELECTED' ? formData.eligibleUserIds.map(Number) : []
      };

      if (editingId) {
        await updateOffer(editingId, payload);
        alert('Offer updated successfully!');
      } else {
        await createOffer(payload);
        alert('New offer created successfully!');
      }

      setFormData(initialFormState);
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving offer: ' + err.message);
    }
  };

  const handleEdit = (offer) => {
    setEditingId(offer.id);
    let perkType = 'NONE';
    if (offer.freeAddonId) perkType = 'FREE';
    else if (offer.discountAddonId) perkType = 'DISCOUNT';

    setFormData({
      code: offer.code,
      title: offer.title,
      description: offer.description,
      discountType: offer.discountType || 'PERCENTAGE',
      discountPct: offer.discountPct || '',
      discountAmount: offer.discountAmount || '',
      limitOption: offer.limitOption || 'UNLIMITED',
      maxDiscountAmount: offer.maxDiscountAmount || '',
      applicableCarTypeIds: offer.applicableCarTypeIds ? offer.applicableCarTypeIds.split(',').filter(Boolean).map(Number) : [],
      applicableWashTypeIds: offer.applicableWashTypeIds ? offer.applicableWashTypeIds.split(',').filter(Boolean).map(Number) : [],
      addonPerkType: perkType,
      freeAddonId: offer.freeAddonId ? String(offer.freeAddonId) : '',
      discountAddonId: offer.discountAddonId ? String(offer.discountAddonId) : '',
      addonDiscountType: offer.addonDiscountType || 'PERCENTAGE',
      addonDiscountValue: offer.addonDiscountValue !== null && offer.addonDiscountValue !== undefined ? String(offer.addonDiscountValue) : '',
      validUntil: offer.validUntil.split('T')[0],
      userType: offer.userType,
      usageLimit: offer.usageLimit,
      rotation: offer.rotation,
      eligibleUserIds: offer.eligibleUsers ? offer.eligibleUsers.map(u => u.id) : [],
      active: offer.active
    });
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await updateOffer(id, { active: !currentStatus });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer? Deleted coupons cannot be redeemed by users.")) return;
    try {
      await deleteOffer(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleUserSelection = (userId) => {
    const isSelected = formData.eligibleUserIds.includes(userId);
    const updatedUserIds = isSelected
      ? formData.eligibleUserIds.filter(id => id !== userId)
      : [...formData.eligibleUserIds, userId];
    setFormData({ ...formData, eligibleUserIds: updatedUserIds });
  };

  const getApplicableCarTypesStr = (idsStr) => {
    if (!idsStr) return 'All Car Types';
    const ids = idsStr.split(',').filter(Boolean).map(Number);
    if (ids.length === 0) return 'All Car Types';
    const names = ids.map(id => carTypes.find(c => c.id === id)?.name).filter(Boolean);
    return names.join(', ');
  };

  const getApplicableWashTypesStr = (idsStr) => {
    if (!idsStr) return 'All Wash Types';
    const ids = idsStr.split(',').filter(Boolean).map(Number);
    if (ids.length === 0) return 'All Wash Types';
    const names = ids.map(id => washTypes.find(w => w.id === id)?.name).filter(Boolean);
    return names.join(', ');
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Offers...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Creation/Editing Form Card */}
      <div className="lg:col-span-1">
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary-navy)' }}>
            {editingId ? 'Edit Offer & Rules' : 'Create New Offer'}
          </h3>
          <form className="flex-col gap-4" onSubmit={handleSubmit} style={{ display: 'flex' }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Coupon Code (e.g. WELCOME50)</label>
              <input 
                required 
                type="text" 
                className="form-input" 
                value={formData.code} 
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })} 
                placeholder="SAVE20" 
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Title</label>
              <input 
                required 
                type="text" 
                className="form-input" 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                placeholder="e.g. Monsoon Special" 
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Description</label>
              <textarea 
                required 
                className="form-input" 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Terms and details..." 
                rows={2} 
              />
            </div>

            {/* Discount Type Selector */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Discount Type</label>
              <select
                className="form-input"
                value={formData.discountType}
                onChange={e => setFormData({ 
                  ...formData, 
                  discountType: e.target.value,
                  discountPct: e.target.value === 'PERCENTAGE' ? formData.discountPct : '',
                  discountAmount: e.target.value === 'FLAT' ? formData.discountAmount : '',
                  addonPerkType: e.target.value === 'NONE' && formData.addonPerkType === 'NONE' ? 'FREE' : formData.addonPerkType,
                  freeAddonId: e.target.value === 'NONE' && !formData.freeAddonId ? (addons[0]?.id ? String(addons[0].id) : '') : formData.freeAddonId
                })}
              >
                <option value="PERCENTAGE">Percentage Wash Discount (%)</option>
                <option value="FLAT">Flat Wash Discount Amount (₹)</option>
                <option value="NONE">🎁 Free / Discounted Add-On Only (No Wash Discount)</option>
              </select>
            </div>

            {/* Discount Settings Inputs */}
            {formData.discountType === 'PERCENTAGE' ? (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Discount Percentage (%)</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    max="100" 
                    className="form-input" 
                    value={formData.discountPct} 
                    onChange={e => setFormData({ ...formData, discountPct: e.target.value })} 
                    placeholder="e.g. 20" 
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Discount Upper Limit</label>
                  <select
                    className="form-input"
                    value={formData.limitOption}
                    onChange={e => setFormData({ 
                      ...formData, 
                      limitOption: e.target.value,
                      maxDiscountAmount: e.target.value === 'UNLIMITED' ? '' : formData.maxDiscountAmount
                    })}
                  >
                    <option value="UNLIMITED">Unlimited Discount</option>
                    <option value="UP_TO">Up to Amount (₹ Cap)</option>
                  </select>
                </div>

                {formData.limitOption === 'UP_TO' && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Max Discount Cap Amount (₹)</label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      className="form-input" 
                      value={formData.maxDiscountAmount} 
                      onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value })} 
                      placeholder="e.g. 150" 
                    />
                  </div>
                )}
              </>
            ) : formData.discountType === 'FLAT' ? (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Flat Discount Amount (₹)</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  className="form-input" 
                  value={formData.discountAmount} 
                  onChange={e => setFormData({ ...formData, discountAmount: e.target.value })} 
                  placeholder="e.g. 100" 
                />
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(99, 102, 241, 0.08))',
                border: '1.5px dashed #0284C7',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🎁 Free or Discounted Add-on Perk (Full Price Wash)</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.45 }}>
                  The customer pays regular standard price for their car wash booking, but receives your chosen Free or Discounted Add-on perk (e.g., Free Bike Wash, Helmet Wash, etc.) with the booking!
                </p>
              </div>
            )}

            {/* Applicable Category Restrictions */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Limit to Specific Car Types</label>
              <div style={{
                maxHeight: '110px',
                overflowY: 'auto',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                background: '#F8FAFC',
                marginTop: '0.25rem'
              }}>
                {carTypes.map(c => {
                  const isChecked = formData.applicableCarTypeIds.includes(c.id);
                  return (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => {
                          const updated = isChecked
                            ? formData.applicableCarTypeIds.filter(id => id !== c.id)
                            : [...formData.applicableCarTypeIds, c.id];
                          setFormData({ ...formData, applicableCarTypeIds: updated });
                        }} 
                      />
                      <span>{c.name}</span>
                    </label>
                  );
                })}
                {carTypes.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No car types found</span>}
              </div>
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem', fontSize: '0.75rem' }}>Leave unchecked for no constraints.</small>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Limit to Specific Wash Types</label>
              <div style={{
                maxHeight: '110px',
                overflowY: 'auto',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                background: '#F8FAFC',
                marginTop: '0.25rem'
              }}>
                {washTypes.map(w => {
                  const isChecked = formData.applicableWashTypeIds.includes(w.id);
                  return (
                    <label key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => {
                          const updated = isChecked
                            ? formData.applicableWashTypeIds.filter(id => id !== w.id)
                            : [...formData.applicableWashTypeIds, w.id];
                          setFormData({ ...formData, applicableWashTypeIds: updated });
                        }} 
                      />
                      <span>{w.name}</span>
                    </label>
                  );
                })}
                {washTypes.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No wash types found</span>}
              </div>
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem', fontSize: '0.75rem' }}>Leave unchecked for no constraints (applies to any wash package).</small>
            </div>

            {/* Add-on Perks (Free or Discounted Add-on) */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
                  🎁 Add-on Service Perk / Bundle (Optional)
                </label>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Configure free or discounted add-on service with any attached car wash package.
                </p>
              </div>

              <select
                className="form-input"
                style={{ margin: 0 }}
                value={formData.addonPerkType}
                onChange={e => setFormData({
                  ...formData,
                  addonPerkType: e.target.value,
                  freeAddonId: e.target.value === 'FREE' ? (addons[0]?.id ? String(addons[0].id) : '') : '',
                  discountAddonId: e.target.value === 'DISCOUNT' ? (addons[0]?.id ? String(addons[0].id) : '') : ''
                })}
              >
                <option value="NONE">No Add-on Perk (Standard Wash Discount Only)</option>
                <option value="FREE">Give a 100% FREE Add-on</option>
                <option value="DISCOUNT">Give a Decreased / Discounted Price on Add-on</option>
              </select>

              {formData.addonPerkType === 'FREE' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Select Free Add-on</label>
                  <select
                    className="form-input"
                    value={formData.freeAddonId}
                    onChange={e => setFormData({ ...formData, freeAddonId: e.target.value })}
                  >
                    <option value="">-- Choose Add-on --</option>
                    {addons.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Normal: ₹{a.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.addonPerkType === 'DISCOUNT' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Select Add-on to Discount</label>
                    <select
                      className="form-input"
                      value={formData.discountAddonId}
                      onChange={e => setFormData({ ...formData, discountAddonId: e.target.value })}
                    >
                      <option value="">-- Choose Add-on --</option>
                      {addons.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} (Normal: ₹{a.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Discount Type</label>
                      <select
                        className="form-input"
                        value={formData.addonDiscountType}
                        onChange={e => setFormData({ ...formData, addonDiscountType: e.target.value })}
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FLAT">Flat Off (₹)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">
                        {formData.addonDiscountType === 'PERCENTAGE' ? 'Discount %' : 'Flat Off (₹)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="e.g. 50"
                        value={formData.addonDiscountValue}
                        onChange={e => setFormData({ ...formData, addonDiscountValue: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Valid Until</label>
              <input 
                required 
                type="date" 
                className="form-input" 
                value={formData.validUntil} 
                onChange={e => setFormData({ ...formData, validUntil: e.target.value })} 
              />
            </div>

            {/* Target Audience Condition */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Target User Group</label>
              <select 
                className="form-input"
                value={formData.userType}
                onChange={e => setFormData({ ...formData, userType: e.target.value, eligibleUserIds: [] })}
              >
                <option value="ALL">All Users</option>
                <option value="NEW">New Users Only (0 completed bookings)</option>
                <option value="SELECTED">Selected Users List</option>
              </select>
            </div>

            {/* Multi-select user list if SELECTED */}
            {formData.userType === 'SELECTED' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Eligible Users ({formData.eligibleUserIds.length} selected)</label>
                <div style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  background: '#F8FAFC',
                  marginTop: '0.25rem'
                }}>
                  {users.map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.eligibleUserIds.includes(u.id)} 
                        onChange={() => toggleUserSelection(u.id)} 
                      />
                      <span>{u.name || 'Unnamed User'} ({u.phone})</span>
                    </label>
                  ))}
                  {users.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No users found</span>}
                </div>
              </div>
            )}

            {/* Usage Rotations & Limits */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Rotation Period</label>
                <select 
                  className="form-input"
                  value={formData.rotation}
                  onChange={e => setFormData({ ...formData, rotation: e.target.value })}
                >
                  <option value="UNLIMITED">No Limits</option>
                  <option value="OVERALL">Overall Limit</option>
                  <option value="MONTHLY">Monthly Limit</option>
                  <option value="YEARLY">Yearly Limit</option>
                </select>
              </div>

              {formData.rotation !== 'UNLIMITED' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Max Uses Count</label>
                  <input 
                    required
                    type="number" 
                    min="1" 
                    className="form-input" 
                    value={formData.usageLimit} 
                    onChange={e => setFormData({ ...formData, usageLimit: e.target.value })} 
                    placeholder="e.g. 1" 
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                {editingId ? 'Save Changes' : 'Create Offer'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1 }} 
                  onClick={() => { setEditingId(null); setFormData(initialFormState); }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {/* Offers Table List */}
      <div className="lg:col-span-2">
        <div className="card p-0" style={{ padding: 0 }}>
          <div className="p-6 border-b border-gray-200">
            <h3 style={{ margin: 0, color: 'var(--primary-navy)' }}>Active & Scheduled Offers</h3>
          </div>
          <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Offer details</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Target audience</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Usage limits</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--primary-navy)' }}>
                      {o.title}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '0.2rem 0' }}>
                      <span className="badge badge-teal" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 'bold' }}>
                        {o.code}
                      </span>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-teal)', fontSize: '0.9rem' }}>
                        {o.discountType === 'FLAT' 
                          ? `₹${o.discountAmount} FLAT OFF` 
                          : o.discountType === 'NONE'
                            ? (o.freeAddonId ? '🎁 FREE ADD-ON INCLUDED' : '⚡ DISCOUNTED ADD-ON')
                            : `${o.discountPct}% OFF${o.limitOption === 'UP_TO' ? ` (Up to ₹${o.maxDiscountAmount})` : ''}`
                        }
                      </span>
                    </div>
                    <div className="text-sm text-muted" style={{ marginBottom: '0.25rem' }}>{o.description}</div>
                    
                    {/* Constraints details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div>🚗 <strong style={{color: 'var(--text-main)'}}>Car types:</strong> {getApplicableCarTypesStr(o.applicableCarTypeIds)}</div>
                      <div>💧 <strong style={{color: 'var(--text-main)'}}>Wash types:</strong> {getApplicableWashTypesStr(o.applicableWashTypeIds)}</div>
                    </div>

                    {/* Add-on perk badge */}
                    {o.freeAddonId && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          🎁 100% Free Add-on Included: {addons.find(a => a.id === o.freeAddonId)?.name || `Add-on #${o.freeAddonId}`}
                        </span>
                      </div>
                    )}
                    {o.discountAddonId && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#EFF6FF', color: '#1E40AF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          ✨ Add-on Discount ({o.addonDiscountType === 'PERCENTAGE' ? `${o.addonDiscountValue}% OFF` : `₹${o.addonDiscountValue} OFF`}): {addons.find(a => a.id === o.discountAddonId)?.name || `Add-on #${o.discountAddonId}`}
                        </span>
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>
                    {o.userType === 'ALL' && <span>All Users</span>}
                    {o.userType === 'NEW' && <span style={{ color: 'var(--primary-blue)', fontWeight: 500 }}>New Users Only</span>}
                    {o.userType === 'SELECTED' && (
                      <div>
                        <span style={{ color: '#805AD5', fontWeight: 600 }}>Targeted List</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ({o.eligibleUsers?.length || 0} users selected)
                        </div>
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>
                    {o.rotation === 'UNLIMITED' ? (
                      <span className="text-muted">Unlimited usage</span>
                    ) : (
                      <div>
                        <strong>{o.usageLimit} uses</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          per {o.rotation === 'OVERALL' ? 'user overall' : o.rotation === 'MONTHLY' ? 'calendar month' : 'calendar year'}
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                      Expires: {new Date(o.validUntil).toLocaleDateString()}
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className={`badge ${o.active ? 'badge-success' : 'badge-danger'}`}>
                      {o.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>

                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div className="flex gap-2" style={{ display: 'flex', gap: '0.4rem' }}>
                      <button 
                        className="btn btn-outline text-xs" 
                        style={{ padding: '0.25rem 0.5rem' }} 
                        onClick={() => handleEdit(o)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-outline text-xs" 
                        style={{ padding: '0.25rem 0.5rem', borderColor: o.active ? 'var(--danger)' : '#10B981', color: o.active ? 'var(--danger)' : '#10B981' }} 
                        onClick={() => handleToggle(o.id, o.active)}
                      >
                        {o.active ? 'Disable' : 'Enable'}
                      </button>
                      <button 
                        className="btn btn-danger text-xs" 
                        style={{ padding: '0.25rem 0.5rem' }} 
                        onClick={() => handleDelete(o.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No offers found. Create one to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Offers;
