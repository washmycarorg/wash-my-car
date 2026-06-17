import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { getStats } from '../api';

const Financials = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(res => { setStats(res); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return <div>Loading financials...</div>;

  const revenue = stats?.totalRevenue || 0;
  const cost = stats?.totalCostToCompany || 0;
  const profit = revenue - cost;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

  return (
    <div className="flex-col gap-6" style={{display: 'flex'}}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card" style={{background: 'linear-gradient(135deg, var(--primary-navy), #1e3a8a)', color: 'white'}}>
          <div className="flex justify-between items-center mb-4">
            <h3 style={{color: 'rgba(255,255,255,0.8)', margin: 0}}>Total Earnings</h3>
            <div style={{background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '50%'}}><TrendingUp size={24} /></div>
          </div>
          <h1 style={{color: 'white', margin: 0}}>₹{revenue.toLocaleString()}</h1>
          <p style={{color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem'}}>Gross revenue from completed bookings</p>
        </div>
        
        <div className="card" style={{border: '1px solid #E2E8F0'}}>
          <div className="flex justify-between items-center mb-4">
            <h3 style={{color: 'var(--text-muted)', margin: 0}}>Cost to Company</h3>
            <div style={{background: '#FEE2E2', color: '#EF4444', padding: '0.5rem', borderRadius: '50%'}}><Users size={24} /></div>
          </div>
          <h1 style={{color: 'var(--text-dark)', margin: 0}}>₹{cost.toLocaleString()}</h1>
          <p className="text-muted" style={{marginTop: '0.5rem'}}>Total employee salaries</p>
        </div>
        
        <div className="card" style={{border: '1px solid #E2E8F0', borderTop: profit >= 0 ? '4px solid var(--success)' : '4px solid var(--danger)'}}>
          <div className="flex justify-between items-center mb-4">
            <h3 style={{color: 'var(--text-muted)', margin: 0}}>Net Profit</h3>
            <div style={{background: profit >= 0 ? '#D1FAE5' : '#FEE2E2', color: profit >= 0 ? '#10B981' : '#EF4444', padding: '0.5rem', borderRadius: '50%'}}>
              <DollarSign size={24} />
            </div>
          </div>
          <h1 style={{color: profit >= 0 ? 'var(--success)' : 'var(--danger)', margin: 0}}>₹{profit.toLocaleString()}</h1>
          <p className="text-muted" style={{marginTop: '0.5rem'}}>Profit Margin: {margin}%</p>
        </div>
      </div>
      
      <div className="card">
        <h3>Financial Breakdown</h3>
        <p className="text-muted mb-6">A detailed view of revenue versus cost over time is in development.</p>
        <div style={{height: '300px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', border: '1px dashed #CBD5E1'}}>
           <p className="text-muted">Interactive Charts Coming Soon</p>
        </div>
      </div>
    </div>
  );
};

export default Financials;
