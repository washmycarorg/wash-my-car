import React, { useState, useEffect } from 'react';
import { getServices, createService, deleteService, updateService } from '../api';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', type: 'Basic' });

  const fetchServices = async () => {
    try {
      const res = await getServices();
      setServices(res);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createService(formData);
      setFormData({ name: '', description: '', price: '', type: 'Basic' });
      fetchServices();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this package?")) return;
    try {
      await deleteService(id);
      fetchServices();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="card">
          <h3 style={{marginBottom: '1rem'}}>Add Package / Plan</h3>
          <form className="flex-col gap-4" onSubmit={handleSubmit} style={{display: 'flex'}}>
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label">Package Name</label>
              <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Premium Wash" />
            </div>
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label">Type</label>
              <select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Basic">Basic</option>
                <option value="Premium">Premium</option>
                <option value="Full">Full Detailing</option>
                <option value="Subscription">Subscription Plan</option>
              </select>
            </div>
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label">Price ($)</label>
              <input required type="number" min="0" step="0.01" className="form-input" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="e.g. 49.99" />
            </div>
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label">Description</label>
              <textarea required className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What's included..." rows={3} />
            </div>
            <button type="submit" className="btn btn-primary">Save Package</button>
          </form>
        </div>
      </div>
      
      <div className="lg:col-span-2">
        <div className="card" style={{padding: 0, overflowX: 'auto'}}>
          <div className="p-6 border-b border-gray-200"><h3 style={{margin: 0}}>Existing Packages</h3></div>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
            <thead style={{background: '#F8FAFC'}}>
              <tr>
                <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Package</th>
                <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Type</th>
                <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Price</th>
                <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} style={{borderBottom: '1px solid #F1F5F9'}}>
                  <td style={{padding: '1rem 1.5rem'}}>
                    <div style={{fontWeight: 600}}>{s.name}</div>
                    <div className="text-sm text-muted">{s.description.substring(0, 40)}...</div>
                  </td>
                  <td style={{padding: '1rem 1.5rem'}}>
                    <span className="badge" style={{background: '#E0E7FF', color: '#4F46E5'}}>{s.type}</span>
                  </td>
                  <td style={{padding: '1rem 1.5rem', fontWeight: 'bold'}}>${s.price}</td>
                  <td style={{padding: '1rem 1.5rem'}} className="flex gap-2">
                    <button className="btn btn-danger text-xs" style={{padding: '0.25rem 0.5rem'}} onClick={() => handleDelete(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && <tr><td colSpan="4" style={{padding: '2rem', textAlign: 'center'}}>No packages found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Services;
