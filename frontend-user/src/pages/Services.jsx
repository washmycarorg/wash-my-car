import React from 'react';

const Services = () => {
  const services = [
    { id: '1', name: 'Basic Wash', description: 'Exterior wash & dry', price: 25 },
    { id: '2', name: 'Premium Wash', description: 'Exterior + interior vacuum + tyre shine', price: 45 },
    { id: '3', name: 'Full Detailing', description: 'Full interior & exterior detailing, polish & wax', price: 120 }
  ];

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      <div className="card" style={{padding: 0, marginBottom: '1.5rem', overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Explore services</h3>
        </div>
        <div style={{padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {services.map(svc => (
            <div 
              key={svc.id} 
              style={{
                padding: '1.25rem',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-md)',
                background: 'white',
              }}
            >
              <h4 style={{margin: '0 0 0.25rem 0', color: 'var(--primary-navy)', fontSize: '1.05rem'}}>{svc.name}</h4>
              <p style={{margin: '0 0 0.75rem 0', color: 'var(--text-muted)', fontSize: '0.85rem'}}>{svc.description}</p>
              <div style={{fontWeight: 700, color: 'var(--primary-blue)', fontSize: '1.2rem'}}>
                ₹{svc.price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
