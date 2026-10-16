import React, { useState, useEffect } from 'react';
import { 
  Trophy, Gift, TrendingUp, TrendingDown, Star, Coins, 
  Copy, Check, Share2, Users, Flame, Sparkles, MessageCircle,
  AlertCircle, ShieldCheck, Zap, Info, CheckCircle2, ArrowRight,
  Car, CreditCard, HelpCircle
} from 'lucide-react';
import { getProfile, getBookings, getSettings } from '../api';

const Rewards = () => {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [sysSettings, setSysSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    Promise.all([
      getProfile().catch(() => null),
      getBookings().catch(() => []),
      getSettings().catch(() => null)
    ]).then(([prof, bks, stgs]) => {
      setProfile(prof);
      setBookings(bks);
      setSysSettings(stgs);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: 'var(--primary-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        Loading rewards & referral stats...
      </div>
    </div>
  );

  const currentPoints = profile?.points || 0;
  const referralCode = profile?.referralCode || 'WMC777';
  const referralCount = profile?.stats?.referralCount || 0;
  const completedReferrals = profile?.stats?.completedReferralsCount || 0;
  
  // Combine profile stats with live system settings
  const refSettings = {
    enabled: sysSettings?.referralEnabled !== undefined 
      ? !!sysSettings.referralEnabled 
      : (profile?.stats?.referralSettings?.enabled ?? true),
    rewardPoints: sysSettings?.referralRewardPoints ?? profile?.stats?.referralSettings?.rewardPoints ?? 50,
    maxLimit: sysSettings?.referralMaxLimit ?? profile?.stats?.referralSettings?.maxLimit ?? 0,
    streakBonus: sysSettings?.referralStreakBonus ?? profile?.stats?.referralSettings?.streakBonus ?? 25,
    streakConfig: sysSettings?.referralStreakConfig ?? profile?.stats?.referralSettings?.streakConfig
  };

  const pointsToCashRatio = Number(sysSettings?.pointsToCashRatio) > 0 ? Number(sysSettings.pointsToCashRatio) : 1;
  const earnRatio = Number(sysSettings?.rewardPointsRatio) > 0 ? Number(sysSettings.rewardPointsRatio) : 0.1;
  const earnPercent = Math.round(earnRatio * 100);
  const cashEquivalent = Math.floor(currentPoints / pointsToCashRatio);
  const baseRewardPoints = Number(refSettings.rewardPoints) >= 0 ? Number(refSettings.rewardPoints) : 50;
  const baseRewardCash = Math.round(baseRewardPoints / pointsToCashRatio);

  // Parse streak milestones
  let streakTiers = [
    { count: 1, points: baseRewardPoints },
    { count: 2, points: baseRewardPoints + (Number(refSettings.streakBonus) || 25) },
    { count: 3, points: baseRewardPoints + (Number(refSettings.streakBonus) || 25) * 2 },
    { count: 5, points: baseRewardPoints + (Number(refSettings.streakBonus) || 25) * 4 }
  ];

  if (refSettings.streakConfig) {
    try {
      const parsed = typeof refSettings.streakConfig === 'string' ? JSON.parse(refSettings.streakConfig) : refSettings.streakConfig;
      if (Array.isArray(parsed) && parsed.length > 0) {
        streakTiers = parsed;
      }
    } catch (e) {
      console.warn('Could not parse streak config:', e);
    }
  }

  const highestTierPoints = streakTiers.length > 0 ? Math.max(...streakTiers.map(t => Number(t.points) || 0)) : baseRewardPoints;

  const shareUrl = `${window.location.origin}/register?ref=${referralCode}`;
  const shareMessage = `Hey! Book an authentic doorstep car wash with Wash My Car Org. Use my referral code ${referralCode} when registering: ${shareUrl}`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Wash My Car Org Referral',
          text: shareMessage,
          url: shareUrl
        });
      } catch (err) {
        console.warn(err);
      }
    } else {
      copyToClipboard(shareUrl, 'link');
    }
  };

  // Build history from bookings
  const rewardHistory = bookings
    .filter(b => (b.pointsEarned > 0 || b.pointsRedeemed > 0))
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  const totalEarned = bookings.reduce((sum, b) => sum + (b.pointsEarned || 0), 0);
  const totalRedeemed = bookings.reduce((sum, b) => sum + (b.pointsRedeemed || 0), 0);

  // Tier logic
  const getTier = (pts) => {
    if (pts >= 2000) return { name: 'Platinum', color: '#7C3AED', bg: 'linear-gradient(135deg, #4C1D95, #7C3AED)' };
    if (pts >= 1000) return { name: 'Gold',     color: '#D97706', bg: 'linear-gradient(135deg, #92400E, #D97706)' };
    if (pts >= 500)  return { name: 'Silver',   color: '#6B7280', bg: 'linear-gradient(135deg, #374151, #6B7280)' };
    return                  { name: 'Bronze',   color: '#B45309', bg: 'linear-gradient(135deg, #78350F, #D97706)' };
  };

  const tier = getTier(currentPoints);
  const nextTierThreshold = currentPoints >= 2000 ? null : currentPoints >= 1000 ? 2000 : currentPoints >= 500 ? 1000 : 500;
  const progressPct = nextTierThreshold
    ? Math.min(100, Math.round((currentPoints / nextTierThreshold) * 100))
    : 100;

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', paddingBottom: '3.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* 1. BALANCE HERO CARD */}
      <div style={{
        background: tier.bg,
        borderRadius: '24px',
        padding: '2rem 1.75rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-40px', right: '70px', width: '110px', height: '110px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <p style={{ margin: '0 0 0.4rem', opacity: 0.9, fontSize: '0.88rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Your Reward Wallet Balance
            </p>
            <h1 style={{ margin: '0 0 0.35rem', fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {currentPoints.toLocaleString()}
              <span style={{ fontSize: '1.25rem', fontWeight: 700, opacity: 0.85, marginLeft: '0.35rem' }}>pts</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <span style={{ background: 'rgba(255,255,255,0.22)', padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                {tier.name} Tier
              </span>
              <span style={{ background: 'rgba(255,255,255,0.18)', padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700 }}>
                Worth ₹{cashEquivalent} Discount
              </span>
              <span style={{ background: 'rgba(0,0,0,0.25)', padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                ⚡ Conversion: {pointsToCashRatio} pt{pointsToCashRatio > 1 ? 's' : ''} = ₹1.00
              </span>
            </div>
          </div>
          <Trophy size={56} style={{ opacity: 0.85 }} strokeWidth={1.5} />
        </div>

        {/* Progress to next tier */}
        {nextTierThreshold && (
          <div style={{ marginTop: '1.75rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', fontSize: '0.8rem', opacity: 0.9, fontWeight: 600 }}>
              <span>{currentPoints} pts earned</span>
              <span>{nextTierThreshold - currentPoints} pts to next tier ({nextTierThreshold} pts)</span>
            </div>
            <div style={{ height: '7px', background: 'rgba(255,255,255,0.25)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: 'white', borderRadius: '999px', transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* 2. COMPREHENSIVE REWARD SYSTEM EXPLANATION CARD (TOLD COMPLETELY) */}
      <div style={{
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: '20px',
        padding: '1.5rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.4rem' }}>
          <HelpCircle size={20} color="var(--primary-blue)" />
          <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-navy)', fontWeight: 800 }}>
            How the Reward & Referral Program Works
          </h2>
        </div>
        <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5 }}>
          Wash My Car Org rewards your loyalty on every wash and friend referral. All values below dynamically match the live system settings configured by our management.
        </p>

        {/* 4 Pillars Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          
          {/* Pillar 1: Booking Cashback */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                <Car size={18} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                {earnPercent}% CASHBACK
              </span>
            </div>
            <h4 style={{ margin: '0.4rem 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
              Earn on Every Wash
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              Earn <strong>{earnPercent}%</strong> of your service bill back in loyalty points. For example, booking a ₹500 wash automatically credits <strong>{Math.round(500 * earnRatio)} points</strong> to your wallet upon completion.
            </p>
          </div>

          {/* Pillar 2: Referrals */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                <Gift size={18} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                +{baseRewardPoints} PTS
              </span>
            </div>
            <h4 style={{ margin: '0.4rem 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
              Invite Friends & Neighbors
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              Share your invite code. When a friend signs up and finishes their 1st doorstep wash, you instantly earn <strong>+{baseRewardPoints} points (equal to ₹{baseRewardCash} cash discount)</strong>.
            </p>
          </div>

          {/* Pillar 3: Cashless Checkout */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                <CreditCard size={18} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                {pointsToCashRatio} PT{pointsToCashRatio > 1 ? 'S' : ''} = ₹1
              </span>
            </div>
            <h4 style={{ margin: '0.4rem 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
              100% Cashless Checkout
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              Redeem anytime with zero minimum threshold! Toggle 'Redeem Reward Points' during booking checkout to pay partially or cover <strong>100% of your bill for free washes</strong>.
            </p>
          </div>

          {/* Pillar 4: Milestone Streaks */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA' }}>
                <Flame size={18} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9333EA', background: '#F3E8FF', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                BOOSTER TIERS
              </span>
            </div>
            <h4 style={{ margin: '0.4rem 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
              Milestones & Invite Cap
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              Climb escalating milestone bonuses as more friends wash with us. Invite capacity: <strong>{refSettings.maxLimit > 0 ? `${refSettings.maxLimit} friends` : 'Unlimited friends allowed'}</strong>. Points never expire!
            </p>
          </div>

        </div>
      </div>

      {/* 3. REFERRAL SHARING HUB & MILESTONES (OR PAUSED NOTICE) */}
      {refSettings.enabled === false ? (
        <div style={{
          background: '#FFFBEB',
          border: '1.5px solid #FDE68A',
          borderRadius: '20px',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <h4 style={{ margin: 0, color: '#92400E', fontSize: '1.05rem', fontWeight: 700 }}>
                Customer Referral Program Currently Paused
              </h4>
              <span style={{
                background: '#FEF3C7',
                color: '#B45309',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid #FDE68A',
                textTransform: 'uppercase'
              }}>
                Notice
              </span>
            </div>
            <p style={{ margin: 0, color: '#B45309', fontSize: '0.85rem', lineHeight: 1.5 }}>
              The referral rewards program is temporarily deactivated by the administration. Friend invitations and referral bonus points are currently paused. All existing points in your wallet remain fully valid and can be redeemed towards your bookings anytime. Stay tuned for exciting new bonus campaigns!
            </p>
          </div>
        </div>
      ) : (
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: '24px',
        padding: '1.85rem',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow decorative effects */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '180px',
          height: '180px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '140px',
          height: '140px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />

        {/* Section Header */}
        <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'linear-gradient(90deg, #F59E0B, #EF4444)', padding: '4px 10px', borderRadius: '999px', marginBottom: '0.65rem' }}>
            <Sparkles size={13} color="#FFFFFF" />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Your Referral Hub
            </span>
          </div>

          <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.45rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            Invite Friends & Earn Free Doorstep Washes
          </h3>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.55 }}>
            Share your unique code. When your friend registers and completes their 1st car wash, you both earn bonus points credited automatically!
          </p>
        </div>

        {/* Code & Share Bar */}
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '16px',
          padding: '1.15rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block' }}>
              Your Unique Referral Code
            </span>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.08em' }}>
              {referralCode}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Copy Code */}
            <button
              onClick={() => copyToClipboard(referralCode, 'code')}
              style={{
                background: copiedCode ? '#10B981' : 'rgba(255,255,255,0.12)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                padding: '0.65rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s'
              }}
            >
              {copiedCode ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>

            {/* WhatsApp Share */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#25D366',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                padding: '0.65rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'none'
              }}
            >
              <MessageCircle size={16} />
              <span>WhatsApp</span>
            </a>

            {/* Share Link */}
            <button
              onClick={handleNativeShare}
              style={{
                background: copiedLink ? '#10B981' : 'rgba(56, 189, 248, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '10px',
                color: '#38BDF8',
                padding: '0.65rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Share2 size={16} />
              <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
            </button>
          </div>
        </div>

        {/* Milestone Streak Gamified Roadmap */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#E2E8F0', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Flame size={17} color="#F59E0B" /> Milestone Bonus Roadmap
            </h4>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
              {completedReferrals} Friend {completedReferrals === 1 ? 'wash' : 'washes'} completed
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(130px, 1fr))`,
            gap: '0.65rem'
          }}>
            {streakTiers.map((tierItem, idx) => {
              const isAchieved = completedReferrals >= tierItem.count;
              const isNext = !isAchieved && (idx === 0 || completedReferrals >= streakTiers[idx - 1].count);
              const cashVal = Math.round(tierItem.points / pointsToCashRatio);

              return (
                <div
                  key={idx}
                  style={{
                    background: isAchieved 
                      ? 'rgba(16, 185, 129, 0.18)' 
                      : isNext 
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(255,255,255,0.04)',
                    border: isAchieved 
                      ? '1.5px solid #10B981' 
                      : isNext 
                        ? '1.5px solid #F59E0B'
                        : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    padding: '0.9rem 0.65rem',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: isAchieved ? '#6EE7B7' : isNext ? '#FDE68A' : '#94A3B8', fontWeight: 700, display: 'block' }}>
                    {tierItem.count} {tierItem.count === 1 ? 'Friend' : 'Friends'}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: isAchieved ? '#10B981' : isNext ? '#F59E0B' : 'white', display: 'block', margin: '0.2rem 0' }}>
                    +{tierItem.points} <span style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.8 }}>pts</span>
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginBottom: '0.35rem' }}>
                    = ₹{cashVal} Off
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    color: isAchieved ? '#10B981' : isNext ? '#F59E0B' : '#64748B',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: isAchieved ? 'rgba(16, 185, 129, 0.15)' : isNext ? 'rgba(245, 158, 11, 0.15)' : 'transparent'
                  }}>
                    {isAchieved ? '✓ Done' : isNext ? 'Next Goal' : 'Locked'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Referral Stats Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.65rem'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.85rem 0.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>INVITES REGISTERED</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', marginTop: '2px', display: 'block' }}>{referralCount}</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.85rem 0.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>WASHES COMPLETED</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px', display: 'block' }}>{completedReferrals}</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.85rem 0.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>ALLOWED INVITES</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px', display: 'block' }}>
              {refSettings.maxLimit > 0 ? refSettings.maxLimit : '∞'}
            </span>
          </div>
        </div>

      </div>
      )}

      {/* 4. TOTAL EARNED & TOTAL REDEEMED STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={22} color="#16A34A" />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Earned</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803D' }}>{totalEarned.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>pts</span></div>
          </div>
        </div>
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingDown size={22} color="#D97706" />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Redeemed</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#92400E' }}>{totalRedeemed.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>pts</span></div>
          </div>
        </div>
      </div>

      {/* 5. POINTS HISTORY LEDGER */}
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '1.15rem 1.35rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <Star size={18} color="var(--primary-blue)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--primary-navy)', fontWeight: 800 }}>Points Transaction History</h3>
        </div>

        {rewardHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 2rem', color: 'var(--text-muted)' }}>
            <Gift size={44} color="#CBD5E1" style={{ marginBottom: '0.85rem' }} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>No points activity yet.</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#94A3B8' }}>
              Book your next doorstep wash or share your referral code to earn reward points!
            </p>
          </div>
        ) : (
          <div style={{ padding: '0.25rem 0' }}>
            {rewardHistory.map(b => {
              const dateStr = new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              const washLabel = b.washType?.name || 'Wash Service';
              const carLabel = b.car ? `${b.car.make} ${b.car.model}` : b.carType?.name || 'Vehicle';

              return (
                <div key={b.id} style={{ padding: '1rem 1.35rem', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Earned Entry */}
                  {b.pointsEarned > 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TrendingUp size={16} color="#16A34A" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--primary-navy)', fontWeight: 700 }}>Earned — {washLabel}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{carLabel} &bull; {dateStr}</div>
                      </div>
                      <div style={{ fontWeight: 900, color: '#16A34A', fontSize: '1.05rem' }}>+{b.pointsEarned}</div>
                    </div>
                  )}
                  {b.pointsEarned > 0 && b.pointsRedeemed > 0 && <div style={{ width: '1px', background: '#F1F5F9', alignSelf: 'stretch' }} />}
                  {/* Redeemed Entry */}
                  {b.pointsRedeemed > 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TrendingDown size={16} color="#D97706" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--primary-navy)', fontWeight: 700 }}>Redeemed — {washLabel}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{carLabel} &bull; {dateStr}</div>
                      </div>
                      <div style={{ fontWeight: 900, color: '#D97706', fontSize: '1.05rem' }}>-{b.pointsRedeemed}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Rewards;
