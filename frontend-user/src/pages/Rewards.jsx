import React, { useState, useEffect } from 'react';
import { Trophy, Gift, TrendingUp, TrendingDown, Star, Coins } from 'lucide-react';
import { getProfile, getBookings } from '../api';

const Rewards = () => {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProfile().catch(() => null), getBookings().catch(() => [])])
      .then(([prof, bks]) => {
        setProfile(prof);
        setBookings(bks);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: 'var(--primary-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        Loading rewards...
      </div>
    </div>
  );

  const currentPoints = profile?.points || 0;

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
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Balance Hero Card */}
      <div style={{
        background: tier.bg,
        borderRadius: '16px',
        padding: '2rem 1.75rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
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
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              {tier.name} Tier
            </span>
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

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={20} color="#16A34A" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Earned</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803D' }}>{totalEarned.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>pts</span></div>
          </div>
        </div>
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingDown size={20} color="#D97706" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Redeemed</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#92400E' }}>{totalRedeemed.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>pts</span></div>
          </div>
        </div>
      </div>

      {/* Points History */}
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star size={16} color="var(--primary-blue)" />
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-navy)', fontWeight: 700 }}>Points History</h3>
        </div>

        {rewardHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
            <Gift size={40} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
            <p style={{ margin: 0 }}>No points activity yet. Start booking to earn rewards!</p>
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
