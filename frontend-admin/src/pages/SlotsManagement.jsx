import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getSlotsConfig, 
  updateSlotsConfig, 
  releaseWeekSlots, 
  releaseMonthSlots 
} from '../api';
import { 
  Clock, Users, Navigation, Calendar, Check, AlertCircle, Plus, Trash2, 
  Save, MapPin, Compass, Shield, ExternalLink, RefreshCw, Edit3, 
  ChevronRight, ChevronLeft, CalendarX, Zap, CheckCircle2, Lock, Eye, EyeOff, Sparkles, Sliders
} from 'lucide-react';

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

const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'Monday', short: 'Mon' },
  { key: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { key: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { key: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { key: 'FRIDAY', label: 'Friday', short: 'Fri' },
  { key: 'SATURDAY', label: 'Saturday', short: 'Sat' },
  { key: 'SUNDAY', label: 'Sunday', short: 'Sun' }
];

const INITIAL_WEEKLY_TEMPLATE = {
  MONDAY: { enabled: true, slots: [...DEFAULT_SLOTS], capacity: 1 },
  TUESDAY: { enabled: true, slots: [...DEFAULT_SLOTS], capacity: 1 },
  WEDNESDAY: { enabled: true, slots: [...DEFAULT_SLOTS], capacity: 1 },
  THURSDAY: { enabled: true, slots: [...DEFAULT_SLOTS], capacity: 1 },
  FRIDAY: { enabled: true, slots: [...DEFAULT_SLOTS], capacity: 1 },
  SATURDAY: { enabled: true, slots: [...DEFAULT_SLOTS], capacity: 1 },
  SUNDAY: { enabled: true, slots: [...DEFAULT_SLOTS], capacity: 1 }
};

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
  return Math.round(straightKm * 1.3 * 10) / 10;
};

const SlotsManagement = () => {
  // Navigation Tabs: 'RELEASE_STUDIO' | 'DEFAULT_WEEKLY' | 'DATE_OVERRIDES' | 'FLEET_ROUTING'
  const [activeTab, setActiveTab] = useState('RELEASE_STUDIO');

  // Core Fleet & Settings
  const [activeWorkers, setActiveWorkers] = useState(1);
  const [maxTravelKm, setMaxTravelKm] = useState(15);
  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [weeklyTemplate, setWeeklyTemplate] = useState(INITIAL_WEEKLY_TEMPLATE);
  const [releasedDates, setReleasedDates] = useState([]);
  const [monthlyOverrides, setMonthlyOverrides] = useState({});

  // Dynamic Service Areas & Matrix
  const [serviceAreas, setServiceAreas] = useState([]);
  const [distanceMatrix, setDistanceMatrix] = useState({});
  const [isEditingMatrix, setIsEditingMatrix] = useState(false);
  const [matrixNotice, setMatrixNotice] = useState('');

  // Weekly Template Selected Day
  const [selectedDayKey, setSelectedDayKey] = useState('MONDAY');
  const [dayWinStart, setDayWinStart] = useState('08:30 AM');
  const [dayWinEnd, setDayWinEnd] = useState('10:30 AM');
  const [newDaySlotInput, setNewDaySlotInput] = useState('');

  // Release Studio States
  const [releaseMode, setReleaseMode] = useState('WEEK'); // 'WEEK' or 'MONTH'
  const [releaseWeekStart, setReleaseWeekStart] = useState(() => {
    const d = new Date();
    // Default to upcoming Monday or today
    const day = d.getDay();
    const diff = d.getDate() + ((day === 0 ? 1 : 8) - day);
    const nextMon = new Date(d.setDate(diff));
    return nextMon.toISOString().split('T')[0];
  });
  const [releaseMonth, setReleaseMonth] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 7); // e.g. '2026-11'
  });
  const [studioPreviewDays, setStudioPreviewDays] = useState([]);
  const [releasingBatch, setReleasingBatch] = useState(false);
  const [studioNotice, setStudioNotice] = useState('');

  // Date / Month Overrides State
  const [overrideDate, setOverrideDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [overrideSlots, setOverrideSlots] = useState([...DEFAULT_SLOTS]);
  const [overrideCapacity, setOverrideCapacity] = useState(1);
  const [dateWinStart, setDateWinStart] = useState('08:30 AM');
  const [dateWinEnd, setDateWinEnd] = useState('10:30 AM');
  const [newDateSlotInput, setNewDateSlotInput] = useState('');

  // General Status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Fetch initial config
  const fetchConfig = () => {
    setLoading(true);
    getSlotsConfig()
      .then(res => {
        if (res) {
          if (res.activeWorkers !== undefined) setActiveWorkers(Number(res.activeWorkers));
          if (res.maxTravelKm !== undefined) setMaxTravelKm(Number(res.maxTravelKm));
          if (Array.isArray(res.configuredSlots) && res.configuredSlots.length > 0) {
            setSlots(res.configuredSlots.slice(0, 6));
          }
          if (res.weeklySlotTemplate && typeof res.weeklySlotTemplate === 'object') {
            setWeeklyTemplate({ ...INITIAL_WEEKLY_TEMPLATE, ...res.weeklySlotTemplate });
          }
          if (Array.isArray(res.releasedDates)) {
            setReleasedDates(res.releasedDates);
          }
          if (res.monthlySlotOverrides && typeof res.monthlySlotOverrides === 'object') {
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
      .catch(err => {
        setSaveError('Could not load slots configuration. Please check your network or login.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Sync Studio Preview Days whenever release parameters or weekly template change
  useEffect(() => {
    generateStudioPreview();
  }, [releaseMode, releaseWeekStart, releaseMonth, weeklyTemplate, releasedDates, monthlyOverrides]);

  const generateStudioPreview = () => {
    const days = [];
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    if (releaseMode === 'WEEK') {
      if (!releaseWeekStart) return;
      const parts = releaseWeekStart.split('-');
      if (parts.length !== 3) return;
      const base = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

      for (let i = 0; i < 7; i++) {
        const cur = new Date(base);
        cur.setDate(base.getDate() + i);
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        const dayKey = dayNames[cur.getDay()];
        const dayTmpl = weeklyTemplate[dayKey] || { enabled: true, slots: DEFAULT_SLOTS, capacity: 1 };
        
        // Check if date has explicit override
        const override = monthlyOverrides[dateStr];
        const effectiveSlots = override && Array.isArray(override) ? override : (dayTmpl.slots || DEFAULT_SLOTS);
        const isApproved = releasedDates.includes(dateStr);

        days.push({
          dateStr,
          dayKey,
          dayName: cur.toLocaleDateString('en-US', { weekday: 'short' }),
          displayDate: cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          enabled: dayTmpl.enabled !== false,
          capacity: dayTmpl.capacity || 1,
          slots: effectiveSlots,
          isApproved
        });
      }
    } else {
      // Month mode
      if (!releaseMonth) return;
      const [yearStr, monthStr] = releaseMonth.split('-');
      const year = Number(yearStr);
      const monthIdx = Number(monthStr) - 1;
      const daysCount = new Date(year, monthIdx + 1, 0).getDate();

      for (let day = 1; day <= daysCount; day++) {
        const cur = new Date(year, monthIdx, day);
        const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayKey = dayNames[cur.getDay()];
        const dayTmpl = weeklyTemplate[dayKey] || { enabled: true, slots: DEFAULT_SLOTS, capacity: 1 };
        
        const override = monthlyOverrides[dateStr];
        const effectiveSlots = override && Array.isArray(override) ? override : (dayTmpl.slots || DEFAULT_SLOTS);
        const isApproved = releasedDates.includes(dateStr);

        days.push({
          dateStr,
          dayKey,
          dayName: cur.toLocaleDateString('en-US', { weekday: 'short' }),
          displayDate: cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          enabled: dayTmpl.enabled !== false,
          capacity: dayTmpl.capacity || 1,
          slots: effectiveSlots,
          isApproved
        });
      }
    }

    setStudioPreviewDays(days);
  };

  // ==========================================
  // ACTION: SAVE WEEKLY DEFAULT TEMPLATE
  // ==========================================
  const handleSaveWeeklyTemplate = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await updateSlotsConfig({
        activeWorkers,
        maxTravelKm,
        configuredSlots: slots,
        weeklySlotTemplate: weeklyTemplate,
        releasedDates,
        monthlySlotOverrides: monthlyOverrides,
        zoneDistanceMatrix: distanceMatrix
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      alert('Weekly Default Slot System saved successfully! You can now load this template with 1 click to release slots for any week or month.');
    } catch (err) {
      setSaveError(err.message || 'Failed to save weekly template');
    } finally {
      setSaving(false);
    }
  };

  // Helper: Copy day template to all weekdays (Mon-Sat) or all 7 days
  const handleCopyDayToWeekdays = (sourceDayKey, includeSunday = false) => {
    const src = weeklyTemplate[sourceDayKey];
    if (!src) return;
    const updated = { ...weeklyTemplate };
    DAYS_OF_WEEK.forEach(d => {
      if (!includeSunday && d.key === 'SUNDAY') return;
      updated[d.key] = {
        enabled: src.enabled,
        slots: [...src.slots],
        capacity: src.capacity
      };
    });
    setWeeklyTemplate(updated);
    alert(`Applied ${sourceDayKey}'s slot schedule to ${includeSunday ? 'all 7 days' : 'all weekdays (Mon-Sat)'}! Remember to click "Save Weekly Template".`);
  };

  // Helper: Add slot to selected day in weekly template
  const handleAddSlotToDay = (slotToAdd = null) => {
    const val = (slotToAdd || newDaySlotInput).trim().toUpperCase();
    if (!val) return;
    const curSlots = weeklyTemplate[selectedDayKey]?.slots || [];
    if (curSlots.length >= 6) {
      alert('Maximum 6 slots per day allowed.');
      return;
    }
    if (curSlots.includes(val)) {
      alert('This slot window already exists for this day.');
      return;
    }
    setWeeklyTemplate(prev => ({
      ...prev,
      [selectedDayKey]: {
        ...prev[selectedDayKey],
        slots: [...curSlots, val]
      }
    }));
    setNewDaySlotInput('');
  };

  const handleRemoveSlotFromDay = (index) => {
    const curSlots = weeklyTemplate[selectedDayKey]?.slots || [];
    if (curSlots.length <= 1) {
      alert('At least one slot must remain configured for enabled days.');
      return;
    }
    setWeeklyTemplate(prev => ({
      ...prev,
      [selectedDayKey]: {
        ...prev[selectedDayKey],
        slots: curSlots.filter((_, i) => i !== index)
      }
    }));
  };

  // ==========================================
  // ACTION: BATCH RELEASE SLOTS (WEEK OR MONTH)
  // ==========================================
  const handleApproveAndReleaseBatch = async () => {
    setReleasingBatch(true);
    setStudioNotice('');
    try {
      if (releaseMode === 'WEEK') {
        const res = await releaseWeekSlots(releaseWeekStart);
        if (res && res.releasedDates) {
          setReleasedDates(res.releasedDates);
          setStudioNotice(`🎉 Success! Approved and released all slots for week of ${releaseWeekStart}. Customers can now view and book these slots.`);
        }
      } else {
        const res = await releaseMonthSlots(releaseMonth);
        if (res && res.releasedDates) {
          setReleasedDates(res.releasedDates);
          setStudioNotice(`🎉 Success! Approved and released all slots for month ${releaseMonth}. Customers can now view and book.`);
        }
      }
      setTimeout(() => setStudioNotice(''), 6000);
    } catch (err) {
      alert('Failed to release slots: ' + (err.message || 'Network error'));
    } finally {
      setReleasingBatch(false);
    }
  };

  // Toggle individual date release status
  const handleToggleSingleDateRelease = async (dateStr) => {
    const isCurrentlyReleased = releasedDates.includes(dateStr);
    let updated;
    if (isCurrentlyReleased) {
      updated = releasedDates.filter(d => d !== dateStr);
    } else {
      updated = [...releasedDates, dateStr].sort();
    }
    setReleasedDates(updated);

    try {
      await updateSlotsConfig({
        activeWorkers,
        maxTravelKm,
        configuredSlots: slots,
        weeklySlotTemplate: weeklyTemplate,
        releasedDates: updated,
        monthlySlotOverrides: monthlyOverrides,
        zoneDistanceMatrix: distanceMatrix
      });
    } catch (e) {
      console.warn('Could not save single date toggle:', e);
    }
  };

  // Clear / Revoke all released dates
  const handleRevokeAllReleased = async () => {
    if (!window.confirm('Are you sure you want to revoke ALL approved booking dates? Customers will see that bookings are closed until new dates are released.')) {
      return;
    }
    setReleasedDates([]);
    try {
      await updateSlotsConfig({
        activeWorkers,
        maxTravelKm,
        configuredSlots: slots,
        weeklySlotTemplate: weeklyTemplate,
        releasedDates: [],
        monthlySlotOverrides: monthlyOverrides,
        zoneDistanceMatrix: distanceMatrix
      });
      alert('All released booking dates have been revoked.');
    } catch (e) {
      alert('Failed to revoke dates: ' + e.message);
    }
  };

  // ==========================================
  // ACTION: DATE / MONTH SPECIFIC OVERRIDES
  // ==========================================
  const handleSaveDateOverride = () => {
    if (!overrideDate) return;
    if (overrideSlots.length === 0) {
      alert('Please add at least one slot for this custom date.');
      return;
    }
    const updated = {
      ...monthlyOverrides,
      [overrideDate]: overrideSlots.slice(0, 6)
    };
    setMonthlyOverrides(updated);
    alert(`Custom override configured for ${overrideDate}! Click "Commit All Changes" to save to database.`);
  };

  const handleRemoveOverride = (key) => {
    const updated = { ...monthlyOverrides };
    delete updated[key];
    setMonthlyOverrides(updated);
  };

  // ==========================================
  // ACTION: FLEET & DISTANCE MATRIX
  // ==========================================
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
    setMatrixNotice('Distances recalculated from real Google Maps GPS coordinates! Click "Commit All Changes" to commit.');
    setTimeout(() => setMatrixNotice(''), 5000);
  };

  // Master Save All
  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      await updateSlotsConfig({
        activeWorkers: Math.max(1, Number(activeWorkers)),
        maxTravelKm: Math.max(1, Number(maxTravelKm)),
        configuredSlots: slots.slice(0, 6),
        weeklySlotTemplate: weeklyTemplate,
        releasedDates,
        monthlySlotOverrides: monthlyOverrides,
        zoneDistanceMatrix: distanceMatrix
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      alert('All Slot Scheduling, Weekly System & Zone Dispatch rules successfully saved!');
    } catch (err) {
      setSaveError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary-blue)' }} />
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)' }}>Loading Slot Scheduling & Release Control...</div>
      </div>
    );
  }

  const selectedDayConfig = weeklyTemplate[selectedDayKey] || { enabled: true, slots: DEFAULT_SLOTS, capacity: 1 };
  const displayAreas = serviceAreas.length > 0 ? serviceAreas : [
    { name: 'NAD Junction', latitude: 17.7428, longitude: 83.2353, radius: 5000 },
    { name: 'Gajuwaka', latitude: 17.6863, longitude: 83.2041, radius: 5000 },
    { name: 'Maddilapalem', latitude: 17.7389, longitude: 83.3184, radius: 5000 },
    { name: 'Madhurawada', latitude: 17.8180, longitude: 83.3512, radius: 5000 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
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
            SYNCHRONIZED SLOT CONTROL & RELEASE STUDIO
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: '#FFFFFF' }}>
            Slot Timings, Weekly System & Release Studio
          </h2>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.92rem', maxWidth: '640px', lineHeight: 1.5 }}>
            Configure your <strong>Default Weekly Slot System</strong>, batch-release slots for weeks/months with 1-click, assign unique Slot IDs, and enforce live concurrency locks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn btn-teal"
            style={{ padding: '0.85rem 1.6rem', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Save size={18} />
            <span>{saving ? 'Saving...' : 'Commit All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {saveSuccess && (
        <div style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC', color: '#166534', padding: '0.9rem 1.25rem', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>Configuration saved! Customer booking page and employee schedules are now actively synchronized.</span>
        </div>
      )}

      {saveError && (
        <div style={{ background: '#FEE2E2', border: '1.5px solid #FCA5A5', color: '#991B1B', padding: '0.9rem 1.25rem', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        background: '#FFFFFF',
        padding: '0.5rem',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('RELEASE_STUDIO')}
          style={{
            flex: '1 1 200px',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'RELEASE_STUDIO' ? 800 : 600,
            fontSize: '0.9rem',
            background: activeTab === 'RELEASE_STUDIO' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : 'transparent',
            color: activeTab === 'RELEASE_STUDIO' ? '#FFFFFF' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'RELEASE_STUDIO' ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none'
          }}
        >
          <Zap size={17} />
          <span>1. Weekly & Monthly Release Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DEFAULT_WEEKLY')}
          style={{
            flex: '1 1 200px',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'DEFAULT_WEEKLY' ? 800 : 600,
            fontSize: '0.9rem',
            background: activeTab === 'DEFAULT_WEEKLY' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : 'transparent',
            color: activeTab === 'DEFAULT_WEEKLY' ? '#FFFFFF' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'DEFAULT_WEEKLY' ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none'
          }}
        >
          <Calendar size={17} />
          <span>2. Default Weekly Slot System</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DATE_OVERRIDES')}
          style={{
            flex: '1 1 200px',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'DATE_OVERRIDES' ? 800 : 600,
            fontSize: '0.9rem',
            background: activeTab === 'DATE_OVERRIDES' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : 'transparent',
            color: activeTab === 'DATE_OVERRIDES' ? '#FFFFFF' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'DATE_OVERRIDES' ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none'
          }}
        >
          <Sliders size={17} />
          <span>3. Custom Date Overrides</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FLEET_ROUTING')}
          style={{
            flex: '1 1 200px',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'FLEET_ROUTING' ? 800 : 600,
            fontSize: '0.9rem',
            background: activeTab === 'FLEET_ROUTING' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : 'transparent',
            color: activeTab === 'FLEET_ROUTING' ? '#FFFFFF' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'FLEET_ROUTING' ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none'
          }}
        >
          <Users size={17} />
          <span>4. Fleet Capacity & Routing</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: WEEKLY & MONTHLY RELEASE STUDIO
      ======================================================== */}
      {activeTab === 'RELEASE_STUDIO' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Release Studio Action Card */}
          <div className="card" style={{ padding: '1.75rem', background: '#FFFFFF', borderRadius: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={20} color="#0284C7" />
                  <span>1-Click Slot Release Studio</span>
                </h3>
                <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: '0.85rem' }}>
                  Release slots weekly or monthly. Users will ONLY see dates and slot IDs you approve here!
                </p>
              </div>

              {/* Mode Toggle: Release by Week vs Release by Month */}
              <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.25rem', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                <button
                  type="button"
                  onClick={() => setReleaseMode('WEEK')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '9px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: releaseMode === 'WEEK' ? 800 : 600,
                    fontSize: '0.85rem',
                    background: releaseMode === 'WEEK' ? '#FFFFFF' : 'transparent',
                    color: releaseMode === 'WEEK' ? 'var(--primary-blue)' : '#64748B',
                    boxShadow: releaseMode === 'WEEK' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  📅 Release by Week
                </button>
                <button
                  type="button"
                  onClick={() => setReleaseMode('MONTH')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '9px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: releaseMode === 'MONTH' ? 800 : 600,
                    fontSize: '0.85rem',
                    background: releaseMode === 'MONTH' ? '#FFFFFF' : 'transparent',
                    color: releaseMode === 'MONTH' ? 'var(--primary-blue)' : '#64748B',
                    boxShadow: releaseMode === 'MONTH' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  🗓️ Release by Month
                </button>
              </div>
            </div>

            {/* Selector & Release Action Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              background: '#F8FAFC',
              padding: '1.25rem',
              borderRadius: '14px',
              border: '1.5px solid #E2E8F0',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {releaseMode === 'WEEK' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                      Select Week Starting Date:
                    </label>
                    <input
                      type="date"
                      value={releaseWeekStart}
                      onChange={e => setReleaseWeekStart(e.target.value)}
                      className="form-input"
                      style={{ fontWeight: 800, padding: '0.5rem 0.85rem', width: '180px' }}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                      Select Target Month:
                    </label>
                    <input
                      type="month"
                      value={releaseMonth}
                      onChange={e => setReleaseMonth(e.target.value)}
                      className="form-input"
                      style={{ fontWeight: 800, padding: '0.5rem 0.85rem', width: '180px' }}
                    />
                  </div>
                )}

                <div style={{ paddingLeft: '0.5rem' }}>
                  <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#047857', marginBottom: '0.2rem' }}>
                    ⚡ Default Template Status:
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700 }}>
                    Loaded from <strong>Default Weekly Slot System</strong> (6 windows configured)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleApproveAndReleaseBatch}
                  disabled={releasingBatch}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 1.6rem',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <Sparkles size={16} />
                  <span>
                    {releasingBatch 
                      ? 'Releasing...' 
                      : releaseMode === 'WEEK' 
                        ? 'Approve & Release Week Slots' 
                        : `Approve & Release Month (${releaseMonth})`}
                  </span>
                </button>
              </div>
            </div>

            {studioNotice && (
              <div style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC', color: '#166534', padding: '0.9rem 1.25rem', borderRadius: '12px', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <span>{studioNotice}</span>
              </div>
            )}

            {/* Summary Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>Total Approved Booking Dates</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E3A8A', marginTop: '0.2rem' }}>
                  {releasedDates.length} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#3B82F6' }}>Dates Active</span>
                </div>
              </div>

              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Selected Range Days</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#14532D', marginTop: '0.2rem' }}>
                  {studioPreviewDays.length} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10B981' }}>Days in Batch</span>
                </div>
              </div>

              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleRevokeAllReleased}
                  disabled={releasedDates.length === 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#B45309',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: releasedDates.length === 0 ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    padding: 0
                  }}
                >
                  🚫 Revoke All Released Dates
                </button>
                <span style={{ fontSize: '0.72rem', color: '#92400E', marginTop: '0.2rem' }}>
                  Instantly close customer booking calendar for all dates.
                </span>
              </div>
            </div>

            {/* Day-by-Day Release Preview List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1rem', fontWeight: 800 }}>
                Generated Slots Preview with Unique Slot IDs ({studioPreviewDays.length} Days)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {studioPreviewDays.map((item, dIdx) => {
                  const isReleased = releasedDates.includes(item.dateStr);
                  const cleanDateNum = item.dateStr.replace(/-/g, '');

                  return (
                    <div
                      key={item.dateStr}
                      style={{
                        background: isReleased ? '#FFFFFF' : '#F8FAFC',
                        border: isReleased ? '2px solid #10B981' : '1px dashed #CBD5E1',
                        borderRadius: '14px',
                        padding: '1.1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        boxShadow: isReleased ? '0 4px 12px rgba(16, 185, 129, 0.08)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Day Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--primary-navy)', fontSize: '1rem' }}>
                              {item.dayName}, {item.displayDate}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
                              ({item.dateStr})
                            </span>
                          </div>
                          <span style={{ fontSize: '0.74rem', color: '#0369A1', fontWeight: 700 }}>
                            Capacity: {item.capacity} {item.capacity === 1 ? 'Technician' : 'Technicians'}
                          </span>
                        </div>

                        {/* Approved Badge / Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleSingleDateRelease(item.dateStr)}
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '8px',
                            border: isReleased ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                            background: isReleased ? '#ECFDF5' : '#F1F5F9',
                            color: isReleased ? '#047857' : '#64748B',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          {isReleased ? (
                            <>
                              <Eye size={12} />
                              <span>APPROVED</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={12} />
                              <span>UNRELEASED</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Unique Slot IDs & Windows List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {item.slots.map((sWin, sIdx) => {
                          const slotId = `SLOT-${cleanDateNum}-${String(sIdx + 1).padStart(2, '0')}`;
                          return (
                            <div
                              key={sIdx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: isReleased ? '#F0FDF4' : '#F1F5F9',
                                border: isReleased ? '1px solid #DCFCE7' : '1px solid #E2E8F0',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '8px',
                                fontSize: '0.78rem'
                              }}
                            >
                              <span style={{ fontWeight: 800, color: isReleased ? '#15803D' : '#475569', letterSpacing: '0.02em' }}>
                                {sWin}
                              </span>
                              <span style={{
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                fontSize: '0.7rem',
                                color: isReleased ? '#047857' : '#64748B',
                                background: isReleased ? '#DCFCE7' : '#E2E8F0',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px'
                              }}>
                                {slotId}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', fontSize: '0.72rem' }}>
                        <span style={{ color: isReleased ? '#16A34A' : '#94A3B8', fontWeight: 700 }}>
                          {isReleased ? '✓ Visible to users on Book page' : 'Hidden until released'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setOverrideDate(item.dateStr);
                            setOverrideSlots([...item.slots]);
                            setActiveTab('DATE_OVERRIDES');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-blue)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          Customize This Day →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: DEFAULT WEEKLY SLOT SYSTEM
      ======================================================== */}
      {activeTab === 'DEFAULT_WEEKLY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '1.75rem', background: '#FFFFFF', borderRadius: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={20} color="#0284C7" />
                  <span>Default Weekly Slot System (Monday to Sunday)</span>
                </h3>
                <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: '0.85rem' }}>
                  Configure your standard routine once. When you release any week, it automatically copies these default slots!
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleSaveWeeklyTemplate}
                  disabled={saving}
                  className="btn btn-teal"
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save Weekly Template'}</span>
                </button>
              </div>
            </div>

            {/* Day of Week Selector Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {DAYS_OF_WEEK.map(day => {
                const isSelected = selectedDayKey === day.key;
                const dConfig = weeklyTemplate[day.key] || { enabled: true, slots: DEFAULT_SLOTS };
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDayKey(day.key)}
                    style={{
                      flex: '1 1 120px',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid var(--primary-blue)' : '1px solid #CBD5E1',
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      color: isSelected ? 'var(--primary-blue)' : '#334155',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{day.label}</span>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: dConfig.enabled !== false ? '#10B981' : '#CBD5E1'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                      {dConfig.enabled !== false ? `${dConfig.slots.length} Slots · Active` : 'Day Off'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Configuration Form */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '16px',
              border: '1.5px solid #E2E8F0',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.1rem', fontWeight: 800 }}>
                    Configuring Schedule for {DAYS_OF_WEEK.find(d => d.key === selectedDayKey)?.label}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Standard slot arrival windows & technician capacity for this weekday
                  </span>
                </div>

                {/* Day Enabled Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary-navy)' }}>
                  <input
                    type="checkbox"
                    checked={selectedDayConfig.enabled !== false}
                    onChange={e => {
                      setWeeklyTemplate(prev => ({
                        ...prev,
                        [selectedDayKey]: {
                          ...prev[selectedDayKey],
                          enabled: e.target.checked
                        }
                      }));
                    }}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-blue)' }}
                  />
                  <span>Enable Bookings on {DAYS_OF_WEEK.find(d => d.key === selectedDayKey)?.label}s</span>
                </label>
              </div>

              {/* Quick Replication Tools */}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => handleCopyDayToWeekdays(selectedDayKey, false)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: '8px' }}
                >
                  ⚡ Copy {selectedDayKey}'s Schedule to All Weekdays (Mon-Sat)
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyDayToWeekdays(selectedDayKey, true)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: '8px' }}
                >
                  ⚡ Copy to All 7 Days (Including Sunday)
                </button>
              </div>

              {/* Slots List for Selected Day */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    Configured Slots ({selectedDayConfig.slots?.length || 0}/6 Maximum)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: (selectedDayConfig.slots?.length || 0) >= 6 ? '#DC2626' : '#059669', fontWeight: 700 }}>
                    {(selectedDayConfig.slots?.length || 0) >= 6 ? 'Max 6 reached' : `${6 - (selectedDayConfig.slots?.length || 0)} available`}
                  </span>
                </div>

                {(selectedDayConfig.slots || []).map((slotWindow, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      background: '#FFFFFF',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1'
                    }}
                  >
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--primary-blue)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      flexShrink: 0
                    }}>
                      {sIdx + 1}
                    </span>

                    <input
                      type="text"
                      value={slotWindow}
                      onChange={e => {
                        const copy = [...selectedDayConfig.slots];
                        copy[sIdx] = e.target.value;
                        setWeeklyTemplate(prev => ({
                          ...prev,
                          [selectedDayKey]: {
                            ...prev[selectedDayKey],
                            slots: copy
                          }
                        }));
                      }}
                      className="form-input"
                      style={{ flex: 1, padding: '0.4rem 0.65rem', margin: 0, fontWeight: 700, fontSize: '0.85rem' }}
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveSlotFromDay(sIdx)}
                      className="btn btn-outline"
                      style={{ borderColor: '#FCA5A5', color: '#DC2626', padding: '0.35rem 0.55rem' }}
                      title="Remove Slot"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Slot to Day */}
              {(selectedDayConfig.slots?.length || 0) < 6 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                    + Add Slot Window to {selectedDayKey}:
                  </span>

                  {/* Window Range Builder */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>From:</span>
                    <select
                      value={dayWinStart}
                      onChange={e => setDayWinStart(e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      {TIME_POINTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>To:</span>
                    <select
                      value={dayWinEnd}
                      onChange={e => setDayWinEnd(e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      {TIME_POINTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleAddSlotToDay(`${dayWinStart} - ${dayWinEnd}`)}
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 800 }}
                    >
                      + Add Built Range
                    </button>
                  </div>

                  {/* Standard Presets */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                    {DEFAULT_SLOTS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        disabled={selectedDayConfig.slots?.includes(preset)}
                        onClick={() => handleAddSlotToDay(preset)}
                        style={{
                          background: selectedDayConfig.slots?.includes(preset) ? '#F1F5F9' : '#EFF6FF',
                          border: selectedDayConfig.slots?.includes(preset) ? '1px solid #E2E8F0' : '1px solid #BFDBFE',
                          color: selectedDayConfig.slots?.includes(preset) ? '#94A3B8' : 'var(--primary-blue)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: selectedDayConfig.slots?.includes(preset) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: CUSTOM DATE OVERRIDES (HOLIDAYS & FESTIVALS)
      ======================================================== */}
      {activeTab === 'DATE_OVERRIDES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '1.75rem', background: '#FFFFFF', borderRadius: '18px' }}>
            <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={20} color="#0284C7" />
                <span>Custom Date Overrides (Festivals, Holidays & Peak Days)</span>
              </h3>
              <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: '0.85rem' }}>
                Set custom timings for specific single calendar dates without altering your weekly system.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              
              {/* Form to Add Override */}
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 1rem', color: 'var(--primary-navy)', fontSize: '0.98rem', fontWeight: 800 }}>
                  Configure Custom Override for Date
                </h4>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Target Date:</label>
                  <input
                    type="date"
                    value={overrideDate}
                    onChange={e => setOverrideDate(e.target.value)}
                    className="form-input"
                    style={{ fontWeight: 800, fontSize: '0.95rem' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
                      Custom Slots ({overrideSlots.length}/6)
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {overrideSlots.map((s, idx) => (
                      <span key={idx} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        {s}
                        <button
                          type="button"
                          onClick={() => setOverrideSlots(overrideSlots.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0 }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>

                  {overrideSlots.length < 6 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {DEFAULT_SLOTS.map(preset => (
                        <button
                          key={preset}
                          type="button"
                          disabled={overrideSlots.includes(preset)}
                          onClick={() => setOverrideSlots([...overrideSlots, preset])}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveDateOverride}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.65rem', fontWeight: 800, borderRadius: '10px' }}
                >
                  Save Override for {overrideDate}
                </button>
              </div>

              {/* Active Overrides List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--primary-navy)', fontSize: '0.98rem', fontWeight: 800 }}>
                  Active Specific Date Overrides ({Object.keys(monthlyOverrides).length})
                </h4>

                {Object.keys(monthlyOverrides).length === 0 ? (
                  <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                    No specific date overrides configured. All dates follow the <strong>Default Weekly Slot System</strong>.
                  </div>
                ) : (
                  Object.entries(monthlyOverrides).map(([key, val]) => (
                    <div
                      key={key}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 800, color: 'var(--primary-navy)', fontSize: '0.92rem' }}>
                          📅 {key}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                          {Array.isArray(val) ? val.join(' · ') : String(val)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveOverride(key)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: FLEET CAPACITY & ZONE ROUTING MATRIX
      ======================================================== */}
      {activeTab === 'FLEET_ROUTING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* Field Worker Fleet Slider */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <Users size={20} color="var(--primary-blue)" />
                <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem' }}>
                  Field Worker Fleet Capacity
                </h3>
              </div>

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
                  💡 <strong>Dispatch Concurrency:</strong> When 1 boy is on duty, consecutive bookings enforce transit distance limits. When you increase capacity (e.g. 2, 3), multiple users can book the same time slot across different zones simultaneously!
                </p>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
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
                  🚗 Controls maximum transit radius between consecutive bookings on bike with pressure equipment.
                </p>
              </div>
            </div>

            {/* GPS Recalculation Action */}
            <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <Compass size={20} color="var(--primary-blue)" />
                  <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem' }}>
                    GPS Distance Matrix Recalculator
                  </h3>
                </div>
                <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Recalculate all pairwise transit distances across Visakhapatnam operational service regions based on their real Google Maps coordinates.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={handleRecalculateGps}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', fontWeight: 800 }}
                >
                  <RefreshCw size={15} />
                  <span>Recalculate Distances from Map Pins</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditingMatrix(!isEditingMatrix)}
                  className={isEditingMatrix ? "btn btn-teal" : "btn btn-outline"}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', fontWeight: 800 }}
                >
                  <Edit3 size={15} />
                  <span>{isEditingMatrix ? '✓ Finish Tuning Distances' : '✏️ Manual Distance Overrides'}</span>
                </button>
              </div>
            </div>
          </div>

          {matrixNotice && (
            <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={16} />
              <span>{matrixNotice}</span>
            </div>
          )}

          {/* Distance Matrix Table */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem', color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 800 }}>
              Operational Zones Transit Distance Matrix
            </h4>

            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '600px' }}>
                <thead style={{ background: '#0F172A', color: 'white' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.82rem' }}>From \ To</th>
                    {displayAreas.map(col => (
                      <th key={col.id || col.name} style={{ padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayAreas.map((rowArea, rIdx) => (
                    <tr key={rowArea.id || rIdx} style={{ borderBottom: '1px solid #E2E8F0', background: rIdx % 2 === 0 ? 'white' : '#F8FAFC' }}>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--primary-navy)', fontSize: '0.88rem' }}>
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
                            <td key={colArea.id || cIdx} style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#94A3B8' }}>
                              0 km
                            </td>
                          );
                        }

                        if (isEditingMatrix) {
                          return (
                            <td key={colArea.id || cIdx} style={{ padding: '0.4rem 0.5rem' }}>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="100"
                                value={dist}
                                onChange={e => handleMatrixCellChange(rowArea.name, colArea.name, e.target.value)}
                                style={{ width: '60px', padding: '0.2rem 0.4rem', borderRadius: '6px', border: '1.5px solid #3B82F6', textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}
                              />
                            </td>
                          );
                        }

                        return (
                          <td key={colArea.id || cIdx} style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              background: isFar ? '#FEE2E2' : '#DCFCE7',
                              color: isFar ? '#DC2626' : '#166534'
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
      )}

    </div>
  );
};

export default SlotsManagement;
