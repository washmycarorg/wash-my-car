import React from 'react';
import { Power, ClipboardList, Wallet, Star } from 'lucide-react';
import { toggleDuty } from '../api';

const Dashboard = ({ profile, setProfile }) => {

  const handleToggle = async () => {
    try {
      const updated = await toggleDuty();
      setProfile({...profile, onDuty: updated.onDuty});
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const name = profile?.name || 'Suresh Kumar';
  const onDuty = profile?.onDuty || false;
  const stats = profile?.stats || { assignedToday: 0, completedJobs: 0, pendingJobs: 0 };
  const earnings = profile?.salary || 0;

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-blue), var(--accent-teal))',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem 1.5rem',
        color: 'white',
        marginBottom: '1.5rem'
      }}>
        <p style={{margin: '0 0 0.5rem 0', opacity: 0.9, fontSize: '0.9rem'}}>Welcome,</p>
        <h1 style={{margin: '0 0 1rem 0', fontSize: '2rem', fontWeight: 700}}>{name}</h1>
        <p style={{margin: '0 0 1.5rem 0', fontSize: '1.05rem'}}>
          Status: <span style={{fontWeight: 600}}>{onDuty ? 'On Duty' : 'Off Duty'}</span>
        </p>
        
        <button 
          onClick={handleToggle}
          style={{
            background: 'white',
            color: 'var(--primary-blue)',
            border: 'none',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <Power size={18} />
          {onDuty ? 'Log Off Duty' : 'Go On Duty'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card" style={{padding: '1.25rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600}}>ASSIGNED TODAY</span>
            <ClipboardList size={20} color="var(--primary-blue)" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.75rem', color: 'var(--primary-navy)'}}>{stats.assignedToday || stats.pendingJobs}</h2>
        </div>

        <div className="card" style={{padding: '1.25rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600}}>EARNINGS</span>
            <Wallet size={20} color="var(--primary-blue)" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.75rem', color: 'var(--primary-navy)'}}>₹{earnings}</h2>
        </div>

        <div className="card" style={{padding: '1.25rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600}}>RATING</span>
            <Star size={20} color="var(--primary-blue)" />
          </div>
          <h2 style={{margin: 0, fontSize: '1.75rem', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            4.8 <Star size={20} fill="var(--primary-navy)" color="var(--primary-navy)" />
          </h2>
        </div>
      </div>

      {/* Navigation Map */}
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Navigation to next job</h3>
        </div>
        <div style={{padding: '1.25rem'}}>
          <div style={{
            height: '200px', 
            borderRadius: 'var(--radius-md)', 
            background: 'linear-gradient(to bottom right, #E0F2FE, #D1FAE5)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #E2E8F0'
          }}>
            <span style={{color: '#64748B'}}>Google Maps placeholder</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
