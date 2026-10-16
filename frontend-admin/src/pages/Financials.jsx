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
          <p className="text-muted" style={{marginTop: '0.5rem'}}>Payouts to servicing employees</p>
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
      
      <div className="card" style={{ border: '1px solid #E2E8F0', padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: 'var(--primary-navy)' }}>Financial & Cost Breakdown</h3>
        <p className="text-muted" style={{ margin: '0 0 1.25rem', fontSize: '0.88rem' }}>
          Breakdown of company expenditure across compensation models and consumables.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Fixed Monthly Salaries
            </span>
            <h2 style={{ margin: '0.25rem 0', color: 'var(--primary-navy)', fontSize: '1.4rem' }}>
              ₹{(stats?.fixedSalariesCost || 0).toLocaleString()}
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Remuneration for fixed & hybrid base staff
            </p>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Wash Task Commissions
            </span>
            <h2 style={{ margin: '0.25rem 0', color: '#0284C7', fontSize: '1.4rem' }}>
              ₹{(stats?.commissionsCost || 0).toLocaleString()}
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Per-wash payout on completed bookings
            </p>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Consumables & Materials
            </span>
            <h2 style={{ margin: '0.25rem 0', color: '#D97706', fontSize: '1.4rem' }}>
              ₹{(stats?.materialCost || 0).toLocaleString()}
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Shampoo, microfiber, wax & equipment fees
            </p>
          </div>

          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '1rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>
              Completed Washes
            </span>
            <h2 style={{ margin: '0.25rem 0', color: '#166534', fontSize: '1.4rem' }}>
              {stats?.completedWashOrders || 0}
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#15803D' }}>
              Delivered across all service zones
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financials;
