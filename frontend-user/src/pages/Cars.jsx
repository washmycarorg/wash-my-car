import React, { useState, useEffect } from 'react';
import { Trash2, Car as CarIcon, Plus, Check, Shield } from 'lucide-react';
import { getCars, addCar, deleteCar, getCarTypes } from '../api';
import SearchableDropdown from '../components/SearchableDropdown';
import { INDIAN_CAR_BRANDS } from '../data/indianCars';
import { formatIndianCarNumber, validateIndianCarNumber, getCarNumberMetadata } from '../utils/indianVehicle';

const Cars = () => {
  const [cars, setCars] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedBrand, setSelectedBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [carTypeId, setCarTypeId] = useState('');
  const [carNumber, setCarNumber] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [carsList, typesList] = await Promise.all([getCars(), getCarTypes()]);
      setCars(carsList);
      setCarTypes(typesList);
      if (typesList.length > 0) {
        setCarTypeId(typesList[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-match car type on model selection
  useEffect(() => {
    if (selectedBrand && selectedBrand !== '__OTHER__' && selectedModel && selectedModel !== '__OTHER__') {
      const brandObj = INDIAN_CAR_BRANDS.find(b => b.name === selectedBrand);
      if (brandObj) {
        const modelObj = brandObj.models.find(m => m.name === selectedModel);
        if (modelObj && modelObj.type && carTypes.length > 0) {
          const match = carTypes.find(ct => ct.name.toLowerCase().includes(modelObj.type.toLowerCase()) || modelObj.type.toLowerCase().includes(ct.name.toLowerCase()));
          if (match) setCarTypeId(match.id.toString());
        }
      }
    }
  }, [selectedBrand, selectedModel, carTypes]);

  const handleAdd = async () => {
    const finalMake = selectedBrand === '__OTHER__' ? customBrand.trim() : selectedBrand.trim();
    const finalModel = selectedModel === '__OTHER__' ? customModel.trim() : selectedModel.trim();

    if (!finalMake || !finalModel || !carTypeId) {
      return alert('Please select a car brand, model, and body type.');
    }

    const valRes = validateIndianCarNumber(carNumber);
    if (!valRes.isValid) {
      return alert(valRes.message);
    }

    try {
      await addCar({
        make: finalMake,
        model: finalModel,
        carTypeId: Number(carTypeId),
        carNumber: carNumber.trim()
      });
      // Reset form
      setSelectedBrand('');
      setCustomBrand('');
      setSelectedModel('');
      setCustomModel('');
      setCarNumber('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to add car: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this vehicle from your profile?')) return;
    try {
      await deleteCar(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete car');
    }
  };

  const brandOptions = INDIAN_CAR_BRANDS.map(b => b.name);
  const currentBrandObj = INDIAN_CAR_BRANDS.find(b => b.name === selectedBrand);
  const modelOptions = currentBrandObj ? currentBrandObj.models.map(m => m.name) : [];

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading your saved garage...</div>;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '2rem' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 0.25rem' }}>
          My Registered Vehicles
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
          Manage your saved cars for instant 1-click doorstep wash scheduling
        </p>
      </div>

      {/* Saved Cars List */}
      <div className="card" style={{ padding: 0, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CarIcon size={20} color="var(--primary-blue)" /> Garage ({cars.length})
          </h3>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {cars.map(car => (
            <div 
              key={car.id} 
              style={{
                padding: '1.1rem 1.25rem',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CarIcon size={22} color="var(--primary-blue)" />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.2rem 0', color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 700 }}>
                    {car.make} {car.model}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '0.1rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                      {car.carType?.name || 'Standard'}
                    </span>
                    {car.carNumber ? (
                      <span style={{ fontSize: '0.75rem', background: '#E0F2FE', color: '#0369A1', padding: '0.1rem 0.55rem', borderRadius: '6px', fontWeight: 700, letterSpacing: '0.05em' }}>
                        {car.carNumber}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No reg number added</span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(car.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px' }}
                title="Remove vehicle"
              >
                <Trash2 size={18} color="var(--danger)" />
              </button>
            </div>
          ))}
          {cars.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
              No saved vehicles yet. Register your vehicle below!
            </p>
          )}
        </div>
      </div>

      {/* Add New Car Form */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: '18px' }}>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', color: 'var(--primary-navy)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={18} color="var(--primary-blue)" /> Register a New Vehicle
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="booking-car-fields-grid">
            {/* Brand */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Manufacturer / Brand</label>
              <SearchableDropdown
                options={brandOptions}
                value={selectedBrand}
                onChange={val => {
                  setSelectedBrand(val);
                  setSelectedModel('');
                }}
                placeholder="Choose brand (e.g. Maruti, Tata)"
                allowOther={true}
                otherLabel="+ Other Brand (Manual)"
              />
              {selectedBrand === '__OTHER__' && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Custom brand..."
                  value={customBrand}
                  onChange={e => setCustomBrand(e.target.value)}
                  style={{ marginTop: '0.5rem' }}
                />
              )}
            </div>

            {/* Model */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Vehicle Model</label>
              <SearchableDropdown
                options={modelOptions}
                value={selectedModel}
                onChange={val => setSelectedModel(val)}
                placeholder={selectedBrand ? "Choose model..." : "Select brand first"}
                allowOther={true}
                otherLabel="+ Other Model (Manual)"
                disabled={!selectedBrand}
              />
              {selectedModel === '__OTHER__' && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Custom model..."
                  value={customModel}
                  onChange={e => setCustomModel(e.target.value)}
                  style={{ marginTop: '0.5rem' }}
                />
              )}
            </div>
          </div>

          {/* Car Type Pills */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Vehicle Body Category</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {carTypes.map(ct => {
                const isSelected = carTypeId === ct.id.toString();
                return (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => setCarTypeId(ct.id.toString())}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--primary-blue)' : '1px solid #CBD5E1',
                      background: isSelected ? '#EFF6FF' : 'white',
                      color: isSelected ? 'var(--primary-blue)' : 'var(--text-main)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {ct.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Registration Number */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
              <span>
                Car Registration Plate Number <span style={{ color: '#EF4444' }}>*</span>
              </span>
              <span style={{ fontSize: '0.74rem', color: '#0284C7', fontWeight: 600 }}>
                Formats: AP-31-EA-1234, AP-31-E-1234, or 22-BH-1234-AA
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                maxLength={14}
                className="form-input"
                placeholder="e.g. AP-31-EA-1234 or 22-BH-1234-AA"
                value={carNumber}
                onChange={e => setCarNumber(formatIndianCarNumber(e.target.value))}
                style={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.98rem', paddingRight: '50px' }}
              />
              <span style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.7rem',
                background: '#F1F5F9',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                color: '#64748B',
                fontWeight: 800,
                letterSpacing: '0.05em'
              }}>
                IND
              </span>
            </div>

            {carNumber && (() => {
              const meta = getCarNumberMetadata(carNumber);
              return meta ? (
                <div style={{
                  marginTop: '0.4rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.74rem',
                  color: '#047857',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontWeight: 700
                }}>
                  <span>🚗 Recognized:</span>
                  <span>{meta.badge}</span>
                </div>
              ) : null;
            })()}
          </div>

          <button
            onClick={handleAdd}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem', borderRadius: '12px' }}
          >
            Save Vehicle to Garage
          </button>
        </div>
      </div>

    </div>
  );
};

export default Cars;
