import React, { useState, useEffect } from 'react';
import { getAssignedBookings, startBooking, completeBooking } from '../api';
import { 
  Phone, MapPin, Compass, CheckCircle, Camera, Navigation, AlertCircle, Sparkles,
  Shield, Bike, Droplets, Feather, Flame 
} from 'lucide-react';

const renderAddonIcon = (iconName, size = 14) => {
  if (!iconName) return <Sparkles size={size} />;
  const str = String(iconName).toLowerCase().trim();
  if (str.includes('shield') || str.includes('helmet') || str.includes('guard')) return <Shield size={size} />;
  if (str.includes('bike') || str.includes('scooter') || str.includes('two-wheeler')) return <Bike size={size} />;
  if (str.includes('droplet') || str.includes('rain') || str.includes('water') || str.includes('windshield')) return <Droplets size={size} />;
  if (str.includes('feather') || str.includes('pet') || str.includes('hair') || str.includes('fur')) return <Feather size={size} />;
  if (str.includes('flame') || str.includes('steam') || str.includes('engine') || str.includes('fire')) return <Flame size={size} />;
  if (str.includes('sparkle') || str.includes('ozone') || str.includes('clean') || str.includes('shine')) return <Sparkles size={size} />;

  if (iconName.length <= 4) return <span style={{ fontSize: `${size}px` }}>{iconName}</span>;
  return <Sparkles size={size} />;
};

