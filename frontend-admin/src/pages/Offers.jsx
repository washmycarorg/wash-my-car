import React, { useState, useEffect } from 'react';
import { getOffers, createOffer, updateOffer, deleteOffer } from '../api';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', description: '', discountPct: '', validUntil: '', active: true });

  const fetchData = async () => {
    try {
      const res = await getOffers();
      setOffers(res);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOffer(formData);
      setFormData({ title: '', description: '', discountPct: '', validUntil: '', active: true });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await updateOffer(id, { active: !currentStatus });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this offer?")) return;
    try {
      await deleteOffer(id);
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="card">
          <h3 style={{marginBottom: '1rem'}}>Create New Offer</h3>
          <form className="flex-col gap-4" onSubmit={handleSubmit} style={{display: 'flex'}}>
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label">Title</label>
              <input required type="text" className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Summer Special" />
            </div>
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label">Description</label>
              <textarea required className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Details..." rows={3} />
            </div>
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label">Discount Percentage (%)</label>
              <input required type="number" min="1" max="100" className="form-input" value={formData.discountPct} onChange={e => setFormData({...formData, discountPct: e.target.value})} placeholder="e.g. 20" />
            </div>
            <div className="form-group" style={{margin: 0}}>
              <label className="form-label">Valid Until</label>
              <input required type="date" className="form-input" value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary">Create Offer</button>
          </form>
        </div>
      </div>
      
      <div className="lg:col-span-2">
        <div className="card" style={{padding: 0, overflowX: 'auto'}}>
          <div className="p-6 border-b border-gray-200"><h3 style={{margin: 0}}>Active & Past Offers</h3></div>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
            <thead style={{background: '#F8FAFC'}}>
              <tr>
                <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Offer</th>
                <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Discount</th>
                <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Valid Until</th>
                <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Status</th>
                <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(o => (
                <tr key={o.id} style={{borderBottom: '1px solid #F1F5F9'}}>
                  <td style={{padding: '1rem 1.5rem'}}>
                    <div style={{fontWeight: 600}}>{o.title}</div>
                    <div className="text-sm text-muted">{o.description.substring(0, 30)}...</div>
                  </td>
                  <td style={{padding: '1rem 1.5rem', fontWeight: 'bold', color: 'var(--accent-teal)'}}>{o.discountPct}% OFF</td>
                  <td style={{padding: '1rem 1.5rem'}}>{new Date(o.validUntil).toLocaleDateString()}</td>
                  <td style={{padding: '1rem 1.5rem'}}>
                    <span className={`badge ${o.active ? 'badge-success' : 'badge-danger'}`}>{o.active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{padding: '1rem 1.5rem'}} className="flex gap-2">
                    <button className="btn btn-outline text-xs" style={{padding: '0.25rem 0.5rem'}} onClick={() => handleToggle(o.id, o.active)}>
                      {o.active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn btn-danger text-xs" style={{padding: '0.25rem 0.5rem'}} onClick={() => handleDelete(o.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && <tr><td colSpan="5" style={{padding: '2rem', textAlign: 'center'}}>No offers found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Offers;
