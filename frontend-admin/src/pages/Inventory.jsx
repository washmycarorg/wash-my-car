import React, { useState, useEffect } from 'react';
import { 
  getInventoryItems, createInventoryItem, deleteInventoryItem,
  allocateInventory, deleteAllocation, getEmployees
} from '../api';
import { Plus, Trash2, Shield, Wrench, Droplet, User, Package, RefreshCw, BarChart2 } from 'lucide-react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newItem, setNewItem] = useState({ name: '', type: 'CHEMICAL', totalQuantity: '', washesPerUnit: '' });
  const [newAllocation, setNewAllocation] = useState({ inventoryItemId: '', employeeId: '', quantity: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invItems, emps] = await Promise.all([
        getInventoryItems(),
        getEmployees()
      ]);
      setItems(invItems);
      setEmployees(emps.filter(emp => emp.status === 'ACTIVE'));
    } catch (err) {
      console.error(err);
      alert('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.totalQuantity || !newItem.washesPerUnit) return;
    try {
      await createInventoryItem({
        name: newItem.name,
        type: newItem.type,
        totalQuantity: Number(newItem.totalQuantity),
        washesPerUnit: Number(newItem.washesPerUnit)
      });
      setNewItem({ name: '', type: 'CHEMICAL', totalQuantity: '', washesPerUnit: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to add inventory item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item? This will also delete any allocations.')) return;
    try {
      await deleteInventoryItem(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete item');
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!newAllocation.inventoryItemId || !newAllocation.employeeId || !newAllocation.quantity) return;
    try {
      await allocateInventory({
        inventoryItemId: Number(newAllocation.inventoryItemId),
        employeeId: Number(newAllocation.employeeId),
        quantity: Number(newAllocation.quantity)
      });
      setNewAllocation({ inventoryItemId: '', employeeId: '', quantity: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to allocate inventory');
    }
  };

  const handleReturnAllocation = async (id) => {
    if (!confirm('Return this allocation to warehouse? This will reclaim the quantity.')) return;
    try {
      await deleteAllocation(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to return allocation');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading Inventory Management...</div>;

  // Compute all allocations to list them easily
  const allAllocations = [];
  items.forEach(item => {
    (item.allocations || []).forEach(alloc => {
      allAllocations.push({
        ...alloc,
        item
      });
    });
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: '#EFF6FF', color: '#3B82F6', padding: '0.75rem', borderRadius: '12px' }}>
            <Package size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Warehouse Items</h4>
            <h2 style={{ margin: 0 }}>{items.length} Type(s)</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: '#ECFDF5', color: '#10B981', padding: '0.75rem', borderRadius: '12px' }}>
            <User size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Active Allocations</h4>
            <h2 style={{ margin: 0 }}>{allAllocations.length} Assigned</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: '#FFF7ED', color: '#F97316', padding: '0.75rem', borderRadius: '12px' }}>
            <BarChart2 size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Alerts & Depleted</h4>
            <h2 style={{ margin: 0 }}>
              {allAllocations.filter(a => a.washesUsed >= a.quantity * a.item.washesPerUnit).length} Depleted
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Forms */}
        <div className="flex-col gap-6" style={{ display: 'flex' }}>
          
          {/* Add Item Form */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} color="var(--primary-blue)" /> Add Warehouse Stock
            </h3>
            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Item Name</label>
                <input 
                  required 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Premium Car Shampoo (1L)"
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Category</label>
                <select 
                  className="form-input" 
                  value={newItem.type}
                  onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                >
                  <option value="CHEMICAL">Chemical / Liquid Consumables</option>
                  <option value="EQUIPMENT">Equipment / Tools</option>
                  <option value="OTHER">Other / Miscellaneous</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Warehouse Stock</label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    step="0.1"
                    className="form-input" 
                    placeholder="e.g. 50"
                    value={newItem.totalQuantity}
                    onChange={e => setNewItem({ ...newItem, totalQuantity: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Washes / Unit</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    className="form-input" 
                    placeholder="e.g. 20 (Washes per Liter/piece)"
                    value={newItem.washesPerUnit}
                    onChange={e => setNewItem({ ...newItem, washesPerUnit: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Add Warehouse Stock</button>
            </form>
          </div>

          {/* Allocate Stock Form */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} color="var(--accent-teal)" /> Distribute to Employee
            </h3>
            <form onSubmit={handleAllocate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Stock Item</label>
                <select 
                  required
                  className="form-input"
                  value={newAllocation.inventoryItemId}
                  onChange={e => setNewAllocation({ ...newAllocation, inventoryItemId: e.target.value })}
                >
                  <option value="">-- Choose Stock Item --</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id} disabled={item.totalQuantity <= 0}>
                      {item.name} ({item.totalQuantity} in stock)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Employee</label>
                <select 
                  required
                  className="form-input"
                  value={newAllocation.employeeId}
                  onChange={e => setNewAllocation({ ...newAllocation, employeeId: e.target.value })}
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Quantity to Handout</label>
                <input 
                  required
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 5 (Liters or units)"
                  value={newAllocation.quantity}
                  onChange={e => setNewAllocation({ ...newAllocation, quantity: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-teal" style={{ marginTop: '0.5rem' }}>Handout Stock</button>
            </form>
          </div>

        </div>

        {/* Right column: Warehouse Stock & Allocations */}
        <div className="lg:col-span-2 flex-col gap-6" style={{ display: 'flex' }}>
          
          {/* Warehouse Stock List */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-navy)' }}>Warehouse Stock Inventory</h3>
              <button onClick={fetchData} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.8rem' }}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map(item => (
                <div 
                  key={item.id} 
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
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ 
                      background: item.type === 'CHEMICAL' ? '#ECFDF5' : item.type === 'EQUIPMENT' ? '#EFF6FF' : '#F1F5F9',
                      color: item.type === 'CHEMICAL' ? '#10B981' : item.type === 'EQUIPMENT' ? '#3B82F6' : '#64748B',
                      padding: '0.5rem',
                      borderRadius: '8px'
                    }}>
                      {item.type === 'CHEMICAL' ? <Droplet size={18} /> : item.type === 'EQUIPMENT' ? <Wrench size={18} /> : <Package size={18} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Capacity: {item.washesPerUnit} washes / unit • Type: {item.type}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: item.totalQuantity > 5 ? 'var(--text-dark)' : 'var(--danger)' }}>
                        {item.totalQuantity}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Units Available</div>
                    </div>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      <Trash2 size={16} color="var(--danger)" />
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '1rem 0' }}>No warehouse items defined yet. Add some stock on the left panel!</p>
              )}
            </div>
          </div>

          {/* Active Employee Allocations */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-navy)' }}>Employee Stock Allocations & Consumption</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--primary-navy)' }}>Employee</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--primary-navy)' }}>Handed Out Item</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--primary-navy)', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--primary-navy)' }}>Washes Done / Max</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--primary-navy)', textAlign: 'center' }}>Usage</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--primary-navy)', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allAllocations.map(alloc => {
                    const maxWashes = alloc.quantity * alloc.item.washesPerUnit;
                    const progress = maxWashes > 0 ? Math.min((alloc.washesUsed / maxWashes) * 100, 100) : 0;
                    const isDepleted = alloc.washesUsed >= maxWashes;
                    const isLow = !isDepleted && (maxWashes - alloc.washesUsed <= alloc.item.washesPerUnit * 2);

                    return (
                      <tr key={alloc.id} style={{ borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-dark)' }}>{alloc.employee?.name}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontWeight: 500 }}>{alloc.item?.name}</span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{alloc.item?.type}</div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>{alloc.quantity}</td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                          {alloc.washesUsed} / {maxWashes.toFixed(0)} wash limit
                          {isDepleted ? (
                            <span style={{ marginLeft: '0.5rem', background: '#FEE2E2', color: '#EF4444', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.3rem', borderRadius: '4px' }}>DEPLETED</span>
                          ) : isLow ? (
                            <span style={{ marginLeft: '0.5rem', background: '#FEF3C7', color: '#F59E0B', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.3rem', borderRadius: '4px' }}>LOW</span>
                          ) : null}
                        </td>
                        <td style={{ padding: '1rem', minWidth: '100px' }}>
                          <div style={{ background: '#E2E8F0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              background: isDepleted ? '#EF4444' : isLow ? '#F59E0B' : '#10B981',
                              height: '100%',
                              width: `${progress}%`
                            }} />
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleReturnAllocation(alloc.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                            title="Return stock to warehouse"
                          >
                            <Trash2 size={16} color="var(--danger)" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {allAllocations.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No inventory allocated to employees yet. Use the distribution panel to allocate stock.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Inventory;
