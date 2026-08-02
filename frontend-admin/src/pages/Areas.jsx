import React, { useState, useEffect } from 'react';
import { getServiceAreas, createServiceArea, deleteServiceArea } from '../api';
import { Trash2, MapPin, Plus } from 'lucide-react';

const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [newAreaName, setNewAreaName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const res = await getServiceAreas();
      setAreas(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddArea = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return alert('Please enter a location/area name');
    try {
      await createServiceArea(newAreaName);
      setNewAreaName('');
      fetchAreas();
    } catch (err) {
      console.error(err);
      alert('Failed to add service area. Make sure it is unique.');
    }
  };

  const handleDeleteArea = async (id) => {
    if (!confirm('Are you sure you want to delete this service area? Employees serving this area and saved addresses using it might be affected.')) return;
    try {
      await deleteServiceArea(id);
      fetchAreas();
    } catch (err) {
      console.error(err);
      alert('Failed to delete service area.');
    }
  };

  if (loading) return <div>Loading service areas...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }} className="animate-fade-in">
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} color="var(--primary-blue)" /> Service Areas Configuration
          </h3>
        </div>
        
        {/* Add Area */}
        <div style={{ padding: '1.25rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <form onSubmit={handleAddArea} style={{ display: 'flex', gap: '0.75rem' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Bandra West, Hitech City, Downtown" 
              value={newAreaName}
              onChange={e => setNewAreaName(e.target.value)}
              style={{ marginBottom: 0, background: 'white' }}
            />
            <button 
              type="submit" 
              className="btn btn-teal" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0 1.5rem', borderRadius: 'var(--radius-md)', height: '42px', flexShrink: 0 }}
            >
              <Plus size={18} /> Add
            </button>
          </form>
        </div>

        {/* Areas List */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {areas.map(area => (
            <div 
              key={area.id} 
              style={{
                padding: '1rem',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'white'
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{area.name}</span>
              <button 
                onClick={() => handleDeleteArea(area.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                title="Delete Service Area"
              >
                <Trash2 size={18} color="var(--danger)" />
              </button>
            </div>
          ))}
          {areas.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 0, padding: '1.5rem 0' }}>No service areas configured yet. Configure one above!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Areas;
