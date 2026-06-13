import React, { useState, useEffect } from 'react';
import { Gift, Trophy } from 'lucide-react';
import { getProfile } from '../api';

const Rewards = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getProfile()
      .then(res => setProfile(res))
      .catch(err => console.error(err));
  }, []);

  const pts = profile?.stats?.rewardPoints || 0;

  const rewards = [
    { title: '₹50 off', cost: 100 },
    { title: '₹150 off', cost: 250 },
    { title: 'Free Basic Wash', cost: 500 }
  ];

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      {/* Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-blue), var(--accent-teal))',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem 1.5rem',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <p style={{margin: '0 0 0.5rem 0', opacity: 0.9, fontSize: '0.9rem'}}>Reward balance</p>
          <h1 style={{margin: '0 0 0.25rem 0', fontSize: '2.5rem', fontWeight: 800}}>{pts} pts</h1>
          <p style={{margin: 0, opacity: 0.9, fontSize: '0.9rem'}}>Tier: Silver</p>
        </div>
        <Trophy size={64} style={{opacity: 0.8}} strokeWidth={1.5} />
      </div>

      {/* Redeem Options */}
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Redeem</h3>
        </div>
        <div style={{padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {rewards.map((rew, i) => (
            <div 
              key={i} 
              style={{
                padding: '1.25rem',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-md)',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <Gift size={24} color="var(--primary-blue)" style={{marginBottom: '0.75rem'}} />
              <h4 style={{margin: '0 0 0.25rem 0', color: 'var(--primary-navy)', fontSize: '1.05rem'}}>{rew.title}</h4>
              <p style={{margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem'}}>{rew.cost} pts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rewards;
