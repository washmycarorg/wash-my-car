import React, { useState, useEffect } from 'react';
import { getAssignedBookings, startBooking, completeBooking, reportBookingIssue, markDoorstepRejection } from '../api';
import { initPushNotifications } from '../utils/pushManager';
import { 
  Phone, MapPin, Compass, CheckCircle, Camera, Navigation, AlertCircle, Sparkles,
  Shield, Bike, Droplets, Feather, Flame, AlertTriangle, X, Clock, Calendar, CheckCircle2,
  ArrowRight, XCircle, RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

// Parse time slot to minutes from midnight for accurate chronological sorting
const parseSlotMinutes = (timeSlot) => {
  if (!timeSlot) return 9999;
  const match = timeSlot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 9999;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const getLocalDateStr = (dateInput) => {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ISSUE_OPTIONS = [
  'Customer Not Available at Home',
  'Not Lifting Call',
  'Given Location is Wrong',
  'House Locked / Gate Closed',
  'Customer Postponed / Rescheduled',
  'Other Issue'
];

const Schedule = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);

  // Issue Reporting Modal State
  const [reportModalBooking, setReportModalBooking] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState('Customer Not Available at Home');
  const [issueNote, setIssueNote] = useState('');
  const [reportingLoading, setReportingLoading] = useState(false);

  // Doorstep Rejection / Customer Unavailable Modal State
  const [doorstepModalBooking, setDoorstepModalBooking] = useState(null);
  const [doorstepNote, setDoorstepNote] = useState('');
  const [doorstepLoading, setDoorstepLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
    initPushNotifications().catch(e => console.warn('Push init:', e));
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await getAssignedBookings();
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
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

      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser. Uploading without GPS.');
        submitStart(id, base64Image, null, null);
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            submitStart(id, base64Image, position.coords.latitude, position.coords.longitude);
          },
          (err) => {
            alert('Location permission denied or unavailable. Uploading without GPS coordinates.');
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
      alert('Job started! You can now proceed with servicing the vehicle.');
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert('Failed to start service: ' + (err.message || 'Unknown error'));
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
      alert('Wash marked as COMPLETED successfully! Great work.');
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert('Failed to complete service: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingId(null);
    }
  };

  // Open Issue Report Modal
  const openReportModal = (booking) => {
    setReportModalBooking(booking);
    setSelectedIssue(booking.reportedIssue || 'Customer Not Available at Home');
    setIssueNote(booking.reportedIssueNote || '');
  };

  // Submit Issue Report
  const handleSubmitIssueReport = async (e) => {
    e.preventDefault();
    if (!reportModalBooking) return;

    setReportingLoading(true);
    try {
      await reportBookingIssue(reportModalBooking.id, selectedIssue, issueNote);
      alert('Issue reported to administration successfully. Admin will review and assist.');
      setReportModalBooking(null);
      fetchBookings();
    } catch (err) {
      alert('Failed to report issue: ' + (err.message || 'Unknown error'));
    } finally {
      setReportingLoading(false);
    }
  };

  // Submit Doorstep Rejection / Unavailability with ₹99 fee deduction
  const handleConfirmDoorstepRejection = async () => {
    if (!doorstepModalBooking) return;

    setDoorstepLoading(true);
    try {
      const res = await markDoorstepRejection(doorstepModalBooking.id, doorstepNote || 'Customer not available / rejected upon arrival');
      alert(res.message || 'Doorstep rejection recorded. ₹99 fee deduction applied.');
      setDoorstepModalBooking(null);
      setDoorstepNote('');
      fetchBookings();
    } catch (err) {
      alert('Failed to mark doorstep rejection: ' + (err.message || 'Unknown error'));
    } finally {
      setDoorstepLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading assigned slots...</div>;

  // Filter and sort bookings:
  // Non-completed slots (ASSIGNED, STARTED, CANCELLED)
  const todayStr = getLocalDateStr(new Date());

  // Show pending/active and cancelled slots on this page (completed goes to /completed)
  const pendingOrActiveBookings = bookings.filter(b => b.status !== 'COMPLETED');

  // Sorting logic:
  // Today's pending slots come FIRST (sorted chronologically by time slot)
  // Followed by future pending slots (sorted by date ascending, then time slot)
  // Followed by cancelled or other slots
  const sortedBookings = [...pendingOrActiveBookings].sort((a, b) => {
    const aDateStr = getLocalDateStr(a.date);
    const bDateStr = getLocalDateStr(b.date);

    const aIsPendingToday = aDateStr === todayStr && ['ASSIGNED', 'STARTED'].includes(a.status);
    const bIsPendingToday = bDateStr === todayStr && ['ASSIGNED', 'STARTED'].includes(b.status);

    if (aIsPendingToday && !bIsPendingToday) return -1;
    if (!aIsPendingToday && bIsPendingToday) return 1;

    if (aIsPendingToday && bIsPendingToday) {
      return parseSlotMinutes(a.timeSlot) - parseSlotMinutes(b.timeSlot);
    }

    // Both are not today pending: sort active before cancelled
    const aIsActive = ['ASSIGNED', 'STARTED'].includes(a.status);
    const bIsActive = ['ASSIGNED', 'STARTED'].includes(b.status);
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    // Compare date
    if (aDateStr !== bDateStr) {
      return new Date(aDateStr) - new Date(bDateStr);
    }

    // Same date: compare time slot
    return parseSlotMinutes(a.timeSlot) - parseSlotMinutes(b.timeSlot);
  });

  const todayCount = sortedBookings.filter(b => getLocalDateStr(b.date) === todayStr && ['ASSIGNED', 'STARTED'].includes(b.status)).length;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Banner / Info Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-navy) 0%, var(--primary-blue) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        color: 'white',
        marginBottom: '1.25rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Assigned Slots</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
              Today's pending slots sorted by schedule time
            </p>
          </div>
          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.15)', padding: '0.4rem 0.85rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{todayCount}</div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Tasks</div>
          </div>
        </div>

        {/* Link to Completed Slots page */}
        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Looking for finished jobs?</span>
          <Link 
            to="/completed" 
            style={{ 
              color: '#38BDF8', 
              fontSize: '0.82rem', 
              fontWeight: 700, 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.3rem',
              background: 'rgba(255,255,255,0.1)',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px'
            }}
          >
            <CheckCircle2 size={13} /> View Completed Slots <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
            Active Tasks Queue ({sortedBookings.length})
          </span>
          <button 
            onClick={fetchBookings} 
            className="btn btn-outline" 
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
          >
            Refresh List
          </button>
        </div>
        
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {sortedBookings.map(booking => {
            const isToday = getLocalDateStr(booking.date) === todayStr;
            const dateDisplay = new Date(booking.date).toLocaleDateString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });
            const address = booking.address || 'User Address';
            const customerName = booking.user?.name || 'Customer';
            const customerPhone = booking.user?.phone || '';
            const alternatePhone = booking.alternatePhone || '';
            const carDetails = booking.car 
              ? `${booking.car.make} ${booking.car.model}` 
              : (booking.carMake && booking.carModel ? `${booking.carMake} ${booking.carModel}` : 'Vehicle');
            const carNumber = booking.car?.carNumber || booking.carNumber;
            const carType = booking.carType?.name || 'Standard';
            const washType = booking.washType?.name || 'Wash Plan';

            return (
              <div 
                key={booking.id} 
                style={{
                  border: isToday ? '2px solid #38BDF8' : '1px solid #E2E8F0', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '1.25rem',
                  background: isToday ? '#F8FCFF' : 'white',
                  boxShadow: isToday ? '0 4px 12px rgba(14, 165, 233, 0.12)' : 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative'
                }}
              >
                {/* Today's Priority Badge */}
                {isToday && ['ASSIGNED', 'STARTED'].includes(booking.status) && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '16px',
                    background: '#0284C7',
                    color: 'white',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '10px',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                  }}>
                    ⚡ TODAY'S SCHEDULE
                  </div>
                )}

                {/* Card Header: Wash Type & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: isToday ? '0.25rem' : 0 }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary-navy)', fontSize: '1.1rem', fontWeight: 800 }}>
                      {washType} ({carType})
                    </h4>
                    <span style={{ fontSize: '0.78rem', background: '#F1F5F9', color: 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      Booking #{booking.bookingId || booking.id}
                    </span>
                  </div>
                  <span style={{
                    background: booking.status === 'STARTED' ? '#FEF3C7' : booking.status === 'CANCELLED' ? '#FEE2E2' : '#E0F2FE', 
                    color: booking.status === 'STARTED' ? '#92400E' : booking.status === 'CANCELLED' ? '#DC2626' : '#0369A1', 
                    padding: '0.3rem 0.75rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.78rem', 
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}>
                    {booking.status}
                  </span>
                </div>
                
                {/* Cancelled Notice & Doorstep Fee Badge */}
                {booking.status === 'CANCELLED' && (
                  <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DC2626', fontWeight: 800, fontSize: '0.88rem' }}>
                      <AlertCircle size={16} /> ⚠️ JOB CANCELLED
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#991B1B', lineHeight: 1.4 }}>
                      This service was cancelled. Do not proceed to customer's location.
                    </p>
                    {booking.cancellationReason && (
                      <div style={{ fontSize: '0.78rem', color: '#7F1D1D', marginTop: '0.15rem' }}>
                        <strong>Reason:</strong> {booking.cancellationReason}
                      </div>
                    )}
                    {booking.doorstepFeeDeducted > 0 && (
                      <div style={{ marginTop: '0.35rem', background: '#FEF3C7', color: '#92400E', padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>🚪</span> ₹99 Doorstep Rejection / Unavailability Fee Applied
                      </div>
                    )}
                  </div>
                )}

                {/* Rescheduled Notice Banner */}
                {booking.rescheduledAt && (
                  <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1E40AF', fontWeight: 800 }}>
                      <RotateCcw size={14} /> Rescheduled by {booking.rescheduledBy || 'Admin'}
                    </div>
                    {booking.rescheduledReason && (
                      <div style={{ color: '#1E3A8A' }}>
                        <strong>Reason:</strong> {booking.rescheduledReason}
                      </div>
                    )}
                    {booking.originalDate && (
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        Original Slot: {new Date(booking.originalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({booking.originalTimeSlot})
                      </div>
                    )}
                  </div>
                )}

                {/* Prominent Doorstep Issue Banner if already reported */}
                {booking.reportedIssue && (
                  <div style={{
                    background: '#FFFBEB',
                    border: '1.5px solid #FCD34D',
                    borderRadius: '8px',
                    padding: '0.75rem 0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertTriangle size={15} color="#D97706" /> REPORTED TO ADMIN: {booking.reportedIssue}
                      </span>
                      {booking.reportedIssueAt && (
                        <span style={{ fontSize: '0.7rem', color: '#92400E' }}>
                          {new Date(booking.reportedIssueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {booking.reportedIssueNote && (
                      <div style={{ fontSize: '0.78rem', color: '#78350F', fontStyle: 'italic' }}>
                        "{booking.reportedIssueNote}"
                      </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: '#92400E', marginTop: '0.15rem' }}>
                      Admin team has been notified. You can update this status below if anything changes.
                    </div>
                  </div>
                )}

                {/* Details Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  
                  {/* Vehicle & Plate */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--primary-navy)' }}>Vehicle:</strong>
                    <span style={{ fontWeight: 600 }}>{carDetails} ({carType})</span>
                    {carNumber ? (
                      <span style={{
                        background: '#0F172A',
                        color: '#F8FAFC',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '6px',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        fontSize: '0.82rem',
                        fontFamily: 'monospace',
                        border: '1.5px solid #334155',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <span style={{ fontSize: '0.62rem', background: '#2563EB', color: 'white', padding: '0.05rem 0.3rem', borderRadius: '2px', fontWeight: 800 }}>IND</span>
                        {carNumber}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '4px', fontStyle: 'italic' }}>
                        No plate registered
                      </span>
                    )}
                  </div>

                  {/* Customer Info & Alt Phone */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--primary-navy)' }}>Customer:</strong> 
                      <span style={{ fontWeight: 600 }}>{customerName}</span>
                      {customerPhone && (
                        <a 
                          href={`tel:${customerPhone}`}
                          style={{
                            color: 'var(--primary-blue)',
                            fontWeight: 700,
                            textDecoration: 'none',
                            fontSize: '0.84rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: '#F0F9FF',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #BAE6FD'
                          }}
                        >
                          <Phone size={12} /> {customerPhone}
                        </a>
                      )}
                    </div>

                    {/* Prominent Alternative Phone if customer provided one */}
                    {alternatePhone && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        background: '#FEF3C7',
                        border: '1.5px dashed #F59E0B',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        width: 'fit-content'
                      }}>
                        <strong style={{ color: '#92400E' }}>Alt Contact:</strong>
                        <a 
                          href={`tel:${alternatePhone}`} 
                          style={{ color: '#B45309', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Phone size={13} color="#D97706" /> {alternatePhone}
                        </a>
                        <span style={{ fontSize: '0.68rem', background: '#F59E0B', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                          BACKUP PHONE
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Date & Time Slot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: 'var(--primary-navy)' }}>Schedule:</strong> 
                    <span style={{ color: isToday ? '#0284C7' : 'inherit', fontWeight: isToday ? 800 : 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={14} /> {dateDisplay}
                    </span>
                    <span style={{ color: '#0F172A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      <Clock size={13} /> {booking.timeSlot}
                    </span>
                    {booking.slotId && (
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.72rem', background: '#E0F2FE', color: '#0369A1', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #BAE6FD' }}>
                        {booking.slotId}
                      </span>
                    )}
                  </div>

                  {/* Location & Address */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <MapPin size={17} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ lineHeight: 1.35 }}>{address}</span>
                  </div>
                </div>

                {/* Add-ons Checklist */}
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
                        <Sparkles size={16} color="#059669" /> Required Add-ons ({booking.addons.length})
                      </span>
                      <span style={{ fontSize: '0.72rem', background: '#059669', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                        Technician Tasks
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem', alignItems: 'center' }}>
                  {booking.status === 'CANCELLED' ? (
                    <div style={{ color: '#DC2626', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={15} /> Service Closed — Job Cancelled
                    </div>
                  ) : (
                    <>
                      {/* Call Customer (Primary) */}
                      {customerPhone && (
                        <a 
                          href={`tel:${customerPhone}`}
                          className="btn btn-outline"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-sm)' }}
                        >
                          <Phone size={15} /> Call Customer
                        </a>
                      )}

                      {/* Call Alternate Phone (if provided by customer) */}
                      {alternatePhone && (
                        <a 
                          href={`tel:${alternatePhone}`}
                          style={{
                            background: '#FEF3C7',
                            color: '#92400E',
                            border: '1.5px solid #F59E0B',
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            borderRadius: 'var(--radius-sm)',
                            textDecoration: 'none',
                            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.2)'
                          }}
                        >
                          <Phone size={15} color="#D97706" /> Call Alt Phone
                        </a>
                      )}

                      {/* Navigation Trigger */}
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Navigation size={15} /> Navigate
                      </a>

                      {/* Report Issue Button (Always available for active slots) */}
                      <button
                        type="button"
                        onClick={() => openReportModal(booking)}
                        style={{
                          background: booking.reportedIssue ? '#FEF3C7' : '#FFF7ED',
                          color: booking.reportedIssue ? '#B45309' : '#C2410C',
                          border: booking.reportedIssue ? '1.5px solid #F59E0B' : '1px solid #FDBA74',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <AlertTriangle size={15} />
                        {booking.reportedIssue ? 'Update Issue' : 'Report Issue'}
                      </button>

                      {/* Customer Unavailable / Doorstep Rejection Button (₹99 Fee Cut Policy) */}
                      {['ASSIGNED', 'STARTED'].includes(booking.status) && (
                        <button
                          type="button"
                          onClick={() => {
                            setDoorstepModalBooking(booking);
                            setDoorstepNote('');
                          }}
                          style={{
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1.5px solid #FCA5A5',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                          title="Customer not available or rejected upon arrival (₹99 fee policy)"
                        >
                          <XCircle size={15} color="#DC2626" /> Customer Unavailable (₹99 Cut)
                        </button>
                      )}

                      {/* Booking Flow Buttons: Start Service */}
                      {booking.status === 'ASSIGNED' && (
                        <label style={{
                          background: 'var(--success)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.45rem 1rem', 
                          fontSize: '0.82rem', 
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          marginLeft: 'auto'
                        }}>
                          <Camera size={15} /> Start Service
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

                      {/* Booking Flow Buttons: Complete Wash */}
                      {booking.status === 'STARTED' && (
                        <label style={{
                          background: 'var(--primary-blue)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.45rem 1rem', 
                          fontSize: '0.82rem', 
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          marginLeft: 'auto'
                        }}>
                          <CheckCircle size={15} /> Complete Wash
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
          
          {sortedBookings.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} color="#CBD5E1" style={{ margin: '0 auto 0.75rem auto', display: 'block' }} />
              <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary-navy)' }}>No pending assigned slots</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                You have no pending bookings right now. New tasks assigned by admin will appear here instantly.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Doorstep Issue Reporting Modal */}
      {reportModalBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="card" style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: '#C2410C', fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={20} color="#EA580C" /> Report Doorstep Issue
              </h3>
              <button
                type="button"
                onClick={() => setReportModalBooking(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} color="#64748B" />
              </button>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.86rem', color: '#475569', lineHeight: 1.4 }}>
              Reporting an issue for <strong>Booking #{reportModalBooking.bookingId || reportModalBooking.id}</strong> ({reportModalBooking.user?.name || 'Customer'}). This immediately alerts administration.
            </p>

            <form onSubmit={handleSubmitIssueReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Issue Type Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.4rem' }}>
                  Select Doorstep Issue Type
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ISSUE_OPTIONS.map(opt => (
                    <label 
                      key={opt}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: selectedIssue === opt ? '2px solid #EA580C' : '1px solid #E2E8F0',
                        background: selectedIssue === opt ? '#FFF7ED' : 'white',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: selectedIssue === opt ? 700 : 500,
                        color: selectedIssue === opt ? '#9A3412' : '#334155'
                      }}
                    >
                      <input
                        type="radio"
                        name="issueType"
                        value={opt}
                        checked={selectedIssue === opt}
                        onChange={() => setSelectedIssue(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Optional Additional Note */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="e.g. Called twice, rang bell 3 times, neighbor says out of station..."
                  value={issueNote}
                  onChange={e => setIssueNote(e.target.value)}
                  style={{ width: '100%', marginBottom: 0, fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setReportModalBooking(null)}
                  disabled={reportingLoading}
                  className="btn btn-outline"
                  style={{ borderRadius: '8px', padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportingLoading}
                  style={{
                    background: '#EA580C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: reportingLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {reportingLoading ? 'Submitting Report...' : 'Submit to Admin'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Doorstep Rejection / Customer Unavailable Confirmation Modal (₹99 Fee Cut Policy) */}
      {doorstepModalBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="card" style={{
            background: 'white',
            borderRadius: '18px',
            maxWidth: '500px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: '#DC2626', fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertCircle size={20} color="#DC2626" /> Customer Unavailable / Rejection (₹99 Fee)
              </h3>
              <button
                type="button"
                onClick={() => setDoorstepModalBooking(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} color="#64748B" />
              </button>
            </div>

            <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.88rem', color: '#334155', lineHeight: 1.45 }}>
              Confirm marking customer unavailable or rejecting service upon arrival for <strong>Booking #{doorstepModalBooking.bookingId || doorstepModalBooking.id}</strong> ({doorstepModalBooking.user?.name || 'Customer'} &bull; {doorstepModalBooking.car?.make} {doorstepModalBooking.car?.model}).
            </p>

            {/* Policy Enforcement Box */}
            <div style={{
              background: '#FFFBEB',
              border: '1.5px solid #FCD34D',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.82rem',
              color: '#92400E',
              lineHeight: 1.5
            }}>
              <div style={{ fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#B45309' }}>
                <span>📜</span> Company Policy Deduction Rules:
              </div>
              <div>• <strong>Physical Payment:</strong> <strong>₹99</strong> technician visit fee will be deducted; remaining balance refunded automatically to customer via Razorpay.</div>
              <div>• <strong>Reward Points:</strong> <strong>99</strong> reward coins deducted from redeemed points, remaining coins restored.</div>
              <div>• <strong>Subscription Booking:</strong> <strong>1 wash limit</strong> is burned from subscription quota with ZERO refund or compensation.</div>
              <div>• Booking status will immediately change to <strong>CANCELLED</strong>.</div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.4rem' }}>
                Technician Arrival & Attempt Details (Required)
              </label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="e.g. Arrived at address, called primary & alt phone 3 times, door locked / customer refused wash..."
                value={doorstepNote}
                onChange={e => setDoorstepNote(e.target.value)}
                style={{ width: '100%', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDoorstepModalBooking(null)}
                disabled={doorstepLoading}
                className="btn btn-outline"
                style={{ borderRadius: '8px', padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleConfirmDoorstepRejection}
                disabled={doorstepLoading}
                style={{
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: doorstepLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {doorstepLoading ? 'Processing Fee Cut...' : 'Confirm Rejection (Deduct ₹99)'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Schedule;
