import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../api';
import { 
  Upload, Image as ImageIcon, Link as LinkIcon, Trash2, Plus, 
  Minus, Sparkles, Flame, Check, X, Award, Crown, Power, Calendar, CalendarX, AlertTriangle
} from 'lucide-react';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [streakTiers, setStreakTiers] = useState([
    { count: 1, points: 50 },
    { count: 2, points: 75 },
    { count: 3, points: 100 },
    { count: 5, points: 150 }
  ]);
  const [adImageTab, setAdImageTab] = useState('upload'); // 'upload' | 'url'
  const [settings, setSettings] = useState({
    bookingsEnabled: true,
    subscriptionsEnabled: true,
    autoAssignment: true,
    pointsRedemption: true,
    pointsReward: true,
    pointsToCashRatio: 4,
    rewardPointsRatio: 0.1,
    referralEnabled: true,
    referralRewardPoints: 50,
    referralMaxLimit: 10,
    referralStreakBonus: 25,
    referralStreakConfig: JSON.stringify([
      { count: 1, points: 50 },
      { count: 2, points: 75 },
      { count: 3, points: 100 },
      { count: 5, points: 150 }
    ]),
    bookingTermsText: "1. Access Requirements: Customer agrees to provide adequate water tap access and a standard electric plug point for the technician to perform the doorstep car wash service safely.\n2. Vehicle Parking: The vehicle must be parked in a safe area with sufficient clearance around all sides.\n3. Valuable Items: Please remove all personal belongings and valuables from inside the car prior to service commencement.",
    dashboardAdImage: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1600&q=85",
    dashboardAdTitle: "Special Weekend Doorstep Detail & Snow Foam Spa",
    dashboardAdSubtitle: "Get sparkling exterior foam wash & deep interior cabin sanitize with spot-free purified water at your doorstep.",
    dashboardAdBadge: "PROMOTIONAL OFFER • LIMITED SLOTS",
    subscriptionBannerTitle: "Exclusive VIP Car Care Membership",
    subscriptionBannerSubtitle: "Save up to 40% with monthly doorstep passes, complimentary add-ons & priority scheduling.",
    subscriptionBannerImage: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1600&q=85"
  });

  useEffect(() => {
    getSettings()
      .then(res => {
        let loadedTiers = [
          { count: 1, points: 50 },
          { count: 2, points: 75 },
          { count: 3, points: 100 },
          { count: 5, points: 150 }
        ];

        if (res.referralStreakConfig) {
          try {
            const parsed = typeof res.referralStreakConfig === 'string' 
              ? JSON.parse(res.referralStreakConfig) 
              : res.referralStreakConfig;
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedTiers = parsed;
            }
          } catch (e) {
            console.warn('Could not parse streak config:', e);
          }
        }

        setStreakTiers(loadedTiers);

        setSettings({
          bookingsEnabled: res.bookingsEnabled !== undefined ? !!res.bookingsEnabled : true,
          subscriptionsEnabled: res.subscriptionsEnabled !== undefined ? !!res.subscriptionsEnabled : true,
          autoAssignment: !!res.autoAssignment,
          pointsRedemption: !!res.pointsRedemption,
          pointsReward: !!res.pointsReward,
          pointsToCashRatio: res.pointsToCashRatio,
          rewardPointsRatio: res.rewardPointsRatio,
          referralEnabled: res.referralEnabled !== undefined ? !!res.referralEnabled : true,
          referralRewardPoints: res.referralRewardPoints ?? 50,
          referralMaxLimit: res.referralMaxLimit ?? 10,
          referralStreakBonus: res.referralStreakBonus ?? 25,
          referralStreakConfig: JSON.stringify(loadedTiers),
          bookingTermsText: res.bookingTermsText || "1. Access Requirements: Customer agrees to provide adequate water tap access and a standard electric plug point for the technician to perform the doorstep car wash service safely.\n2. Vehicle Parking: The vehicle must be parked in a safe area with sufficient clearance around all sides.\n3. Valuable Items: Please remove all personal belongings and valuables from inside the car prior to service commencement.",
          dashboardAdImage: res.dashboardAdImage || "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1600&q=85",
          dashboardAdTitle: res.dashboardAdTitle || "Special Weekend Doorstep Detail & Snow Foam Spa",
          dashboardAdSubtitle: res.dashboardAdSubtitle || "Get sparkling exterior foam wash & deep interior cabin sanitize with spot-free purified water at your doorstep.",
          dashboardAdBadge: res.dashboardAdBadge || "PROMOTIONAL OFFER • LIMITED SLOTS",
          subscriptionBannerTitle: res.subscriptionBannerTitle || "Exclusive VIP Car Care Membership",
          subscriptionBannerSubtitle: res.subscriptionBannerSubtitle || "Save up to 40% with monthly doorstep passes, complimentary add-ons & priority scheduling.",
          subscriptionBannerImage: res.subscriptionBannerImage || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1600&q=85"
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleStepCount = (index, delta) => {
    setStreakTiers(prev => {
      const next = [...prev];
      const newCount = Math.max(1, (Number(next[index].count) || 1) + delta);
      next[index] = { ...next[index], count: newCount };
      return next;
    });
  };

  const handleStepPoints = (index, delta) => {
    setStreakTiers(prev => {
      const next = [...prev];
      const newPoints = Math.max(0, (Number(next[index].points) || 0) + delta);
      next[index] = { ...next[index], points: newPoints };
      return next;
    });
  };

  const handleUpdateTier = (index, field, value) => {
    setStreakTiers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: Math.max(0, Number(value) || 0) };
      return next;
    });
  };

  const handleAddTier = () => {
    setStreakTiers(prev => {
      const last = prev[prev.length - 1] || { count: 1, points: 50 };
      const nextCount = (Number(last.count) || 1) + 1;
      const stepBonus = Number(settings.referralStreakBonus) || 25;
      const nextPoints = (Number(last.points) || 50) + stepBonus;
      return [...prev, { count: nextCount, points: nextPoints }];
    });
  };

  const handleRemoveTier = (index) => {
    if (streakTiers.length <= 1) {
      alert('At least one milestone tier is required.');
      return;
    }
    setStreakTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (type) => {
    const basePts = Number(settings.referralRewardPoints) || 50;
    const stepPts = Number(settings.referralStreakBonus) || 25;
    if (type === 'fixed') {
      setStreakTiers([
        { count: 1, points: basePts },
        { count: 2, points: basePts },
        { count: 3, points: basePts },
        { count: 5, points: basePts }
      ]);
    } else if (type === 'incremental') {
      setStreakTiers([
        { count: 1, points: basePts },
        { count: 2, points: basePts + stepPts },
        { count: 3, points: basePts + stepPts * 2 },
        { count: 4, points: basePts + stepPts * 3 },
        { count: 5, points: basePts + stepPts * 4 }
      ]);
    } else if (type === 'milestones') {
      setStreakTiers([
        { count: 1, points: basePts },
        { count: 2, points: basePts + stepPts },
        { count: 3, points: basePts + stepPts * 2 },
        { count: 5, points: basePts + stepPts * 4 }
      ]);
    }
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size exceeds 5MB. Please choose a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, dashboardAdImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setSettings(prev => ({ ...prev, dashboardAdImage: '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tiersJson = JSON.stringify(streakTiers);
      const res = await updateSettings({
        bookingsEnabled: settings.bookingsEnabled,
        subscriptionsEnabled: settings.subscriptionsEnabled,
        autoAssignment: settings.autoAssignment,
        pointsRedemption: settings.pointsRedemption,
        pointsReward: settings.pointsReward,
        pointsToCashRatio: Number(settings.pointsToCashRatio),
        rewardPointsRatio: Number(settings.rewardPointsRatio),
        referralEnabled: settings.referralEnabled,
        referralRewardPoints: Number(settings.referralRewardPoints),
        referralMaxLimit: Number(settings.referralMaxLimit),
        referralStreakBonus: String(settings.referralStreakBonus ?? '25'),
        referralStreakConfig: tiersJson,
        bookingTermsText: settings.bookingTermsText,
        dashboardAdImage: settings.dashboardAdImage,
        dashboardAdTitle: settings.dashboardAdTitle,
        dashboardAdSubtitle: settings.dashboardAdSubtitle,
        dashboardAdBadge: settings.dashboardAdBadge,
        subscriptionBannerTitle: settings.subscriptionBannerTitle,
        subscriptionBannerSubtitle: settings.subscriptionBannerSubtitle,
        subscriptionBannerImage: settings.subscriptionBannerImage
      });
      setSettings(prev => ({
        ...prev,
        bookingsEnabled: res.bookingsEnabled !== undefined ? !!res.bookingsEnabled : prev.bookingsEnabled,
        subscriptionsEnabled: res.subscriptionsEnabled !== undefined ? !!res.subscriptionsEnabled : prev.subscriptionsEnabled,
        autoAssignment: !!res.autoAssignment,
        pointsRedemption: !!res.pointsRedemption,
        pointsReward: !!res.pointsReward,
        pointsToCashRatio: res.pointsToCashRatio,
        rewardPointsRatio: res.rewardPointsRatio,
        referralEnabled: res.referralEnabled !== undefined ? !!res.referralEnabled : prev.referralEnabled,
        referralRewardPoints: res.referralRewardPoints ?? prev.referralRewardPoints,
        referralMaxLimit: res.referralMaxLimit ?? prev.referralMaxLimit,
        referralStreakBonus: res.referralStreakBonus ?? prev.referralStreakBonus,
        referralStreakConfig: res.referralStreakConfig ?? tiersJson,
        bookingTermsText: res.bookingTermsText ?? prev.bookingTermsText,
        dashboardAdImage: res.dashboardAdImage ?? prev.dashboardAdImage,
        dashboardAdTitle: res.dashboardAdTitle ?? prev.dashboardAdTitle,
        dashboardAdSubtitle: res.dashboardAdSubtitle ?? prev.dashboardAdSubtitle,
        dashboardAdBadge: res.dashboardAdBadge ?? prev.dashboardAdBadge,
        subscriptionBannerTitle: res.subscriptionBannerTitle ?? prev.subscriptionBannerTitle,
        subscriptionBannerSubtitle: res.subscriptionBannerSubtitle ?? prev.subscriptionBannerSubtitle,
        subscriptionBannerImage: res.subscriptionBannerImage ?? prev.subscriptionBannerImage
      }));
      alert('System settings updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Settings...</div>;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="card animate-fade-in" style={{ padding: '2.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary-navy)' }}>System Operations & Rules</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Configure employee auto-assignment workflows, customer loyalty points, referral bonuses, and dashboard promotions.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* ======================================================== */}
          {/* 1. MASTER FEATURE TOGGLES: BOOKINGS & VIP SUBSCRIPTIONS */}
          {/* ======================================================== */}
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Power size={20} color="#38BDF8" /> Master System Controls
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                  Global availability switches directly affecting customer booking and VIP access.
                </span>
              </div>
            </div>

            {/* SWITCH 1: Doorstep Bookings Switch */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              background: settings.bookingsEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
              border: settings.bookingsEnabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '1rem 1.25rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: settings.bookingsEnabled ? '#34D399' : '#F87171' }}>
                    Customer Doorstep Slot Bookings
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: settings.bookingsEnabled ? '#059669' : '#DC2626',
                    color: 'white'
                  }}>
                    {settings.bookingsEnabled ? 'ACCEPTING BOOKINGS' : 'PAUSED (BLOCKED)'}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.4, display: 'block' }}>
                  When OFF: Customers cannot book slots on any date, cannot navigate to booking pages, and checkout is strictly halted on "Proceed to Pay" with a maintenance notice.
                </span>
              </div>

              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '56px', height: '30px', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={settings.bookingsEnabled}
                  onChange={e => setSettings({ ...settings, bookingsEnabled: e.target.checked })}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="slider" style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  inset: 0,
                  backgroundColor: settings.bookingsEnabled ? '#10B981' : '#64748B',
                  transition: '0.3s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '22px',
                    width: '22px',
                    left: '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.3s',
                    borderRadius: '50%',
                    transform: settings.bookingsEnabled ? 'translateX(26px)' : 'none'
                  }} />
                </span>
              </label>
            </div>

            {/* SWITCH 2: VIP Subscriptions Switch */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              background: settings.subscriptionsEnabled ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              border: settings.subscriptionsEnabled ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(100, 116, 139, 0.3)',
              borderRadius: '12px',
              padding: '1rem 1.25rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                  <Crown size={18} color="#FBBF24" />
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: settings.subscriptionsEnabled ? '#FCD34D' : '#94A3B8' }}>
                    VIP Subscriptions Feature
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: settings.subscriptionsEnabled ? '#D97706' : '#475569',
                    color: 'white'
                  }}>
                    {settings.subscriptionsEnabled ? 'GOLD DOCK & BANNER ON' : 'DISABLED'}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.4, display: 'block' }}>
                  When ON: Subscription page is visible to users, appears in the user floating dock highlighted in Gold (replaces rewards), and the VIP advertisement banner appears on the homepage.
                </span>
              </div>

              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '56px', height: '30px', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={settings.subscriptionsEnabled}
                  onChange={e => setSettings({ ...settings, subscriptionsEnabled: e.target.checked })}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="slider" style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  inset: 0,
                  backgroundColor: settings.subscriptionsEnabled ? '#F59E0B' : '#64748B',
                  transition: '0.3s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '22px',
                    width: '22px',
                    left: '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.3s',
                    borderRadius: '50%',
                    transform: settings.subscriptionsEnabled ? 'translateX(26px)' : 'none'
                  }} />
                </span>
              </label>
            </div>

            {/* VIP Subscription Ad Banner Configuration */}
            {settings.subscriptionsEnabled && (
              <div style={{
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '10px',
                padding: '1rem',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Homepage VIP Subscription Advertisement Banner:
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', marginBottom: '3px' }}>Banner Title</label>
                  <input
                    type="text"
                    value={settings.subscriptionBannerTitle}
                    onChange={e => setSettings({ ...settings, subscriptionBannerTitle: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: '#1E293B', color: 'white', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', marginBottom: '3px' }}>Banner Subtitle / Value Proposition</label>
                  <input
                    type="text"
                    value={settings.subscriptionBannerSubtitle}
                    onChange={e => setSettings({ ...settings, subscriptionBannerSubtitle: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: '#1E293B', color: 'white', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', marginBottom: '3px' }}>Banner Image URL</label>
                  <input
                    type="text"
                    value={settings.subscriptionBannerImage}
                    onChange={e => setSettings({ ...settings, subscriptionBannerImage: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: '#1E293B', color: 'white', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Auto Assignment Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            width: '100%'
          }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--primary-navy)', display: 'block' }}>Automatic Employee Assignment</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>If enabled, bookings are auto-assigned on checkout. Otherwise, manual assign.</span>
            </div>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={settings.autoAssignment}
                onChange={e => setSettings({ ...settings, autoAssignment: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="slider" style={{
                position: 'absolute',
                cursor: 'pointer',
                inset: 0,
                backgroundColor: settings.autoAssignment ? 'var(--accent-teal)' : '#CBD5E1',
                transition: '0.3s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '0.3s',
                  borderRadius: '50%',
                  transform: settings.autoAssignment ? 'translateX(24px)' : 'none'
                }} />
              </span>
            </label>
          </div>

          {/* Royalty redemption toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            width: '100%'
          }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--primary-navy)', display: 'block' }}>Points Cash Redemption</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Allow users to redeem points during booking checkout</span>
            </div>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={settings.pointsRedemption}
                onChange={e => setSettings({ ...settings, pointsRedemption: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="slider" style={{
                position: 'absolute',
                cursor: 'pointer',
                inset: 0,
                backgroundColor: settings.pointsRedemption ? 'var(--accent-teal)' : '#CBD5E1',
                transition: '0.3s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '0.3s',
                  borderRadius: '50%',
                  transform: settings.pointsRedemption ? 'translateX(24px)' : 'none'
                }} />
              </span>
            </label>
          </div>

          {/* Earning reward points toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            width: '100%'
          }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--primary-navy)', display: 'block' }}>Points Earning Rewards</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reward points to users based on payment subtotals</span>
            </div>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={settings.pointsReward}
                onChange={e => setSettings({ ...settings, pointsReward: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="slider" style={{
                position: 'absolute',
                cursor: 'pointer',
                inset: 0,
                backgroundColor: settings.pointsReward ? 'var(--accent-teal)' : '#CBD5E1',
                transition: '0.3s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '0.3s',
                  borderRadius: '50%',
                  transform: settings.pointsReward ? 'translateX(24px)' : 'none'
                }} />
              </span>
            </label>
          </div>

          {/* Conversion Details fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            
            {/* Cash redemption ratio */}
            {settings.pointsRedemption && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Redemption Conversion Ratio (Points per ₹1)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    className="form-input"
                    value={settings.pointsToCashRatio}
                    onChange={e => setSettings({ ...settings, pointsToCashRatio: e.target.value })}
                    placeholder="e.g. 4"
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', minWidth: '150px' }}>
                    points = <strong>₹1.00</strong> cash value
                  </span>
                </div>
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                  Example: If set to 4, a user redeeming 400 points gets a ₹100 discount.
                </small>
              </div>
            )}

            {/* Reward earning ratio */}
            {settings.pointsReward && (
              <div className="form-group" style={{ margin: 0, borderTop: settings.pointsRedemption ? '1px solid #F1F5F9' : 'none', paddingTop: settings.pointsRedemption ? '1.25rem' : 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Reward Earning Percentage (Points per ₹ spent)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <input
                    required
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    className="form-input"
                    value={settings.rewardPointsRatio}
                    onChange={e => setSettings({ ...settings, rewardPointsRatio: e.target.value })}
                    placeholder="e.g. 0.10"
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', minWidth: '150px' }}>
                    points earned per ₹1 spent (<strong>{Math.round(settings.rewardPointsRatio * 100)}%</strong>)
                  </span>
                </div>
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                  Example: If set to 0.10, booking a ₹500 wash rewards the user with 50 loyalty points.
                </small>
              </div>
            )}

            {/* ========================================================
                REFERRAL PROGRAM CONFIGURATION
            ======================================================== */}
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🤝</span>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 700 }}>
                    Customer Referral Program Configuration
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Reward existing users with loyalty points when their referred friends sign up and complete their 1st car wash.
                  </p>
                </div>
              </div>

              {/* Enable / Disable Referral Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary-navy)', display: 'block' }}>
                    Referral Program Status: {settings.referralEnabled ? <span style={{ color: '#059669' }}>Active / Enabled</span> : <span style={{ color: '#DC2626' }}>Disabled</span>}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {settings.referralEnabled 
                      ? 'Refer & Earn showcase is active on User Dashboard and Rewards page.' 
                      : 'Disabled: Referral code input is hidden on Register page and paused notice shows in Rewards.'}
                  </span>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer', flexShrink: 0, marginLeft: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.referralEnabled}
                    onChange={e => setSettings({ ...settings, referralEnabled: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: settings.referralEnabled ? '#10B981' : '#CBD5E1',
                    borderRadius: '26px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '20px',
                      width: '20px',
                      left: settings.referralEnabled ? '24px' : '4px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.3s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', opacity: settings.referralEnabled ? 1 : 0.5, pointerEvents: settings.referralEnabled ? 'auto' : 'none' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Base Points per Referral
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '0.4rem 0.65rem', background: '#F1F5F9', border: '1px solid #CBD5E1' }}
                      onClick={() => setSettings(s => ({ ...s, referralRewardPoints: Math.max(0, Number(s.referralRewardPoints) - 10) }))}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      required
                      type="number"
                      min="0"
                      step="5"
                      className="form-input"
                      value={settings.referralRewardPoints}
                      onChange={e => setSettings({ ...settings, referralRewardPoints: e.target.value })}
                      placeholder="e.g. 50"
                      style={{ textAlign: 'center', fontWeight: 700 }}
                    />
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '0.4rem 0.65rem', background: '#F1F5F9', border: '1px solid #CBD5E1' }}
                      onClick={() => setSettings(s => ({ ...s, referralRewardPoints: Number(s.referralRewardPoints) + 10 }))}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginTop: '0.25rem' }}>
                    Standard reward awarded upon friend's 1st completed wash
                  </small>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Max Referrals Allowed
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '0.4rem 0.65rem', background: '#F1F5F9', border: '1px solid #CBD5E1' }}
                      onClick={() => setSettings(s => ({ ...s, referralMaxLimit: Math.max(0, Number(s.referralMaxLimit) - 1) }))}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      className="form-input"
                      value={settings.referralMaxLimit}
                      onChange={e => setSettings({ ...settings, referralMaxLimit: e.target.value })}
                      placeholder="0 = unlimited"
                      style={{ textAlign: 'center', fontWeight: 700 }}
                    />
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '0.4rem 0.65rem', background: '#F1F5F9', border: '1px solid #CBD5E1' }}
                      onClick={() => setSettings(s => ({ ...s, referralMaxLimit: Number(s.referralMaxLimit) + 1 }))}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginTop: '0.25rem' }}>
                    Cap on rewardable invites (Set to 0 for unlimited)
                  </small>
                </div>
              </div>

              {/* ========================================================
                  USER-FRIENDLY BONUS STREAK & MILESTONE SETTINGS
              ======================================================== */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                opacity: settings.referralEnabled ? 1 : 0.5,
                pointerEvents: settings.referralEnabled ? 'auto' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Flame size={18} color="#EA580C" />
                    <strong style={{ fontSize: '0.92rem', color: 'var(--primary-navy)' }}>
                      Milestone Bonus & Streak Configuration
                    </strong>
                  </div>

                  {/* Preset quick buttons */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('incremental')}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.72rem',
                        borderRadius: '6px',
                        background: '#E0F2FE',
                        color: '#0369A1',
                        border: '1px solid #BAE6FD',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      +25 Step Incremental
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('fixed')}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.72rem',
                        borderRadius: '6px',
                        background: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FDE68A',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Fixed Base Reward
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('milestones')}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.72rem',
                        borderRadius: '6px',
                        background: '#F1F5F9',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Milestones (1, 2, 3, 5)
                    </button>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Motivate customers by granting escalating booster points for continuous invites. Adjust friend count and reward points directly with <strong>+</strong> and <strong>-</strong> steppers.
                </p>

                {/* Incremental step parameter */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-navy)', display: 'block' }}>Default Step Increment Bonus</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Additional points added per milestone tier step</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '0.3rem 0.5rem', background: '#F1F5F9', border: '1px solid #CBD5E1' }}
                      onClick={() => setSettings(s => ({ ...s, referralStreakBonus: Math.max(0, Number(s.referralStreakBonus) - 5) }))}
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      className="form-input"
                      value={settings.referralStreakBonus}
                      onChange={e => setSettings({ ...settings, referralStreakBonus: e.target.value })}
                      style={{ width: '65px', padding: '0.3rem 0.4rem', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '0.3rem 0.5rem', background: '#F1F5F9', border: '1px solid #CBD5E1' }}
                      onClick={() => setSettings(s => ({ ...s, referralStreakBonus: Number(s.referralStreakBonus) + 5 }))}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Milestone Tier Cards List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Configured Milestone Tiers ({streakTiers.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddTier}
                      style={{
                        background: '#0284C7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Plus size={14} /> Add Tier
                    </button>
                  </div>

                  {streakTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      {/* Badge / Tier number */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '95px' }}>
                        <span style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#E0F2FE',
                          color: '#0369A1',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                          Tier #{idx + 1}
                        </span>
                      </div>

                      {/* Friends count stepper */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Friends Count</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: '0.2rem 0.45rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                            onClick={() => handleStepCount(idx, -1)}
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            value={tier.count}
                            onChange={e => handleUpdateTier(idx, 'count', e.target.value)}
                            style={{ width: '52px', padding: '0.25rem 0.35rem', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem' }}
                          />
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: '0.2rem 0.45rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                            onClick={() => handleStepCount(idx, 1)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Points reward stepper */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bonus Points</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: '0.2rem 0.45rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                            onClick={() => handleStepPoints(idx, -10)}
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            className="form-input"
                            value={tier.points}
                            onChange={e => handleUpdateTier(idx, 'points', e.target.value)}
                            style={{ width: '64px', padding: '0.25rem 0.35rem', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#059669' }}
                          />
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: '0.2rem 0.45rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                            onClick={() => handleStepPoints(idx, 10)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Delete tier */}
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        title="Remove this tier"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: streakTiers.length <= 1 ? 0.3 : 1
                        }}
                        disabled={streakTiers.length <= 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Milestone Summary Preview */}
                <div style={{ background: '#F1F5F9', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.75rem', color: '#475569' }}>
                  <strong>Live Preview Rule: </strong>
                  {streakTiers.map((t, i) => (
                    <span key={i}>
                      Friend #{t.count} &rarr; <strong>+{t.points} pts</strong>{i < streakTiers.length - 1 ? '  |  ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Terms & Conditions / Disclaimer matter */}
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📜</span>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1rem', fontWeight: 700 }}>
                    Booking Disclaimer & Terms Matter
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Custom matter for accepting terms (water & electricity access, parking clearance) that customer must acknowledge before checkout.
                  </p>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <textarea
                  className="form-input"
                  rows={4}
                  value={settings.bookingTermsText}
                  onChange={e => setSettings({ ...settings, bookingTermsText: e.target.value })}
                  placeholder="Terms and conditions matter..."
                  style={{ fontSize: '0.85rem', lineHeight: 1.5 }}
                />
              </div>
            </div>

            {/* ========================================================
                DASHBOARD ADVERTISEMENT BANNER (UPLOAD + LINK BOTH)
            ======================================================== */}
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🖼️</span>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1rem', fontWeight: 700 }}>
                    User Dashboard Ad Banner
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Set a promotional background image (upload from your device or paste web URL), headline, badge, and pitch for the user portal dashboard.
                  </p>
                </div>
              </div>

              {/* Upload vs URL Tabs */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', margin: 0 }}>
                    Banner Image Source
                  </label>
                  
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setAdImageTab('upload')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: adImageTab === 'upload' ? '#0284C7' : '#CBD5E1',
                        background: adImageTab === 'upload' ? '#0284C7' : 'white',
                        color: adImageTab === 'upload' ? 'white' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Upload size={13} /> Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdImageTab('url')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: adImageTab === 'url' ? '#0284C7' : '#CBD5E1',
                        background: adImageTab === 'url' ? '#0284C7' : 'white',
                        color: adImageTab === 'url' ? 'white' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <LinkIcon size={13} /> Image Web Link
                    </button>
                    {settings.dashboardAdImage && (
                      <button
                        type="button"
                        onClick={handleClearImage}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #FECACA',
                          background: '#FEE2E2',
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <X size={13} /> Clear Image
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload from file */}
                {adImageTab === 'upload' && (
                  <div style={{
                    border: '2px dashed #CBD5E1',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0,
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%'
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', pointerEvents: 'none' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Upload size={20} color="#0284C7" />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                        Click to Choose or Drag & Drop Banner Photo
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Supports PNG, JPG, WEBP • Max 5MB (Landscape ratio recommended)
                      </span>
                    </div>
                  </div>
                )}

                {/* Paste URL */}
                {adImageTab === 'url' && (
                  <div>
                    <input
                      type="url"
                      className="form-input"
                      value={settings.dashboardAdImage || ''}
                      onChange={e => setSettings({ ...settings, dashboardAdImage: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginTop: '0.25rem' }}>
                      Paste a high-resolution public image URL
                    </small>
                  </div>
                )}

                {/* Preview Banner */}
                {settings.dashboardAdImage ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Live Ad Banner Preview
                    </div>
                    <div style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      height: '130px',
                      position: 'relative',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                    }}>
                      <img 
                        src={settings.dashboardAdImage} 
                        alt="Ad Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to right, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.45) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1.25rem',
                        color: '#fff'
                      }}>
                        <div style={{ maxWidth: '85%' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            background: '#F59E0B',
                            color: '#000',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'inline-block',
                            marginBottom: '6px'
                          }}>
                            {settings.dashboardAdBadge || 'PROMO'}
                          </span>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, marginBottom: '4px' }}>
                            {settings.dashboardAdTitle || 'Ad Headline'}
                          </div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {settings.dashboardAdSubtitle || 'Promotional description...'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem', background: '#F1F5F9', borderRadius: '8px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    No banner photo set. Upload a file or paste a link to display on the user dashboard.
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Promo Badge
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.dashboardAdBadge || ''}
                    onChange={e => setSettings({ ...settings, dashboardAdBadge: e.target.value })}
                    placeholder="e.g. SPECIAL OFFER • LIMITED SLOTS"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Ad Headline
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.dashboardAdTitle || ''}
                    onChange={e => setSettings({ ...settings, dashboardAdTitle: e.target.value })}
                    placeholder="e.g. Special Weekend Snow Foam Spa"
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Ad Subtitle / Description
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={settings.dashboardAdSubtitle || ''}
                  onChange={e => setSettings({ ...settings, dashboardAdSubtitle: e.target.value })}
                  placeholder="e.g. Get sparkling exterior foam wash & deep interior cabin sanitize..."
                  style={{ fontSize: '0.82rem' }}
                />
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', fontWeight: 700 }}
          >
            {saving ? 'Updating settings...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
