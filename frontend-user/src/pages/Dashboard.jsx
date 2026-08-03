import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Car, Sparkles, Gift, MapPin } from 'lucide-react';
import { getProfile, getServiceAreas } from '../api';

const VIZAG_COORDS = [17.7042, 83.2980];

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef(null);
  const leafletMapInstance = useRef(null);

  useEffect(() => {
    Promise.all([
      getProfile().catch(() => null),
      getServiceAreas().catch(() => [])
    ])
      .then(([prof, sAreas]) => {
        setProfile(prof);
        setAreas(sAreas);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Initialize Leaflet map and draw active regions
  useEffect(() => {
    if (loading || !mapContainerRef.current) return;

    const initUserMap = () => {
      if (leafletMapInstance.current || !window.L) return;

      const L = window.L;
      // Initialize map centered at Vizag or first region center
      const center = areas.length > 0 && areas[0].latitude ? [areas[0].latitude, areas[0].longitude] : VIZAG_COORDS;
      const map = L.map(mapContainerRef.current).setView(center, 12);
      leafletMapInstance.current = map;

      // Clean Light Map Layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; Service Areas Map'
      }).addTo(map);

      // Render coverage circles
      areas.forEach(area => {
        if (area.latitude && area.longitude && area.radius) {
          const circle = L.circle([area.latitude, area.longitude], {
            radius: area.radius,
            color: 'var(--primary-blue)',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 2
          }).addTo(map);

          circle.bindTooltip(`<strong>${area.name}</strong><br/>Doorstep coverage active!`, {
            permanent: false,
            direction: 'top'
          });
        }
      });
    };

    // Load Leaflet assets dynamically if not already loaded
    const loadLeafletAssets = () => {
      if (window.L) {
        initUserMap();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initUserMap();
      document.body.appendChild(script);
    };

    loadLeafletAssets();

    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, [loading, areas]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: 'var(--primary-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        Loading dashboard...
      </div>
    </div>
  );

  const stats = profile?.stats || { upcomingBookings: 0, totalWashes: 0, savedCars: 0, rewardPoints: 0 };
  const nextBooking = profile?.nextBooking;

  return (
    <div style={{maxWidth: '1000px', margin: '0 auto'}}>
      
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
          <h2 style={{margin: 0, fontSize: '1.75rem'}}>{profile?.points || 0}</h2>
          <p className="text-muted text-xs" style={{margin: 0}}>Redeem at checkout</p>
        </div>
      </div>

      {/* Next Booking */}
      <div className="card" style={{padding: 0, overflow: 'hidden', marginBottom: '1.5rem'}}>
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Next booking</h3>
          <Link to="/bookings" className="text-sm font-semibold" style={{color: 'var(--primary-navy)'}}>View all</Link>
        </div>
        
        <div className="p-4">
          {nextBooking ? (
            <div>
              <h3 style={{fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--primary-navy)'}}>{nextBooking.washType?.name || 'Wash Service'}</h3>
              <p className="text-muted text-sm mb-2">
                {new Date(nextBooking.date).toISOString().split('T')[0]} at {nextBooking.timeSlot}
              </p>
              <p className="text-muted text-sm mb-4">
                {nextBooking.address || '12 Sujatha Nagar, Vizag'}
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

      {/* Service Area Map */}
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <MapPin size={18} color="var(--primary-blue)" />
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Our Active Service Regions</h3>
        </div>
        <div className="p-4">
          <div 
            ref={mapContainerRef} 
            style={{
              height: '250px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid #E2E8F0',
              zIndex: 1
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
