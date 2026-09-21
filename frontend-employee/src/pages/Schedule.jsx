import React, { useState, useEffect } from 'react';
import { getAssignedBookings, startBooking, completeBooking } from '../api';
import { Phone, MapPin, Compass, CheckCircle, Camera, Navigation, AlertCircle } from 'lucide-react';

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
              : 'User Vehicle';
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
                    background: booking.status === 'COMPLETED' ? '#D1FAE5' : booking.status === 'STARTED' ? '#FEF3C7' : '#E0F2FE', 
                    color: booking.status === 'COMPLETED' ? '#065F46' : booking.status === 'STARTED' ? '#92400E' : '#0369A1', 
                    padding: '0.3rem 0.75rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    {booking.status}
                  </span>
                </div>
                
                {/* Details Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>Vehicle:</strong> {carDetails}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>Customer:</strong> {customerName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>Date & Time:</strong> {date} at {booking.timeSlot}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <MapPin size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{address}</span>
                  </div>
                </div>

                {/* Add-ons Requirement Pill for Technician */}
                {booking.addons && booking.addons.length > 0 && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#15803D', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      ✨ Additional Add-on Tasks ({booking.addons.length})
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {booking.addons.map(ba => (
                        <span key={ba.id} style={{ background: 'white', border: '1px solid #86EFAC', color: '#166534', padding: '0.25rem 0.55rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span>{ba.addon?.icon || '➕'}</span>
                          <span>{ba.addon?.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                  
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
