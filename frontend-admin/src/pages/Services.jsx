import React, { useState, useEffect } from 'react';
import { 
  getCarTypes, createCarType, deleteCarType,
  getWashTypes, createWashType, deleteWashType,
  getWashPrices, saveWashPrice,
  getAddons, createAddon, updateAddon, deleteAddon
} from '../api';
import { Settings, Car, Sparkles, DollarSign, Plus, Trash2, Edit3, Check, X, Shield, Bike, Flame, Feather, Droplets, CheckCircle, ToggleLeft, ToggleRight } from 'lucide-react';

const Services = () => {
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix', 'cartypes', 'washtypes', 'addons'
  
  // Lists
  const [carTypes, setCarTypes] = useState([]);
  const [washTypes, setWashTypes] = useState([]);
  const [prices, setPrices] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newCarType, setNewCarType] = useState('');
  const [newWashType, setNewWashType] = useState({ name: '', description: '' });
  const [newAddon, setNewAddon] = useState({ name: '', price: '', description: '', active: true });
  const [editingAddon, setEditingAddon] = useState(null);

  // Inline editing state for matrix cell
  const [editingCell, setEditingCell] = useState(null); // { carTypeId, washTypeId, price, payoutType, payoutValue }

  const fetchData = async () => {
    try {
      const [cars, washes, matrixPrices, addonsList] = await Promise.all([
        getCarTypes(),
        getWashTypes(),
        getWashPrices(),
        getAddons().catch(() => [])
      ]);
      setCarTypes(cars);
      setWashTypes(washes);
      setPrices(matrixPrices);
      setAddons(addonsList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Car Types CRUD
  const handleAddCarType = async (e) => {
    e.preventDefault();
    if (!newCarType.trim()) return;
    try {
      await createCarType(newCarType);
      setNewCarType('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to add car type. Check if it already exists.');
    }
  };

  const handleDeleteCarType = async (id) => {
    if (!confirm('Are you sure you want to delete this car type? This will also delete any associated pricing settings.')) return;
    try {
      await deleteCarType(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Wash Types CRUD
  const handleAddWashType = async (e) => {
    e.preventDefault();
    if (!newWashType.name.trim()) return;
    try {
      await createWashType(newWashType.name, newWashType.description);
      setNewWashType({ name: '', description: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to add wash type. Check if it already exists.');
    }
  };

  const handleDeleteWashType = async (id) => {
    if (!confirm('Are you sure you want to delete this wash type? This will also delete any associated pricing settings.')) return;
    try {
      await deleteWashType(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Addons Handlers
  const handleAddAddon = async (e) => {
    e.preventDefault();
    if (!newAddon.name.trim() || !newAddon.price) return;
    try {
      await createAddon({
        name: newAddon.name,
        price: Number(newAddon.price),
        description: newAddon.description,
        active: newAddon.active
      });
      setNewAddon({ name: '', price: '', description: '', active: true });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to add add-on. Make sure the name is unique.');
    }
  };

  const handleUpdateAddon = async (id, data) => {
    try {
      await updateAddon(id, data);
      setEditingAddon(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update add-on.');
    }
  };

  const handleToggleAddon = async (addon) => {
    try {
      await updateAddon(addon.id, { active: !addon.active });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddon = async (id) => {
    if (!confirm('Are you sure you want to delete this add-on?')) return;
    try {
      await deleteAddon(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete add-on.');
    }
  };

  // Save Pricing Matrix
  const handleSavePriceCell = async () => {
    if (!editingCell) return;
    try {
      await saveWashPrice({
        carTypeId: editingCell.carTypeId,
        washTypeId: editingCell.washTypeId,
        price: Number(editingCell.price),
        payoutType: editingCell.payoutType,
        payoutValue: Number(editingCell.payoutValue),
        companyCost: Number(editingCell.companyCost || 0)
      });
      setEditingCell(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save pricing cell settings.');
    }
  };

  const getPriceInfo = (carTypeId, washTypeId) => {
    return prices.find(p => p.carTypeId === carTypeId && p.washTypeId === washTypeId) || {
      price: 0,
      payoutType: 'PERCENTAGE',
      payoutValue: 50.0,
      companyCost: 0
    };
  };

  if (loading) return <div>Loading plans & pricing configurations...</div>;

  return (
    <div className="animate-fade-in">
      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('matrix')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            color: activeTab === 'matrix' ? 'var(--primary-blue)' : 'var(--text-muted)',
            borderBottom: activeTab === 'matrix' ? '3px solid var(--primary-blue)' : 'none',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          <DollarSign size={18} /> Pricing & Commission Matrix
        </button>

        <button 
          onClick={() => setActiveTab('cartypes')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            color: activeTab === 'cartypes' ? 'var(--primary-blue)' : 'var(--text-muted)',
            borderBottom: activeTab === 'cartypes' ? '3px solid var(--primary-blue)' : 'none',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          <Car size={18} /> Car Types
        </button>

        <button 
          onClick={() => setActiveTab('washtypes')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            color: activeTab === 'washtypes' ? 'var(--primary-blue)' : 'var(--text-muted)',
            borderBottom: activeTab === 'washtypes' ? '3px solid var(--primary-blue)' : 'none',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          <Sparkles size={18} /> Wash Plans
        </button>

        <button 
          onClick={() => setActiveTab('addons')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            color: activeTab === 'addons' ? 'var(--primary-blue)' : 'var(--text-muted)',
            borderBottom: activeTab === 'addons' ? '3px solid var(--primary-blue)' : 'none',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Plus size={18} /> Add-ons ({addons.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'matrix' && (
        <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-navy)' }}>Service Pricing & Commission Matrix</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Click on any cell to edit the service price and configure the employee payout (percentage or fixed amount) for that specific vehicle and plan.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ padding: '1rem', color: 'var(--primary-navy)', fontWeight: 700 }}>Car / Vehicle Type</th>
                {washTypes.map(wt => (
                  <th key={wt.id} style={{ padding: '1rem', color: 'var(--primary-navy)', fontWeight: 700, textAlign: 'center' }}>
                    {wt.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {carTypes.map(ct => (
                <tr key={ct.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '1.25rem 1rem', fontWeight: 600, color: 'var(--primary-navy)' }}>{ct.name}</td>
                  
                  {washTypes.map(wt => {
                    const priceInfo = getPriceInfo(ct.id, wt.id);
                    const isEditing = editingCell?.carTypeId === ct.id && editingCell?.washTypeId === wt.id;

                    return (
                      <td key={wt.id} style={{ padding: '1rem', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{
                            background: '#F8FAFC',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--primary-blue)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            maxWidth: '180px',
                            margin: '0 auto'
                          }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, textAlign: 'left' }}>Price (₹)</label>
                              <input 
                                type="number" 
                                className="form-input" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', marginBottom: 0 }}
                                value={editingCell.price}
                                onChange={e => setEditingCell({ ...editingCell, price: e.target.value })}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, textAlign: 'left' }}>Commission Type</label>
                              <select 
                                className="form-input" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', marginBottom: 0 }}
                                value={editingCell.payoutType}
                                onChange={e => setEditingCell({ ...editingCell, payoutType: e.target.value })}
                              >
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="AMOUNT">Fixed (₹)</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, textAlign: 'left' }}>Payout Value</label>
                              <input 
                                type="number" 
                                className="form-input" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', marginBottom: 0 }}
                                value={editingCell.payoutValue}
                                onChange={e => setEditingCell({ ...editingCell, payoutValue: e.target.value })}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, textAlign: 'left' }}>Company Cost (₹)</label>
                              <input 
                                type="number" 
                                className="form-input" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', marginBottom: 0 }}
                                value={editingCell.companyCost}
                                onChange={e => setEditingCell({ ...editingCell, companyCost: e.target.value })}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                              <button onClick={handleSavePriceCell} className="btn btn-teal" style={{ padding: '0.25rem', flex: 1, borderRadius: '4px' }}>
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditingCell(null)} className="btn btn-outline" style={{ padding: '0.25rem', flex: 1, borderRadius: '4px', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => setEditingCell({
                              carTypeId: ct.id,
                              washTypeId: wt.id,
                              price: priceInfo.price,
                              payoutType: priceInfo.payoutType,
                              payoutValue: priceInfo.payoutValue,
                              companyCost: priceInfo.companyCost || 0
                            })}
                            style={{
                              padding: '0.75rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: '1px dashed #CBD5E1',
                              background: priceInfo.price > 0 ? '#F0FDF4' : '#FFF7ED',
                              transition: 'all 0.2s',
                              display: 'inline-block',
                              minWidth: '120px'
                            }}
                            className="hover:border-primary-blue"
                          >
                            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                              ₹{priceInfo.price}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              Emp: {priceInfo.payoutType === 'PERCENTAGE' ? `${priceInfo.payoutValue}%` : `₹${priceInfo.payoutValue}`}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Co. Cost: ₹{priceInfo.companyCost || 0}
                            </div>
                            {priceInfo.price > 0 && (() => {
                              const empPayout = priceInfo.payoutType === 'PERCENTAGE' ? (priceInfo.price * priceInfo.payoutValue) / 100 : priceInfo.payoutValue;
                              const netProfit = priceInfo.price - empPayout - (priceInfo.companyCost || 0);
                              return (
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '0.1rem' }}>
                                  Net: ₹{netProfit}
                                </div>
                              );
                            })()}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.1rem', fontSize: '0.65rem', color: 'var(--primary-blue)', marginTop: '0.25rem', opacity: 0.8 }}>
                              <Edit3 size={10} /> Edit Settings
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {carTypes.length === 0 || washTypes.length === 0 ? (
                <tr>
                  <td colSpan={washTypes.length + 1} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Add Car Types and Wash Plans to populate the matrix!
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'cartypes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <h3 style={{ marginBottom: '1.25rem' }}>Add Car Type</h3>
              <form onSubmit={handleAddCarType} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Vehicle Type Name</label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Sedan, SUV, Hatchback, Luxury"
                    value={newCarType}
                    onChange={e => setNewCarType(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Add Car Type</button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="card" style={{ padding: 0 }}>
              <div className="p-6 border-b border-gray-200"><h3 style={{ margin: 0 }}>Active Car Categories</h3></div>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {carTypes.map(c => (
                  <div 
                    key={c.id} 
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
                    <span style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{c.name}</span>
                    <button 
                      onClick={() => handleDeleteCarType(c.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      <Trash2 size={18} color="var(--danger)" />
                    </button>
                  </div>
                ))}
                {carTypes.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No car types created yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'washtypes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <h3 style={{ marginBottom: '1.25rem' }}>Add Wash Plan</h3>
              <form onSubmit={handleAddWashType} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Plan Name</label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Basic Wash, Full Detail"
                    value={newWashType.name}
                    onChange={e => setNewWashType({ ...newWashType, name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Included services..."
                    value={newWashType.description}
                    onChange={e => setNewWashType({ ...newWashType, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Add Wash Type</button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="card" style={{ padding: 0 }}>
              <div className="p-6 border-b border-gray-200"><h3 style={{ margin: 0 }}>Available Wash Plans</h3></div>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {washTypes.map(w => (
                  <div 
                    key={w.id} 
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
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary-navy)', fontWeight: 600 }}>{w.name}</h4>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{w.description}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteWashType(w.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      <Trash2 size={18} color="var(--danger)" />
                    </button>
                  </div>
                ))}
                {washTypes.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No wash types created yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'addons' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Add-on form */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-navy)' }}>
                {editingAddon ? 'Edit Add-on Service' : 'Create New Add-on'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Add-ons (e.g. Helmet wash, Bike wash, Engine steam) can only be added along with a main vehicle wash.
              </p>
              
              <form 
                onSubmit={editingAddon ? (e) => { e.preventDefault(); handleUpdateAddon(editingAddon.id, editingAddon); } : handleAddAddon} 
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Add-on Name</label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Helmet Wash, Two-Wheeler Foam Wash"
                    value={editingAddon ? editingAddon.name : newAddon.name}
                    onChange={e => editingAddon 
                      ? setEditingAddon({ ...editingAddon, name: e.target.value })
                      : setNewAddon({ ...newAddon, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Price (₹ INR)</label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    step="1"
                    className="form-input" 
                    placeholder="e.g. 99, 199, 299"
                    value={editingAddon ? editingAddon.price : newAddon.price}
                    onChange={e => editingAddon 
                      ? setEditingAddon({ ...editingAddon, price: e.target.value })
                      : setNewAddon({ ...newAddon, price: e.target.value })
                    }
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Short summary of what this add-on includes..."
                    value={editingAddon ? (editingAddon.description || '') : newAddon.description}
                    onChange={e => editingAddon 
                      ? setEditingAddon({ ...editingAddon, description: e.target.value })
                      : setNewAddon({ ...newAddon, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {editingAddon ? 'Save Add-on' : 'Add Service'}
                  </button>
                  {editingAddon && (
                    <button 
                      type="button" 
                      onClick={() => setEditingAddon(null)} 
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Add-ons List */}
          <div className="lg:col-span-2">
            <div className="card" style={{ padding: 0 }}>
              <div className="p-6 border-b border-gray-200" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--primary-navy)' }}>Active Add-ons Catalog</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Total: {addons.length} items
                </span>
              </div>

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {addons.map(addon => (
                  <div 
                    key={addon.id} 
                    style={{
                      padding: '1.1rem 1.25rem',
                      border: addon.active ? '1px solid #E2E8F0' : '1px dashed #CBD5E1',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: addon.active ? 'white' : '#F8FAFC',
                      opacity: addon.active ? 1 : 0.7,
                      transition: 'all 0.2s',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontWeight: 700, fontSize: '1rem' }}>
                          {addon.name}
                        </h4>
                        <span style={{ 
                          fontWeight: 800, 
                          color: '#0284C7', 
                          background: '#E0F2FE', 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '20px', 
                          fontSize: '0.85rem' 
                        }}>
                          ₹{addon.price}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          background: addon.active ? '#DCFCE7' : '#F1F5F9',
                          color: addon.active ? '#15803D' : '#64748B'
                        }}>
                          {addon.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      {addon.description && (
                        <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                          {addon.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <button 
                        onClick={() => handleToggleAddon(addon)}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', borderRadius: '4px' }}
                        title={addon.active ? 'Deactivate' : 'Activate'}
                      >
                        {addon.active ? 'Disable' : 'Enable'}
                      </button>
                      <button 
                        onClick={() => setEditingAddon(addon)}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.6rem', borderRadius: '4px' }}
                        title="Edit"
                      >
                        <Edit3 size={15} color="var(--primary-blue)" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAddon(addon.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.35rem' }}
                        title="Delete"
                      >
                        <Trash2 size={16} color="var(--danger)" />
                      </button>
                    </div>
                  </div>
                ))}
                {addons.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No add-on services configured. Create your first add-on using the form on the left.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inject custom cell editing style overrides */}
      <style>{`
        .hover\\:border-primary-blue:hover {
          border-color: var(--primary-blue) !important;
          background: #F0F9FF !important;
        }
      `}</style>
    </div>
  );
};

export default Services;
