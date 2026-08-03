import React, { useState, useEffect } from 'react';
import { getOffers, createOffer, updateOffer, deleteOffer, getUsers, getCarTypes, getWashTypes } from '../api';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [users, setUsers] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [washTypes, setWashTypes] = useState([]);
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
      const [offersRes, usersRes, ctRes, wtRes] = await Promise.all([
        getOffers(),
        getUsers(),
        getCarTypes().catch(() => []),
        getWashTypes().catch(() => [])
      ]);
      setOffers(offersRes);
      setUsers(usersRes);
      setCarTypes(ctRes);
      setWashTypes(wtRes);
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
      const payload = {
        ...formData,
        discountPct: formData.discountType === 'PERCENTAGE' ? Number(formData.discountPct || 0) : 0,
        discountAmount: formData.discountType === 'FLAT' ? Number(formData.discountAmount || 0) : 0,
        maxDiscountAmount: (formData.discountType === 'PERCENTAGE' && formData.limitOption === 'UP_TO') ? Number(formData.maxDiscountAmount || 0) : null,
        applicableCarTypeIds: formData.applicableCarTypeIds.join(','),
        applicableWashTypeIds: formData.applicableWashTypeIds.join(','),
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
                  discountAmount: e.target.value === 'FLAT' ? formData.discountAmount : ''
                })}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
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
            ) : (
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
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem', fontSize: '0.75rem' }}>Leave unchecked for no constraints.</small>
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
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <div className="p-6 border-b border-gray-200">
            <h3 style={{ margin: 0, color: 'var(--primary-navy)' }}>Active & Scheduled Offers</h3>
          </div>
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
  );
};

export default Offers;
