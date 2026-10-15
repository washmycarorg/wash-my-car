import React, { useState, useEffect } from 'react';
import { 
  getSubscriptionPlans, 
  createSubscriptionPlan, 
  updateSubscriptionPlan, 
  deleteSubscriptionPlan, 
  getSubscribers,
  getCarTypes,
  getAddons
} from '../api';
import { 
  Crown, Plus, Edit2, Trash2, CheckCircle, XCircle, 
  Users, Shield, Calendar, Sparkles, Tag, Car, Gift, 
  AlertCircle, Check, X, RefreshCw
} from 'lucide-react';

const Subscriptions = () => {
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'subscribers'
  const [plans, setPlans] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [addonsList, setAddonsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedCarFilter, setSelectedCarFilter] = useState('ALL');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    carTypeId: '',
    durationDays: 30,
    durationLabel: '1 Month',
    price: '',
    originalPrice: '',
    washesCount: 4,
    freeAddonsCount: 2,
    freeAddonIds: '',
    badge: 'MOST POPULAR',
    features: [
      '4 Complete Doorstep Foam Washes',
      '2 Free Add-on Services (Bike wash/Sanitization)',
      'Priority Slot Dispatch',
      'Zero Rescheduling Fee'
    ],
    active: true
  });
  const [featureInput, setFeatureInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, subscribersData, carTypesData, addonsData] = await Promise.all([
        getSubscriptionPlans().catch(() => []),
        getSubscribers().catch(() => []),
        getCarTypes().catch(() => []),
        getAddons().catch(() => [])
      ]);

      setPlans(Array.isArray(plansData) ? plansData : []);
      setSubscribers(Array.isArray(subscribersData) ? subscribersData : []);
      setCarTypes(Array.isArray(carTypesData) ? carTypesData : []);
      setAddonsList(Array.isArray(addonsData) ? addonsData : []);
    } catch (err) {
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      carTypeId: carTypes[0]?.id || '',
      durationDays: 30,
      durationLabel: '1 Month',
      price: '',
      originalPrice: '',
      washesCount: 4,
      freeAddonsCount: 2,
      freeAddonIds: '',
      badge: 'MOST POPULAR',
      features: [
        '4 Complete Doorstep Foam Washes',
        '2 Free Add-on Services (Bike wash/Sanitization)',
        'Priority Slot Dispatch',
        'Zero Rescheduling Fee'
      ],
      active: true
    });
    setFeatureInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    let parsedFeatures = [];
    try {
      parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
    } catch (e) {
      parsedFeatures = [plan.features];
    }

    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      carTypeId: plan.carTypeId || '',
      durationDays: plan.durationDays || 30,
      durationLabel: plan.durationLabel || '1 Month',
      price: plan.price || '',
      originalPrice: plan.originalPrice || '',
      washesCount: plan.washesCount || 4,
      freeAddonsCount: plan.freeAddonsCount || 0,
      freeAddonIds: plan.freeAddonIds || '',
      badge: plan.badge || '',
      features: Array.isArray(parsedFeatures) ? parsedFeatures : [],
      active: plan.active !== undefined ? plan.active : true
    });
    setFeatureInput('');
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, featureInput.trim()]
    }));
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.carTypeId || formData.price === '') {
      alert('Please fill in Plan Name, Car Type, and Price');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        carTypeId: Number(formData.carTypeId),
        durationDays: Number(formData.durationDays) || 30,
        durationLabel: formData.durationLabel,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        washesCount: Number(formData.washesCount) || 0,
        freeAddonsCount: Number(formData.freeAddonsCount) || 0,
        freeAddonIds: formData.freeAddonIds,
        badge: formData.badge,
        features: formData.features,
        active: formData.active
      };

      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.id, payload);
        setSuccessMsg('Subscription plan updated successfully!');
      } else {
        await createSubscriptionPlan(payload);
        setSuccessMsg('New subscription plan created successfully!');
      }

      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to save subscription plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteSubscriptionPlan(id);
      setSuccessMsg(`Plan "${name}" deleted.`);
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(err.message || 'Failed to delete plan');
    }
  };

  const handleToggleActive = async (plan) => {
    try {
      await updateSubscriptionPlan(plan.id, { active: !plan.active });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const filteredPlans = plans.filter(p => {
    if (selectedCarFilter === 'ALL') return true;
    return String(p.carTypeId) === String(selectedCarFilter);
  });

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
          }}>
            <Crown size={26} color="#FFFFFF" strokeWidth={2.4} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              VIP Subscriptions & Passes
              <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 700 }}>
                GOLD TIER
              </span>
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94A3B8' }}>
              Configure recurring vehicle passes, car-type tier pricing, included washes, and free doorstep add-ons.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={loadData}
            className="btn btn-outline"
            style={{ color: '#E2E8F0', borderColor: 'rgba(255,255,255,0.2)', padding: '0.5rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            onClick={openCreateModal}
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
            }}
          >
            <Plus size={18} strokeWidth={2.5} /> Add Subscription Plan
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {successMsg && (
        <div style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '0.75rem 1.25rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <Check size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', padding: '0.75rem 1.25rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'plans' ? '3px solid #D97706' : '3px solid transparent',
            color: activeTab === 'plans' ? '#B45309' : '#64748B',
            fontWeight: activeTab === 'plans' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Crown size={18} /> Subscription Plans ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab('subscribers')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'subscribers' ? '3px solid #D97706' : '3px solid transparent',
            color: activeTab === 'subscribers' ? '#B45309' : '#64748B',
            fontWeight: activeTab === 'subscribers' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Users size={18} /> Active Members & Subscribers ({subscribers.length})
        </button>
      </div>

      {/* TAB 1: Subscription Plans */}
      {activeTab === 'plans' && (
        <div>
          {/* Car Type Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginRight: '0.25rem' }}>Vehicle Type:</span>
            <button
              onClick={() => setSelectedCarFilter('ALL')}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: selectedCarFilter === 'ALL' ? '#D97706' : '#CBD5E1',
                background: selectedCarFilter === 'ALL' ? '#FEF3C7' : '#FFFFFF',
                color: selectedCarFilter === 'ALL' ? '#92400E' : '#475569',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              All Vehicles ({plans.length})
            </button>
            {carTypes.map(ct => {
              const count = plans.filter(p => p.carTypeId === ct.id).length;
              return (
                <button
                  key={ct.id}
                  onClick={() => setSelectedCarFilter(ct.id)}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: selectedCarFilter === ct.id ? '#D97706' : '#CBD5E1',
                    background: selectedCarFilter === ct.id ? '#FEF3C7' : '#FFFFFF',
                    color: selectedCarFilter === ct.id ? '#92400E' : '#475569',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {ct.name} ({count})
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 0.5rem' }} />
              Loading subscription plans...
            </div>
          ) : filteredPlans.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
              <Crown size={40} color="#D97706" style={{ margin: '0 auto 0.75rem', opacity: 0.7 }} />
              <h3 style={{ margin: '0 0 0.5rem', color: '#1E293B' }}>No Subscription Plans Found</h3>
              <p style={{ margin: '0 0 1rem', color: '#64748B', fontSize: '0.9rem' }}>
                Create recurring monthly or quarterly vehicle wash passes for your customers.
              </p>
              <button onClick={openCreateModal} className="btn btn-primary" style={{ background: '#D97706', borderColor: '#D97706' }}>
                <Plus size={16} /> Add First Plan
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {filteredPlans.map(plan => {
                let parsedFeatures = [];
                try {
                  parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
                } catch (e) {
                  parsedFeatures = [plan.features];
                }

                return (
                  <div
                    key={plan.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      border: plan.active ? '1.5px solid #FDE68A' : '1px solid #E2E8F0',
                      boxShadow: plan.active ? '0 10px 25px -5px rgba(245, 158, 11, 0.15)' : '0 4px 12px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {/* Top Gold Banner */}
                    <div style={{
                      background: plan.active 
                        ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' 
                        : '#F1F5F9',
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid #F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          background: '#D97706',
                          color: '#FFFFFF',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          letterSpacing: '0.04em'
                        }}>
                          {plan.carType?.name || 'ALL VEHICLES'}
                        </span>
                        {plan.badge && (
                          <span style={{
                            background: '#FFFFFF',
                            color: '#B45309',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            border: '1px solid #FCD34D'
                          }}>
                            ★ {plan.badge}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleToggleActive(plan)}
                          title={plan.active ? 'Click to Deactivate' : 'Click to Activate'}
                          style={{
                            background: plan.active ? '#DCFCE7' : '#FEE2E2',
                            color: plan.active ? '#15803D' : '#B91C1C',
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          {plan.active ? <CheckCircle size={13} /> : <XCircle size={13} />}
                          {plan.active ? 'ACTIVE' : 'PAUSED'}
                        </button>
                      </div>
                    </div>

                    {/* Plan Body */}
                    <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', color: '#1E293B', fontWeight: 800 }}>
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#64748B', lineHeight: 1.4 }}>
                          {plan.description}
                        </p>
                      )}

                      {/* Pricing Tag */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#B45309' }}>
                          ₹{plan.price}
                        </span>
                        {plan.originalPrice && (
                          <span style={{ fontSize: '1rem', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
                            ₹{plan.originalPrice}
                          </span>
                        )}
                        <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                          / {plan.durationLabel || `${plan.durationDays} Days`}
                        </span>
                      </div>

                      {/* Core Perks Matrix */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.6rem',
                        background: '#FFFBEB',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: '1px solid #FEF3C7',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Car size={16} color="#D97706" />
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 600 }}>Washes Included</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#78350F' }}>{plan.washesCount} Washes</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Gift size={16} color="#D97706" />
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 600 }}>Free Add-ons</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#78350F' }}>{plan.freeAddonsCount} Free</div>
                          </div>
                        </div>
                      </div>

                      {/* Features Bullet List */}
                      <div style={{ flex: 1, marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                          Plan Highlights:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {parsedFeatures.map((feat, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.82rem', color: '#334155' }}>
                              <Check size={14} color="#16A34A" style={{ marginTop: '2px', flexShrink: 0 }} />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #F1F5F9'
                      }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                          {plan._count?.userSubscriptions || 0} active subscribers
                        </span>

                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => openEditModal(plan)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0284C7', borderColor: '#BAE6FD' }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id, plan.name)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#DC2626', borderColor: '#FECACA' }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Subscribers List */}
      {activeTab === 'subscribers' && (
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1E293B', fontWeight: 700 }}>
              Active VIP Club Subscribers
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Total: <strong>{subscribers.length}</strong>
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
              Loading subscribers...
            </div>
          ) : subscribers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              <Users size={36} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0 }}>No active subscribers yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>User / Contact</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Vehicle</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Subscription Plan</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Washes Left</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Free Add-ons</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Valid Until</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => {
                    const isExpired = new Date(sub.endDate) < new Date();
                    return (
                      <tr key={sub.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{sub.user?.name || 'Registered Customer'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{sub.user?.phone || 'No Phone'}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: '#E0F2FE', color: '#0369A1', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
                            {sub.carType?.name || 'Standard'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#1E293B' }}>{sub.plan?.name || 'VIP Pass'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 700 }}>₹{sub.price}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontWeight: 800, color: sub.washesRemaining > 0 ? '#15803D' : '#94A3B8' }}>
                            {sub.washesRemaining} / {sub.washesTotal}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontWeight: 800, color: sub.freeAddonsRemaining > 0 ? '#B45309' : '#94A3B8' }}>
                            {sub.freeAddonsRemaining} / {sub.freeAddonsTotal}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: isExpired ? '#DC2626' : '#334155' }}>
                          {new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            background: isExpired ? '#FEE2E2' : '#DCFCE7',
                            color: isExpired ? '#B91C1C' : '#15803D',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {isExpired ? 'EXPIRED' : sub.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Create / Edit Subscription Plan */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '1.25rem',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <Crown size={24} color="#D97706" />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1E293B' }}>
                {editingPlan ? 'Edit Subscription Plan' : 'Create New VIP Pass'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Plan Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hatchback Gold VIP Monthly Pass"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Description / Subtitle
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of pass benefits..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>

              {/* Row 1: Car Type & Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Vehicle Type *
                  </label>
                  <select
                    required
                    value={formData.carTypeId}
                    onChange={e => setFormData({ ...formData, carTypeId: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="">Select Car Type</option>
                    {carTypes.map(ct => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Duration Label
                  </label>
                  <select
                    value={formData.durationLabel}
                    onChange={e => {
                      const label = e.target.value;
                      let days = 30;
                      if (label === '3 Months') days = 90;
                      if (label === '6 Months') days = 180;
                      if (label === '1 Year') days = 365;
                      setFormData({ ...formData, durationLabel: label, durationDays: days });
                    }}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="1 Month">1 Month (30 Days)</option>
                    <option value="3 Months">3 Months (90 Days)</option>
                    <option value="6 Months">6 Months (180 Days)</option>
                    <option value="1 Year">1 Year (365 Days)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Price & Strike Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Offer Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 999"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Original Price (₹) (Strike-through)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1599"
                    value={formData.originalPrice}
                    onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Row 3: Washes Count & Free Add-ons Count */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Doorstep Washes Included *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 4"
                    value={formData.washesCount}
                    onChange={e => setFormData({ ...formData, washesCount: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Total doorstep washes user gets in this pass.</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Free Add-ons Included *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 2"
                    value={formData.freeAddonsCount}
                    onChange={e => setFormData({ ...formData, freeAddonsCount: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>How many add-on services are free for this pass.</span>
                </div>
              </div>

              {/* Badge & Active */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Promotional Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MOST POPULAR, BEST VALUE, VIP"
                    value={formData.badge}
                    onChange={e => setFormData({ ...formData, badge: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ paddingTop: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', color: '#1E293B' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={e => setFormData({ ...formData, active: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Plan Active (Visible to Users)
                  </label>
                </div>
              </div>

              {/* Feature Highlights */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Perk Highlights & Checklist
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Add bullet highlight..."
                    value={featureInput}
                    onChange={e => setFeatureInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                    style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    style={{ padding: '0.6rem 1rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
                  >
                    Add
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '140px', overflowY: 'auto' }}>
                  {formData.features.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.4rem 0.75rem',
                        background: '#F8FAFC',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      <span style={{ color: '#334155' }}>✓ {feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '2px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create VIP Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
