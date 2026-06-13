import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../api';

const BookSlot = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    serviceId: '2', // Default Premium Wash
    date: '',
    timeSlot: '',
    address: '12 Marine Drive, Mumbai',
    offerCode: ''
  });
  const [loading, setLoading] = useState(false);

  const services = [
    { id: '1', name: 'Basic Wash', description: 'Exterior wash & dry', price: 25 },
    { id: '2', name: 'Premium Wash', description: 'Exterior + interior vacuum + tyre shine', price: 45 },
    { id: '3', name: 'Full Detailing', description: 'Full interior & exterior detailing, polish & wax', price: 120 }
  ];

  const handleBook = async () => {
    if (!formData.date || !formData.address) return alert('Please fill in date and address');
    setLoading(true);
    try {
      await createBooking({
        serviceId: formData.serviceId,
        date: new Date(formData.date).toISOString(),
        timeSlot: formData.timeSlot || '10:00 AM',
        address: formData.address,
        amount: services.find(s => s.id === formData.serviceId)?.price || 45
      });
      alert('Booking Confirmed! (Mock Payment)');
      navigate('/history');
    } catch (err) {
      console.error(err);
      alert('Failed to book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find(s => s.id === formData.serviceId);

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      {/* Choose Service */}
      <div className="card" style={{padding: 0, marginBottom: '1.5rem', overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Choose service</h3>
        </div>
        <div style={{padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {services.map(svc => {
            const isSelected = formData.serviceId === svc.id;
            return (
              <div 
                key={svc.id} 
                onClick={() => setFormData({...formData, serviceId: svc.id})}
                style={{
                  padding: '1.25rem',
                  border: isSelected ? '1.5px solid var(--primary-blue)' : '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: isSelected ? '#F0F9FF' : 'white',
                }}
              >
                <h4 style={{margin: '0 0 0.25rem 0', color: 'var(--primary-navy)', fontSize: '1.05rem'}}>{svc.name}</h4>
                <p style={{margin: '0 0 0.75rem 0', color: 'var(--text-muted)', fontSize: '0.85rem'}}>{svc.description}</p>
                <div style={{fontWeight: 700, color: 'var(--primary-blue)', fontSize: '1.2rem'}}>
                  ₹{svc.price}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date & Time */}
      <div className="card" style={{padding: 0, marginBottom: '1.5rem', overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Date & time</h3>
        </div>
        <div style={{padding: '1.25rem'}}>
          <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem'}}>Date</label>
          <div style={{position: 'relative'}}>
            <input 
              type="date" 
              className="form-input" 
              value={formData.date} 
              onChange={e => setFormData({...formData, date: e.target.value})}
              style={{borderColor: '#E2E8F0', color: 'var(--primary-navy)'}}
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="card" style={{padding: 0, marginBottom: '1.5rem', overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Address</h3>
        </div>
        <div style={{padding: '1.25rem'}}>
          <input 
            type="text" 
            className="form-input mb-4" 
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            placeholder="Enter address"
            style={{borderColor: '#E2E8F0', color: 'var(--primary-navy)'}}
          />
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

      {/* Order Summary */}
      <div className="card" style={{padding: 0, marginBottom: '2rem', overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Order summary</h3>
        </div>
        <div style={{padding: '1.25rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
            <span style={{color: 'var(--primary-navy)'}}>{selectedService?.name}</span>
            <span style={{color: 'var(--primary-navy)'}}>₹{selectedService?.price}</span>
          </div>
          
          <input 
            type="text" 
            className="form-input mb-4" 
            placeholder="Offer code (try FIRST20)"
            value={formData.offerCode}
            onChange={e => setFormData({...formData, offerCode: e.target.value})}
            style={{borderColor: '#E2E8F0'}}
          />

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0', marginBottom: '1.5rem'}}>
            <span style={{fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-navy)'}}>Total</span>
            <span style={{fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-navy)'}}>₹{selectedService?.price}</span>
          </div>

          <button 
            onClick={handleBook}
            disabled={loading}
            style={{
              width: '100%', 
              padding: '1rem', 
              background: 'var(--accent-teal)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 'var(--radius-md)',
              fontSize: '1.05rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {loading ? 'Processing...' : 'Confirm & Pay (mock)'}
          </button>
          <div style={{textAlign: 'center', marginTop: '1rem', color: '#64748B', fontSize: '0.85rem'}}>
            Payment gateway placeholder
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookSlot;
