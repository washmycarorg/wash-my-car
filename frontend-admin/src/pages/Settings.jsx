import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../api';
import { 
  Upload, Image as ImageIcon, Link as LinkIcon, Trash2, Plus, 
  Minus, Sparkles, Flame, Check, X, Award, Crown, Power, Calendar, CalendarX, AlertTriangle
} from 'lucide-react';

const parseBool = (val, defaultVal = true) => {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.toLowerCase() === 'true';
  if (typeof val === 'number') return val !== 0;
  return Boolean(val);
};

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggleLoading, setToggleLoading] = useState({});
  const [toast, setToast] = useState(null);
  const [streakTiers, setStreakTiers] = useState([
    { count: 1, points: 50 },
    { count: 2, points: 75 },
    { count: 3, points: 100 },
    { count: 5, points: 150 }
  ]);
  const [adImageTab, setAdImageTab] = useState('upload'); // 'upload' | 'url'
  const [policyTab, setPolicyTab] = useState('terms'); // 'terms' | 'privacy'

  const DEFAULT_TERMS = `1. DOORSTEP ACCESS & SERVICE REQUIREMENTS
- Customer Water & Power Access: The customer agrees to provide accessible domestic water tap connection and a standard 220V/16A electric plug point within a reasonable distance (20-25 meters) for our technician to operate high-pressure washing machines, vacuum cleaners, and steam detailing equipment safely.
- Vehicle Parking Clearance: The vehicle must be parked in a safe, legal, and adequately illuminated space with at least 2 to 3 feet of clearance on all sides to allow complete exterior and interior detailing without obstruction.
- Personal Belongings & Valuables: Customers are strictly requested to remove all personal belongings, cash, jewelry, electronic items, and important documents from inside the car before service starts. Wash My Car Org and its technicians are not responsible for unattended personal valuables.

2. CANCELLATION, RESCHEDULE & REFUND POLICY
- 9-Hour Full Refund Window: Customers can cancel an upcoming booking up to 9 hours prior to the scheduled slot arrival time on the booking date to receive a 100% full refund. The refund is automatically initiated to your original payment method.
- Non-Refundable Within 9 Hours: If not cancelled at least 9 hours prior to the scheduled slot time, bookings are strictly non-refundable and no refund will be initiated, as our service technician equipped on scooty/bike with professional wash & detailing kits and complete vehicle care amenities (floor papers, car fresheners, cleaning liquids & detailing supplies) is reserved exclusively for your vehicle.
- Easy Slot Rescheduling: Customers can reschedule any upcoming service slot free of charge up to 9 hours before the scheduled appointment time.
- Doorstep Rejection / Non-Refund Policy: If not cancelled at least 9 hours prior to slot time, or if any doorstep rejection is found upon technician arrival (including customer refusal, lack of domestic water/electricity access, gated community denial, or customer unavailability after 20 minutes of waiting), NO refund will be initiated under any circumstances.
- Bad Weather Policy: In case of sudden torrential monsoon rain or hazardous weather, washes will be placed on hold and rescheduled to the earliest convenient dry time slot with customer consent.

3. PRICING, PROMOTIONS & VIP PASSES
- All prices displayed are inclusive of professional detailing labor and premium pH-neutral cleaning chemicals.
- Promotional coupon codes and referral wallet discounts are applicable as per individual offer rules.
- VIP monthly subscription passes are non-transferable and tied to the registered vehicle plate number.`;

  const DEFAULT_PRIVACY = `1. INFORMATION WE COLLECT & PURPOSE
- Mobile Number & SMS OTP: Collected exclusively for secure account registration, login verification, passwordless SMS authentication via Twilio, and instant transactional booking updates (booking confirmation, technician arrival alert, and digital invoice).
- Vehicle Registration Plate Number & Model: Collected strictly to instruct the assigned service technician on exactly which vehicle to wash and detail at your doorstep, guaranteeing service authenticity and preventing wrong-car washing.
- Service Address & Location: Used solely for navigation and smart dispatch routing of our doorstep mobile detailing technician (arriving on scooty/bike equipped with complete wash & detailing kit and vehicle care amenities) to your home or office parking.

2. BEFORE & AFTER WASH VERIFICATION PHOTOS
- Purpose of Vehicle Photos: Our field technicians take high-resolution before-and-after photographs of the vehicle exterior, tyres, and cabin. These photos are taken solely for service completion verification, job quality audit, and internal technician authenticity evaluation.
- Absolute Confidentiality: Vehicle photos are strictly private and stored securely. They will NEVER be sold, shared, published, or distributed to any third party or public social media without your prior explicit consent.

3. COMMUNICATIONS & PROMOTIONAL NOTIFICATIONS
- Service Communications: We send essential transactional SMS, WhatsApp updates, and call reminders regarding your active wash appointment and arrival timings.
- Promotional Messages: We may occasionally notify you about exclusive seasonal discounts, monsoon specials, or loyalty point bonuses. You can opt out of promotional messages anytime by contacting support.

4. STRICT ZERO THIRD-PARTY DATA SHARING GUARANTEE
- We respect your privacy. Wash My Car Org has a strict zero-tolerance data monetisation policy: we NEVER sell, rent, lease, trade, or share your personal information, phone numbers, or vehicle details with third-party advertisers or external marketing brokers.`;

  const DEFAULT_SOCIAL_LINKS = [
    { id: 'instagram', platform: 'Instagram', enabled: true, name: '@washmycarorg', url: 'https://instagram.com/washmycarorg' },
    { id: 'facebook', platform: 'Facebook', enabled: true, name: 'Wash My Car Org', url: 'https://facebook.com/washmycarorg' },
    { id: 'whatsapp', platform: 'WhatsApp', enabled: true, name: '+91 98765 43210', url: 'https://wa.me/919876543210' },
    { id: 'linkedin', platform: 'LinkedIn', enabled: false, name: 'Wash My Car Org', url: 'https://linkedin.com/' },
    { id: 'twitter', platform: 'Twitter (X)', enabled: false, name: '@washmycarorg', url: 'https://x.com/washmycarorg' }
  ];
  const [socialLinks, setSocialLinks] = useState(DEFAULT_SOCIAL_LINKS);
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
    bookingTermsText: "1. Access Requirements: Customer agrees to provide adequate water tap access and a standard electric plug point for the technician to perform the doorstep car wash service safely.\n2. Vehicle Parking: The vehicle must be parked in a safe area with sufficient clearance around all sides.\n3. Valuable Items: Please remove all personal belongings and valuables from inside the car prior to service commencement.\n4. Cancellation & Refund Policy: Full 100% refund is allocated for cancellations made at least 9 hours prior to scheduled slot time. If not cancelled before 9 hours or if any doorstep rejection is found upon technician arrival, no refund will be initiated.",
    dashboardAdImage: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1600&q=85",
    dashboardAdTitle: "Special Weekend Doorstep Detail & Snow Foam Spa",
    dashboardAdSubtitle: "Get sparkling exterior foam wash & deep interior cabin sanitize with spot-free purified water at your doorstep.",
    dashboardAdBadge: "PROMOTIONAL OFFER • LIMITED SLOTS",
    subscriptionBannerTitle: "Exclusive VIP Car Care Membership",
    subscriptionBannerSubtitle: "Save up to 40% with monthly doorstep passes, complimentary add-ons & priority scheduling.",
    subscriptionBannerImage: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1600&q=85",
    termsAndConditionsText: DEFAULT_TERMS,
    privacyPolicyText: DEFAULT_PRIVACY
  });


  const handleInstantToggle = async (field, newValue) => {
    setSettings(prev => ({ ...prev, [field]: newValue }));
    setToggleLoading(prev => ({ ...prev, [field]: true }));

    const labels = {
      bookingsEnabled: 'Customer Slot Bookings',
      subscriptionsEnabled: 'VIP Subscriptions Feature',
      autoAssignment: 'Automatic Employee Assignment',
      pointsRedemption: 'Points Cash Redemption',
      pointsReward: 'Points Earning Rewards',
      referralEnabled: 'Referral Program'
    };
    const title = labels[field] || field;

    try {
      const res = await updateSettings({ [field]: newValue });
      if (res && res[field] !== undefined) {
        setSettings(prev => ({ ...prev, [field]: parseBool(res[field], newValue) }));
      }
      setToast({
        type: 'success',
        message: `${title} is now ${newValue ? 'ENABLED / ACCEPTING' : 'PAUSED / DISABLED'}. Saved to database!`
      });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
      setSettings(prev => ({ ...prev, [field]: !newValue }));
      setToast({
        type: 'error',
        message: `Failed to update ${title}: ${err.message}`
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setToggleLoading(prev => ({ ...prev, [field]: false }));
    }
  };

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
          bookingsEnabled: parseBool(res.bookingsEnabled, true),
          subscriptionsEnabled: parseBool(res.subscriptionsEnabled, true),
          autoAssignment: parseBool(res.autoAssignment, true),
          pointsRedemption: parseBool(res.pointsRedemption, true),
          pointsReward: parseBool(res.pointsReward, true),
          pointsToCashRatio: res.pointsToCashRatio ?? 4,
          rewardPointsRatio: res.rewardPointsRatio ?? 0.1,
          referralEnabled: parseBool(res.referralEnabled, true),
          referralRewardPoints: res.referralRewardPoints ?? 50,
          referralMaxLimit: res.referralMaxLimit ?? 10,
          referralStreakBonus: res.referralStreakBonus ?? 25,
          referralStreakConfig: JSON.stringify(loadedTiers),
          bookingTermsText: res.bookingTermsText || "1. Access Requirements: Customer agrees to provide adequate water tap access and a standard electric plug point for the technician to perform the doorstep car wash service safely.\n2. Vehicle Parking: The vehicle must be parked in a safe area with sufficient clearance around all sides.\n3. Valuable Items: Please remove all personal belongings and valuables from inside the car prior to service commencement.\n4. Cancellation & Refund Policy: Full 100% refund is allocated for cancellations made at least 9 hours prior to scheduled slot time. If not cancelled before 9 hours or if any doorstep rejection is found upon technician arrival, no refund will be initiated.",
          dashboardAdImage: res.dashboardAdImage || "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1600&q=85",
          dashboardAdTitle: res.dashboardAdTitle || "Special Weekend Doorstep Detail & Snow Foam Spa",
          dashboardAdSubtitle: res.dashboardAdSubtitle || "Get sparkling exterior foam wash & deep interior cabin sanitize with spot-free purified water at your doorstep.",
          dashboardAdBadge: res.dashboardAdBadge || "PROMOTIONAL OFFER • LIMITED SLOTS",
          subscriptionBannerTitle: res.subscriptionBannerTitle || "Exclusive VIP Car Care Membership",
          subscriptionBannerSubtitle: res.subscriptionBannerSubtitle || "Save up to 40% with monthly doorstep passes, complimentary add-ons & priority scheduling.",
          subscriptionBannerImage: res.subscriptionBannerImage || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1600&q=85",
          termsAndConditionsText: res.termsAndConditionsText || DEFAULT_TERMS,
          privacyPolicyText: res.privacyPolicyText || DEFAULT_PRIVACY
        });


        if (res.socialLinks) {
          try {
            const parsedSocial = typeof res.socialLinks === 'string' ? JSON.parse(res.socialLinks) : res.socialLinks;
            if (Array.isArray(parsedSocial) && parsedSocial.length > 0) {
              setSocialLinks(parsedSocial);
            }
          } catch (e) {
            console.warn('Could not parse social links:', e);
          }
        }

        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load settings:', err);
        setToast({
          type: 'error',
          message: `Failed to load settings from server: ${err.message}`
        });
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

  const handleUpdateSocial = (index, field, value) => {
    setSocialLinks(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
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
        subscriptionBannerImage: settings.subscriptionBannerImage,
        socialLinks: JSON.stringify(socialLinks),
        termsAndConditionsText: settings.termsAndConditionsText,
        privacyPolicyText: settings.privacyPolicyText
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
        subscriptionBannerImage: res.subscriptionBannerImage ?? prev.subscriptionBannerImage,
        termsAndConditionsText: res.termsAndConditionsText ?? prev.termsAndConditionsText,
        privacyPolicyText: res.privacyPolicyText ?? prev.privacyPolicyText
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
      {/* Real-time floating toast feedback */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: toast.type === 'error' ? '#EF4444' : '#10B981',
          color: 'white',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '0.9rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          animation: 'fadeIn 0.25s ease'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="card animate-fade-in" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.35rem', color: 'var(--primary-navy)' }}>System Operations & Rules</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Master availability switches, employee assignment, loyalty points, referral bonuses, and ads.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>

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
                  Live switches save automatically to the database when toggled.
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
                    background: toggleLoading.bookingsEnabled ? '#2563EB' : settings.bookingsEnabled ? '#059669' : '#DC2626',
                    color: 'white'
                  }}>
                    {toggleLoading.bookingsEnabled ? 'SAVING...' : settings.bookingsEnabled ? 'ACCEPTING BOOKINGS' : 'PAUSED (BLOCKED)'}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.4, display: 'block' }}>
                  When OFF: Customers cannot book slots on any date, cannot navigate to booking pages, and checkout is strictly halted on "Proceed to Pay" with a maintenance notice.
                </span>
              </div>

              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '56px', height: '30px', flexShrink: 0, opacity: toggleLoading.bookingsEnabled ? 0.6 : 1 }}>
                <input
                  type="checkbox"
                  disabled={toggleLoading.bookingsEnabled}
                  checked={settings.bookingsEnabled}
                  onChange={e => handleInstantToggle('bookingsEnabled', e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="slider" style={{
                  position: 'absolute',
                  cursor: toggleLoading.bookingsEnabled ? 'wait' : 'pointer',
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
                    background: toggleLoading.subscriptionsEnabled ? '#2563EB' : settings.subscriptionsEnabled ? '#D97706' : '#475569',
                    color: 'white'
                  }}>
                    {toggleLoading.subscriptionsEnabled ? 'SAVING...' : settings.subscriptionsEnabled ? 'GOLD DOCK & BANNER ON' : 'DISABLED'}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.4, display: 'block' }}>
                  When ON: Subscription page is visible to users, appears in the user floating dock highlighted in Gold (replaces rewards), and the VIP advertisement banner appears on the homepage.
                </span>
              </div>

              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '56px', height: '30px', flexShrink: 0, opacity: toggleLoading.subscriptionsEnabled ? 0.6 : 1 }}>
                <input
                  type="checkbox"
                  disabled={toggleLoading.subscriptionsEnabled}
                  checked={settings.subscriptionsEnabled}
                  onChange={e => handleInstantToggle('subscriptionsEnabled', e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="slider" style={{
                  position: 'absolute',
                  cursor: toggleLoading.subscriptionsEnabled ? 'wait' : 'pointer',
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
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', flexShrink: 0, opacity: toggleLoading.autoAssignment ? 0.6 : 1 }}>
              <input
                type="checkbox"
                disabled={toggleLoading.autoAssignment}
                checked={settings.autoAssignment}
                onChange={e => handleInstantToggle('autoAssignment', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="slider" style={{
                position: 'absolute',
                cursor: toggleLoading.autoAssignment ? 'wait' : 'pointer',
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
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', flexShrink: 0, opacity: toggleLoading.pointsRedemption ? 0.6 : 1 }}>
              <input
                type="checkbox"
                disabled={toggleLoading.pointsRedemption}
                checked={settings.pointsRedemption}
                onChange={e => handleInstantToggle('pointsRedemption', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="slider" style={{
                position: 'absolute',
                cursor: toggleLoading.pointsRedemption ? 'wait' : 'pointer',
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
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', flexShrink: 0, opacity: toggleLoading.pointsReward ? 0.6 : 1 }}>
              <input
                type="checkbox"
                disabled={toggleLoading.pointsReward}
                checked={settings.pointsReward}
                onChange={e => handleInstantToggle('pointsReward', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="slider" style={{
                position: 'absolute',
                cursor: toggleLoading.pointsReward ? 'wait' : 'pointer',
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
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: toggleLoading.referralEnabled ? 'wait' : 'pointer', flexShrink: 0, marginLeft: '1rem', opacity: toggleLoading.referralEnabled ? 0.6 : 1 }}>
                  <input
                    type="checkbox"
                    disabled={toggleLoading.referralEnabled}
                    checked={settings.referralEnabled}
                    onChange={e => handleInstantToggle('referralEnabled', e.target.checked)}
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

            {/* ========================================================
                SOCIAL MEDIA & "FOLLOW US ON" FOOTER LINKS
            ======================================================== */}
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🌐</span>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 700 }}>
                    Social Media & "Follow Us On" Footer Links
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Control which social channels appear in the website footer. Customize each platform's display name or handle, and set the target redirect link.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {socialLinks.map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    style={{
                      background: item.enabled ? '#FFFFFF' : '#F8FAFC',
                      border: item.enabled ? '1.5px solid #0284C7' : '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      boxShadow: item.enabled ? '0 4px 12px rgba(2, 132, 199, 0.08)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: item.id === 'instagram' 
                            ? 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)' 
                            : item.id === 'facebook' 
                            ? '#1877F2' 
                            : item.id === 'whatsapp' 
                            ? '#25D366' 
                            : item.id === 'linkedin' 
                            ? '#0A66C2' 
                            : '#0F172A',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {item.id === 'instagram' && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                            </svg>
                          )}
                          {item.id === 'facebook' && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                            </svg>
                          )}
                          {item.id === 'whatsapp' && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                            </svg>
                          )}
                          {item.id === 'linkedin' && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                              <rect x="2" y="9" width="4" height="12"/>
                              <circle cx="4" cy="4" r="2"/>
                            </svg>
                          )}
                          {item.id === 'twitter' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          )}
                        </div>

                        <div>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--primary-navy)' }}>
                            {item.platform}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            marginLeft: '0.5rem',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: item.enabled ? '#DCFCE7' : '#F1F5F9',
                            color: item.enabled ? '#15803D' : '#64748B'
                          }}>
                            {item.enabled ? 'ACTIVE IN FOOTER' : 'HIDDEN'}
                          </span>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer', flexShrink: 0 }}>
                        <input
                          type="checkbox"
                          checked={!!item.enabled}
                          onChange={e => handleUpdateSocial(idx, 'enabled', e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: item.enabled ? '#0284C7' : '#CBD5E1',
                          borderRadius: '26px',
                          transition: '0.3s'
                        }}>
                          <span style={{
                            position: 'absolute',
                            height: '20px',
                            width: '20px',
                            left: item.enabled ? '24px' : '4px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: '0.3s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </span>
                      </label>
                    </div>

                    {/* Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', opacity: item.enabled ? 1 : 0.6 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                          Display Name / ID (Shown in Footer)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={item.name || ''}
                          onChange={e => handleUpdateSocial(idx, 'name', e.target.value)}
                          placeholder="e.g. @washmycarorg"
                          style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                          Target Redirect Link / Web URL
                        </label>
                        <input
                          type="url"
                          className="form-input"
                          value={item.url || ''}
                          onChange={e => handleUpdateSocial(idx, 'url', e.target.value)}
                          placeholder={`https://${item.id === 'whatsapp' ? 'wa.me/91...' : item.id + '.com/...'}`}
                          style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Footer Preview */}
              <div style={{ background: '#0F172A', borderRadius: '12px', padding: '1.25rem', color: 'white', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Live Footer "Follow Us On" Preview:
                </div>
                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {socialLinks.filter(s => s.enabled).map((s, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        background: 'rgba(255,255,255,0.08)', 
                        border: '1px solid rgba(255,255,255,0.15)', 
                        borderRadius: '25px', 
                        padding: '0.35rem 0.85rem', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        fontSize: '0.78rem',
                        color: '#F8FAFC'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {s.id === 'instagram' && '📸'}
                        {s.id === 'facebook' && '📘'}
                        {s.id === 'whatsapp' && '💬'}
                        {s.id === 'linkedin' && '💼'}
                        {s.id === 'twitter' && '𝕏'}
                      </span>
                      <strong style={{ color: 'white' }}>{s.name || s.platform}</strong>
                    </div>
                  ))}
                  {socialLinks.filter(s => s.enabled).length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>No social channels enabled. Toggle switches above to display.</span>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================
                TERMS & CONDITIONS & PRIVACY POLICY EDITOR
            ======================================================== */}
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>📜</span>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 700 }}>
                      Terms of Service & Privacy Policy Editor
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Super Admin can alter customer policies anytime. Dynamically served on public /terms and /privacy pages.
                    </p>
                  </div>
                </div>

                {/* Sub Tab Switcher */}
                <div style={{ display: 'flex', gap: '0.35rem', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPolicyTab('terms')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      background: policyTab === 'terms' ? '#0284C7' : 'transparent',
                      color: policyTab === 'terms' ? 'white' : '#64748B',
                      cursor: 'pointer'
                    }}
                  >
                    Terms & Conditions
                  </button>
                  <button
                    type="button"
                    onClick={() => setPolicyTab('privacy')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      background: policyTab === 'privacy' ? '#0284C7' : 'transparent',
                      color: policyTab === 'privacy' ? 'white' : '#64748B',
                      cursor: 'pointer'
                    }}
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>

              {/* Terms of Service Editor */}
              {policyTab === 'terms' && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                      Customer Doorstep Terms & Operating Conditions
                    </span>
                    <button
                      type="button"
                      onClick={() => setSettings(s => ({ ...s, termsAndConditionsText: DEFAULT_TERMS }))}
                      style={{ fontSize: '0.72rem', color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Reset to Standard Template
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    className="form-input"
                    value={settings.termsAndConditionsText || ''}
                    onChange={e => setSettings({ ...settings, termsAndConditionsText: e.target.value })}
                    placeholder="Enter Terms & Conditions..."
                    style={{ fontSize: '0.84rem', lineHeight: 1.6, fontFamily: 'monospace' }}
                  />

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    💡 <strong>Includes:</strong> Domestic water tap & 16A power requirement, vehicle clearance, valuables disclaimer, 100% full refund up to 9 hours before slot, strictly non-refundable within 9 hours, and zero refund on doorstep rejections.
                  </div>
                </div>
              )}

              {/* Privacy Policy Editor */}
              {policyTab === 'privacy' && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                      Customer Privacy, Vehicle Data & Photo Audit Policy
                    </span>
                    <button
                      type="button"
                      onClick={() => setSettings(s => ({ ...s, privacyPolicyText: DEFAULT_PRIVACY }))}
                      style={{ fontSize: '0.72rem', color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Reset to Standard Template
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    className="form-input"
                    value={settings.privacyPolicyText || ''}
                    onChange={e => setSettings({ ...settings, privacyPolicyText: e.target.value })}
                    placeholder="Enter Privacy Policy..."
                    style={{ fontSize: '0.84rem', lineHeight: 1.6, fontFamily: 'monospace' }}
                  />

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    💡 <strong>Includes:</strong> Phone/OTP for login, vehicle plate taken strictly to wash right car, vehicle before/after photos strictly for employee quality audit & never shared with 3rd parties, zero data monetisation.
                  </div>
                </div>
              )}
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
