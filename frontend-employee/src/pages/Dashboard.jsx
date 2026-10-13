import React, { useState, useEffect } from 'react';
import { 
  Power, ClipboardList, Wallet, Star, Car, MapPin, Phone, 
  Navigation, Clock, Sparkles, CheckCircle2, Shield, Bike, 
  Droplets, Feather, Flame, ArrowRight, AlertCircle 
} from 'lucide-react';
import { toggleDuty, getAssignedBookings } from '../api';
import { useNavigate } from 'react-router-dom';

const renderAddonIcon = (iconName, size = 14) => {
  if (!iconName) return <Sparkles size={size} color="#059669" />;
  const str = String(iconName).toLowerCase().trim();
  if (str.includes('shield') || str.includes('helmet') || str.includes('guard')) return <Shield size={size} color="#059669" />;
  if (str.includes('bike') || str.includes('scooter') || str.includes('two-wheeler')) return <Bike size={size} color="#059669" />;
  if (str.includes('droplet') || str.includes('rain') || str.includes('water') || str.includes('windshield')) return <Droplets size={size} color="#059669" />;
  if (str.includes('feather') || str.includes('pet') || str.includes('hair') || str.includes('fur')) return <Feather size={size} color="#059669" />;
  if (str.includes('flame') || str.includes('steam') || str.includes('engine') || str.includes('fire')) return <Flame size={size} color="#059669" />;
  if (str.includes('sparkle') || str.includes('ozone') || str.includes('clean') || str.includes('shine')) return <Sparkles size={size} color="#059669" />;

  if (iconName.length <= 4) return <span style={{ fontSize: `${size}px` }}>{iconName}</span>;
  return <Sparkles size={size} color="#059669" />;
};

