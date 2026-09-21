import React, { useState, useEffect } from 'react';
import { getBookings, getCars, getProfile } from '../api';
import { Calendar, Car, Filter, ChevronDown, CheckCircle, Clock, AlertCircle, XCircle, Star, Tag, Gift } from 'lucide-react';

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
              {carLabel} &bull; {dateStr} &bull; {booking.timeSlot}
              {areaLabel && <> &bull; {areaLabel}</>}
            </div>
            {booking.addons && booking.addons.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                {booking.addons.map(ba => (
                  <span key={ba.id} style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#166534', padding: '0.1rem 0.45rem', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span>{ba.addon?.icon || '✨'}</span> {ba.addon?.name} (+₹{ba.price})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Price + expand */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-navy)' }}>₹{booking.price?.toFixed ? booking.price.toFixed(2) : booking.price}</div>
            <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginTop: '4px' }} />
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
                <div style={{ fontSize: '0.9rem', color: 'var(--primary-navy)', fontWeight: 600 }}>
                  {carLabel} {carTypeLabel ? `(${carTypeLabel})` : ''}
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
                    <div key={ba.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#15803D' }}>
                      <span>{ba.addon?.icon || '✨'} {ba.addon?.name}</span>
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
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Payment Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Base Wash Price</span>
                  <span style={{ color: 'var(--primary-navy)' }}>₹{(booking.originalPrice ?? booking.price) - (booking.addonsTotal || 0)}</span>
                </div>
                {booking.addonsTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                    <span>Add-ons Total</span>
                    <span>+₹{booking.addonsTotal}</span>
                  </div>
                )}
                {booking.appliedOfferCode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Tag size={12} /> Coupon ({booking.appliedOfferCode})
                    </span>
                    <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>Applied</span>
                  </div>
                )}
                {booking.pointsRedeemed > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Gift size={12} /> Points Redeemed ({booking.pointsRedeemed} pts)
                    </span>
                    <span style={{ color: '#B45309', fontWeight: 600 }}>Cash used</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '0.35rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--primary-navy)' }}>Final Paid</span>
                  <span style={{ color: 'var(--primary-navy)' }}>₹{booking.price?.toFixed ? booking.price.toFixed(2) : booking.price}</span>
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
    </div>
  );
};

export default Bookings;
