import React, { useState, useEffect } from 'react';
import { getBookings } from '../api';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookings()
      .then(res => { setBookings(res); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>My bookings</h3>
        </div>
        
        <div style={{padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {bookings.map(booking => {
            const date = new Date(booking.date).toISOString().split('T')[0];
            const time = booking.timeSlot;
            const address = booking.address || '12 Marine Drive, Mumbai';
            const assigned = booking.employee ? booking.employee.name : 'Pending';
            
            return (
              <div key={booking.id} style={{
                border: '1px solid #E2E8F0', 
                borderRadius: 'var(--radius-md)', 
                padding: '1.25rem',
                background: 'white'
              }}>
                <h4 style={{margin: '0 0 0.5rem 0', color: 'var(--primary-navy)', fontSize: '1.05rem'}}>
                  {booking.service?.name || 'Wash Service'}
                </h4>
                
                <p style={{margin: '0 0 0.25rem 0', color: 'var(--text-muted)', fontSize: '0.85rem'}}>
                  {date} · {time} · {address}
                </p>
                <p style={{margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem'}}>
                  Assigned: {assigned}
                </p>
                
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  {booking.status === 'COMPLETED' ? (
                    <span style={{background: '#D1FAE5', color: '#065F46', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 500}}>
                      Completed
                    </span>
                  ) : (
                    <span style={{background: '#E0F2FE', color: '#0369A1', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 500}}>
                      {booking.status}
                    </span>
                  )}
                  
                  <span style={{fontWeight: 700, color: 'var(--primary-navy)', fontSize: '1.1rem', marginLeft: 'auto'}}>
                    ₹{booking.amount}
                  </span>

                  {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                    <button style={{
                      background: 'white', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-sm)',
                      padding: '0.35rem 1rem', color: 'var(--primary-navy)', fontSize: '0.85rem', cursor: 'pointer'
                    }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {bookings.length === 0 && (
            <p style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>No bookings found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookings;