const Dashboard = ({ profile, setProfile }) => {
  const navigate = useNavigate();
  const [activeJobs, setActiveJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    getAssignedBookings()
      .then(bks => {
        const pending = (bks || []).filter(b => ['ASSIGNED', 'STARTED'].includes(b.status));
        setActiveJobs(pending);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingJobs(false));
  }, []);

  const handleToggle = async () => {
    try {
      const updated = await toggleDuty(!onDuty);
      setProfile({...profile, onDuty: updated.onDuty});
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const name = profile?.name || 'Suresh Kumar';
  const onDuty = profile?.onDuty || false;
  const stats = profile?.stats || { assignedToday: 0, completedJobs: 0, pendingJobs: 0 };
  const earnings = profile?.earnings !== undefined ? profile.earnings : (profile?.salary || 0);
  const payType = profile?.payType || 'COMMISSION_ONLY';

  const getPayTypeLabel = () => {
    if (payType === 'FIXED_SALARY') return 'Fixed Monthly Salary';
    if (payType === 'HYBRID') return 'Hybrid (Base + Commission)';
    return 'Full Commission';
  };

  const nextJob = activeJobs[0] || profile?.nextJob || null;
  const nextCarDetails = nextJob?.car 
    ? `${nextJob.car.make} ${nextJob.car.model}` 
    : (nextJob?.carMake && nextJob?.carModel ? `${nextJob.carMake} ${nextJob.carModel}` : 'Vehicle');
  const nextCarNumber = nextJob?.car?.carNumber || nextJob?.carNumber;

  return (
    <div style={{maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem'}}>
      
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-blue), var(--accent-teal))',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem 1.5rem',
        color: 'white',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 24px rgba(2, 132, 199, 0.25)'
      }}>
        <p style={{margin: '0 0 0.5rem 0', opacity: 0.9, fontSize: '0.9rem'}}>Welcome back,</p>
        <h1 style={{margin: '0 0 1rem 0', fontSize: '2rem', fontWeight: 800}}>{name}</h1>
        <p style={{margin: '0 0 1.5rem 0', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          Duty Status: 
          <span style={{
            background: onDuty ? '#DCFCE7' : '#FEE2E2',
            color: onDuty ? '#166534' : '#991B1B',
            padding: '0.2rem 0.6rem',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 800
          }}>
            {onDuty ? '● ON DUTY' : '○ OFF DUTY'}
          </span>
        </p>
        
        <button 
          onClick={handleToggle}
          style={{
            background: 'white',
            color: 'var(--primary-blue)',
            border: 'none',
            padding: '0.65rem 1.35rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Power size={18} />
          {onDuty ? 'Go Off Duty' : 'Go On Duty'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card" style={{padding: '1.25rem', border: '1px solid #E2E8F0'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700}}>ACTIVE JOBS</span>
            <ClipboardList size={20} color="var(--primary-blue)" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)'}}>
            {activeJobs.length || stats.pendingJobs || 0}
          </h2>
          <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, display: 'block', marginTop: '0.35rem' }}>
            Ready to service
          </span>
        </div>

        <div className="card" style={{padding: '1.25rem', border: '1px solid #E2E8F0'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700}}>EARNINGS</span>
            <Wallet size={20} color="var(--primary-blue)" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)'}}>₹{earnings}</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--primary-blue)', background: '#EFF6FF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700, display: 'inline-block', marginTop: '0.35rem' }}>
            {getPayTypeLabel()}
          </span>
        </div>

        <div className="card" style={{padding: '1.25rem', border: '1px solid #E2E8F0'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700}}>COMPLETED</span>
            <CheckCircle2 size={20} color="#16A34A" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.85rem', fontWeight: 800, color: '#166534'}}>
            {stats.completedJobs || 0}
          </h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
            Total washes finished
          </span>
        </div>

        <div className="card" style={{padding: '1.25rem', border: '1px solid #E2E8F0'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700}}>RATING</span>
            <Star size={20} color="#D97706" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
            4.9 <Star size={18} fill="#F59E0B" color="#F59E0B" />
          </h2>
          <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, display: 'block', marginTop: '0.35rem' }}>
            Top Performer
          </span>
        </div>
      </div>

      {/* Next Job Card with Car Number & Addons Details */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1.5px solid #CBD5E1', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{
          padding: '1rem 1.25rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Car size={18} color="#38BDF8" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'white' }}>
              Next Scheduled Job
            </h3>
          </div>
          {nextJob && (
            <span style={{
              background: nextJob.status === 'STARTED' ? '#FEF3C7' : '#E0F2FE',
              color: nextJob.status === 'STARTED' ? '#92400E' : '#0369A1',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {nextJob.status}
            </span>
          )}
        </div>

        {nextJob ? (
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Package & Car Details Row */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem', color: 'var(--primary-navy)', fontSize: '1.15rem', fontWeight: 800 }}>
                    {nextJob.washType?.name} ({nextJob.carType?.name})
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: '#F1F5F9', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                    Booking #{nextJob.id}
                  </span>
                </div>
              </div>

              {/* Prominent Vehicle & License Plate Badge */}
              <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                  {nextCarDetails}
                </span>

                {nextCarNumber ? (
                  <span style={{
                    background: '#0F172A',
                    color: '#F8FAFC',
                    padding: '0.25rem 0.7rem',
                    borderRadius: '6px',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    border: '1.5px solid #334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                  }}>
                    <span style={{ fontSize: '0.65rem', background: '#2563EB', color: 'white', padding: '0.1rem 0.35rem', borderRadius: '3px', fontWeight: 800 }}>IND</span>
                    {nextCarNumber}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontStyle: 'italic' }}>
                    No plate registered
                  </span>
                )}
              </div>
            </div>

            {/* Time & Location */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.88rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E293B', fontWeight: 600 }}>
                <Clock size={16} color="var(--primary-blue)" />
                <span>{new Date(nextJob.date).toLocaleDateString()} at <strong>{nextJob.timeSlot}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#334155' }}>
                <MapPin size={16} color="var(--primary-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{nextJob.address || 'Customer doorstep address'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', marginTop: '0.15rem' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Customer: {nextJob.user?.name || 'Customer'}</span>
                {nextJob.user?.phone && (
                  <a
                    href={`tel:${nextJob.user.phone}`}
                    style={{
                      background: '#EFF6FF',
                      color: 'var(--primary-blue)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Phone size={13} /> {nextJob.user.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Prominent Add-on Services Checklist on Dashboard */}
            {nextJob.addons && nextJob.addons.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                border: '1.5px solid #6EE7B7',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#065F46', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={16} color="#059669" /> Required Add-ons Checklist ({nextJob.addons.length})
                  </span>
                  <span style={{ fontSize: '0.7rem', background: '#059669', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                    Must Perform
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {nextJob.addons.map((ba, idx) => (
                    <div key={ba.id || idx} style={{
                      background: 'white',
                      border: '1px solid #A7F3D0',
                      borderRadius: '8px',
                      padding: '0.45rem 0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                        {renderAddonIcon(ba.addon?.icon, 15)}
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#065F46' }}>
                          {ba.addon?.name || 'Add-on Service'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, background: '#DCFCE7', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        ✓ Included
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions for Next Job */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${nextJob.latitude},${nextJob.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem'
                }}
              >
                <Navigation size={16} /> Navigate to Location
              </a>

              <button
                type="button"
                onClick={() => navigate('/schedule')}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem'
                }}
              >
                <span>View in Schedule</span>
                <ArrowRight size={15} />
              </button>
            </div>

          </div>
        ) : (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ margin: '0 0 0.25rem', color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 700 }}>
              No Active Jobs Assigned
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              You are all caught up! New bookings will show up here as soon as they are assigned.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
