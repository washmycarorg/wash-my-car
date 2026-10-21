import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Car, Sparkles, Gift, MapPin, Share2, Copy, Check, Crown } from 'lucide-react';
import { getProfile, getServiceAreas, getSettings } from '../api';
import { loadGoogleMaps } from '../utils/googleMapsLoader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const VIZAG_COORDS = { lat: 17.7042, lng: 83.2980 };

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [areas, setAreas] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const mapContainerRef = useRef(null);
  const googleMapInstance = useRef(null);

  const handleCopyReferral = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  useEffect(() => {
    Promise.all([
      getProfile().catch(() => null),
      getServiceAreas().catch(() => []),
      getSettings().catch(() => null)
    ])
      .then(([prof, sAreas, sysSettings]) => {
        setProfile(prof);
        setAreas(sAreas);
        setSystemSettings(sysSettings);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Initialize Google Maps showing active regions with auto-framing and automatic zoom in/out
  useEffect(() => {
    if (loading || !mapContainerRef.current) return;

    let autoZoomTimer = null;
    let resizeObserver = null;

    const zoneCoordsFallback = {
      'maddilapalem': { lat: 17.7389, lng: 83.3184, radius: 5000 },
      'madhurawada': { lat: 17.8180, lng: 83.3512, radius: 5000 },
      'nad junction': { lat: 17.7428, lng: 83.2353, radius: 5000 },
      'old gajuwaka': { lat: 17.6863, lng: 83.2041, radius: 5000 },
      'gajuwaka': { lat: 17.6863, lng: 83.2041, radius: 5000 },
      'pendurthi': { lat: 17.8286, lng: 83.1973, radius: 5000 },
    };

    const initUserMap = () => {
      if (googleMapInstance.current || !window.google || !mapContainerRef.current) return;

      const maps = window.google.maps;

      // Create pure visual map: all interactive controls and gestures disabled
      const map = new maps.Map(mapContainerRef.current, {
        center: VIZAG_COORDS,
        zoom: 11,
        disableDefaultUI: true, // No map/sat buttons, street view pegman, zoom buttons, or fullscreen
        gestureHandling: 'none', // No touch or mouse gesture hijacking
        draggable: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        keyboardShortcuts: false,
        clickableIcons: false,
        mapTypeId: maps.MapTypeId.ROADMAP
      });
      googleMapInstance.current = map;

      const bounds = new maps.LatLngBounds();
      const validPoints = [];

      areas.forEach(area => {
        const nameKey = (area.name || '').toLowerCase().trim();
        const fallback = zoneCoordsFallback[nameKey] || {};
        const lat = Number(area.latitude || fallback.lat);
        const lng = Number(area.longitude || fallback.lng);
        const radiusMeters = Number(area.radius || fallback.radius || 5000);

        if (lat && lng) {
          validPoints.push({ lat, lng, radiusMeters, name: area.name });

          // Calculate latitude/longitude offsets based on radius so full circles fit comfortably
          const latOffset = (radiusMeters / 111000) * 1.15;
          const lngOffset = (radiusMeters / (111000 * Math.cos((lat * Math.PI) / 180))) * 1.15;

          bounds.extend({ lat: lat + latOffset, lng });
          bounds.extend({ lat: lat - latOffset, lng });
          bounds.extend({ lat, lng: lng + lngOffset });
          bounds.extend({ lat, lng: lng - lngOffset });

          // Draw coverage circles
          new maps.Circle({
            map: map,
            center: { lat, lng },
            radius: radiusMeters,
            fillColor: '#0284C7',
            fillOpacity: 0.16,
            strokeColor: '#0284C7',
            strokeOpacity: 0.75,
            strokeWeight: 1.5,
            clickable: false
          });

          // Pin marker with name label
          new maps.Marker({
            position: { lat, lng },
            map: map,
            title: area.name,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: '#0284C7',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            },
            label: {
              text: area.name,
              color: '#0F172A',
              fontSize: '11px',
              fontWeight: '700'
            },
            clickable: false
          });
        }
      });

      // Fit map bounds to show all covered locations clearly based on container size
      const fitAllCoveredLocations = () => {
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { top: 32, right: 32, bottom: 32, left: 32 });
        }
      };

      fitAllCoveredLocations();

      // Listen for container resize to automatically re-fit bounds on mobile/tablet/desktop
      if (window.ResizeObserver && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          fitAllCoveredLocations();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      // Automatic zoom in and zoom out showcase cycle (no user interaction required)
      if (validPoints.length > 0) {
        let cycleIndex = 0;
        let isZoomedIn = false;

        autoZoomTimer = setInterval(() => {
          if (!map || bounds.isEmpty()) return;

          if (!isZoomedIn) {
            // Smoothly pan & zoom in to highlight one of the operational hubs
            const targetPoint = validPoints[cycleIndex % validPoints.length];
            map.panTo({ lat: targetPoint.lat, lng: targetPoint.lng });
            setTimeout(() => {
              map.setZoom(13);
            }, 400);
            isZoomedIn = true;
            cycleIndex++;
          } else {
            // Smoothly zoom back out to encompass all covered locations
            fitAllCoveredLocations();
            isZoomedIn = false;
          }
        }, 6000);
      }
    };

    loadGoogleMaps()
      .then(() => initUserMap())
      .catch((err) => console.warn('Dashboard map load warning:', err));

    return () => {
      if (autoZoomTimer) clearInterval(autoZoomTimer);
      if (resizeObserver && mapContainerRef.current) {
        resizeObserver.disconnect();
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
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* 1. Greeting Section (Above Card) */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
          Welcome back,
        </p>
        <h1 style={{ color: 'var(--primary-navy)', margin: '0.15rem 0 0.25rem', fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', letterSpacing: '-0.02em' }}>
          {profile?.name || 'User'} <span style={{ fontSize: '1.6rem' }}>👋</span>
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Ready to get your car cleaned today?
        </p>
      </div>

      {/* 2. Top Advertisement Card with Admin-Configured Background Image */}
      <div style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.12)',
        minHeight: '210px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: '#0F172A'
      }}>
        {/* Background Image */}
        <img
          src={systemSettings?.dashboardAdImage || 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1600&q=85'}
          alt="Advertisement"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1600&q=85';
          }}
        />

        {/* Contrast Dark Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.62) 55%, rgba(15, 23, 42, 0.88) 100%)'
        }} />

        {/* Ad Content & Book a Wash CTA Button */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          padding: '1.6rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          maxWidth: '640px'
        }}>
          {/* Ad Badge */}
          <div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(245, 158, 11, 0.25)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              color: '#FCD34D',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              backdropFilter: 'blur(8px)'
            }}>
              ✨ {systemSettings?.dashboardAdBadge || 'LIMITED TIME OFFER • DOORSTEP SPECIAL'}
            </span>
          </div>

          <h2 style={{
            color: 'white',
            margin: '0.1rem 0',
            fontSize: '1.4rem',
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            textShadow: '0 2px 4px rgba(0,0,0,0.4)'
          }}>
            {systemSettings?.dashboardAdTitle || 'Special Doorstep Car Spa & Snow Foam Detailing'}
          </h2>

          <p style={{
            color: 'rgba(255, 255, 255, 0.88)',
            margin: '0 0 0.75rem',
            fontSize: '0.86rem',
            lineHeight: 1.45,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            {systemSettings?.dashboardAdSubtitle || 'Book a sparkling exterior foam wash and deep interior cabin sanitize with spot-free purified water at your doorstep.'}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {systemSettings?.bookingsEnabled === false ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid #EF4444',
                color: '#FCA5A5',
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                ● Slot Bookings Paused by Admin
              </div>
            ) : (
              <Link
                to="/book"
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #0284C7, #06B6D4)',
                  color: 'white',
                  fontWeight: 700,
                  padding: '0.65rem 1.4rem',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 6px 18px rgba(2, 132, 199, 0.45)',
                  border: 'none',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  transition: 'all 0.2s'
                }}
              >
                <Sparkles size={16} /> Book a Wash
              </Link>
            )}

            {systemSettings?.subscriptionsEnabled !== false && (
              <Link
                to="/subscriptions"
                style={{
                  background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                  color: '#92400E',
                  fontWeight: 800,
                  padding: '0.65rem 1.25rem',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                  border: '1.5px solid #F59E0B',
                  textDecoration: 'none',
                  fontSize: '0.88rem'
                }}
              >
                <Crown size={16} color="#D97706" /> VIP Pass
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. 4-Grid Stats (Clickable, 2x2 on mobile, 4-col on desktop) */}
      <div className="dashboard-stats-grid">
        {/* 1. Upcoming Bookings -> /bookings */}
        <Link to="/bookings" className="stat-card-clickable" style={{ borderLeft: '4px solid #0284C7' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Upcoming
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={17} color="#0284C7" />
              </div>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
              {stats.upcomingBookings}
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 600, marginTop: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
            View bookings →
          </span>
        </Link>

        {/* 2. Total Washes -> /bookings */}
        <Link to="/bookings" className="stat-card-clickable" style={{ borderLeft: '4px solid #0D9488' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Total Washes
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFEFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={17} color="#0D9488" />
              </div>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
              {stats.totalWashes}
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#0D9488', fontWeight: 600, marginTop: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
            Wash history →
          </span>
        </Link>

        {/* 3. Saved Cars -> /cars */}
        <Link to="/cars" className="stat-card-clickable" style={{ borderLeft: '4px solid #7C3AED' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Saved Cars
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Car size={17} color="#7C3AED" />
              </div>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
              {stats.savedCars}
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600, marginTop: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
            Manage cars →
          </span>
        </Link>

        {/* 4. Reward Points -> /rewards */}
        <Link to="/rewards" className="stat-card-clickable" style={{ borderLeft: '4px solid #D97706' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Reward Points
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={17} color="#D97706" />
              </div>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
              {profile?.points || 0}
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 600, marginTop: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
            Redeem rewards →
          </span>
        </Link>
      </div>

      {/* 4. Refer & Earn Advertisement Card (Shown only if Referral Program is enabled by admin) */}
      {(systemSettings?.referralEnabled !== false && profile?.stats?.referralSettings?.enabled !== false) && (
        <div style={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
          border: '1px solid rgba(165, 180, 252, 0.25)',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.22)',
          padding: '1.5rem',
          color: 'white'
        }}>
          {/* Subtle decorative glowing background shapes */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(168, 85, 247, 0) 70%)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '20%',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0) 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.6rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                color: '#FCD34D',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                backdropFilter: 'blur(8px)'
              }}>
                🎁 REFER & EARN BONUS
              </span>

              <Link
                to="/rewards"
                style={{
                  color: '#93C5FD',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  textDecoration: 'none'
                }}
              >
                View Reward Milestones →
              </Link>
            </div>

            <h3 style={{
              margin: '0 0 0.35rem',
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              lineHeight: 1.3
            }}>
              Invite Friends & Earn {systemSettings?.referralRewardPoints || profile?.stats?.referralSettings?.rewardPoints || 50} Points for Every Wash!
            </h3>

            <p style={{
              margin: '0 0 1.1rem',
              color: 'rgba(255, 255, 255, 0.82)',
              fontSize: '0.85rem',
              lineHeight: 1.45,
              maxWidth: '540px'
            }}>
              Share your personal referral code. When your friend completes their first doorstep wash, you earn bonus loyalty points directly to your wallet!
            </p>

            {/* Code Box & Share CTA */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              {/* Code Pill */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px dashed rgba(255, 255, 255, 0.35)',
                borderRadius: '12px',
                padding: '0.45rem 0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                backdropFilter: 'blur(6px)'
              }}>
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    Your Code
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FCD34D', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
                    {profile?.referralCode || 'WMCVIP'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyReferral}
                  style={{
                    background: copiedCode ? '#10B981' : 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem 0.65rem',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}
                  title="Copy Referral Code"
                >
                  {copiedCode ? (
                    <>
                      <Check size={14} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </button>
              </div>

              {/* Quick WhatsApp Share Button */}
              <a
                href={`https://wa.me/?text=Hey!%20Get%20a%20doorstep%20car%20wash%20with%20Wash%20My%20Car.%20Use%20my%20referral%20code%20${profile?.referralCode || ''}%20to%20get%20started:%20${encodeURIComponent(window.location.origin + '/register?ref=' + (profile?.referralCode || ''))}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#25D366',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '0.6rem 1.1rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)',
                  transition: 'all 0.2s'
                }}
              >
                <Share2 size={15} /> Share via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

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
      <div className="card" style={{padding: 0, overflow: 'hidden', borderRadius: '18px', border: '1.5px solid #E2E8F0'}}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          background: '#FAFCFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={16} color="var(--primary-blue)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--primary-navy)', fontWeight: 800 }}>
                Our Active Service Regions
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Doorstep mobile wash coverage across Visakhapatnam
              </p>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#047857',
            padding: '0.25rem 0.65rem',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: 800
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            <span>Auto-Framed Coverage View</span>
          </div>
        </div>

        <div style={{ padding: '0.75rem', position: 'relative' }}>
          <div 
            ref={mapContainerRef} 
            style={{
              height: '260px', 
              width: '100%',
              borderRadius: '14px', 
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              background: '#F1F5F9'
            }}
          />
        </div>

        {/* Operational Hubs Chips */}
        {areas && areas.length > 0 && (
          <div style={{
            padding: '0.65rem 1.25rem 1rem',
            borderTop: '1px solid #F8FAFC',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            flexWrap: 'wrap',
            background: '#FAFCFF'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '0.25rem' }}>
              Covered Zones:
            </span>
            {areas.map(a => (
              <span
                key={a.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#1E293B',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span style={{ color: '#0284C7' }}>📍</span> {a.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
