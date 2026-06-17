import React, { useState, useEffect } from 'react';
import { getBookings } from '../api';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookings()
      .then(res => { 
        // Filter out completed for history
        setHistory(res.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED')); 
        setLoading(false); 
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Service history</h3>
        </div>
        
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem'}}>
          <thead style={{borderBottom: '1px solid #E2E8F0'}}>
            <tr>
              <th style={{padding: '1rem', color: 'var(--primary-blue)', fontWeight: 600}}>Service</th>
              <th style={{padding: '1rem', color: 'var(--primary-blue)', fontWeight: 600}}>Date</th>
              <th style={{padding: '1rem', color: 'var(--primary-blue)', fontWeight: 600}}>Employee</th>
              <th style={{padding: '1rem', color: 'var(--primary-blue)', fontWeight: 600}}>Status</th>
              <th style={{padding: '1rem', color: 'var(--primary-blue)', fontWeight: 600}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id} style={{borderBottom: '1px solid #E2E8F0'}}>
                <td style={{padding: '1rem', fontWeight: 600, color: 'var(--primary-navy)'}}>{item.service?.name.split(' ').join('\n')}</td>
                <td style={{padding: '1rem', color: 'var(--primary-navy)'}}>{new Date(item.date).toISOString().split('T')[0]}</td>
                <td style={{padding: '1rem', color: 'var(--primary-navy)'}}>{item.employee?.name || '-'}</td>
                <td style={{padding: '1rem', color: 'var(--primary-navy)'}}>{item.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}</td>
                <td style={{padding: '1rem', color: 'var(--primary-navy)'}}>₹{item.service?.price}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan="5" style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>No history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
