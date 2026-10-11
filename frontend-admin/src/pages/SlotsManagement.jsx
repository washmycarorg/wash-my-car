import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSlotsConfig, updateSlotsConfig } from '../api';
import { Clock, Users, Navigation, Calendar, Check, AlertCircle, Plus, Trash2, Save, MapPin, Compass, Shield, ExternalLink, RefreshCw, Edit3 } from 'lucide-react';

const DEFAULT_SLOTS = [
  '08:30 AM - 10:30 AM',
  '10:30 AM - 12:30 PM',
  '12:30 PM - 02:30 PM',
  '02:30 PM - 04:30 PM',
  '04:30 PM - 06:30 PM',
  '06:30 PM - 08:30 PM'
];

const TIME_WINDOW_PRESETS = [
  '07:00 AM - 09:00 AM',
  '07:30 AM - 09:30 AM',
  '08:00 AM - 10:00 AM',
  '08:30 AM - 10:30 AM',
  '09:00 AM - 11:00 AM',
  '09:30 AM - 11:30 AM',
  '10:00 AM - 12:00 PM',
  '10:30 AM - 12:30 PM',
  '11:00 AM - 01:00 PM',
  '11:30 AM - 01:30 PM',
  '12:00 PM - 02:00 PM',
  '12:30 PM - 02:30 PM',
  '01:00 PM - 03:00 PM',
  '01:30 PM - 03:30 PM',
  '02:00 PM - 04:00 PM',
  '02:30 PM - 04:30 PM',
  '03:00 PM - 05:00 PM',
  '03:30 PM - 05:30 PM',
  '04:00 PM - 06:00 PM',
  '04:30 PM - 06:30 PM',
  '05:00 PM - 07:00 PM',
  '05:30 PM - 07:30 PM',
  '06:00 PM - 08:00 PM',
  '06:30 PM - 08:30 PM',
  '07:00 PM - 09:00 PM'
];

