import React from 'react';
import { Wallet } from 'lucide-react';

const Earnings = ({ profile }) => {
  const earnings = profile?.earnings || 0;
  const completedJobs = profile?.stats?.completedJobs || 0;
  const avg = completedJobs > 0 ? (earnings / completedJobs).toFixed(0) : '—';
  const payouts = profile?.recentPayouts || [];

  const payType = profile?.payType || 'COMMISSION_ONLY';
  const baseSalary = profile?.baseSalary || profile?.salary || 0;
  const commissionEarned = profile?.commissionEarnings || 0;

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>

      {/* Compensation Plan Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
        border: '1.5px solid #86EFAC',
        borderRadius: '12px',
        padding: '1.1rem 1.25rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Compensation Structure
          </span>
          <span style={{ background: '#16A34A', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
            {payType === 'FIXED_SALARY' ? 'Fixed Salary' : payType === 'HYBRID' ? 'Hybrid Salary + Comm.' : 'Commission Only'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#14532D', lineHeight: 1.4 }}>
          {payType === 'FIXED_SALARY' && `You receive a fixed monthly remuneration of ₹${baseSalary} set by administration.`}
          {payType === 'COMMISSION_ONLY' && `You earn commissions on every wash task you complete. Total commissions earned: ₹${commissionEarned}.`}
          {payType === 'HYBRID' && `You receive a base monthly salary of ₹${baseSalary} plus commissions of ₹${commissionEarned} on completed washes.`}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card" style={{padding: '1.25rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600}}>TOTAL PAYOUT</span>
            <Wallet size={20} color="var(--primary-blue)" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.75rem', color: 'var(--primary-navy)'}}>₹{earnings}</h2>
          {payType === 'HYBRID' && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Base: ₹{baseSalary} | Comm: ₹{commissionEarned}
            </div>
          )}
        </div>

        <div className="card" style={{padding: '1.25rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600}}>COMPLETED JOBS</span>
          </div>
          <h2 style={{margin: 0, fontSize: '1.75rem', color: 'var(--primary-navy)'}}>{completedJobs}</h2>
        </div>
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
            {payouts.length > 0 ? (
              payouts.map((payout, i) => (
                <tr key={i} style={{borderBottom: '1px solid #F1F5F9'}}>
                  <td style={{padding: '1rem', fontWeight: 500, color: 'var(--primary-navy)'}}>{payout.job}</td>
                  <td style={{padding: '1rem', color: 'var(--text-muted)'}}>{new Date(payout.date).toLocaleDateString()}</td>
                  <td style={{padding: '1rem', color: 'var(--text-main)'}}>{payout.customer}</td>
                  <td style={{padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--success)'}}>₹{payout.amount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>No completed jobs yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Earnings;
