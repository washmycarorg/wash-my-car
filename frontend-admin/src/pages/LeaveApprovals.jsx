import React, { useState, useEffect } from 'react';
import { getLeaves, updateLeaveStatus } from '../api';
import { Check, X } from 'lucide-react';

const LeaveApprovals = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      const res = await getLeaves();
      setLeaves(res);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleAction = async (id, status) => {
    try {
      await updateLeaveStatus(id, status);
      fetchLeaves();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div>Loading leaves...</div>;

  return (
    <div className="card" style={{padding: 0, overflowX: 'auto'}}>
      <div className="p-6 border-b border-gray-200">
        <h3 style={{margin: 0}}>Leave Requests</h3>
      </div>
      <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px'}}>
        <thead style={{background: '#F8FAFC'}}>
          <tr>
            <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Employee</th>
            <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Dates</th>
            <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Reason</th>
            <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Status</th>
            <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((lv) => (
            <tr key={lv.id} style={{borderBottom: '1px solid #F1F5F9'}} className="hover:bg-gray-50">
              <td style={{padding: '1rem 1.5rem'}}>
                <div style={{fontWeight: 600}}>{lv.employee?.name}</div>
                <div className="text-sm text-muted">{lv.employee?.phone}</div>
              </td>
              <td style={{padding: '1rem 1.5rem'}}>
                <div style={{fontWeight: 500}}>{new Date(lv.startDate).toLocaleDateString()} to</div>
                <div style={{fontWeight: 500}}>{new Date(lv.endDate).toLocaleDateString()}</div>
              </td>
              <td style={{padding: '1rem 1.5rem'}}>
                <p style={{margin: 0, maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={lv.reason}>
                  {lv.reason}
                </p>
              </td>
              <td style={{padding: '1rem 1.5rem'}}>
                <span className={`badge ${lv.status === 'APPROVED' ? 'badge-success' : lv.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                  {lv.status}
                </span>
              </td>
              <td style={{padding: '1rem 1.5rem'}} className="flex gap-2">
                {lv.status === 'PENDING' ? (
                  <>
                    <button className="btn btn-teal text-white flex items-center justify-center" style={{width: 36, height: 36, padding: 0, borderRadius: '50%'}} onClick={() => handleAction(lv.id, 'APPROVED')} title="Approve">
                      <Check size={18} />
                    </button>
                    <button className="btn btn-danger text-white flex items-center justify-center" style={{width: 36, height: 36, padding: 0, borderRadius: '50%'}} onClick={() => handleAction(lv.id, 'REJECTED')} title="Reject">
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <span className="text-muted text-sm">Resolved</span>
                )}
              </td>
            </tr>
          ))}
          {leaves.length === 0 && (
            <tr>
              <td colSpan="5" style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No leave requests found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveApprovals;
