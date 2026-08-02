import React, { useState, useEffect, useRef } from 'react';
import { getBookings, assignSlot, autoAssignSlot, getEmployees } from '../api';
import { Calendar, User, Car, MapPin, Compass, Image, Eye, RefreshCw, CheckCircle, Navigation, AlertCircle } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verification Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const mapContainerRef = useRef(null);

  const fetchData = async () => {
    try {
      const bRes = await getBookings();
      const eRes = await getEmployees();
      setBookings(bRes);
      setEmployees(eRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualAssign = async (bookingId, employeeId) => {
    try {
      await assignSlot(bookingId, employeeId);
      alert('Employee assigned successfully.');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign employee.');
    }
  };

  const handleAutoAssign = async (bookingId) => {
    try {
      const res = await autoAssignSlot(bookingId);
      alert(res.message || 'Auto-assignment completed.');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Auto-assignment failed. No on-duty employees serve this area.');
    }
  };

  // Helper to calculate distance between coordinates (Haversine formula in meters)
  const getDistanceStr = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 'N/A';
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;

    if (d < 1000) {
      return `${Math.round(d)} meters`;
    }
    return `${(d / 1000).toFixed(2)} km`;
  };

  // Initialize Map inside the Verification Modal
  useEffect(() => {
    if (selectedBooking && showMap && mapContainerRef.current && window.google && window.google.maps) {
      const userPos = { lat: selectedBooking.latitude, lng: selectedBooking.longitude };
      
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: userPos,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true
      });

      // 1. User Booked Destination Pin (Green)
      new window.google.maps.Marker({
        position: userPos,
        map,
        title: "User Destination",
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
      });

      // 2. Employee Start Job Pin (Orange)
      if (selectedBooking.startLatitude && selectedBooking.startLongitude) {
        new window.google.maps.Marker({
          position: { lat: selectedBooking.startLatitude, lng: selectedBooking.startLongitude },
          map,
          title: "Employee Started Job Here",
          icon: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'
        });
      }

      // 3. Employee Complete Job Pin (Purple)
      if (selectedBooking.endLatitude && selectedBooking.endLongitude) {
        new window.google.maps.Marker({
          position: { lat: selectedBooking.endLatitude, lng: selectedBooking.endLongitude },
          map,
          title: "Employee Completed Job Here",
          icon: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png'
        });
      }
    }
  }, [selectedBooking, showMap]);

  // Load Maps SDK if not already loaded, when user clicks verification map
  const openVerificationModal = (booking) => {
    setSelectedBooking(booking);
    setShowMap(true);
    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {};
      document.head.appendChild(script);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading bookings...</div>;

  return (
    <div className="card animate-fade-in" style={{ padding: 0, overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 style={{ margin: 0 }}>Slots Details & Assignment</h3>
        <button onClick={fetchData} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
        <thead style={{ background: '#F8FAFC' }}>
          <tr>
            <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Booking ID</th>
            <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Customer & Car</th>
            <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Wash & Area</th>
            <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Date & Price</th>
            <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
            <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Assignment Actions</th>
            <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Service Pics</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            // Find active, on duty employees who serve this booking's serviceAreaId
            const eligibleEmployees = employees.filter(emp => 
              emp.status === 'ACTIVE' && 
              emp.onDuty && 
              emp.serviceAreas.some(sa => sa.id === b.serviceAreaId)
            );

            return (
              <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-gray-50">
                
                {/* ID */}
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>#{b.id}</td>
                
                {/* Customer Details */}
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{b.user?.name || 'User'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.user?.phone}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                    <Car size={12} /> {b.car ? `${b.car.make} ${b.car.model}` : 'Generic Vehicle'}
                  </div>
                </td>
                
                {/* Wash and Area details */}
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{b.washType?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type: {b.carType?.name}</div>
                  <span style={{ fontSize: '0.75rem', background: 'var(--accent-teal-light)', color: 'var(--primary-navy)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.25rem', fontWeight: 600 }}>
                    {b.serviceArea?.name || 'Local'}
                  </span>
                </td>
                
                {/* Date & Price */}
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ fontWeight: 600 }}>{new Date(b.date).toLocaleDateString()}</div>
                  <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>{b.timeSlot}</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>₹{b.price}</div>
                </td>
                
                {/* Status */}
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <span className={`badge ${b.status === 'COMPLETED' ? 'badge-success' : b.status === 'STARTED' ? 'badge-warning' : 'badge-primary'}`}>
                    {b.status}
                  </span>
                </td>
                
                {/* Assignment triggers */}
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  {b.employeeId ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {b.employee?.photo ? (
                          <img src={b.employee.photo} alt="Emp" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            {b.employee?.name[0]}
                          </div>
                        )}
                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{b.employee?.name}</span>
                      </div>
                      {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }}
                            onClick={() => handleManualAssign(b.id, '')}
                          >
                            Unassign
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '200px' }}>
                      <select 
                        className="form-input" 
                        style={{ padding: '0.35rem', fontSize: '0.85rem', marginBottom: 0 }}
                        onChange={(e) => handleManualAssign(b.id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Manual Assign</option>
                        {eligibleEmployees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} (Duty: Yes)</option>
                        ))}
                      </select>
                      
                      <button 
                        onClick={() => handleAutoAssign(b.id)}
                        className="btn btn-teal"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: '100%', borderRadius: '4px' }}
                      >
                        Auto-Assign
                      </button>
                    </div>
                  )}
                </td>

                {/* Service Pics Button */}
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  {b.status === 'STARTED' || b.status === 'COMPLETED' ? (
                    <button 
                      onClick={() => openVerificationModal(b)}
                      className="btn btn-outline"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: '4px' }}
                    >
                      <Eye size={14} /> Verify Pics
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not started</span>
                  )}
                </td>

              </tr>
            );
          })}
          {bookings.length === 0 && (
            <tr>
              <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No wash orders found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Verify Service Accuracy Modal */}
      {showMap && selectedBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(13, 38, 80, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '750px', background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-navy)' }}>
                Verify Service Accuracy (Booking #{selectedBooking.id})
              </h3>
              <button 
                onClick={() => { setShowMap(false); setSelectedBooking(null); }}
                className="btn btn-outline"
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>

            {/* Photos Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-navy)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Image size={16} /> Before Servicing
                </h4>
                {selectedBooking.startImage ? (
                  <img 
                    src={selectedBooking.startImage} 
                    alt="Before service" 
                    style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }} 
                  />
                ) : (
                  <div style={{ height: '200px', borderRadius: 'var(--radius-md)', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed #CBD5E1' }}>
                    No start picture uploaded yet.
                  </div>
                )}
                {selectedBooking.startAt && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'center' }}>
                    Uploaded: {new Date(selectedBooking.startAt).toLocaleTimeString()}
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-navy)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Image size={16} /> After Servicing
                </h4>
                {selectedBooking.endImage ? (
                  <img 
                    src={selectedBooking.endImage} 
                    alt="After service" 
                    style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }} 
                  />
                ) : (
                  <div style={{ height: '200px', borderRadius: 'var(--radius-md)', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed #CBD5E1' }}>
                    No completion picture uploaded yet.
                  </div>
                )}
                {selectedBooking.endAt && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'center' }}>
                    Uploaded: {new Date(selectedBooking.endAt).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>

            {/* GPS Map Pinpoints */}
            <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-navy)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Compass size={16} /> Location Accuracy Track (Google Map Pinpoints)
            </h4>
            <div 
              ref={mapContainerRef} 
              style={{
                height: '240px',
                borderRadius: 'var(--radius-md)',
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                marginBottom: '1rem'
              }}
            >
              {!GOOGLE_MAPS_API_KEY && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <AlertCircle size={24} style={{ marginBottom: '0.25rem' }} />
                  Google Maps SDK could not be loaded because VITE_GOOGLE_MAPS_API_KEY is missing.
                </div>
              )}
            </div>

            {/* Accuracy Calculations */}
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary-blue)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span><strong>User Target Location Coords:</strong></span>
                <span>{selectedBooking.latitude.toFixed(5)}, {selectedBooking.longitude.toFixed(5)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span><strong>Employee Start Location Coords:</strong></span>
                <span>
                  {selectedBooking.startLatitude && selectedBooking.startLongitude
                    ? `${selectedBooking.startLatitude.toFixed(5)}, ${selectedBooking.startLongitude.toFixed(5)}`
                    : 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span><strong>Employee Complete Location Coords:</strong></span>
                <span>
                  {selectedBooking.endLatitude && selectedBooking.endLongitude
                    ? `${selectedBooking.endLatitude.toFixed(5)}, ${selectedBooking.endLongitude.toFixed(5)}`
                    : 'N/A'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: '0.75rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                <span>Start Picture Deviation (Accuracy):</span>
                <span>
                  {getDistanceStr(selectedBooking.latitude, selectedBooking.longitude, selectedBooking.startLatitude, selectedBooking.startLongitude)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                <span>Complete Picture Deviation (Accuracy):</span>
                <span>
                  {getDistanceStr(selectedBooking.latitude, selectedBooking.longitude, selectedBooking.endLatitude, selectedBooking.endLongitude)}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Custom hover CSS */}
      <style>{`
        tr.hover\\:bg-gray-50:hover { background-color: #F8FAFC; }
      `}</style>
    </div>
  );
};

export default Bookings;