const TIME_POINTS = [
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM'
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
  
  // Window Builder States (From Time - To Time)
  const [winStart, setWinStart] = useState('08:30 AM');
  const [winEnd, setWinEnd] = useState('10:30 AM');
  const [monthWinStart, setMonthWinStart] = useState('08:30 AM');
  const [monthWinEnd, setMonthWinEnd] = useState('10:30 AM');
  const [dateWinStart, setDateWinStart] = useState('08:30 AM');
  const [dateWinEnd, setDateWinEnd] = useState('10:30 AM');

  // Schedule Override Mode: 'MONTH' (Entire Month at Once) vs 'DATE' (Specific Date)
  const [overrideMode, setOverrideMode] = useState('MONTH');

  // 1. Entire Month Override States
  const [overrideMonth, setOverrideMonth] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 7); // e.g. '2026-10'
  });
  const [monthOverrideSlots, setMonthOverrideSlots] = useState([...DEFAULT_SLOTS]);
  const [newMonthSlotInput, setNewMonthSlotInput] = useState('');

  // 2. Specific Date Override States
  const [overrideDate, setOverrideDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [overrideSlots, setOverrideSlots] = useState([...DEFAULT_SLOTS]);
  const [newDateSlotInput, setNewDateSlotInput] = useState('');

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
            setMonthOverrideSlots(res.configuredSlots.slice(0, 6));
            setOverrideSlots(res.configuredSlots.slice(0, 6));
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

  const handleAddSlot = (slotToAdd = null) => {
    const val = (slotToAdd || newSlotInput).trim().toUpperCase();
    if (!val) return;
    if (slots.length >= 6) {
      alert('Maximum 6 slots per day allowed as per company scheduling policy.');
      return;
    }
    if (slots.includes(val)) {
      alert('This slot time already exists in the schedule.');
      return;
    }
    setSlots([...slots, val]);
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

  // Entire Month Override handler
  const handleSaveMonthOverride = () => {
    if (!overrideMonth) return;
    if (monthOverrideSlots.length === 0) {
      alert('Please configure at least one slot for this month.');
      return;
    }
    const updated = {
      ...monthlyOverrides,
      [overrideMonth]: monthOverrideSlots.slice(0, 6)
    };
    setMonthlyOverrides(updated);
    setOverrideNotice(`Entire month schedule saved for ${overrideMonth}! All days in this month will use these slots. (Click "Save All Settings" to commit)`);
    setTimeout(() => setOverrideNotice(''), 5000);
  };

  // Specific Date Override handler
  const handleSaveDateOverride = () => {
    if (!overrideDate) return;
    if (overrideSlots.length === 0) {
      alert('Please configure at least one slot for this date.');
      return;
    }
    const updated = {
      ...monthlyOverrides,
      [overrideDate]: overrideSlots.slice(0, 6)
    };
    setMonthlyOverrides(updated);
    setOverrideNotice(`Custom schedule saved for date ${overrideDate}! (Click "Save All Settings" to commit)`);
    setTimeout(() => setOverrideNotice(''), 5000);
  };

  const handleRemoveOverride = (key) => {
    const updated = { ...monthlyOverrides };
    delete updated[key];
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

        {/* Card 2: Default Daily Slots (Max 6 Allowed) - Editable by Super Admin */}
        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Clock size={20} color="var(--primary-blue)" />
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem' }}>
                  Default Daily Slots ({slots.length}/6)
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  Configure 2-hour arrival & wash windows (e.g. 08:30 AM - 10:30 AM)
                </span>
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: slots.length >= 6 ? '#DC2626' : '#059669', fontWeight: 800 }}>
              {slots.length >= 6 ? 'Max Allowed 6 Slots' : `${6 - slots.length} slots remaining`}
            </span>
          </div>

          {/* Service Window Information Alert */}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Clock size={15} color="#2563EB" style={{ flexShrink: 0 }} />
            <span>
              <strong>Service Window Model:</strong> Slots represent the time range (e.g. <em>08:30 AM - 10:30 AM</em>) during which your technician arrives at the customer's doorstep and completes the wash.
            </span>
          </div>

          {/* Slots List with Direct Timing Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {slots.map((slotTime, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#F8FAFC', padding: '0.5rem 0.85rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem', flexShrink: 0 }}>
                  {idx + 1}
                </span>

                {/* Preset Time Window Selector */}
                <select
                  value={TIME_WINDOW_PRESETS.includes(slotTime) ? slotTime : ''}
                  onChange={e => e.target.value && handleSlotTimeChange(idx, e.target.value)}
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--primary-navy)',
                    background: 'white',
                    cursor: 'pointer',
                    maxWidth: '185px'
                  }}
                  title="Choose standard window preset"
                >
                  <option value="" disabled>Window Presets...</option>
                  {TIME_WINDOW_PRESETS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>

                {/* Direct Custom Time Text Edit */}
                <input
                  type="text"
                  value={slotTime}
                  onChange={e => handleSlotTimeChange(idx, e.target.value)}
                  placeholder="e.g. 08:30 AM - 10:30 AM"
                  className="form-input"
                  style={{ flex: 1, padding: '0.4rem 0.75rem', fontWeight: 800, letterSpacing: '0.04em', margin: 0, fontSize: '0.86rem' }}
                  title="Direct custom timing window range"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveSlot(idx)}
                  className="btn btn-outline"
                  title="Remove Slot"
                  style={{ borderColor: '#FCA5A5', color: '#DC2626', padding: '0.4rem 0.6rem', flexShrink: 0 }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Window Builder & Quick Presets & Add Slot */}
          {slots.length < 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px dashed #E2E8F0', paddingTop: '0.75rem' }}>
              
              {/* Build Custom Window (From -> To) */}
              <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '0.7rem 0.85rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--primary-navy)', display: 'block', marginBottom: '0.4rem' }}>
                  ⏱️ Quick Window Range Builder:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>From:</span>
                  <select
                    value={winStart}
                    onChange={e => setWinStart(e.target.value)}
                    style={{ padding: '0.35rem 0.5rem', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    {TIME_POINTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>To:</span>
                  <select
                    value={winEnd}
                    onChange={e => setWinEnd(e.target.value)}
                    style={{ padding: '0.35rem 0.5rem', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    {TIME_POINTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddSlot(`${winStart} - ${winEnd}`)}
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap' }}
                  >
                    + Add Range ({winStart} - {winEnd})
                  </button>
                </div>
              </div>

              {/* Standard 2-Hour Presets */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>
                    Popular 2-Hour Window Presets:
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--primary-blue)' }}>
                    Tap to add
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    '08:30 AM - 10:30 AM',
                    '10:30 AM - 12:30 PM',
                    '12:30 PM - 02:30 PM',
                    '02:30 PM - 04:30 PM',
                    '04:30 PM - 06:30 PM',
                    '06:30 PM - 08:30 PM'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      disabled={slots.includes(preset)}
                      onClick={() => handleAddSlot(preset)}
                      style={{
                        background: slots.includes(preset) ? '#F1F5F9' : '#EFF6FF',
                        border: slots.includes(preset) ? '1px solid #E2E8F0' : '1px solid #BFDBFE',
                        color: slots.includes(preset) ? '#94A3B8' : 'var(--primary-blue)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '7px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: slots.includes(preset) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input Add Bar */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                <input
                  type="text"
                  placeholder="Type any range, e.g. 08:30 AM - 10:30 AM"
                  value={newSlotInput}
                  onChange={e => setNewSlotInput(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, margin: 0, fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={() => handleAddSlot()}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', fontSize: '0.84rem' }}
                >
                  <Plus size={15} />
                  <span>Add Window</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Entire Month & Specific Date Dynamic Overrides */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={22} color="var(--primary-blue)" />
            <div>
              <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.18rem', fontWeight: 800 }}>
                Month-Wide & Date-Specific Slot Schedules
              </h3>
              <p style={{ margin: '0.15rem 0 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                Change an entire month at once, or set custom overrides for holidays and festivals.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={() => setOverrideMode('MONTH')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: overrideMode === 'MONTH' ? 800 : 600,
                fontSize: '0.84rem',
                background: overrideMode === 'MONTH' ? 'white' : 'transparent',
                color: overrideMode === 'MONTH' ? 'var(--primary-blue)' : '#64748B',
                boxShadow: overrideMode === 'MONTH' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s'
              }}
            >
              <Calendar size={14} />
              <span>Entire Month at Once</span>
            </button>
            <button
              type="button"
              onClick={() => setOverrideMode('DATE')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: overrideMode === 'DATE' ? 800 : 600,
                fontSize: '0.84rem',
                background: overrideMode === 'DATE' ? 'white' : 'transparent',
                color: overrideMode === 'DATE' ? 'var(--primary-blue)' : '#64748B',
                boxShadow: overrideMode === 'DATE' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s'
              }}
            >
              <Clock size={14} />
              <span>Specific Date Override</span>
            </button>
          </div>
        </div>

        {overrideNotice && (
          <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={16} />
            <span>{overrideNotice}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* TAB 1: Entire Month Configuration Form */}
          {overrideMode === 'MONTH' ? (
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1.5px solid #BFDBFE' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📅</span> Configure Entire Month Schedule
                </h4>
                <button
                  type="button"
                  onClick={() => setMonthOverrideSlots([...slots])}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  title="Copy the default daily slots into this month"
                >
                  Copy Default Slots ↺
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Select Target Month (Year & Month)</label>
                <input
                  type="month"
                  value={overrideMonth}
                  onChange={e => setOverrideMonth(e.target.value)}
                  className="form-input"
                  style={{ fontWeight: 800, fontSize: '1rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '0.3rem' }}>
                  Applying here sets these slots for <strong>every single day</strong> of this month automatically!
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
                    Slots For Entire Month ({monthOverrideSlots.length}/6)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: monthOverrideSlots.length >= 6 ? '#DC2626' : '#059669', fontWeight: 800 }}>
                    {monthOverrideSlots.length >= 6 ? 'Max 6' : `${6 - monthOverrideSlots.length} left`}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {monthOverrideSlots.map((s, i) => (
                    <span key={i} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      {s}
                      <button
                        type="button"
                        onClick={() => setMonthOverrideSlots(monthOverrideSlots.filter((_, idx) => idx !== i))}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0, fontWeight: 900 }}
                        title="Remove slot"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add slot to month */}
                {monthOverrideSlots.length < 6 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <select
                        value={newMonthSlotInput}
                        onChange={e => {
                          if (e.target.value && !monthOverrideSlots.includes(e.target.value)) {
                            setMonthOverrideSlots([...monthOverrideSlots, e.target.value]);
                            setNewMonthSlotInput('');
                          }
                        }}
                        className="form-input"
                        style={{ flex: 1, margin: 0, padding: '0.4rem 0.6rem', fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        <option value="">+ Add standard 2-hour window...</option>
                        {TIME_WINDOW_PRESETS.filter(t => !monthOverrideSlots.includes(t)).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Window Builder for Month */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F1F5F9', padding: '0.4rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 700, color: '#64748B' }}>From:</span>
                      <select
                        value={monthWinStart}
                        onChange={e => setMonthWinStart(e.target.value)}
                        style={{ padding: '0.25rem 0.4rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.76rem', fontWeight: 700 }}
                      >
                        {TIME_POINTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span style={{ fontWeight: 700, color: '#64748B' }}>To:</span>
                      <select
                        value={monthWinEnd}
                        onChange={e => setMonthWinEnd(e.target.value)}
                        style={{ padding: '0.25rem 0.4rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.76rem', fontWeight: 700 }}
                      >
                        {TIME_POINTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const comb = `${monthWinStart} - ${monthWinEnd}`;
                          if (!monthOverrideSlots.includes(comb)) {
                            setMonthOverrideSlots([...monthOverrideSlots, comb]);
                          }
                        }}
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem', fontWeight: 800, whiteSpace: 'nowrap' }}
                      >
                        + Add Custom Window
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveMonthOverride}
                className="btn btn-teal"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 800, padding: '0.75rem' }}
              >
                <Check size={18} />
                <span>Apply Schedule to Entire Month ({overrideMonth})</span>
              </button>
            </div>
          ) : (
            /* TAB 2: Specific Date Configuration Form */
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1.5px solid #FCD34D' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📌</span> Configure Specific Date Override
                </h4>
                <button
                  type="button"
                  onClick={() => setOverrideSlots([...slots])}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  title="Copy the default daily slots into this date"
                >
                  Copy Default Slots ↺
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Select Specific Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={overrideDate}
                  onChange={e => setOverrideDate(e.target.value)}
                  className="form-input"
                  style={{ fontWeight: 800, fontSize: '1rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '0.3rem' }}>
                  Overrides default schedule for festivals, holidays, or special staffing on this specific day.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
                    Slots For This Date ({overrideSlots.length}/6)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: overrideSlots.length >= 6 ? '#DC2626' : '#059669', fontWeight: 800 }}>
                    {overrideSlots.length >= 6 ? 'Max 6' : `${6 - overrideSlots.length} left`}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {overrideSlots.map((s, i) => (
                    <span key={i} style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      {s}
                      <button
                        type="button"
                        onClick={() => setOverrideSlots(overrideSlots.filter((_, idx) => idx !== i))}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0, fontWeight: 900 }}
                        title="Remove slot"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add slot to specific date */}
                {overrideSlots.length < 6 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <select
                        value={newDateSlotInput}
                        onChange={e => {
                          if (e.target.value && !overrideSlots.includes(e.target.value)) {
                            setOverrideSlots([...overrideSlots, e.target.value]);
                            setNewDateSlotInput('');
                          }
                        }}
                        className="form-input"
                        style={{ flex: 1, margin: 0, padding: '0.4rem 0.6rem', fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        <option value="">+ Add standard 2-hour window...</option>
                        {TIME_WINDOW_PRESETS.filter(t => !overrideSlots.includes(t)).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Window Builder for Date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#FEF9C3', padding: '0.4rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 700, color: '#854D0E' }}>From:</span>
                      <select
                        value={dateWinStart}
                        onChange={e => setDateWinStart(e.target.value)}
                        style={{ padding: '0.25rem 0.4rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.76rem', fontWeight: 700 }}
                      >
                        {TIME_POINTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span style={{ fontWeight: 700, color: '#854D0E' }}>To:</span>
                      <select
                        value={dateWinEnd}
                        onChange={e => setDateWinEnd(e.target.value)}
                        style={{ padding: '0.25rem 0.4rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.76rem', fontWeight: 700 }}
                      >
                        {TIME_POINTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const comb = `${dateWinStart} - ${dateWinEnd}`;
                          if (!overrideSlots.includes(comb)) {
                            setOverrideSlots([...overrideSlots, comb]);
                          }
                        }}
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem', fontWeight: 800, whiteSpace: 'nowrap' }}
                      >
                        + Add Custom Window
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveDateOverride}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 800, padding: '0.75rem' }}
              >
                <Check size={18} />
                <span>Apply Override to Date ({overrideDate})</span>
              </button>
            </div>
          )}

          {/* Active Overrides List (Month-Wide and Single-Date) */}
          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--primary-navy)', fontSize: '1rem', fontWeight: 800 }}>
              Configured Schedules & Overrides ({Object.keys(monthlyOverrides).length})
            </h4>

            {Object.keys(monthlyOverrides).length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#94A3B8', border: '1.5px dashed #CBD5E1', borderRadius: '16px' }}>
                <Calendar size={32} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No month-wide or date overrides saved yet.</p>
                <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginTop: '0.25rem' }}>
                  All days will operate on the default 6 daily slots configured above.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(monthlyOverrides).map(([key, slotsArr]) => {
                  const isMonthWide = key.length === 7 && key.includes('-'); // 'YYYY-MM'
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'white',
                        padding: '0.85rem 1.25rem',
                        borderRadius: '14px',
                        border: isMonthWide ? '1.5px solid #93C5FD' : '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{
                            background: isMonthWide ? '#EFF6FF' : '#FEF3C7',
                            color: isMonthWide ? '#1E40AF' : '#92400E',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}>
                            {isMonthWide ? '📅 ENTIRE MONTH' : '📌 SINGLE DATE'}
                          </span>
                          <strong style={{ color: 'var(--primary-navy)', fontSize: '0.98rem' }}>{key}</strong>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.35rem', fontWeight: 600 }}>
                          Slots: {(slotsArr || []).join(' · ')}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.15rem' }}>
                          {isMonthWide ? 'Applies to all days in this calendar month' : 'Applies only to this specific day'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveOverride(key)}
                        className="btn btn-outline"
                        style={{ borderColor: '#FCA5A5', color: '#DC2626', padding: '0.35rem 0.65rem', fontSize: '0.78rem', fontWeight: 700 }}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
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
