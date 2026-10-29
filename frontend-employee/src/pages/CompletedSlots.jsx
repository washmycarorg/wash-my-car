import React, { useState, useEffect } from 'react';
import { getAssignedBookings } from '../api';
import { 
  CheckCircle2, Calendar, Clock, MapPin, Car, Sparkles, 
  Search, ShieldCheck, Image as ImageIcon, Eye, Star
} from 'lucide-react';

const parseReviewTags = (rawTags) => {
  if (!rawTags) return [];
  if (Array.isArray(rawTags)) return rawTags;
  if (typeof rawTags === 'string') {
    try {
      const parsed = JSON.parse(rawTags);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
      return [];
    } catch {
      return rawTags
        .split(',')
        .map(t => t.replace(/[\[\]"']/g, '').trim())
        .filter(Boolean);
    }
  }
  return [];
};

const CompletedSlots = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchCompletedBookings();
  }, []);

  const fetchCompletedBookings = async () => {
    try {
      const data = await getAssignedBookings();
      const completed = (data || []).filter(b => b.status === 'COMPLETED');
      // Sort most recent first
      completed.sort((a, b) => new Date(b.endAt || b.date) - new Date(a.endAt || a.date));
      setBookings(completed);
    } catch (err) {
      console.error('Error fetching completed bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const idMatch = (b.bookingId && b.bookingId.toLowerCase().includes(q)) || String(b.id).includes(q);
    const washMatch = (b.washType?.name || '').toLowerCase().includes(q);
    const carMatch = (b.car ? `${b.car.make} ${b.car.model}` : `${b.carMake || ''} ${b.carModel || ''}`).toLowerCase().includes(q);
    return idMatch || washMatch || carMatch;
  });

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading completed slots...</div>;
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #065F46 0%, #059669 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem 1.5rem',
        color: 'white',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 24px rgba(5, 150, 105, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.5rem', borderRadius: '10px' }}>
            <CheckCircle2 size={24} color="#A7F3D0" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Completed Slots</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
              Archive of all your finished car wash services
            </p>
          </div>
        </div>
        <div style={{
          background: 'rgba(0, 0, 0, 0.15)',
          borderRadius: '8px',
          padding: '0.65rem 0.85rem',
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.78rem',
          color: '#D1FAE5'
        }}>
          <ShieldCheck size={16} color="#A7F3D0" style={{ flexShrink: 0 }} />
          <span>Customer Privacy Shield Active: Customer phone numbers and vehicle license registration plates are hidden after service completion.</span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '10px' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search completed jobs by ID or vehicle..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.4rem', margin: 0, width: '100%' }}
          />
        </div>
      </div>

      {/* Total Count Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.25rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          TOTAL COMPLETED: <span style={{ color: '#065F46' }}>{filteredBookings.length}</span>
        </span>
      </div>

      {/* Bookings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredBookings.map(b => {
          const dateStr = new Date(b.date).toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          const carDetails = b.car 
            ? `${b.car.make} ${b.car.model}` 
            : (b.carMake && b.carModel ? `${b.carMake} ${b.carModel}` : 'Vehicle');
          const washName = b.washType?.name || 'Car Wash Service';
          const carTypeName = b.carType?.name || 'Standard';
          const completedAtTime = b.endAt ? new Date(b.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

          return (
            <div key={b.id} className="card" style={{
              padding: '1.25rem',
              border: '1.5px solid #E2E8F0',
              borderRadius: 'var(--radius-lg)',
              background: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              
              {/* Card Top: ID and Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary-navy)', fontSize: '1.05rem' }}>
                      {b.bookingId ? b.bookingId : `#${b.id}`}
                    </span>
                    <span style={{
                      background: '#DCFCE7',
                      color: '#166534',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <CheckCircle2 size={12} /> COMPLETED
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>
                    {washName} ({carTypeName})
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                    <Calendar size={13} color="var(--primary-blue)" /> {dateStr}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {b.timeSlot}</span>
                    {b.slotId && (
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.68rem', background: '#E0F2FE', color: '#0369A1', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid #BAE6FD' }}>
                        {b.slotId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle & Customer Info (With Privacy Shield: Phone and Car Number Hidden) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '0.85rem', fontSize: '0.86rem' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Car size={16} color="var(--primary-blue)" style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>Vehicle:</span> {carDetails}
                    {/* Notice: License Car Number is intentionally NOT displayed per privacy requirement */}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>Customer:</span> {b.user?.name || 'Customer'}
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic', marginLeft: '0.5rem' }}>
                      (Contact details protected)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <MapPin size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ color: 'var(--text-muted)' }}>
                    {b.serviceArea?.name || 'Local Area'} · {b.address || 'Doorstep Service'}
                  </span>
                </div>
              </div>

              {/* Add-ons List if any */}
              {b.addons && b.addons.length > 0 && (
                <div style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                    <Sparkles size={12} color="#059669" /> Performed Add-ons ({b.addons.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {b.addons.map((ba, idx) => (
                      <span key={idx} style={{ background: 'white', border: '1px solid #CBD5E1', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', color: '#1E293B', fontWeight: 600 }}>
                        ✓ {ba.addon?.name || 'Add-on'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Metadata & Pictures */}
              <div style={{
                borderTop: '1px dashed #E2E8F0',
                paddingTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {completedAtTime && (
                    <span>Completed at: <strong style={{ color: '#065F46' }}>{completedAtTime}</strong></span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {b.endImage && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(b.endImage)}
                      className="btn btn-outline"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: '4px' }}
                    >
                      <ImageIcon size={13} /> View After Pic
                    </button>
                  )}
                  {b.startImage && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(b.startImage)}
                      className="btn btn-outline"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: '4px' }}
                    >
                      <Eye size={13} /> View Before Pic
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Review & Rating Section */}
              {b.review && (
                <div style={{
                  marginTop: '0.85rem',
                  background: 'linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%)',
                  border: '1.5px solid #FACC15',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Star size={16} fill="#D97706" color="#D97706" />
                      <span style={{ fontWeight: 800, color: '#854D0E', fontSize: '0.9rem' }}>
                        Customer Review: {b.review.rating} / 5 Stars
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#A16207', fontWeight: 600 }}>
                      {new Date(b.review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {b.review.comment && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#713F12', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{b.review.comment}"
                    </p>
                  )}
                  {(() => {
                    const reviewTags = parseReviewTags(b.review.tags);
                    if (!reviewTags || reviewTags.length === 0) return null;
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                        {reviewTags.map((tag, tIdx) => (
                          <span key={tIdx} style={{ background: 'white', color: '#854D0E', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #FDE047' }}>
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          );
        })}

        {filteredBookings.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="#CBD5E1" style={{ margin: '0 auto 0.75rem auto', display: 'block' }} />
            <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary-navy)' }}>No completed slots found</h4>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {searchQuery ? 'Try clearing your search query.' : 'Slots you finish will automatically be archived here.'}
            </p>
          </div>
        )}
      </div>

      {/* Picture Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ background: 'white', borderRadius: '12px', padding: '1rem', maxWidth: '500px', width: '100%', position: 'relative' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--primary-navy)' }}>Service Photo Verification</h4>
              <button 
                onClick={() => setPreviewImage(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>
            <img 
              src={previewImage} 
              alt="Service capture" 
              style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #E2E8F0' }} 
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default CompletedSlots;
