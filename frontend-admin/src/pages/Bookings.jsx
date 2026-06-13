import React, { useState, useEffect } from 'react';
import { getBookings, assignSlot, getEmployees } from '../api';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const bRes = await getBookings();
      const eRes = await getEmployees();
      setBookings(bRes);
      setEmployees(eRes.filter(e => e.status === 'ACTIVE'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (bookingId, employeeId) => {
    if (!employeeId) return;
    try {
      await assignSlot(bookingId, employeeId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading bookings...</div>;

  return (
    <div className="card" style={{padding: 0, overflowX: 'auto'}}>
      <div className="p-6 border-b border-gray-200">
        <h3 style={{margin: 0}}>Slots Details & Assignment</h3>
      </div>
      <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px'}}>
        <thead style={{background: '#F8FAFC'}}>
          <tr>
            <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>ID</th>
            <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Customer</th>
            <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Service</th>
            <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Date & Time</th>
            <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Status</th>
            <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Assignment</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} style={{borderBottom: '1px solid #F1F5F9'}} className="hover:bg-gray-50">
              <td style={{padding: '1rem 1.5rem', fontWeight: 500}}>#{b.id}</td>
              <td style={{padding: '1rem 1.5rem'}}>{b.user?.name || b.user?.phone}</td>
              <td style={{padding: '1rem 1.5rem'}}>{b.service?.name}</td>
              <td style={{padding: '1rem 1.5rem'}}>
                <div style={{fontWeight: 500}}>{new Date(b.date).toLocaleDateString()}</div>
                <div className="text-sm text-muted">{b.timeSlot}</div>
              </td>
              <td style={{padding: '1rem 1.5rem'}}>
                <span className={`badge ${b.status === 'COMPLETED' ? 'badge-success' : b.status === 'ASSIGNED' ? 'badge-primary' : 'badge-warning'}`}>
                  {b.status}
                </span>
              </td>
              <td style={{padding: '1rem 1.5rem'}}>
                {b.employeeId ? (
                  <div className="flex items-center gap-2">
                    <span style={{fontWeight: 500}}>{b.employee?.name}</span>
                    {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                      <button className="btn btn-outline text-xs" style={{padding: '0.2rem 0.5rem'}} onClick={() => handleAssign(b.id, '')}>Reassign</button>
                    )}
                  </div>
                ) : (
                  <select 
                    className="form-input" 
                    style={{padding: '0.4rem', fontSize: '0.9rem'}}
                    onChange={(e) => handleAssign(b.id, e.target.value)}
                    value=""
                  >
                    <option value="" disabled>Assign Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                )}
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan="6" style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No bookings found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Bookings;
