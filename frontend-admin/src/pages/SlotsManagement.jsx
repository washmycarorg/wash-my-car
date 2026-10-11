import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSlotsConfig, updateSlotsConfig } from '../api';
import { Clock, Users, Navigation, Calendar, Check, AlertCircle, Plus, Trash2, Save, MapPin, Compass, Shield, ExternalLink, RefreshCw, Edit3 } from 'lucide-react';

const DEFAULT_SLOTS = [
  '08:00 AM',
  '10:00 AM',
  '12:00 PM',
  '02:00 PM',
  '04:00 PM',
  '06:00 PM'
];

// Helper to calculate realistic road transit distance from GPS coordinates (km)
const calcGpsDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined ||
      lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
    return 15;
  }
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return 15;

  const R = 6371; // Earth radius in km
  const dLat = (nLat2 - nLat1) * Math.PI / 180;
  const dLon = (nLon2 - nLon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(nLat1 * Math.PI / 180) * Math.cos(nLat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightKm = R * c;
  // Visakhapatnam urban road transit factor (~1.3x)
  return Math.round(straightKm * 1.3 * 10) / 10;
};

const SlotsManagement = () => {
  const [activeWorkers, setActiveWorkers] = useState(1);
  const [maxTravelKm, setMaxTravelKm] = useState(15);
  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [newSlotInput, setNewSlotInput] = useState('');
  
  // Specific Date Override States
  const [overrideDate, setOverrideDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [overrideSlots, setOverrideSlots] = useState([...DEFAULT_SLOTS]);
  const [monthlyOverrides, setMonthlyOverrides] = useState({});
  const [overrideNotice, setOverrideNotice] = useState('');

  // Dynamically linked Service Areas & Distance Matrix (from /areas)
  const [serviceAreas, setServiceAreas] = useState([]);
  const [distanceMatrix, setDistanceMatrix] = useState({});
  const [isEditingMatrix, setIsEditingMatrix] = useState(false);
  const [matrixNotice, setMatrixNotice] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    getSlotsConfig()
      .then(res => {
        if (res) {
          if (res.activeWorkers !== undefined) setActiveWorkers(Number(res.activeWorkers));
          if (res.maxTravelKm !== undefined) setMaxTravelKm(Number(res.maxTravelKm));
          if (Array.isArray(res.configuredSlots) && res.configuredSlots.length > 0) {
            setSlots(res.configuredSlots.slice(0, 6));
          }
          if (res.monthlySlotOverrides) {
            setMonthlyOverrides(res.monthlySlotOverrides);
          }
          if (Array.isArray(res.serviceAreas)) {
            setServiceAreas(res.serviceAreas);
          }
          if (res.zoneDistanceMatrix) {
            setDistanceMatrix(res.zoneDistanceMatrix);
          }
        }
      })
      .catch(err => console.error('Error fetching slots config:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddSlot = () => {
    const trimmed = newSlotInput.trim().toUpperCase();
    if (!trimmed) return;
    if (slots.length >= 6) {
      alert('Maximum 6 slots per day allowed as per company scheduling policy.');
      return;
    }
    if (slots.includes(trimmed)) {
      alert('This slot time already exists in the schedule.');
      return;
    }
    setSlots([...slots, trimmed]);
    setNewSlotInput('');
  };

  const handleRemoveSlot = (index) => {
    if (slots.length <= 1) {
      alert('At least one slot must remain configured.');
      return;
    }
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSlotTimeChange = (index, value) => {
    const copy = [...slots];
    copy[index] = value;
    setSlots(copy);
  };

  // Specific Date Override handlers
  const handleSaveDateOverride = () => {
    if (!overrideDate) return;
    const updated = {
      ...monthlyOverrides,
      [overrideDate]: overrideSlots.slice(0, 6)
    };
    setMonthlyOverrides(updated);
    setOverrideNotice(`Custom schedule saved for ${overrideDate}! (Click Save All Settings to commit)`);
    setTimeout(() => setOverrideNotice(''), 4000);
  };

  const handleRemoveDateOverride = (dateKey) => {
    const updated = { ...monthlyOverrides };
    delete updated[dateKey];
    setMonthlyOverrides(updated);
  };

  // Distance Matrix overrides & GPS recalculation
  const handleMatrixCellChange = (fromName, toName, val) => {
    const num = Math.max(0, Number(val) || 0);
    setDistanceMatrix(prev => {
      const copy = { ...prev };
      if (!copy[fromName]) copy[fromName] = {};
      if (!copy[toName]) copy[toName] = {};
      copy[fromName] = { ...copy[fromName], [toName]: num };
      copy[toName] = { ...copy[toName], [fromName]: num };
      return copy;
    });
  };

  const handleRecalculateGps = () => {
    const updated = {};
    for (const a of serviceAreas) {
      updated[a.name] = {};
      for (const b of serviceAreas) {
        if (a.id === b.id || a.name === b.name) {
          updated[a.name][b.name] = 0;
        } else {
          updated[a.name][b.name] = calcGpsDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
        }
      }
    }
    setDistanceMatrix(updated);
    setMatrixNotice('Distances recalculated from real Google Maps GPS pins! Click "Save All Settings" to commit.');
    setTimeout(() => setMatrixNotice(''), 5000);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateSlotsConfig({
        activeWorkers: Math.max(1, Number(activeWorkers)),
        maxTravelKm: Math.max(1, Number(maxTravelKm)),
        configuredSlots: slots.slice(0, 6),
        monthlySlotOverrides: monthlyOverrides,
        zoneDistanceMatrix: distanceMatrix
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      alert('Slot Scheduling & Zone Dispatch Configuration successfully updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Slot Dispatch Configuration...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A, #1E293B)',
        borderRadius: '20px',
        padding: '2rem 2.5rem',
        color: 'white',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '0.35rem 0.85rem', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            <Compass size={14} />
            INTELLIGENT DISPATCH & ROUTING ENGINE
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: '#FFFFFF' }}>
            Slot Timings & Zone Dispatch Control
          </h2>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.92rem', maxWidth: '620px', lineHeight: 1.5 }}>
            Configure daily booking slots (max 6/day), scale active technicians, and enforce transit distance constraints across Visakhapatnam zones.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="btn btn-teal"
          style={{ padding: '0.9rem 1.8rem', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Save size={18} />
          <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC', color: '#166534', padding: '1rem 1.5rem', borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={18} />
          <span>Configuration saved! Customer booking page is now actively reflecting these slots and dispatch rules.</span>
        </div>
      )}

      {/* Grid: 1. Fleet & Distance Engine, 2. Default Daily Slots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Card 1: Field Worker Capacity & Transit Limit */}
        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
            <Users size={20} color="var(--primary-blue)" />
            <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem' }}>
              Technician Fleet & Transit Range
            </h3>
          </div>

          {/* Active Workers Slider / Input */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem' }}>
              <span>Active Field Technicians (Boys on Duty)</span>
              <span style={{ background: 'var(--primary-blue)', color: 'white', padding: '0.2rem 0.65rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                {activeWorkers} {activeWorkers === 1 ? 'Worker' : 'Workers'}
              </span>
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={activeWorkers}
              onChange={e => setActiveWorkers(Math.max(1, Number(e.target.value)))}
              className="form-input"
              style={{ fontWeight: 800, fontSize: '1.1rem' }}
            />
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5 }}>
              💡 <strong>Scaling:</strong> Currently starting with <strong>1 boy</strong>. When set to 1, consecutive slot distance rules are automatically enforced. When you increase boys in future (e.g. 2, 3), the algorithm automatically unlocks distant bookings simultaneously!
            </p>
          </div>

          {/* Max Consecutive Travel Distance */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem' }}>
              <span>Max Consecutive Travel Distance</span>
              <span style={{ background: '#059669', color: 'white', padding: '0.2rem 0.65rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                {maxTravelKm} km
              </span>
            </label>
            <input
              type="number"
              min="5"
              max="50"
              value={maxTravelKm}
              onChange={e => setMaxTravelKm(Math.max(5, Number(e.target.value)))}
              className="form-input"
              style={{ fontWeight: 800, fontSize: '1.1rem' }}
            />
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5 }}>
              🚗 If slot 1 is booked in <strong>Madhurawada</strong>, slot 2 is only allowed in zones within {maxTravelKm} km (like Maddilapalem - 12km). Far regions (like Gajuwaka - 30km) are disabled in user dropdown until technicians return to central hub.
            </p>
          </div>
        </div>

        {/* Card 2: Default Daily Slots (Max 6 Allowed) */}
        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Clock size={20} color="var(--primary-blue)" />
              <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem' }}>
                Default Daily Slots ({slots.length}/6)
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: slots.length >= 6 ? '#DC2626' : '#059669', fontWeight: 800 }}>
              {slots.length >= 6 ? 'Max Allowed 6 Slots' : `${6 - slots.length} slots remaining`}
            </span>
          </div>

          {/* Slots List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {slots.map((slotTime, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F8FAFC', padding: '0.5rem 0.85rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={slotTime}
                  onChange={e => handleSlotTimeChange(idx, e.target.value)}
                  className="form-input"
                  style={{ flex: 1, padding: '0.4rem 0.75rem', fontWeight: 700 }}
                />
                <button
                  onClick={() => handleRemoveSlot(idx)}
                  className="btn btn-outline"
                  title="Remove Slot"
                  style={{ borderColor: '#FCA5A5', color: '#DC2626', padding: '0.4rem 0.65rem' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Slot Input */}
          {slots.length < 6 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                placeholder="e.g. 07:30 PM or 09:00 AM"
                value={newSlotInput}
                onChange={e => setNewSlotInput(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddSlot}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} />
                <span>Add Slot</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Date & Month Specific Dynamic Overrides */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
          <Calendar size={20} color="var(--primary-blue)" />
          <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem' }}>
            Month & Date-Specific Slot Overrides
          </h3>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.25rem 0' }}>
          Need to change slots for a festival, weekend, or holiday in a month? Select any date to override the default 6 slots for that specific day.
        </p>

        {overrideNotice && (
          <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
            ✓ {overrideNotice}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Override Form */}
          <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-navy)', fontSize: '1rem' }}>
              Configure Date Override
            </h4>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Select Specific Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={overrideDate}
                onChange={e => setOverrideDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Slots For This Date ({overrideSlots.length}/6)</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {overrideSlots.map((s, i) => (
                  <span key={i} style={{ background: '#E0F2FE', color: '#0369A1', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    {s}
                    <button
                      type="button"
                      onClick={() => setOverrideSlots(overrideSlots.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: '#0369A1', cursor: 'pointer', padding: 0 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveDateOverride}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Check size={16} />
              <span>Apply Override to {overrideDate}</span>
            </button>
          </div>

          {/* Active Overrides List */}
          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--primary-navy)', fontSize: '1rem' }}>
              Active Date Overrides ({Object.keys(monthlyOverrides).length})
            </h4>

            {Object.keys(monthlyOverrides).length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', border: '1.5px dashed #CBD5E1', borderRadius: '14px' }}>
                No date-specific overrides configured yet. All dates will use the default 6 daily slots.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(monthlyOverrides).map(([dateKey, slotsArr]) => (
                  <div key={dateKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div>
                      <strong style={{ color: 'var(--primary-navy)', fontSize: '0.95rem' }}>{dateKey}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                        Slots: {(slotsArr || []).join(', ')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDateOverride(dateKey)}
                      className="btn btn-outline"
                      style={{ borderColor: '#FCA5A5', color: '#DC2626', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card 4: Visakhapatnam Dynamic Service Area Distance Routing Matrix */}
      {(() => {
        const fallbackAreas = [
          { id: 1, name: 'Nad Junction', latitude: 17.7428, longitude: 83.2353, radius: 5000 },
          { id: 2, name: 'Old Gajuwaka', latitude: 17.6863, longitude: 83.2041, radius: 5000 },
          { id: 3, name: 'Pendurthi', latitude: 17.8286, longitude: 83.1973, radius: 5000 },
          { id: 4, name: 'Maddilapalem', latitude: 17.7389, longitude: 83.3184, radius: 5000 },
          { id: 5, name: 'Madhurawada', latitude: 17.8180, longitude: 83.3512, radius: 5000 }
        ];
        const displayAreas = serviceAreas.length > 0 ? serviceAreas : fallbackAreas;

        return (
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MapPin size={22} color="var(--primary-blue)" />
                <div>
                  <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.2rem', fontWeight: 800 }}>
                    Visakhapatnam Service Area Distance Matrix ({displayAreas.length} Regions)
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: '0.82rem' }}>
                    Dynamically linked to GPS coordinates and coverage radii configured in <strong>Service Areas Management</strong>.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={handleRecalculateGps}
                  className="btn btn-outline"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#CBD5E1' }}
                  title="Recompute all pairwise transit distances using actual Google Maps latitude/longitude"
                >
                  <RefreshCw size={14} />
                  <span>Recalculate from GPS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditingMatrix(!isEditingMatrix)}
                  className={isEditingMatrix ? "btn btn-teal" : "btn btn-outline"}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Edit3 size={14} />
                  <span>{isEditingMatrix ? '✓ Finish Tuning Distances' : '✏️ Custom Distance Overrides'}</span>
                </button>

                <Link
                  to="/areas"
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                >
                  <MapPin size={14} />
                  <span>Manage Service Areas on Map ↗</span>
                </Link>
              </div>
            </div>

            {matrixNotice && (
              <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={16} />
                <span>{matrixNotice}</span>
              </div>
            )}

            {/* Dynamic Service Area Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {displayAreas.map((area, idx) => {
                const isCenterHub = idx === 0 || area.name.toLowerCase().includes('nad');
                const distFromHub = idx === 0 ? 0 : (distanceMatrix[displayAreas[0]?.name]?.[area.name] ?? calcGpsDistanceKm(displayAreas[0]?.latitude, displayAreas[0]?.longitude, area.latitude, area.longitude));
                return (
                  <div key={area.id || idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: isCenterHub ? '#EFF6FF' : 'var(--accent-teal-light)', color: isCenterHub ? 'var(--primary-blue)' : 'var(--primary-navy)', padding: '0.2rem 0.55rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800 }}>
                          {isCenterHub ? 'Center Hub (0 km)' : `Region #${idx + 1}`}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                          ✓ Routing Active
                        </span>
                      </div>
                      <h4 style={{ margin: '0.6rem 0 0.2rem 0', color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 800 }}>
                        {area.name}
                      </h4>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                        {area.latitude && area.longitude ? (
                          <>Center: {Number(area.latitude).toFixed(4)}, {Number(area.longitude).toFixed(4)}<br /></>
                        ) : null}
                        Radius: {((area.radius || 5000) / 1000).toFixed(1)} km
                        {!isCenterHub && (
                          <div style={{ color: 'var(--primary-blue)', fontWeight: 600, marginTop: '0.15rem' }}>
                            ~{distFromHub} km from Central Hub
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Link
                        to={`/areas?edit=${area.id}`}
                        style={{ fontSize: '0.76rem', color: 'var(--primary-blue)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <span>📍 Edit Pin on Map</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Quick Add Area Link Card */}
              <Link
                to="/areas"
                style={{
                  background: '#F1F5F9',
                  border: '2px dashed #CBD5E1',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  color: 'var(--primary-navy)',
                  cursor: 'pointer',
                  minHeight: '140px',
                  transition: 'all 0.2s'
                }}
              >
                <Plus size={24} color="var(--primary-blue)" style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Add Service Region</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>Pin new area on Map →</span>
              </Link>
            </div>

            {/* Distance Matrix Table */}
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                  Routing rule: If travel distance &gt; {maxTravelKm} km, consecutive wash is disabled for single worker fleet.
                </span>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#166534', fontWeight: 700 }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E' }} /> Allowed (≤ {maxTravelKm} km)
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#991B1B', fontWeight: 700 }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} /> Blocked (&gt; {maxTravelKm} km)
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '650px' }}>
                  <thead style={{ background: '#0F172A', color: 'white' }}>
                    <tr>
                      <th style={{ padding: '0.8rem 1rem', textAlign: 'left', fontSize: '0.82rem' }}>From \ To</th>
                      {displayAreas.map(col => (
                        <th key={col.id || col.name} style={{ padding: '0.8rem 1rem', fontSize: '0.82rem' }}>
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayAreas.map((rowArea, rIdx) => (
                      <tr key={rowArea.id || rIdx} style={{ borderBottom: '1px solid #E2E8F0', background: rIdx % 2 === 0 ? 'white' : '#F8FAFC' }}>
                        <td style={{ padding: '0.8rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--primary-navy)', fontSize: '0.88rem' }}>
                          {rowArea.name}
                        </td>
                        {displayAreas.map((colArea, cIdx) => {
                          const isSame = rowArea.id ? rowArea.id === colArea.id : rowArea.name === colArea.name;
                          
                          let dist = 0;
                          if (!isSame) {
                            if (distanceMatrix[rowArea.name]?.[colArea.name] !== undefined) {
                              dist = Number(distanceMatrix[rowArea.name][colArea.name]);
                            } else if (distanceMatrix[colArea.name]?.[rowArea.name] !== undefined) {
                              dist = Number(distanceMatrix[colArea.name][rowArea.name]);
                            } else {
                              dist = calcGpsDistanceKm(rowArea.latitude, rowArea.longitude, colArea.latitude, colArea.longitude);
                            }
                          }

                          const isFar = dist > maxTravelKm;

                          if (isSame) {
                            return (
                              <td key={colArea.id || cIdx} style={{ padding: '0.8rem 1rem', fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>
                                0 km
                              </td>
                            );
                          }

                          if (isEditingMatrix) {
                            return (
                              <td key={colArea.id || cIdx} style={{ padding: '0.5rem 0.6rem' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="100"
                                    value={dist}
                                    onChange={e => handleMatrixCellChange(rowArea.name, colArea.name, e.target.value)}
                                    style={{ width: '60px', padding: '0.25rem 0.4rem', borderRadius: '6px', border: '1.5px solid #3B82F6', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}
                                  />
                                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>km</span>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={colArea.id || cIdx} style={{ padding: '0.8rem 1rem' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                background: isFar ? '#FEE2E2' : '#DCFCE7',
                                color: isFar ? '#DC2626' : '#166534',
                                border: `1px solid ${isFar ? '#FCA5A5' : '#86EFAC'}`
                              }}>
                                {dist} km {isFar ? '(Far)' : ''}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default SlotsManagement;
