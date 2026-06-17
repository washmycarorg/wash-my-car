import React, { useState, useEffect } from 'react';
import { getAssignedBookings, completeBooking } from '../api';

const Schedule = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleComplete = async (id) => {
    try {
      await completeBooking(id);
      alert('Job marked as completed!');
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert('Failed to complete job');
    }
  };

  if (loading) return <div>Loading schedule...</div>;

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Assigned slots</h3>
        </div>
        
        <div style={{padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {bookings.map(booking => {
            const date = new Date(booking.date).toISOString().split('T')[0];
            const address = booking.address || '12 Marine Drive, Mumbai';
            const customerName = booking.user?.name || 'Customer';

            return (
              <div key={booking.id} style={{
                border: '1px solid #E2E8F0', 
                borderRadius: 'var(--radius-md)', 
                padding: '1.25rem',
                background: 'white'
              }}>
                <h4 style={{margin: '0 0 0.5rem 0', color: 'var(--primary-navy)', fontSize: '1.05rem'}}>
                  {booking.service?.name || 'Wash Service'} — {customerName}
                </h4>
                
                <p style={{margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem'}}>
                  {date} · {booking.timeSlot} · {address}
                </p>
                
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <span style={{
                    background: booking.status === 'COMPLETED' ? '#D1FAE5' : '#E0F2FE', 
                    color: booking.status === 'COMPLETED' ? '#065F46' : '#0369A1', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.85rem', 
                    fontWeight: 500
                  }}>
                    {booking.status}
                  </span>
                  
                  {booking.status !== 'COMPLETED' && (
                    <button 
                      onClick={() => handleComplete(booking.id)}
                      style={{
                        background: 'var(--primary-blue)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.4rem 1.25rem', 
                        fontSize: '0.9rem', 
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Task Completed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {bookings.length === 0 && (
            <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>No assigned slots for today.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
