import React from 'react';
import { Wallet } from 'lucide-react';

const Earnings = ({ profile }) => {
  const earnings = profile?.salary || 0;
  const completedJobs = profile?.stats?.completedJobs || 0;
  const avg = completedJobs > 0 ? (earnings / completedJobs).toFixed(0) : '—';

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card" style={{padding: '1.25rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600}}>TOTAL EARNINGS</span>
            <Wallet size={20} color="var(--primary-blue)" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.75rem', color: 'var(--primary-navy)'}}>₹{earnings}</h2>
        </div>

        <div className="card" style={{padding: '1.25rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600}}>COMPLETED JOBS</span>
          </div>
          <h2 style={{margin: 0, fontSize: '1.75rem', color: 'var(--primary-navy)'}}>{completedJobs}</h2>
        </div>
      </div>

      <div className="card mb-6" style={{padding: '1.25rem', width: 'calc(50% - 0.5rem)'}}>
        <div style={{marginBottom: '0.75rem'}}>
          <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600}}>AVG PER JOB</span>
        </div>
        <h2 style={{margin: 0, fontSize: '1.75rem', color: 'var(--primary-navy)'}}>
          {avg !== '—' ? `₹${avg}` : '—'}
        </h2>
      </div>

      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Recent payouts</h3>
        </div>
        
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem'}}>
          <thead style={{borderBottom: '1px solid #E2E8F0'}}>
            <tr>
              <th style={{padding: '1rem', color: 'var(--primary-blue)', fontWeight: 600}}>Job</th>
              <th style={{padding: '1rem', color: 'var(--primary-blue)', fontWeight: 600}}>Date</th>
              <th style={{padding: '1rem', color: 'var(--primary-blue)', fontWeight: 600}}>Customer</th>
              <th style={{padding: '1rem', color: 'var(--primary-blue)', fontWeight: 600, textAlign: 'right'}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="4" style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>No completed jobs yet.</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Earnings;
