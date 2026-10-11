import React, { useState, useEffect } from 'react';
import { 
  Trophy, Gift, TrendingUp, TrendingDown, Star, Coins, 
  Copy, Check, Share2, Users, Flame, Sparkles, MessageCircle,
  AlertCircle, ShieldCheck, Zap
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
    maxLimit: sysSettings?.referralMaxLimit ?? profile?.stats?.referralSettings?.maxLimit ?? 10,
    streakBonus: sysSettings?.referralStreakBonus ?? profile?.stats?.referralSettings?.streakBonus ?? 25,
    streakConfig: sysSettings?.referralStreakConfig ?? profile?.stats?.referralSettings?.streakConfig
  };

  const pointsToCashRatio = sysSettings?.pointsToCashRatio || 4;
  const cashEquivalent = (currentPoints / pointsToCashRatio).toFixed(0);

  // Parse streak milestones
  let streakTiers = [
    { count: 1, points: refSettings.rewardPoints || 50 },
    { count: 2, points: (refSettings.rewardPoints || 50) + (refSettings.streakBonus || 25) },
    { count: 3, points: (refSettings.rewardPoints || 50) + (refSettings.streakBonus || 25) * 2 },
    { count: 5, points: (refSettings.rewardPoints || 50) + (refSettings.streakBonus || 25) * 4 }
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

  const highestTierPoints = streakTiers.length > 0 ? Math.max(...streakTiers.map(t => t.points)) : refSettings.rewardPoints;

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
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Balance Hero Card */}
      <div style={{
        background: tier.bg,
        borderRadius: '20px',
        padding: '2rem 1.75rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(0,0,0,0.12)'
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '140px', height: '140px', background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-40px', right: '60px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <p style={{ margin: '0 0 0.4rem', opacity: 0.85, fontSize: '0.88rem', fontWeight: 500 }}>Current Reward Balance</p>
            <h1 style={{ margin: '0 0 0.3rem', fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
              {currentPoints.toLocaleString()}
              <span style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.8, marginLeft: '0.3rem' }}>pts</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                {tier.name} Tier
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
                Worth &asymp; ₹{cashEquivalent} Discount
              </span>
            </div>
          </div>
          <Trophy size={56} style={{ opacity: 0.75 }} strokeWidth={1.5} />
        </div>

        {/* Progress to next tier */}
        {nextTierThreshold && (
          <div style={{ marginTop: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.78rem', opacity: 0.85 }}>
              <span>{currentPoints} pts</span>
              <span>{nextTierThreshold} pts to next tier</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: 'white', borderRadius: '999px', transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          REFERRAL PROGRAM NOTIFICATION (IF DISABLED) OR ADVERTISEMENT SHOWCASE
      ======================================================== */}
      {refSettings.enabled === false ? (
        <div style={{
          background: '#FFFBEB',
          border: '1.5px solid #FDE68A',
          borderRadius: '16px',
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
        borderRadius: '20px',
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

        {/* Advertisement Badge & Headline */}
        <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'linear-gradient(90deg, #F59E0B, #EF4444)', padding: '4px 10px', borderRadius: '999px', marginBottom: '0.65rem' }}>
            <Sparkles size={13} color="#FFFFFF" />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Special Referral Promotion • Earn Free Washes
            </span>
          </div>

          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            Invite Friends, Wash for Free!
          </h2>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.55 }}>
            Give your friends a sparkling doorstep car wash experience. When they register using your invite code and complete their <strong>1st wash</strong>, you earn bonus loyalty points directly to your wallet!
          </p>
        </div>

        {/* Advertisement Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.65rem',
          marginBottom: '1.35rem'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.68rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
              Base Reward
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FFFFFF' }}>
              +{refSettings.rewardPoints} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>pts</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>per friend's 1st wash</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.68rem', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
              Streak Booster
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#F59E0B' }}>
              +{highestTierPoints} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>pts</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>at higher milestones</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
              Cash Discount
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10B981' }}>
              {pointsToCashRatio} pts <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>= ₹1</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>redeemable at checkout</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.68rem', color: '#A78BFA', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
              Invite Limit
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#A78BFA' }}>
              {refSettings.maxLimit > 0 ? `${refSettings.maxLimit}` : 'Unlimited'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>friends allowed</div>
          </div>
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
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.08em' }}>
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
        <div style={{ marginBottom: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#E2E8F0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Flame size={17} color="#F59E0B" /> Milestone Bonus Roadmap
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              {completedReferrals} Friend {completedReferrals === 1 ? 'wash' : 'washes'} completed
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(110px, 1fr))`,
            gap: '0.55rem'
          }}>
            {streakTiers.map((tier, idx) => {
              const isAchieved = completedReferrals >= tier.count;
              const isNext = !isAchieved && (idx === 0 || completedReferrals >= streakTiers[idx - 1].count);
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
                    borderRadius: '12px',
                    padding: '0.8rem 0.6rem',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '0.7rem', color: isAchieved ? '#6EE7B7' : isNext ? '#FDE68A' : '#94A3B8', fontWeight: 700, display: 'block' }}>
                    {tier.count} {tier.count === 1 ? 'Friend' : 'Friends'}
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: isAchieved ? '#10B981' : isNext ? '#F59E0B' : 'white', display: 'block', margin: '0.2rem 0' }}>
                    +{tier.points}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    color: isAchieved ? '#10B981' : isNext ? '#F59E0B' : '#64748B',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {isAchieved ? '✓ Done' : isNext ? 'Next Goal' : 'Locked'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Referral Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.65rem'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.75rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, display: 'block' }}>INVITES REGISTERED</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'white' }}>{referralCount}</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.75rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, display: 'block' }}>WASHES COMPLETED</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10B981' }}>{completedReferrals}</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.75rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, display: 'block' }}>ALLOWED INVITES</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38BDF8' }}>
              {refSettings.maxLimit > 0 ? refSettings.maxLimit : '∞'}
            </span>
          </div>
        </div>

      </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={22} color="#16A34A" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Earned</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803D' }}>{totalEarned.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>pts</span></div>
          </div>
        </div>
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingDown size={22} color="#D97706" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Redeemed</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#92400E' }}>{totalRedeemed.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>pts</span></div>
          </div>
        </div>
      </div>

      {/* Points History */}
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star size={16} color="var(--primary-blue)" />
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-navy)', fontWeight: 700 }}>Points History</h3>
        </div>

        {rewardHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
            <Gift size={40} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
            <p style={{ margin: 0 }}>No points activity yet. Start booking or referring friends to earn rewards!</p>
          </div>
        ) : (
          <div style={{ padding: '0.5rem 0' }}>
            {rewardHistory.map(b => {
              const dateStr = new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              const washLabel = b.washType?.name || 'Wash Service';
              const carLabel = b.car ? `${b.car.make} ${b.car.model}` : b.carType?.name || 'Vehicle';

              return (
                <div key={b.id} style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Entries */}
                  {b.pointsEarned > 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TrendingUp size={16} color="#16A34A" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.88rem', color: 'var(--primary-navy)', fontWeight: 600 }}>Earned — {washLabel}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{carLabel} &bull; {dateStr}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#16A34A', fontSize: '1rem' }}>+{b.pointsEarned}</div>
                    </div>
                  )}
                  {b.pointsEarned > 0 && b.pointsRedeemed > 0 && <div style={{ width: '1px', background: '#F1F5F9', alignSelf: 'stretch' }} />}
                  {b.pointsRedeemed > 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TrendingDown size={16} color="#D97706" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.88rem', color: 'var(--primary-navy)', fontWeight: 600 }}>Redeemed — {washLabel}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{carLabel} &bull; {dateStr}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#D97706', fontSize: '1rem' }}>-{b.pointsRedeemed}</div>
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