const Schedule = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await getAssignedBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartService = async (id, fileInputEvent) => {
    const file = fileInputEvent.target.files[0];
    if (!file) return;

    setUploadingId(id);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;

      // Capture GPS location of employee
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser. Uploading without GPS.');
        submitStart(id, base64Image, null, null);
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            submitStart(id, base64Image, position.coords.latitude, position.coords.longitude);
          },
          (err) => {
            alert('Location permission denied. Uploading without GPS accuracy.');
            submitStart(id, base64Image, null, null);
          }
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const submitStart = async (id, photo, lat, lng) => {
    try {
      await startBooking(id, photo, lat, lng);
      alert('Job started! Proceed with servicing the vehicle.');
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert('Failed to start service.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleCompleteService = async (id, fileInputEvent) => {
    const file = fileInputEvent.target.files[0];
    if (!file) return;

    setUploadingId(id);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;

      // Capture GPS location of employee
      if (!navigator.geolocation) {
        alert('Geolocation is not supported. Completing without GPS.');
        submitComplete(id, base64Image, null, null);
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            submitComplete(id, base64Image, position.coords.latitude, position.coords.longitude);
          },
          (err) => {
            alert('Location permission denied. Completing without GPS.');
            submitComplete(id, base64Image, null, null);
          }
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const submitComplete = async (id, photo, lat, lng) => {
    try {
      await completeBooking(id, photo, lat, lng);
      alert('Job marked as completed successfully! Well done.');
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert('Failed to complete service.');
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading schedule...</div>;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)' }}>Your Assigned Bookings</h3>
        </div>
        
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {bookings.map(booking => {
            const date = new Date(booking.date).toLocaleDateString();
            const address = booking.address || 'User Address';
            const customerName = booking.user?.name || 'Customer';
            const customerPhone = booking.user?.phone || '';
            const carDetails = booking.car 
              ? `${booking.car.make} ${booking.car.model}` 
              : (booking.carMake && booking.carModel ? `${booking.carMake} ${booking.carModel}` : 'Vehicle');
            const carNumber = booking.car?.carNumber || booking.carNumber;
            const carType = booking.carType?.name || 'Standard';
            const washType = booking.washType?.name || 'Wash Plan';

            return (
              <div key={booking.id} style={{
                border: '1px solid #E2E8F0', 
                borderRadius: 'var(--radius-md)', 
                padding: '1.25rem',
                background: 'white',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary-navy)', fontSize: '1.1rem', fontWeight: 700 }}>
                      {washType} ({carType})
                    </h4>
                    <span style={{ fontSize: '0.8rem', background: '#F1F5F9', color: 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      Booking ID #{booking.id}
                    </span>
                  </div>
                  <span style={{
                    background: booking.status === 'COMPLETED' ? '#D1FAE5' : booking.status === 'STARTED' ? '#FEF3C7' : booking.status === 'CANCELLED' ? '#FEE2E2' : '#E0F2FE', 
                    color: booking.status === 'COMPLETED' ? '#065F46' : booking.status === 'STARTED' ? '#92400E' : booking.status === 'CANCELLED' ? '#DC2626' : '#0369A1', 
                    padding: '0.3rem 0.75rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.8rem', 
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {booking.status}
                  </span>
                </div>
                
                {/* Cancelled Notice for Employee */}
                {booking.status === 'CANCELLED' && (
                  <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DC2626', fontWeight: 800, fontSize: '0.9rem' }}>
                      <AlertCircle size={17} /> ⚠️ JOB CANCELLED
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#991B1B', lineHeight: 1.4 }}>
                      This service was cancelled by customer or administration. Do not proceed to the service location.
                    </p>
                    {booking.cancellationReason && (
                      <div style={{ fontSize: '0.78rem', color: '#7F1D1D', marginTop: '0.15rem' }}>
                        <strong>Cancellation Reason:</strong> {booking.cancellationReason}
                      </div>
                    )}
                  </div>
                )}

                {/* Details Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  
                  {/* Vehicle Make, Model and License Registration Plate */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--primary-navy)' }}>Vehicle:</strong>
                    <span style={{ fontWeight: 600 }}>{carDetails} ({carType})</span>
                    {carNumber ? (
                      <span style={{
                        background: '#0F172A',
                        color: '#F8FAFC',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '6px',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        fontSize: '0.85rem',
                        fontFamily: 'monospace',
                        border: '1.5px solid #334155',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
                      }}>
                        <span style={{ fontSize: '0.65rem', background: '#2563EB', color: 'white', padding: '0.1rem 0.35rem', borderRadius: '3px', fontWeight: 800 }}>IND</span>
                        {carNumber}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '4px', fontStyle: 'italic' }}>
                        No plate registered
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: 'var(--primary-navy)' }}>Customer:</strong> {customerName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: 'var(--primary-navy)' }}>Date & Time:</strong> {date} at {booking.timeSlot}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <MapPin size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{address}</span>
                  </div>
                </div>

                {/* Add-ons Requirement Checklist for Technician */}
                {booking.addons && booking.addons.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                    border: '1.5px solid #6EE7B7',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: '#065F46', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={16} color="#059669" /> Required Add-on Tasks ({booking.addons.length})
                      </span>
                      <span style={{ fontSize: '0.72rem', background: '#059669', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                        Technician Checklist
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.45rem' }}>
                      {booking.addons.map((ba, idx) => (
                        <div key={ba.id || idx} style={{
                          background: 'white',
                          border: '1px solid #A7F3D0',
                          borderRadius: '8px',
                          padding: '0.5rem 0.65rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {renderAddonIcon(ba.addon?.icon, 15)}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#065F46', lineHeight: 1.2 }}>
                              {ba.addon?.name || 'Add-on Service'}
                            </div>
                            {ba.addon?.description && (
                              <div style={{ fontSize: '0.72rem', color: '#047857', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ba.addon.description}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, background: '#DCFCE7', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                            ✓ Perform
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                  {booking.status === 'CANCELLED' ? (
                    <div style={{ color: '#DC2626', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={15} /> Service Closed — Job Cancelled
                    </div>
                  ) : (
                    <>
                      {/* Call Customer */}
                      {customerPhone && (
                        <a 
                          href={`tel:${customerPhone}`}
                          className="btn btn-outline"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-sm)' }}
                        >
                          <Phone size={16} /> Call Customer
                        </a>
                      )}

                      {/* Navigation Trigger */}
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Navigation size={16} /> Navigate
                      </a>

                      {/* Booking Flow Buttons */}
                      {booking.status === 'ASSIGNED' && (
                        <label style={{
                          background: 'var(--success)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.5rem 1.25rem', 
                          fontSize: '0.85rem', 
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Camera size={16} /> Start Service
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            onChange={(e) => handleStartService(booking.id, e)} 
                            style={{ display: 'none' }}
                            disabled={uploadingId === booking.id}
                          />
                        </label>
                      )}

                      {booking.status === 'STARTED' && (
                        <label style={{
                          background: 'var(--primary-blue)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.5rem 1.25rem', 
                          fontSize: '0.85rem', 
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <CheckCircle size={16} /> Complete Wash
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            onChange={(e) => handleCompleteService(booking.id, e)} 
                            style={{ display: 'none' }}
                            disabled={uploadingId === booking.id}
                          />
                        </label>
                      )}
                    </>
                  )}
                </div>

                {uploadingId === booking.id && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Compass size={14} className="animate-spin" /> Processing upload & capturing GPS credentials...
                  </div>
                )}
              </div>
            );
          })}
          
          {bookings.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No bookings assigned to you yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
