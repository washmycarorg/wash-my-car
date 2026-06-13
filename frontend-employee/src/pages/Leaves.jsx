import React from 'react';

const Leaves = () => {
  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      
      {/* My Leave Requests */}
      <div className="card" style={{padding: 0, overflow: 'hidden', marginBottom: '1.5rem'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>My leave requests</h3>
        </div>
        <div style={{padding: '1.25rem'}}>
          <p style={{color: 'var(--text-muted)', margin: 0}}>No requests.</p>
        </div>
      </div>

      {/* Apply for Leave Form */}
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Apply for leave</h3>
        </div>
        <div style={{padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem'}}>From</label>
            <input 
              type="date" 
              className="form-input" 
              style={{borderColor: '#E2E8F0', color: 'var(--primary-navy)'}}
            />
          </div>

          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem'}}>To</label>
            <input 
              type="date" 
              className="form-input" 
              style={{borderColor: '#E2E8F0', color: 'var(--primary-navy)'}}
            />
          </div>

          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem'}}>Reason</label>
            <input 
              type="text" 
              className="form-input" 
              style={{borderColor: '#E2E8F0', color: 'var(--primary-navy)'}}
            />
          </div>

          <button 
            onClick={() => alert('Leave request submitted')}
            style={{
              padding: '0.875rem', 
              background: 'var(--primary-blue)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 'var(--radius-md)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            Submit
          </button>
        </div>
      </div>

    </div>
  );
};

export default Leaves;
