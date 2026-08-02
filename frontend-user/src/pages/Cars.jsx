import React, { useState, useEffect } from 'react';
import { Trash2, Car as CarIcon } from 'lucide-react';
import { getCars, addCar, deleteCar, getCarTypes } from '../api';

const Cars = () => {
  const [cars, setCars] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    carTypeId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const carsList = await getCars();
      const typesList = await getCarTypes();
      setCars(carsList);
      setCarTypes(typesList);
      if (typesList.length > 0) {
        setFormData(prev => ({ ...prev, carTypeId: typesList[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.make || !formData.model || !formData.carTypeId) {
      return alert('Please fill in all fields');
    }
    try {
      await addCar({
        make: formData.make,
        model: formData.model,
        carTypeId: Number(formData.carTypeId)
      });
      setFormData(prev => ({
        make: '',
        model: '',
        carTypeId: carTypes.length > 0 ? carTypes[0].id.toString() : ''
      }));
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to add car');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this car?')) return;
    try {
      await deleteCar(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete car');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading cars...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Saved Cars */}
      <div className="card" style={{ padding: 0, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CarIcon size={20} color="var(--primary-blue)" /> Saved Cars
          </h3>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 600 }}>
                  {car.make} {car.model}
                </h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Type: {car.carType?.name || 'Standard'}
                </p>
              </div>
              <button 
                onClick={() => handleDelete(car.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                title="Delete Car"
              >
                <Trash2 size={18} color="var(--danger)" />
              </button>
            </div>
          ))}
          {cars.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0' }}>No saved cars yet. Add one below!</p>
          )}
        </div>
      </div>

      {/* Add Car Form */}
      <div className="card" style={{ padding: 0, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)' }}>Add New Car</h3>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Brand / Make</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Maruti, Toyota"
              value={formData.make}
              onChange={e => setFormData({ ...formData, make: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Model Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Swift, Fortuner"
              value={formData.model}
              onChange={e => setFormData({ ...formData, model: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Vehicle Body Type</label>
            <select 
              className="form-input"
              value={formData.carTypeId}
              onChange={e => setFormData({ ...formData, carTypeId: e.target.value })}
            >
              {carTypes.map(ct => (
                <option key={ct.id} value={ct.id}>{ct.name}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleAdd}
            style={{
              width: '100%', 
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
            Save Car
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cars;
