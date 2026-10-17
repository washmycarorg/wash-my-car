import React, { useState, useEffect } from 'react';
import { getBookings, getCars, getProfile, cancelBooking } from '../api';
import { 
  Calendar, Car, Filter, ChevronDown, CheckCircle, Clock, 
  AlertCircle, XCircle, Star, Tag, Gift, Sparkles,
  Shield, Bike, Droplets, Feather, Flame, X, RefreshCw
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

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   bg: '#FEF3C7', color: '#92400E' },
  ASSIGNED:  { label: 'Assigned',  bg: '#DBEAFE', color: '#1E40AF' },
  STARTED:   { label: 'In Progress', bg: '#E0F2FE', color: '#0369A1' },
  COMPLETED: { label: 'Completed', bg: '#D1FAE5', color: '#065F46' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#F1F5F9', color: '#475569' };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
};

const canCancelBooking = (bookingDate, timeSlot) => {
  if (!bookingDate || !timeSlot) return true;
  try {
    const d = new Date(bookingDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    // Parse start time from slot window e.g. "06:00 PM" or "08:30 AM - 10:30 AM"
    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    const match = String(timeSlot).match(timeRegex);
    if (!match) return true;

    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();

    if (meridiem === 'PM' && hour !== 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;

    // Slot start timestamp on booking day
    const slotStart = new Date(year, month, day, hour, minute, 0, 0);
    const now = new Date();

    const diffMs = slotStart.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Permitted strictly at least 9 hours before slot start time
    return diffHours >= 9;
  } catch (err) {
    return true;
  }
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [savedCars, setSavedCars] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [filterCarId, setFilterCarId] = useState('ALL');

  // Cancellation modal state
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBookingsList = () => {
    return getBookings().then(bks => setBookings(bks)).catch(err => console.error(err));
  };

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;

    // Check time limit again to guard against cached/stale data
    if (!canCancelBooking(cancellingBooking.date, cancellingBooking.timeSlot)) {
      alert('⚠️ Cancellation Window Closed\n\nPer our cancellation policy, cancellations with 100% full refund are only permitted up to 9 hours before your scheduled slot arrival time.\n\nIf not cancelled before 9 hours or if any doorstep rejection is found, no refund will be initiated.');
      setCancellingBooking(null);
      await fetchBookingsList();
      return;
    }

    setCancelLoading(true);
    try {
      const res = await cancelBooking(cancellingBooking.id, cancelReason || 'Cancelled by customer');
      alert(res.message || 'Booking cancelled successfully.');
      setCancellingBooking(null);
      setCancelReason('');
      await fetchBookingsList();
    } catch (err) {
      alert('⚠️ Cancellation Policy Notice: ' + (err.message || 'Cancellations are only permitted up to 9 hours before your scheduled slot arrival time. If not cancelled before 9 hours or if any doorstep rejection occurs, no refund will be initiated.'));
      setCancellingBooking(null);
      await fetchBookingsList();
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([getBookings(), getCars().catch(() => []), getProfile().catch(() => null)])
      .then(([bks, cars, prof]) => {
        setBookings(bks);
        setSavedCars(cars);
        setProfile(prof);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  // Apply filters
  const filtered = bookings.filter(b => {
    if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;
    if (filterDate) {
      const bookingDate = new Date(b.date).toISOString().split('T')[0];
      if (bookingDate !== filterDate) return false;
    }
    if (filterCarId !== 'ALL') {
      if (!b.car || b.car.id.toString() !== filterCarId) return false;
    }
    return true;
  });

  const activeBookings = filtered.filter(b => ['PENDING', 'ASSIGNED', 'STARTED'].includes(b.status));
  const pastBookings = filtered.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: 'var(--primary-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        Loading your bookings...
      </div>
    </div>
  );

  const BookingCard = ({ booking }) => {
    const isExpanded = expandedId === booking.id;
    const dateStr = new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const carLabel = booking.car
      ? `${booking.car.make} ${booking.car.model}`
      : (booking.carType?.name || 'Vehicle');
    const carTypeLabel = booking.carType?.name || '';
    const washLabel = booking.washType?.name || 'Wash Service';
    const areaLabel = booking.serviceArea?.name || '';
    const employeeName = booking.employee?.name || null;
    const hasDiscount = booking.appliedOfferCode || booking.pointsRedeemed > 0;

    return (
      <div style={{
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        background: 'white',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s',
      }}>
        {/* Card Header */}
        <div
          onClick={() => setExpandedId(isExpanded ? null : booking.id)}
          style={{ padding: '1.1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          {/* Icon */}
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Car size={20} color="var(--primary-blue)" />
          </div>

          {/* Main Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                {washLabel}
              </span>
              {carTypeLabel && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: '#F1F5F9', padding: '0.1rem 0.5rem', borderRadius: '8px' }}>
                  {carTypeLabel}
                </span>
              )}
              <StatusBadge status={booking.status} />
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {carLabel} {booking.car?.carNumber && <strong style={{ color: 'var(--primary-blue)', letterSpacing: '0.05em' }}>({booking.car.carNumber})</strong>} &bull; {dateStr} &bull; {booking.timeSlot}
              {areaLabel && <> &bull; {areaLabel}</>}
            </div>
            {booking.addons && booking.addons.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                {booking.addons.map(ba => (
                  <span key={ba.id} style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#166534', padding: '0.1rem 0.45rem', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>{renderAddonIcon(ba.addon?.icon, 12)}</span> {ba.addon?.name} (+₹{ba.price})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Price + expand */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-navy)' }}>₹{booking.price?.toFixed ? booking.price.toFixed(2) : booking.price}</div>
            {booking.totalSavings > 0 && (
              <div style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 700, background: '#DCFCE7', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '2px', display: 'inline-block' }}>
                Saved ₹{booking.totalSavings}
              </div>
            )}
            <div>
              <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginTop: '4px' }} />
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div style={{ borderTop: '1px solid #F1F5F9', padding: '1rem 1.25rem', background: '#FAFBFC', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* Vehicle */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Car size={15} color="var(--text-muted)" style={{ marginTop: '3px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vehicle</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--primary-navy)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span>{carLabel} {carTypeLabel ? `(${carTypeLabel})` : ''}</span>
                  {booking.car?.carNumber && (
                    <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                      {booking.car.carNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Addons Details */}
            {booking.addons && booking.addons.length > 0 && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                  Included Add-on Services
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {booking.addons.map(ba => (
                    <div key={ba.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#15803D' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {renderAddonIcon(ba.addon?.icon, 14)} {ba.addon?.name}
                      </span>
                      <span style={{ fontWeight: 600 }}>+₹{ba.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Employee */}
            {employeeName && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Star size={15} color="var(--text-muted)" style={{ marginTop: '3px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Technician</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--primary-navy)', fontWeight: 600 }}>{employeeName}</div>
                </div>
              </div>
            )}
            {!employeeName && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Clock size={15} color="var(--text-muted)" style={{ marginTop: '3px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Technician</div>
                  <div style={{ fontSize: '0.9rem', color: '#92400E' }}>Awaiting assignment</div>
                </div>
              </div>
            )}

            {/* Address */}
            {booking.address && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Calendar size={15} color="var(--text-muted)" style={{ marginTop: '3px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Address</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--primary-navy)' }}>{booking.address}</div>
                </div>
              </div>
            )}

            {/* Payment Breakdown */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Payment Breakdown
                </span>
                {booking.totalSavings > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#166534', background: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 700 }}>
                    🎉 You Saved ₹{booking.totalSavings}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.88rem' }}>
                {booking.actualPrice > 0 && booking.actualPrice > ((booking.originalPrice ?? booking.price) - (booking.addonsTotal || 0)) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Actual Standard Price</span>
                    <span style={{ color: '#94A3B8', textDecoration: 'line-through' }}>₹{booking.actualPrice}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Giving Offer Price</span>
                  <span style={{ color: 'var(--primary-navy)', fontWeight: 600 }}>₹{(booking.originalPrice ?? booking.price) - (booking.addonsTotal || 0)}</span>
                </div>
                {booking.planDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                    <span>• Plan Special Offer Discount</span>
                    <span>-₹{booking.planDiscount}</span>
                  </div>
                )}
                {booking.addonsTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369A1' }}>
                    <span>• Add-ons Total</span>
                    <span>+₹{booking.addonsTotal}</span>
                  </div>
                )}
                {booking.appliedOfferCode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-teal)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Tag size={12} /> Coupon ({booking.appliedOfferCode})
                    </span>
                    <span style={{ fontWeight: 600 }}>{booking.couponDiscount ? `-₹${booking.couponDiscount}` : 'Applied'}</span>
                  </div>
                )}
                {booking.pointsRedeemed > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Gift size={12} /> Reward Coins ({booking.pointsRedeemed} pts)
                    </span>
                    <span style={{ fontWeight: 600 }}>{booking.pointsDiscount ? `-₹${booking.pointsDiscount}` : 'Cash used'}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '0.35rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--primary-navy)' }}>Final Paid</span>
                  <span style={{ color: 'var(--primary-navy)', fontSize: '1rem' }}>₹{booking.price?.toFixed ? booking.price.toFixed(2) : booking.price}</span>
                </div>
              </div>
            </div>

            {/* Points Earned */}
            {booking.pointsEarned > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                <Gift size={14} color="#16A34A" />
                <span style={{ fontSize: '0.85rem', color: '#15803D', fontWeight: 600 }}>
                  +{booking.pointsEarned} loyalty points earned on this booking
                </span>
              </div>
            )}

            {/* Cancelled Details & Automatic Refund Status */}
            {booking.status === 'CANCELLED' && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DC2626', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                  <XCircle size={16} /> Booking Cancelled
                </div>
                {booking.cancelledAt && (
                  <div style={{ fontSize: '0.78rem', color: '#991B1B' }}>
                    Cancelled on: {new Date(booking.cancelledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                )}
                {booking.cancellationReason && (
                  <div style={{ fontSize: '0.82rem', color: '#7F1D1D', marginTop: '0.2rem' }}>
                    <strong>Reason:</strong> {booking.cancellationReason}
                  </div>
                )}
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #FCA5A5' }}>
                  {booking.refundStatus === 'PROCESSED' ? (
                    <div style={{ background: '#DCFCE7', color: '#166534', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', lineHeight: 1.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                        <CheckCircle size={15} color="#16A34A" />
                        <span>Automatic Refund of <strong>₹{booking.refundAmount || booking.price}</strong> initiated via Razorpay</span>
                      </div>
                      {booking.refundId && (
                        <div style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#15803D', marginTop: '0.2rem' }}>
                          Refund ID: {booking.refundId}
                        </div>
                      )}
                      <div style={{ marginTop: '0.45rem', fontSize: '0.8rem', color: '#14532D', background: '#F0FDF4', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                        ⏱️ <strong>Refund Timeline Note:</strong> Refund will be credited to your bank account within <strong>7 business days</strong>. If not credited within 7 days, please email us on <a href="mailto:washmycarorg@gmail.com" style={{ color: '#047857', fontWeight: 700, textDecoration: 'underline' }}>washmycarorg@gmail.com</a> or contact us through our <a href="/#contact" target="_blank" rel="noopener noreferrer" style={{ color: '#047857', fontWeight: 700, textDecoration: 'underline' }}>Home page Contact section</a>.
                      </div>
                    </div>
                  ) : booking.refundStatus === 'FAILED' ? (
                    <div style={{ background: '#FFFBEB', color: '#B45309', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                        <AlertCircle size={15} color="#D97706" />
                        <span>Automatic gateway refund encountered an issue. Our support team is processing it.</span>
                      </div>
                      <div style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
                        If not credited to your bank within 7 days, please email us on <a href="mailto:washmycarorg@gmail.com" style={{ color: '#92400E', fontWeight: 700, textDecoration: 'underline' }}>washmycarorg@gmail.com</a> or contact us through our <a href="/#contact" target="_blank" rel="noopener noreferrer" style={{ color: '#92400E', fontWeight: 700, textDecoration: 'underline' }}>Home page Contact section</a>.
                      </div>
                    </div>
                  ) : booking.razorpayPaymentId ? (
                    <div style={{ background: '#EFF6FF', color: '#1E40AF', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 700 }}>Automatic Refund: Processing via Razorpay...</div>
                      <div style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
                        Refund will be credited to your bank within 7 days. If not credited within 7 days, please email us on <a href="mailto:washmycarorg@gmail.com" style={{ color: '#1D4ED8', fontWeight: 700, textDecoration: 'underline' }}>washmycarorg@gmail.com</a> or contact us through our <a href="/#contact" target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', fontWeight: 700, textDecoration: 'underline' }}>Home page Contact section</a>.
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      No online transaction charges to refund for this booking.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cancel Action Button for Active Bookings */}
            {['PENDING', 'ASSIGNED'].includes(booking.status) && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', paddingTop: '0.35rem', flexWrap: 'wrap' }}>
                {canCancelBooking(booking.date, booking.timeSlot) ? (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      // Real-time check to prevent opening modal if client data was cached and 9-hour limit has now passed
                      if (!canCancelBooking(booking.date, booking.timeSlot)) {
                        alert('⚠️ Cancellation Policy Notice\n\nCancellations with 100% full refund are only permitted up to 9 hours before your scheduled slot arrival time.\n\nIf not cancelled before 9 hours or if any doorstep rejection is found, no refund will be initiated per company policy.');
                        await fetchBookingsList();
                        return;
                      }
                      setCancellingBooking(booking);
                      setCancelReason('');
                    }}
                    className="btn"
                    style={{
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: '1.5px solid #FCA5A5',
                      padding: '0.45rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <XCircle size={15} /> Cancel Booking & Refund
                  </button>
                ) : (
                  <div style={{
                    fontSize: '0.78rem',
                    color: '#64748B',
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 600
                  }}>
                    <Clock size={13} color="#94A3B8" />
                    Cancellation closed (Allowed up to 9 hrs before slot arrival)
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.25rem', color: 'var(--primary-navy)', fontSize: '1.4rem', fontWeight: 800 }}>My Bookings</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>All active and past bookings with full details</p>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, width: '100%' }}>
          <Filter size={14} /> Filters
        </div>

        {/* Status Filter */}
        <div style={{ flex: '1', minWidth: '130px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>STATUS</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--primary-navy)', background: 'white', cursor: 'pointer' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="STARTED">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Date Filter */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>DATE</label>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--primary-navy)', background: 'white', boxSizing: 'border-box' }}
          />
        </div>

        {/* Car Filter */}
        {savedCars.length > 0 && (
          <div style={{ flex: '1', minWidth: '140px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>SAVED CAR</label>
            <select
              value={filterCarId}
              onChange={e => setFilterCarId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--primary-navy)', background: 'white', cursor: 'pointer' }}
            >
              <option value="ALL">All Cars</option>
              {savedCars.map(c => (
                <option key={c.id} value={c.id.toString()}>{c.make} {c.model}</option>
              ))}
            </select>
          </div>
        )}

        {/* Clear filters */}
        {(filterStatus !== 'ALL' || filterDate || filterCarId !== 'ALL') && (
          <button
            onClick={() => { setFilterStatus('ALL'); setFilterDate(''); setFilterCarId('ALL'); }}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ margin: '0 0 0.75rem', color: 'var(--primary-navy)', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="var(--primary-blue)" /> Active Bookings
            <span style={{ background: 'var(--primary-blue)', color: 'white', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>{activeBookings.length}</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeBookings.map(b => <BookingCard key={b.id} booking={b} />)}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 0.75rem', color: 'var(--primary-navy)', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={16} color="#16A34A" /> Past Bookings
            <span style={{ background: '#E2E8F0', color: 'var(--text-muted)', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>{pastBookings.length}</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pastBookings.map(b => <BookingCard key={b.id} booking={b} />)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Calendar size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--primary-navy)' }}>No bookings found</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {bookings.length === 0 ? "You haven't booked any services yet." : "No bookings match your current filters."}
          </p>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingBooking && (
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
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#DC2626', fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={20} color="#DC2626" /> Cancel Booking #{cancellingBooking.id}
              </h3>
              <button
                onClick={() => setCancellingBooking(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
              Are you sure you want to cancel your scheduled wash on <strong>{new Date(cancellingBooking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({cancellingBooking.timeSlot})</strong>?
            </p>

            <div style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              marginBottom: '1rem',
              fontSize: '0.82rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle size={16} color="#16A34A" style={{ flexShrink: 0 }} />
              <span><strong>9-Hour Full Refund Window Active:</strong> You are cancelling at least 9 hours before your slot time. A 100% full refund will be allocated. (Note: If not cancelled before 9 hours or if any doorstep rejection is found, no refund will be initiated).</span>
            </div>

            {cancellingBooking.price > 0 && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1rem', color: '#065F46', fontSize: '0.85rem', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong>💳 Automatic Razorpay Refund:</strong>
                  <span style={{ background: '#D1FAE5', color: '#065F46', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem' }}>₹{cancellingBooking.price}</span>
                </div>
                <div>
                  A refund of <strong>₹{cancellingBooking.price}</strong> will be initiated automatically to your original payment account. Any redeemed loyalty points will also be restored.
                </div>
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #A7F3D0', fontSize: '0.8rem', color: '#047857' }}>
                  ⏱️ <strong>Refund Timeline Note:</strong> Refund will be credited to your bank account within <strong>7 business days</strong>. If not credited within 7 days, please email us on <a href="mailto:washmycarorg@gmail.com" style={{ color: '#047857', fontWeight: 700, textDecoration: 'underline' }}>washmycarorg@gmail.com</a> or contact us through our <a href="/#contact" target="_blank" rel="noopener noreferrer" style={{ color: '#047857', fontWeight: 700, textDecoration: 'underline' }}>Home page Contact section</a>.
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.4rem' }}>
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="e.g. Schedule change, traveling, need different date/time..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0.6rem 0.75rem', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                disabled={cancelLoading}
                className="btn btn-outline"
                style={{ borderRadius: '8px', padding: '0.6rem 1.25rem' }}
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                style={{
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 700,
                  cursor: cancelLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {cancelLoading ? 'Cancelling & Refunding...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
