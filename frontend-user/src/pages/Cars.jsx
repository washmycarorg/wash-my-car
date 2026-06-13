import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { getCars, addCar } from '../api';

const Cars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    licensePlate: '',
    type: 'Sedan'
  });

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const data = await getCars();
      setCars(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.make || !formData.model || !formData.licensePlate) return alert('Please fill all fields');
    try {
      await addCar(formData);
      setFormData({ make: '', model: '', licensePlate: '', type: 'Sedan' });
      fetchCars();
    } catch (err) {
      console.error(err);
      alert('Failed to add car');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      {/* Saved Cars */}
      <div className="card" style={{padding: 0, marginBottom: '1.5rem', overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Saved cars</h3>
        </div>
        <div style={{padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {cars.map(car => (
            <div 
              key={car.id} 
              style={{
                padding: '1.25rem',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'white'
              }}
            >
              <div>
                <h4 style={{margin: '0 0 0.25rem 0', color: 'var(--primary-navy)', fontSize: '1.05rem'}}>{car.make} {car.model}</h4>
                <p style={{margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem'}}>
                  {car.licensePlate} · {car.type}
                </p>
              </div>
              <button style={{background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem'}}>
                <Trash2 size={18} color="var(--primary-navy)" />
              </button>
            </div>
          ))}
          {cars.length === 0 && (
            <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>No saved cars.</p>
          )}
        </div>
      </div>

      {/* Add Car Form */}
      <div className="card" style={{padding: 0, marginBottom: '1.5rem', overflow: 'hidden'}}>
        <div style={{padding: '1.25rem', borderBottom: '1px solid #E2E8F0'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)'}}>Add car</h3>
        </div>
        <div style={{padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Make"
            value={formData.make}
            onChange={e => setFormData({...formData, make: e.target.value})}
            style={{borderColor: '#E2E8F0'}}
          />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Model"
            value={formData.model}
            onChange={e => setFormData({...formData, model: e.target.value})}
            style={{borderColor: '#E2E8F0'}}
          />
          <input 
            type="text" 
            className="form-input" 
            placeholder="License plate"
            value={formData.licensePlate}
            onChange={e => setFormData({...formData, licensePlate: e.target.value})}
            style={{borderColor: '#E2E8F0'}}
          />
          <select 
            className="form-input"
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value})}
            style={{borderColor: '#E2E8F0'}}
          >
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="Hatchback">Hatchback</option>
          </select>
          <button 
            onClick={handleAdd}
            style={{
              width: '100%', 
              padding: '0.875rem', 
              background: 'var(--accent-teal)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 'var(--radius-md)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            Add car
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cars;
