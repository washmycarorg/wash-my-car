import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../api';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    autoAssignment: true,
    pointsRedemption: true,
    pointsReward: true,
    pointsToCashRatio: 4,
    rewardPointsRatio: 0.1
  });

  useEffect(() => {
    getSettings()
      .then(res => {
        setSettings({
          autoAssignment: !!res.autoAssignment,
          pointsRedemption: !!res.pointsRedemption,
          pointsReward: !!res.pointsReward,
          pointsToCashRatio: res.pointsToCashRatio,
          rewardPointsRatio: res.rewardPointsRatio
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettings({
        autoAssignment: settings.autoAssignment,
        pointsRedemption: settings.pointsRedemption,
        pointsReward: settings.pointsReward,
        pointsToCashRatio: Number(settings.pointsToCashRatio),
        rewardPointsRatio: Number(settings.rewardPointsRatio)
      });
      setSettings({
        autoAssignment: !!res.autoAssignment,
        pointsRedemption: !!res.pointsRedemption,
        pointsReward: !!res.pointsReward,
        pointsToCashRatio: res.pointsToCashRatio,
        rewardPointsRatio: res.rewardPointsRatio
      });
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
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card animate-fade-in" style={{ padding: '2.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary-navy)' }}>System Operations & Rules</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Configure employee auto-assignment workflows and separate controls for user loyalty points.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
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

          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
          >
            {saving ? 'Updating settings...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
