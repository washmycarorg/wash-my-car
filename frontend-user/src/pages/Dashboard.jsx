import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Car, Sparkles, Gift } from 'lucide-react';
import { getProfile } from '../api';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then(res => { setProfile(res); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  const stats = profile?.stats || { upcomingBookings: 0, totalWashes: 0, savedCars: 0, rewardPoints: 0 };
  const nextBooking = profile?.nextBooking;

  return (
    <div style={{maxWidth: '1000px', margin: '0 auto'}}>
      {/* Top Header / Nav items usually go in DashboardLayout, so we just do content */}
      
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--primary-blue), var(--accent-teal))',
        color: 'white',
        border: 'none',
        marginBottom: '1.5rem',
        padding: '2rem'
      }}>
        <p style={{margin: 0, opacity: 0.9, fontSize: '0.95rem'}}>Welcome back,</p>
        <h1 style={{color: 'white', margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem'}}>
          {profile?.name || 'User'} <span style={{fontSize: '1.75rem'}}>👋</span>
        </h1>
        <p style={{marginTop: '0.5rem', marginBottom: '1.5rem', opacity: 0.9}}>Ready to get your car cleaned today?</p>
        
        <Link to="/book" className="btn" style={{
          background: 'white',
          color: 'var(--primary-blue)',
          fontWeight: 600,
          padding: '0.6rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'inline-block'
        }}>
          Book a Wash
        </Link>
      </div>

      {/* 4-Grid Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
          <div className="flex justify-between items-center text-muted text-xs font-semibold" style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>
            UPCOMING <Calendar size={18} color="var(--primary-blue)" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.75rem'}}>{stats.upcomingBookings}</h2>
        </div>
        
        <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
          <div className="flex justify-between items-center text-muted text-xs font-semibold" style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>
            TOTAL WASHES <Sparkles size={18} color="var(--primary-blue)" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.75rem'}}>{stats.totalWashes}</h2>
        </div>
        
        <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
          <div className="flex justify-between items-center text-muted text-xs font-semibold" style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>
            SAVED CARS <Car size={18} color="var(--primary-blue)" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.75rem'}}>{stats.savedCars}</h2>
        </div>
        
        <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
          <div className="flex justify-between items-center text-muted text-xs font-semibold" style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>
            REWARD POINTS <Gift size={18} color="var(--primary-blue)" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.75rem'}}>{stats.rewardPoints}</h2>
          <p className="text-muted text-xs" style={{margin: 0}}>Redeem at checkout</p>
        </div>
      </div>

      {/* Next Booking */}
      <div className="card" style={{padding: 0, overflow: 'hidden', marginBottom: '1.5rem'}}>
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Next booking</h3>
          <Link to="/history" className="text-sm font-semibold" style={{color: 'var(--primary-navy)'}}>View all</Link>
        </div>
        
        <div className="p-4">
          {nextBooking ? (
            <div>
              <h3 style={{fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--primary-navy)'}}>{nextBooking.service?.name || 'Wash Service'}</h3>
              <p className="text-muted text-sm mb-2">
                {new Date(nextBooking.date).toISOString().split('T')[0]} at {nextBooking.timeSlot}
              </p>
              <p className="text-muted text-sm mb-4">
                {nextBooking.address || '12 Marine Drive, Mumbai'}
              </p>
              <div>
                <span className="badge" style={{background: '#E0F2FE', color: '#0369A1'}}>{nextBooking.status}</span>
              </div>
            </div>
          ) : (
             <div className="text-center p-6">
                <p className="text-muted mb-4">No upcoming bookings</p>
                <Link to="/book" className="btn btn-outline" style={{padding: '0.4rem 1rem'}}>Schedule Now</Link>
             </div>
          )}
        </div>
      </div>

      {/* Service Area */}
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div className="p-4 border-b border-gray-100">
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Service area</h3>
        </div>
        <div className="p-4">
          <div style={{
            height: '200px', 
            borderRadius: 'var(--radius-md)', 
            background: 'linear-gradient(to bottom right, #E0F2FE, #D1FAE5)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #E2E8F0'
          }}>
            <span style={{color: '#64748B'}}>Google Maps placeholder</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
