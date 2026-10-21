import React, { useState, useEffect, useRef } from 'react';
import { getBookings, updateBooking, deleteBooking, assignSlot, autoAssignSlot, cancelBookingByAdmin, rescheduleBookingByAdmin, markDoorstepRejectionByAdmin, getAvailableSlotsForAdmin, getEmployees, getEmployeesWorkload, getCarTypes, getWashTypes, getServiceAreas, getSettings, updateSettings } from '../api';
import { Calendar, User, Car, MapPin, Compass, Image, Eye, RefreshCw, CheckCircle, Navigation, AlertCircle, Search, X, Zap, Sparkles, ChevronDown, CreditCard, Clock, RotateCcw, Star, Edit2, Trash2, ExternalLink } from 'lucide-react';


const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Strict dd/mm/yyyy date formatter
const formatDateDMY = (dateInput) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const [year, month, day] = dateInput.substring(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};


// Modern Custom Assignment Dropdown Component
const AssignEmployeeDropdown = ({ booking, employees, workloads, onAssign, onFetchWorkload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      onFetchWorkload(booking.date, booking.timeSlot);
    }
    setIsOpen(!isOpen);
  };

  // Split specialists and other available employees
  const regionEmployees = employees.filter(emp =>
    emp.status === 'ACTIVE' &&
    emp.serviceAreas.some(sa => sa.id === booking.serviceAreaId)
  );

  const otherEmployees = employees.filter(emp =>
    emp.status === 'ACTIVE' &&
    !regionEmployees.some(re => re.id === emp.id)
  );

  const workloadKey = `${booking.date}_${booking.timeSlot}`;
  const slotWorkload = workloads[workloadKey] || [];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', maxWidth: '210px' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.4rem',
          padding: '0.45rem 0.75rem',
          background: isOpen ? '#F0F9FF' : '#FFFFFF',
          border: isOpen ? '1.5px solid #0EA5E9' : '1px solid #CBD5E1',
          borderRadius: '8px',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--primary-navy)',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <User size={13} color="#0EA5E9" /> Manual Assign
        </span>
        <ChevronDown 
          size={14} 
          color="#64748B" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} 
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          width: '270px',
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 14px 35px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(0,0,0,0.06)',
          border: '1px solid #E2E8F0',
          zIndex: 100,
          padding: '0.4rem',
          maxHeight: '340px',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '0.35rem 0.5rem 0.45rem', borderBottom: '1px solid #F1F5F9', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select Technician
            </span>
          </div>

          {/* Region Specialists Group */}
          {regionEmployees.length > 0 ? (
            <div style={{ marginBottom: '0.4rem' }}>
              <div style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#0369A1',
                background: '#E0F2FE',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                margin: '0.2rem 0.1rem 0.3rem'
              }}>
                <MapPin size={11} /> Region Specialists ({booking.serviceArea?.name || 'Local'})
              </div>
              {regionEmployees.map(emp => {
                const wInfo = slotWorkload.find(w => w.id === emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      onAssign(booking.id, emp.id);
                      setIsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.55rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      marginBottom: '0.15rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F0FDF4'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <div style={{ position: 'relative' }}>
                        {emp.photo ? (
                          <img src={emp.photo} alt={emp.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0EA5E9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                            {emp.name[0]}
                          </div>
                        )}
                        <span style={{
                          position: 'absolute',
                          bottom: '-1px',
                          right: '-1px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: emp.onDuty ? '#22C55E' : '#94A3B8',
                          border: '1.5px solid white'
                        }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {emp.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: emp.onDuty ? '#16A34A' : '#64748B', fontWeight: 500 }}>
                          {emp.onDuty ? '● On Duty' : '○ Off Duty'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {wInfo ? (
                        <span style={{ fontSize: '0.68rem', background: '#DCFCE7', color: '#166534', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                          {wInfo.dailyCount} today · {wInfo.slotCount} slot
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Available</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', textAlign: 'center' }}>
              No specialists mapped to this region
            </div>
          )}

          {/* All Other Employees */}
          {otherEmployees.length > 0 && (
            <div>
              <div style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#475569',
                background: '#F1F5F9',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                margin: '0.3rem 0.1rem 0.25rem'
              }}>
                <User size={11} /> All Other Employees
              </div>
              {otherEmployees.map(emp => {
                const wInfo = slotWorkload.find(w => w.id === emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      onAssign(booking.id, emp.id);
                      setIsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.55rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      marginBottom: '0.15rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <div style={{ position: 'relative' }}>
                        {emp.photo ? (
                          <img src={emp.photo} alt={emp.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#CBD5E1', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                            {emp.name[0]}
                          </div>
                        )}
                        <span style={{
                          position: 'absolute',
                          bottom: '-1px',
                          right: '-1px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: emp.onDuty ? '#22C55E' : '#94A3B8',
                          border: '1.5px solid white'
                        }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                          {emp.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: emp.onDuty ? '#16A34A' : '#64748B' }}>
                          {emp.onDuty ? '● On Duty' : '○ Off Duty'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {wInfo && (
                        <span style={{ fontSize: '0.68rem', background: '#F1F5F9', color: '#475569', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                          {wInfo.dailyCount} today
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [washTypes, setWashTypes] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [workloads, setWorkloads] = useState({});
  const [loading, setLoading] = useState(true);
  const [autoAssignMode, setAutoAssignMode] = useState(true);
  const [updatingMode, setUpdatingMode] = useState(false);

  // Admin Edit Booking Modal State
  const [adminEditModal, setAdminEditModal] = useState(null);
  const [editCarNumber, setEditCarNumber] = useState('');
  const [editCarMake, setEditCarMake] = useState('');
  const [editCarModel, setEditCarModel] = useState('');
  const [editCarTypeId, setEditCarTypeId] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMapsUrl, setEditMapsUrl] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAlternatePhone, setEditAlternatePhone] = useState('');
  const [editWashTypeId, setEditWashTypeId] = useState('');
  const [editServiceAreaId, setEditServiceAreaId] = useState('');
  const [editBookingLoading, setEditBookingLoading] = useState(false);
  const [resolvingMaps, setResolvingMaps] = useState(false);

  // Admin Delete Booking Modal State
  const [adminDeleteModal, setAdminDeleteModal] = useState(null);
  const [adminDeleteLoading, setAdminDeleteLoading] = useState(false);

  const openEditBookingModal = (b) => {
    setAdminEditModal(b);
    setEditCarNumber(b.carNumber || b.car?.carNumber || '');
    setEditCarMake(b.carMake || b.car?.make || '');
    setEditCarModel(b.carModel || b.car?.model || '');
    setEditCarTypeId(b.carTypeId || b.car?.carTypeId || '');
    setEditAddress(b.address || '');
    setEditLatitude(b.latitude != null ? b.latitude : '');
    setEditLongitude(b.longitude != null ? b.longitude : '');
    setEditMapsUrl(b.latitude != null && b.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}` : '');
    setEditPhone(b.alternatePhone || b.user?.phone || '');
    setEditAlternatePhone(b.alternatePhone || '');
    setEditWashTypeId(b.washTypeId || '');
    setEditServiceAreaId(b.serviceAreaId || '');
  };

  const handleResolveMapsLink = async () => {
    if (!editMapsUrl.trim()) {
      alert('Please enter or paste a Google Maps link first.');
      return;
    }
    setResolvingMaps(true);
    try {
      // 1. Direct Regex extraction
      const atMatch = editMapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        setEditLatitude(atMatch[1]);
        setEditLongitude(atMatch[2]);
        setResolvingMaps(false);
        return;
      }
      const dMatch = editMapsUrl.match(/!3d(-?\d+\.\d+).*?!4d(-?\d+\.\d+)/);
      if (dMatch) {
        setEditLatitude(dMatch[1]);
        setEditLongitude(dMatch[2]);
        setResolvingMaps(false);
        return;
      }
      const qMatch = editMapsUrl.match(/[?&](?:q|query|ll|destination|daddr|origin|center)=loc:?(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/i) ||
                     editMapsUrl.match(/[?&](?:q|query|ll|destination|daddr|origin|center)=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/i);
      if (qMatch) {
        setEditLatitude(qMatch[1]);
        setEditLongitude(qMatch[2]);
        setResolvingMaps(false);
        return;
      }

      // Shortened link resolution via backend
      const RAW_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001/api' : 'https://api.washmycar.org.in/api');
      const API_URL = RAW_URL.endsWith('/api') ? RAW_URL : `${RAW_URL.replace(/\/$/, '')}/api`;
      const res = await fetch(`${API_URL}/users/resolve-maps-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: editMapsUrl.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lng) {
          setEditLatitude(data.lat);
          setEditLongitude(data.lng);
          return;
        }
      }
      alert('Could not auto-extract GPS coordinates from link. Please verify the URL or enter Latitude and Longitude manually.');
    } catch (err) {
      alert('Failed to resolve Google Maps link: ' + err.message);
    } finally {
      setResolvingMaps(false);
    }
  };

  const handleEditBookingSubmit = async (e) => {
    e.preventDefault();
    if (!adminEditModal) return;
    setEditBookingLoading(true);
    try {
      const payload = {
        carNumber: editCarNumber.trim(),
        carMake: editCarMake.trim(),
        carModel: editCarModel.trim(),
        carTypeId: editCarTypeId ? Number(editCarTypeId) : undefined,
        address: editAddress.trim(),
        mapsUrl: editMapsUrl.trim(),
        latitude: editLatitude !== '' ? parseFloat(editLatitude) : undefined,
        longitude: editLongitude !== '' ? parseFloat(editLongitude) : undefined,
        phone: editPhone.trim(),
        alternatePhone: editAlternatePhone.trim(),
        washTypeId: editWashTypeId ? Number(editWashTypeId) : undefined,
        serviceAreaId: editServiceAreaId ? Number(editServiceAreaId) : undefined
      };

      const res = await updateBooking(adminEditModal.id, payload);
      alert(res.message || 'Booking updated successfully!');
      setAdminEditModal(null);
      fetchData();
    } catch (err) {
      alert('Failed to update booking: ' + (err.message || 'Unknown error'));
    } finally {
      setEditBookingLoading(false);
    }
  };

  const handleDeleteBookingSubmit = async () => {
    if (!adminDeleteModal) return;
    setAdminDeleteLoading(true);
    try {
      const res = await deleteBooking(adminDeleteModal.id);
      alert(res.message || 'Booking deleted successfully.');
      setAdminDeleteModal(null);
      fetchData();
    } catch (err) {
      alert('Failed to delete booking: ' + (err.message || 'Unknown error'));
    } finally {
      setAdminDeleteLoading(false);
    }
  };

  // Admin Cancellation Modal State
  const [adminCancelModal, setAdminCancelModal] = useState(null);
  const [adminCancelReason, setAdminCancelReason] = useState('');
  const [adminCancelLoading, setAdminCancelLoading] = useState(false);

  const handleAdminCancelSubmit = async () => {
    if (!adminCancelModal) return;
    setAdminCancelLoading(true);
    try {
      const res = await cancelBookingByAdmin(adminCancelModal.id, adminCancelReason || 'Cancelled by administration');
      alert(res.message || 'Booking cancelled and refund processed.');
      setAdminCancelModal(null);
      setAdminCancelReason('');
      fetchData();
    } catch (err) {
      alert('Failed to cancel booking: ' + (err.message || 'Unknown error'));
    } finally {
      setAdminCancelLoading(false);
    }
  };

  // Admin Reschedule Modal State
  const [adminRescheduleModal, setAdminRescheduleModal] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleSlotsList, setRescheduleSlotsList] = useState([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [adminRescheduleLoading, setAdminRescheduleLoading] = useState(false);

  // Doorstep Rejection Modal State
  const [adminDoorstepModal, setAdminDoorstepModal] = useState(null);
  const [doorstepRejectionNote, setDoorstepRejectionNote] = useState('');
  const [doorstepRejectionLoading, setDoorstepRejectionLoading] = useState(false);

  const fetchRescheduleSlots = async (targetDate, serviceAreaId, address) => {
    if (!targetDate) return;
    setLoadingRescheduleSlots(true);
    try {
      const res = await getAvailableSlotsForAdmin(targetDate, serviceAreaId, address);
      if (res && Array.isArray(res.slots)) {
        setRescheduleSlotsList(res.slots);
      } else {
        setRescheduleSlotsList([]);
      }
    } catch (e) {
      setRescheduleSlotsList([]);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  const openAdminRescheduleModal = (b) => {
    setAdminRescheduleModal(b);
    const initialDate = b.date ? new Date(b.date).toISOString().split('T')[0] : '';
    setRescheduleDate(initialDate);
    setRescheduleSlot(b.timeSlot || '10:00 AM');
    setRescheduleReason('');
    fetchRescheduleSlots(initialDate, b.serviceAreaId, b.address);
  };

  const handleAdminRescheduleSubmit = async () => {
    if (!adminRescheduleModal) return;
    if (!rescheduleDate) {
      alert('Please choose a valid new date for rescheduling.');
      return;
    }
    if (!rescheduleSlot) {
      alert('Please choose a time slot for the rescheduled date.');
      return;
    }
    if (!rescheduleReason || !rescheduleReason.trim()) {
      alert('Please enter a mandatory reason for rescheduling (e.g. Unfortunate heavy rain, technician emergency, or customer request).');
      return;
    }

    setAdminRescheduleLoading(true);
    try {
      const res = await rescheduleBookingByAdmin(adminRescheduleModal.id, {
        newDate: rescheduleDate,
        newTimeSlot: rescheduleSlot,
        reason: rescheduleReason.trim()
      });
      alert(res.message || 'Booking rescheduled successfully.');
      setAdminRescheduleModal(null);
      fetchData();
    } catch (err) {
      alert('Failed to reschedule: ' + (err.message || 'Unknown error'));
    } finally {
      setAdminRescheduleLoading(false);
    }
  };

  const handleAdminDoorstepRejectionSubmit = async () => {
    if (!adminDoorstepModal) return;
    setDoorstepRejectionLoading(true);
    try {
      const res = await markDoorstepRejectionByAdmin(adminDoorstepModal.id, doorstepRejectionNote || 'Customer not available upon technician arrival');
      alert(res.message || 'Doorstep rejection processed and ₹99 visit fee applied.');
      setAdminDoorstepModal(null);
      setDoorstepRejectionNote('');
      fetchData();
    } catch (err) {
      alert('Failed to process doorstep rejection: ' + (err.message || 'Unknown error'));
    } finally {
      setDoorstepRejectionLoading(false);
    }
  };


  // Search & Filter States
  const [searchPhone, setSearchPhone] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterWashTypeId, setFilterWashTypeId] = useState('');
  const [filterCarTypeId, setFilterCarTypeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');

  const fetchWorkload = async (date, timeSlot) => {
    const key = `${date}_${timeSlot}`;
    if (workloads[key]) return;
    try {
      const res = await getEmployeesWorkload(date, timeSlot);
      setWorkloads(prev => ({ ...prev, [key]: res }));
    } catch (err) {
      console.error('Error loading workloads:', err);
    }
  };

  // Verification Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [googleMapsReady, setGoogleMapsReady] = useState(!!(window.google && window.google.maps));
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const mapContainerRef = useRef(null);

  const fetchData = async () => {
    try {
      const [bRes, eRes, ctRes, wtRes, saRes, setRes] = await Promise.all([
        getBookings(),
        getEmployees(),
        getCarTypes().catch(() => []),
        getWashTypes().catch(() => []),
        getServiceAreas().catch(() => []),
        getSettings().catch(() => null)
      ]);
      setBookings(bRes);
      setEmployees(eRes);
      setCarTypes(ctRes);
      setWashTypes(wtRes);
      setServiceAreas(saRes);
      if (setRes && setRes.autoAssignment !== undefined) {
        setAutoAssignMode(setRes.autoAssignment);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAutoAssignMode = async () => {
    const nextVal = !autoAssignMode;
    setUpdatingMode(true);
    try {
      await updateSettings({ autoAssignment: nextVal });
      setAutoAssignMode(nextVal);
    } catch (err) {
      console.error('Failed to update auto assign mode:', err);
      alert('Failed to update Auto-Assign Mode setting.');
    } finally {
      setUpdatingMode(false);
    }
  };

  const handleManualAssign = async (bookingId, employeeId) => {
    try {
      await assignSlot(bookingId, employeeId);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign employee.');
    }
  };

  // Helper to calculate distance between coordinates (Haversine formula in meters)
  const getDistanceStr = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 'N/A';
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;

    if (d < 1000) {
      return `${Math.round(d)} meters`;
    }
    return `${(d / 1000).toFixed(2)} km`;
  };

  // Initialize Map inside the Verification Modal
  useEffect(() => {
    if (selectedBooking && showMap && mapContainerRef.current && window.google && window.google.maps) {
      const userLat = Number(selectedBooking.latitude);
      const userLng = Number(selectedBooking.longitude);
      if (!userLat || !userLng || isNaN(userLat) || isNaN(userLng)) return;

      const userPos = { lat: userLat, lng: userLng };
      
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: userPos,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true
      });

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(userPos);

      // 1. User Booked Destination Pin (Green) - HTTPS URL
      new window.google.maps.Marker({
        position: userPos,
        map,
        title: "User Destination",
        icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
      });

      // 2. Employee Start Job Pin (Orange)
      if (selectedBooking.startLatitude && selectedBooking.startLongitude) {
        const startPos = { lat: Number(selectedBooking.startLatitude), lng: Number(selectedBooking.startLongitude) };
        bounds.extend(startPos);
        new window.google.maps.Marker({
          position: startPos,
          map,
          title: "Employee Started Job Here",
          icon: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
        });
      }

      // 3. Employee Complete Job Pin (Purple)
      if (selectedBooking.endLatitude && selectedBooking.endLongitude) {
        const endPos = { lat: Number(selectedBooking.endLatitude), lng: Number(selectedBooking.endLongitude) };
        bounds.extend(endPos);
        new window.google.maps.Marker({
          position: endPos,
          map,
          title: "Employee Completed Job Here",
          icon: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png'
        });
      }

      // If technician coordinates exist, auto-fit bounds so all markers are visible on any screen
      if (selectedBooking.startLatitude || selectedBooking.endLatitude) {
        try {
          map.fitBounds(bounds, 40);
        } catch (e) {
          console.warn('Map fitBounds error:', e);
        }
      }
    }
  }, [selectedBooking, showMap, googleMapsReady]);

  // Load Maps SDK if not already loaded, when user clicks verification map
  const openVerificationModal = (booking) => {
    setSelectedBooking(booking);
    setShowMap(true);
    if (window.google && window.google.maps) {
      setGoogleMapsReady(true);
    } else {
      let script = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (!script) {
        script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', () => {
        setGoogleMapsReady(true);
      });
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (searchPhone) {
      const q = searchPhone.trim().toLowerCase();
      const userPhone = (b.user?.phone || '').toLowerCase();
      const userName = (b.user?.name || '').toLowerCase();
      const carPlate = (b.carNumber || b.car?.carNumber || '').toLowerCase();
      const carModel = (b.car ? `${b.car.make} ${b.car.model}` : `${b.carMake || ''} ${b.carModel || ''}`).toLowerCase();
      const bookingId = String(b.id);
      const razorpayId = (b.razorpayPaymentId || b.razorpayOrderId || '').toLowerCase();

      const bookingSerialId = (b.bookingId || '').toLowerCase();
      const matches = 
        userPhone.includes(q) || 
        userName.includes(q) || 
        carPlate.includes(q) || 
        carModel.includes(q) || 
        bookingId === q || 
        (`#${b.id}`).includes(q) || 
        bookingSerialId.includes(q) ||
        razorpayId.includes(q) ||
        (b.reportedIssue || '').toLowerCase().includes(q) ||
        (b.reportedIssueNote || '').toLowerCase().includes(q);

      if (!matches) return false;
    }
    if (filterDate) {
      const bookingDate = new Date(b.date).toISOString().split('T')[0];
      if (bookingDate !== filterDate) return false;
    }
    if (filterWashTypeId) {
      if (b.washTypeId?.toString() !== filterWashTypeId) return false;
    }
    if (filterCarTypeId) {
      if (b.carTypeId?.toString() !== filterCarTypeId) return false;
    }
    if (filterStatus) {
      if (filterStatus === 'REPORTED_ISSUE') {
        if (!b.reportedIssue) return false;
      } else if (b.status !== filterStatus) {
        return false;
      }
    }
    if (filterPaymentStatus) {
      const actualPayStatus = (b.paymentStatus || (b.razorpayPaymentId ? 'PAID' : (b.refundStatus === 'PROCESSED' ? 'REFUNDED' : 'PENDING'))).toUpperCase();
      if (actualPayStatus !== filterPaymentStatus.toUpperCase()) return false;
    }
    return true;
  });

  const handleResetFilters = () => {
    setSearchPhone('');
    setFilterDate('');
    setFilterWashTypeId('');
    setFilterCarTypeId('');
    setFilterStatus('');
    setFilterPaymentStatus('');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading bookings...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search & Filters Controls */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          
          {/* Phone / Text Search */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Search Booking</label>
            <div style={{ position: 'relative', marginTop: '0.25rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Phone, name, car #, ID..."
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                style={{ paddingLeft: '2.25rem', marginBottom: 0 }}
              />
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Date Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter by Date</label>
            <input
              type="date"
              className="form-input"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={{ marginTop: '0.25rem', marginBottom: 0 }}
            />
          </div>

          {/* Wash Type Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Wash Type</label>
            <select
              className="form-input"
              value={filterWashTypeId}
              onChange={e => setFilterWashTypeId(e.target.value)}
              style={{ marginTop: '0.25rem', marginBottom: 0 }}
            >
              <option value="">All Washes</option>
              {washTypes.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Car Type Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Car Type</label>
            <select
              className="form-input"
              value={filterCarTypeId}
              onChange={e => setFilterCarTypeId(e.target.value)}
              style={{ marginTop: '0.25rem', marginBottom: 0 }}
            >
              <option value="">All Car Types</option>
              {carTypes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Service Status Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Service Status</label>
            <select
              className="form-input"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ marginTop: '0.25rem', marginBottom: 0 }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="STARTED">STARTED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REPORTED_ISSUE">⚠️ Reported Issue Only</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Payment</label>
            <select
              className="form-input"
              value={filterPaymentStatus}
              onChange={e => setFilterPaymentStatus(e.target.value)}
              style={{ marginTop: '0.25rem', marginBottom: 0 }}
            >
              <option value="">All Payments</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(searchPhone || filterDate || filterWashTypeId || filterCarTypeId || filterStatus || filterPaymentStatus) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.55rem 1rem', height: '38px', borderRadius: 'var(--radius-md)' }}
            >
              <X size={14} /> Clear Filters
            </button>
          )}

        </div>
      </div>

      {/* Auto-Assign Mode Toggle Card */}
      <div style={{
        background: autoAssignMode ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        border: autoAssignMode ? '1.5px solid #86EFAC' : '1.5px solid #CBD5E1',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: autoAssignMode ? '#16A34A' : '#64748B',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: autoAssignMode ? '0 4px 12px rgba(34, 197, 94, 0.35)' : 'none',
            transition: 'all 0.3s'
          }}>
            <Zap size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--primary-navy)', fontWeight: 800 }}>
                Auto-Assign Mode
              </h3>
              <span style={{
                padding: '0.2rem 0.65rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                background: autoAssignMode ? '#16A34A' : '#64748B',
                color: 'white'
              }}>
                {autoAssignMode ? 'MODE: AUTO (ON)' : 'MODE: MANUAL (OFF)'}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: autoAssignMode ? '#166534' : 'var(--text-muted)' }}>
              {autoAssignMode 
                ? '⚡ When ON: All new incoming bookings are automatically assigned to on-duty employees in the customer\'s service region.' 
                : '🛠️ When OFF: New bookings are received as Unassigned (Pending). Admin manually assigns an employee to each slot.'}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label 
            onClick={handleToggleAutoAssignMode}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: updatingMode ? 'wait' : 'pointer', 
              userSelect: 'none', 
              gap: '0.75rem',
              background: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '30px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: autoAssignMode ? '#15803D' : 'var(--text-muted)' }}>
              {autoAssignMode ? 'Auto-Assign ON' : 'Manual Mode ON'}
            </span>
            <div 
              style={{
                width: '50px',
                height: '26px',
                background: autoAssignMode ? '#16A34A' : '#CBD5E1',
                borderRadius: '13px',
                padding: '2px',
                transition: 'background 0.3s',
                display: 'flex',
                alignItems: 'center',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                background: 'white',
                borderRadius: '50%',
                transform: autoAssignMode ? 'translateX(24px)' : 'translateX(0)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
              }} />
            </div>
          </label>
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="card p-0" style={{ padding: 0, borderRadius: 'var(--radius-lg)', minHeight: '480px', paddingBottom: '3rem' }}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 style={{ margin: 0 }}>Slots Details & Assignment</h3>
          <button onClick={fetchData} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>
        
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1150px' }}>
          <thead style={{ background: '#F8FAFC' }}>
            <tr>
              <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase' }}>Booking ID</th>
              <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase' }}>Customer & Car</th>
              <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase' }}>Wash & Area</th>
              <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase' }}>Schedule</th>
              <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase' }}>Payment Details</th>
              <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase' }}>Assignment Actions</th>
              <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase' }}>Manage & Pics</th>
          </tr>
        </thead>
        <tbody>
          {filteredBookings.map((b) => {
            // Find active, on duty employees who serve this booking's serviceAreaId
            const eligibleEmployees = employees.filter(emp => 
              emp.status === 'ACTIVE' && 
              emp.onDuty && 
              emp.serviceAreas.some(sa => sa.id === b.serviceAreaId)
            );

            return (
              <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-gray-50">
                
                {/* ID */}
                <td style={{ padding: '1.25rem 1.25rem', fontWeight: 700, color: 'var(--primary-navy)' }}>{b.bookingId || `#${b.id}`}</td>
                
                {/* Customer Details & Car */}
                <td style={{ padding: '1.25rem 1.25rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{b.user?.name || 'User'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.user?.phone}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                    <Car size={13} /> {b.car ? `${b.car.make} ${b.car.model}` : (b.carMake || b.carModel ? `${b.carMake || ''} ${b.carModel || ''}` : 'Vehicle')}
                  </div>
                  {(b.carNumber || b.car?.carNumber) && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: '#FEF08A',
                      border: '1.5px solid #CA8A04',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#713F12',
                      padding: '0.1rem 0.4rem',
                      marginTop: '0.35rem',
                      letterSpacing: '0.5px'
                    }}>
                      <span style={{ background: '#1E3A8A', color: 'white', padding: '0 3px', borderRadius: '2px', fontSize: '0.6rem', marginRight: '4px' }}>IND</span>
                      {b.carNumber || b.car?.carNumber}
                    </div>
                  )}
                </td>
                
                {/* Wash and Area details */}
                <td style={{ padding: '1.25rem 1.25rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{b.washType?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type: {b.carType?.name}</div>
                  <span style={{ fontSize: '0.75rem', background: 'var(--accent-teal-light)', color: 'var(--primary-navy)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.25rem', fontWeight: 600 }}>
                    {b.serviceArea?.name || 'Local'}
                  </span>
                  {b.addons && b.addons.length > 0 && (
                    <div style={{ marginTop: '0.5rem', padding: '0.35rem 0.5rem', background: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Sparkles size={11} /> +{b.addons.length} Add-on{b.addons.length > 1 ? 's' : ''}:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.2rem' }}>
                        {b.addons.map((ba, idx) => (
                          <span key={idx} style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 500 }}>
                            • {ba.addon?.name || 'Add-on'} (+₹{ba.price})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </td>
                
                {/* Schedule */}
                <td style={{ padding: '1.25rem 1.25rem', whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} color="var(--primary-blue)" /> {formatDateDMY(b.date)}
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={12} /> {b.timeSlot}
                  </div>
                </td>

                {/* Payment Details */}
                <td style={{ padding: '1.25rem 1.25rem', minWidth: '175px' }}>
                  {/* Total Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary-blue)', fontSize: '1.15rem' }}>₹{b.price}</span>
                    {b.addonsTotal > 0 && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        (+₹{b.addonsTotal} add-ons)
                      </span>
                    )}
                  </div>

                  {/* Payment Status Badge */}
                  <div style={{ marginTop: '0.3rem' }}>
                    {b.paymentStatus === 'PAID' || (!b.paymentStatus && b.razorpayPaymentId) ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: '#DCFCE7',
                        color: '#15803D',
                        border: '1px solid #86EFAC',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        <CheckCircle size={11} /> PAID
                      </span>
                    ) : (b.paymentStatus === 'REFUNDED' || b.refundStatus === 'PROCESSED') ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: '#F3E8FF',
                        color: '#7E22CE',
                        border: '1px solid #D8B4FE',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        <RotateCcw size={11} /> REFUNDED
                      </span>
                    ) : b.paymentStatus === 'FAILED' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        border: '1px solid #FCA5A5',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        <AlertCircle size={11} /> FAILED
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: '#FEF3C7',
                        color: '#B45309',
                        border: '1px solid #FDE68A',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        <Clock size={11} /> PENDING
                      </span>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <CreditCard size={11} /> {b.paymentMethod || (b.razorpayPaymentId ? 'Razorpay (Online)' : 'Online')}
                  </div>

                  {/* Razorpay Payment ID */}
                  {b.razorpayPaymentId && (
                    <div 
                      title={`Razorpay Payment ID: ${b.razorpayPaymentId}`}
                      style={{ 
                        fontSize: '0.68rem', 
                        color: '#1E293B', 
                        fontFamily: 'monospace', 
                        background: '#F1F5F9', 
                        border: '1px solid #E2E8F0', 
                        padding: '0.12rem 0.35rem', 
                        borderRadius: '4px', 
                        marginTop: '0.25rem', 
                        maxWidth: '160px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}
                    >
                      ID: {b.razorpayPaymentId}
                    </div>
                  )}

                  {/* Razorpay Order ID (if no payment ID yet) */}
                  {!b.razorpayPaymentId && b.razorpayOrderId && (
                    <div 
                      title={`Razorpay Order ID: ${b.razorpayOrderId}`}
                      style={{ 
                        fontSize: '0.68rem', 
                        color: '#64748B', 
                        fontFamily: 'monospace', 
                        background: '#F8FAFC', 
                        border: '1px solid #E2E8F0', 
                        padding: '0.12rem 0.35rem', 
                        borderRadius: '4px', 
                        marginTop: '0.25rem', 
                        maxWidth: '160px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}
                    >
                      Ord: {b.razorpayOrderId}
                    </div>
                  )}

                  {/* Refund Details */}
                  {(b.refundStatus === 'PROCESSED' || b.refundId || b.refundAmount) && (
                    <div style={{ marginTop: '0.35rem', background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '5px', padding: '0.25rem 0.4rem', fontSize: '0.7rem' }}>
                      <div style={{ color: '#7E22CE', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <RotateCcw size={10} /> Refund: ₹{b.refundAmount || b.price}
                      </div>
                      {b.refundId && (
                        <div style={{ color: '#9333EA', fontFamily: 'monospace', fontSize: '0.64rem', marginTop: '0.1rem', wordBreak: 'break-all' }}>
                          ID: {b.refundId}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                
                {/* Status */}
                <td style={{ padding: '1.25rem 1.25rem' }}>
                  <span className={`badge ${b.status === 'COMPLETED' ? 'badge-success' : b.status === 'STARTED' ? 'badge-warning' : b.status === 'CANCELLED' ? 'badge-danger' : 'badge-primary'}`} style={{
                    background: b.status === 'CANCELLED' ? '#FEE2E2' : undefined,
                    color: b.status === 'CANCELLED' ? '#DC2626' : undefined,
                    fontWeight: 700
                  }}>
                    {b.status}
                  </span>
                  {b.cancellationReason && (
                    <div style={{ fontSize: '0.72rem', color: '#991B1B', marginTop: '0.25rem', maxWidth: '140px', lineHeight: 1.25 }}>
                      {b.cancellationReason}
                    </div>
                  )}

                  {/* Reschedule Badge */}
                  {b.rescheduledAt && (
                    <div style={{
                      marginTop: '0.4rem',
                      background: '#EFF6FF',
                      border: '1.5px solid #93C5FD',
                      borderRadius: '8px',
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.72rem',
                      color: '#1E40AF',
                      maxWidth: '180px',
                      lineHeight: 1.35
                    }}>
                      <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#1D4ED8' }}>
                        <Calendar size={12} /> Rescheduled:
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#1E3A8A', marginTop: '0.15rem' }}>
                        {b.rescheduledReason || 'Unfortunate scenario'}
                      </div>
                      {b.originalDate && (
                        <div style={{ fontSize: '0.65rem', color: '#3B82F6', marginTop: '0.15rem' }}>
                          Was: {formatDateDMY(b.originalDate)} ({b.originalTimeSlot})
                        </div>
                      )}
                    </div>
                  )}

                  {/* Doorstep Rejection Fee Badge */}
                  {b.doorstepFeeDeducted > 0 && (
                    <div style={{
                      marginTop: '0.35rem',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '6px',
                      padding: '0.2rem 0.45rem',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: '#B91C1C'
                    }}>
                      ⚠️ ₹99 Doorstep Fee Deducted
                    </div>
                  )}

                  {/* Technician Doorstep Issue Alert */}
                  {b.reportedIssue && (
                    <div style={{
                      marginTop: '0.45rem',
                      background: '#FFF7ED',
                      border: '1.5px solid #F97316',
                      borderRadius: '8px',
                      padding: '0.4rem 0.55rem',
                      fontSize: '0.74rem',
                      color: '#9A3412',
                      maxWidth: '190px',
                      lineHeight: 1.35,
                      boxShadow: '0 1px 3px rgba(234, 88, 12, 0.1)'
                    }}>
                      <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#EA580C', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        <AlertCircle size={13} color="#EA580C" /> Tech Doorstep Issue:
                      </div>
                      <div style={{ fontWeight: 800, marginTop: '0.15rem', color: '#9A3412' }}>
                        {b.reportedIssue}
                      </div>
                      {b.reportedIssueNote && (
                        <div style={{ fontStyle: 'italic', color: '#C2410C', marginTop: '0.15rem', fontSize: '0.72rem' }}>
                          "{b.reportedIssueNote}"
                        </div>
                      )}
                      {b.reportedIssueAt && (
                        <div style={{ fontSize: '0.66rem', color: '#9A3412', marginTop: '0.25rem', opacity: 0.85 }}>
                          Reported: {new Date(b.reportedIssueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer Review & Rating */}
                  {b.review && (
                    <div style={{
                      marginTop: '0.45rem',
                      background: '#FEF9C3',
                      border: '1.5px solid #FACC15',
                      borderRadius: '8px',
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.74rem',
                      color: '#854D0E',
                      maxWidth: '190px',
                      lineHeight: 1.35
                    }}>
                      <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#B45309' }}>
                        <Star size={12} fill="#D97706" color="#D97706" /> Review: {b.review.rating}/5
                      </div>
                      {b.review.comment && (
                        <div style={{ fontStyle: 'italic', marginTop: '0.15rem', color: '#713F12', fontSize: '0.72rem' }} title={b.review.comment}>
                          "{b.review.comment}"
                        </div>
                      )}
                    </div>
                  )}
                </td>
                
                {/* Assignment triggers */}
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  {b.status === 'CANCELLED' ? (
                    <div style={{ fontSize: '0.82rem', color: '#DC2626', fontWeight: 600 }}>
                      Service Cancelled
                    </div>
                  ) : b.employeeId ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {b.employee?.photo ? (
                          <img src={b.employee.photo} alt="Emp" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            {b.employee?.name ? b.employee.name[0] : 'E'}
                          </div>
                        )}
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-navy)', display: 'block' }}>{b.employee?.name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.employee?.phone}</span>
                        </div>
                      </div>
                      {b.status !== 'COMPLETED' && (
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }}
                            onClick={() => handleManualAssign(b.id, '')}
                          >
                            Unassign
                          </button>
                          <button 
                            className="btn" 
                            style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => openAdminRescheduleModal(b)}
                            title="Reschedule for unfortunate scenarios (weather, breakdown, etc.)"
                          >
                            <Calendar size={12} /> Reschedule
                          </button>
                          <button 
                            className="btn" 
                            style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => { setAdminDoorstepModal(b); setDoorstepRejectionNote(''); }}
                            title="Customer not available upon arrival (Deduct ₹99 visit fee)"
                          >
                            <AlertCircle size={12} /> Rejection (₹99)
                          </button>
                          <button 
                            className="btn" 
                            style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', fontWeight: 600 }}
                            onClick={() => { setAdminCancelModal(b); setAdminCancelReason(''); }}
                          >
                            Cancel & Refund
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <AssignEmployeeDropdown
                        booking={b}
                        employees={employees}
                        workloads={workloads}
                        onAssign={handleManualAssign}
                        onFetchWorkload={fetchWorkload}
                      />
                      {b.status !== 'COMPLETED' && (
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                          <button 
                            className="btn" 
                            style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '0.2rem 0.5rem', fontSize: '0.72rem', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => openAdminRescheduleModal(b)}
                            title="Reschedule for unfortunate scenarios"
                          >
                            <Calendar size={12} /> Reschedule
                          </button>
                          <button 
                            className="btn" 
                            style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', padding: '0.2rem 0.5rem', fontSize: '0.72rem', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => { setAdminDoorstepModal(b); setDoorstepRejectionNote(''); }}
                            title="Customer not available upon arrival (Deduct ₹99 visit fee)"
                          >
                            <AlertCircle size={12} /> Rejection (₹99)
                          </button>
                          <button 
                            className="btn" 
                            style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '0.2rem 0.5rem', fontSize: '0.72rem', borderRadius: '4px', fontWeight: 600 }}
                            onClick={() => { setAdminCancelModal(b); setAdminCancelReason(''); }}
                          >
                            Cancel & Refund
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </td>


                {/* Actions & Service Pics */}
                <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '135px' }}>
                    <button 
                      type="button"
                      onClick={() => openEditBookingModal(b)}
                      className="btn"
                      style={{ 
                        padding: '0.35rem 0.6rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.35rem', 
                        borderRadius: '6px', 
                        background: '#EFF6FF', 
                        color: '#1D4ED8', 
                        border: '1px solid #BFDBFE' 
                      }}
                      title="Edit car details, address, maps link, phone number, etc."
                    >
                      <Edit2 size={13} /> Edit Booking
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => setAdminDeleteModal(b)}
                      className="btn"
                      style={{ 
                        padding: '0.35rem 0.6rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.35rem', 
                        borderRadius: '6px', 
                        background: '#FEF2F2', 
                        color: '#DC2626', 
                        border: '1px solid #FECACA' 
                      }}
                      title="Permanently delete booking"
                    >
                      <Trash2 size={13} /> Delete
                    </button>

                    {b.status === 'STARTED' || b.status === 'COMPLETED' ? (
                      <button 
                        type="button"
                        onClick={() => openVerificationModal(b)}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: '6px' }}
                      >
                        <Eye size={13} /> Verify Pics
                      </button>
                    ) : null}
                  </div>
                </td>

              </tr>
            );
          })}
          {filteredBookings.length === 0 && (
            <tr>
              <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No wash orders found.</td>
            </tr>
          )}
        </tbody>
      </table>
        </div>
    </div>

    {/* Lightbox Modal for Full Resolution Photo View */}
    {previewPhoto && (
      <div 
        onClick={() => setPreviewPhoto(null)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem',
          cursor: 'zoom-out'
        }}
      >
        <div 
          onClick={e => e.stopPropagation()} 
          style={{ 
            maxWidth: '96vw', 
            maxHeight: '92vh', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            cursor: 'default'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.75rem', color: 'white' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{previewPhoto.title || 'Service Photo'}</span>
            <button 
              onClick={() => setPreviewPhoto(null)}
              style={{ 
                background: 'rgba(255, 255, 255, 0.15)', 
                border: 'none', 
                color: 'white', 
                borderRadius: '50%', 
                width: '36px', 
                height: '36px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer' 
              }}
            >
              <X size={20} />
            </button>
          </div>
          <img 
            src={previewPhoto.url} 
            alt={previewPhoto.title || 'Preview'} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '78vh', 
              objectFit: 'contain', 
              borderRadius: '10px', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.1)'
            }} 
          />
          {previewPhoto.time && (
            <span style={{ color: '#CBD5E1', fontSize: '0.8rem', marginTop: '0.5rem', background: 'rgba(0,0,0,0.4)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              Uploaded: {previewPhoto.time}
            </span>
          )}
        </div>
      </div>
    )}

    {/* Verify Service Accuracy Modal */}
      {showMap && selectedBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(13, 38, 80, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '0.75rem',
          overflowY: 'auto'
        }}>
          <div className="card admin-modal-content" style={{ width: '100%', maxWidth: '780px', background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-lg)', maxHeight: '92vh', overflowY: 'auto', margin: 'auto' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem', fontWeight: 800 }}>
                  Service Verification #{selectedBooking.bookingId || selectedBooking.id}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>📅 {formatDateDMY(selectedBooking.date)} ({selectedBooking.timeSlot})</span>
                  <span>•</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{selectedBooking.user?.name || selectedBooking.user?.phone || 'Customer'}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>{selectedBooking.car ? `${selectedBooking.car.make} ${selectedBooking.car.model}` : (selectedBooking.carMake || 'Car')}</span>
                  {(selectedBooking.carNumber || selectedBooking.car?.carNumber) && (
                    <span style={{ background: '#FEF08A', color: '#713F12', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem' }}>
                      {selectedBooking.carNumber || selectedBooking.car?.carNumber}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => { setShowMap(false); setSelectedBooking(null); }}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  color: 'var(--text-main)',
                  transition: 'background 0.2s, color 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#FEE2E2';
                  e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#F1F5F9';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Photos Comparison - Responsive Grid */}
            <div className="service-pics-grid" style={{ marginBottom: '1.25rem' }}>
              {/* Before servicing */}
              <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Image size={15} color="#0EA5E9" /> Before Servicing
                  </h4>
                  {selectedBooking.startAt && (
                    <span style={{ fontSize: '0.72rem', background: '#E0F2FE', color: '#0369A1', padding: '0.15rem 0.45rem', borderRadius: '12px', fontWeight: 600 }}>
                      {new Date(selectedBooking.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {selectedBooking.startImage ? (
                  <div 
                    onClick={() => setPreviewPhoto({ 
                      url: selectedBooking.startImage, 
                      title: 'Before Servicing Photo', 
                      time: selectedBooking.startAt ? new Date(selectedBooking.startAt).toLocaleString() : '' 
                    })}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '220px',
                      background: '#0F172A',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Click to view full photo"
                  >
                    <img 
                      src={selectedBooking.startImage} 
                      alt="Before service" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: 'white',
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600
                    }}>
                      <Eye size={12} /> Tap to expand
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '220px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1.5px dashed #CBD5E1', padding: '1rem', textAlign: 'center', gap: '0.35rem' }}>
                    <Image size={24} style={{ opacity: 0.4 }} />
                    <span>No start picture uploaded yet</span>
                  </div>
                )}
              </div>

              {/* After servicing */}
              <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Image size={15} color="#10B981" /> After Servicing
                  </h4>
                  {selectedBooking.endAt && (
                    <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '12px', fontWeight: 600 }}>
                      {new Date(selectedBooking.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {selectedBooking.endImage ? (
                  <div 
                    onClick={() => setPreviewPhoto({ 
                      url: selectedBooking.endImage, 
                      title: 'After Servicing Photo', 
                      time: selectedBooking.endAt ? new Date(selectedBooking.endAt).toLocaleString() : '' 
                    })}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '220px',
                      background: '#0F172A',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Click to view full photo"
                  >
                    <img 
                      src={selectedBooking.endImage} 
                      alt="After service" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: 'white',
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600
                    }}>
                      <Eye size={12} /> Tap to expand
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '220px', borderRadius: '8px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1.5px dashed #CBD5E1', padding: '1rem', textAlign: 'center', gap: '0.35rem' }}>
                    <Image size={24} style={{ opacity: 0.4 }} />
                    <span>No completion picture uploaded yet</span>
                  </div>
                )}
              </div>
            </div>

            {/* GPS Location & Map Pinpoints */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                  <Compass size={16} color="var(--primary-blue)" /> Location Accuracy & GPS Track
                </h4>

                {/* Quick Open in Google Maps Link */}
                {selectedBooking.latitude && selectedBooking.longitude && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedBooking.latitude},${selectedBooking.longitude}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#0284C7',
                      background: '#E0F2FE',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      textDecoration: 'none'
                    }}
                  >
                    <Navigation size={12} /> Open in Google Maps ↗
                  </a>
                )}
              </div>

              {/* Map container */}
              <div 
                ref={mapContainerRef} 
                style={{
                  height: '240px',
                  width: '100%',
                  borderRadius: 'var(--radius-md)',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  marginBottom: '0.6rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {!GOOGLE_MAPS_API_KEY && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
                    <AlertCircle size={24} style={{ marginBottom: '0.25rem', color: '#F59E0B' }} />
                    Google Maps SDK key is not configured.
                  </div>
                )}
                {GOOGLE_MAPS_API_KEY && !googleMapsReady && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Loading map pinpoints...
                  </div>
                )}
              </div>

              {/* Map Markers Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.74rem', color: 'var(--text-main)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                  <strong>Green:</strong> Customer Destination
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />
                  <strong>Orange:</strong> Tech Started Job
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#A855F7', display: 'inline-block' }} />
                  <strong>Purple:</strong> Tech Completed Job
                </div>
              </div>
            </div>

            {/* Booked Address & Service Details */}
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--primary-navy)', fontSize: '0.92rem' }}>
                    {selectedBooking.washType?.name} ({selectedBooking.carType?.name})
                  </span>
                  {selectedBooking.serviceArea?.name && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: '#DBEAFE', color: '#1E40AF', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                      {selectedBooking.serviceArea.name}
                    </span>
                  )}
                </div>
                <span style={{ fontWeight: 800, color: 'var(--primary-blue)', fontSize: '1.05rem' }}>
                  ₹{selectedBooking.price}
                </span>
              </div>

              {/* Address display */}
              {selectedBooking.address && (
                <div style={{ fontSize: '0.82rem', color: '#1E3A8A', display: 'flex', alignItems: 'flex-start', gap: '0.35rem', marginTop: '0.3rem', lineHeight: 1.4 }}>
                  <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px', color: '#2563EB' }} />
                  <span><strong>Service Address:</strong> {selectedBooking.address}</span>
                </div>
              )}

              {selectedBooking.addons && selectedBooking.addons.length > 0 && (
                <div style={{ marginTop: '0.5rem', borderTop: '1px dashed #93C5FD', paddingTop: '0.4rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', marginBottom: '0.25rem' }}>
                    ✨ Add-ons:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {selectedBooking.addons.map((ba, i) => (
                      <span key={i} style={{ background: 'white', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600, color: '#1D4ED8', border: '1px solid #DBEAFE' }}>
                        + {ba.addon?.name || 'Add-on'} (₹{ba.price})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Accuracy Calculations */}
            <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary-blue)', fontSize: '0.82rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Customer Target GPS</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary-navy)', fontFamily: 'monospace' }}>
                    {selectedBooking.latitude != null ? Number(selectedBooking.latitude).toFixed(5) : 'N/A'}, {selectedBooking.longitude != null ? Number(selectedBooking.longitude).toFixed(5) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Tech Start GPS</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary-navy)', fontFamily: 'monospace' }}>
                    {selectedBooking.startLatitude != null && selectedBooking.startLongitude != null
                      ? `${Number(selectedBooking.startLatitude).toFixed(5)}, ${Number(selectedBooking.startLongitude).toFixed(5)}`
                      : 'Not recorded'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Tech Complete GPS</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary-navy)', fontFamily: 'monospace' }}>
                    {selectedBooking.endLatitude != null && selectedBooking.endLongitude != null
                      ? `${Number(selectedBooking.endLatitude).toFixed(5)}, ${Number(selectedBooking.endLongitude).toFixed(5)}`
                      : 'Not recorded'}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>Start Picture Deviation (Accuracy):</span>
                  <span style={{ fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                    {getDistanceStr(selectedBooking.latitude, selectedBooking.longitude, selectedBooking.startLatitude, selectedBooking.startLongitude)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>Complete Picture Deviation (Accuracy):</span>
                  <span style={{ fontWeight: 700, color: '#7E22CE', background: '#F3E8FF', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                    {getDistanceStr(selectedBooking.latitude, selectedBooking.longitude, selectedBooking.endLatitude, selectedBooking.endLongitude)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Admin Cancel & Refund Modal */}
      {adminCancelModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="admin-modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#DC2626', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={20} color="#DC2626" /> Cancel & Refund Booking #{adminCancelModal.bookingId || adminCancelModal.id}
              </h3>
              <button
                onClick={() => setAdminCancelModal(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
              Are you sure you want to cancel this booking for <strong>{adminCancelModal.user?.name || adminCancelModal.user?.phone}</strong> on <strong>{formatDateDMY(adminCancelModal.date)} ({adminCancelModal.timeSlot})</strong>?
            </p>

            {adminCancelModal.price > 0 && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#065F46', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong>💳 Payment & Refund Information:</strong>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#065F46' }}>₹{adminCancelModal.price}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                  Payment Method: <strong>{adminCancelModal.paymentMethod || (adminCancelModal.razorpayPaymentId ? 'Razorpay (Online)' : 'Online')}</strong>
                </div>
                {adminCancelModal.razorpayPaymentId && (
                  <div style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#065F46', marginTop: '0.15rem' }}>
                    Payment ID: {adminCancelModal.razorpayPaymentId}
                  </div>
                )}
                <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#047857', borderTop: '1px dashed #A7F3D0', paddingTop: '0.4rem', lineHeight: 1.45 }}>
                  {adminCancelModal.razorpayPaymentId 
                    ? `✨ An automated refund of ₹${adminCancelModal.price} will be triggered to the customer via Razorpay. Refund will credit to customer's bank account within 7 business days. If not credited within 7 days, customer can email washmycarorg@gmail.com or contact through the website Contact section.` 
                    : 'Booking will be marked cancelled with reason recorded.'}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.4rem' }}>
                Cancellation Reason (visible to customer & employee)
              </label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="e.g. Inclement weather, technician unavailable, administrative request..."
                value={adminCancelReason}
                onChange={e => setAdminCancelReason(e.target.value)}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0.6rem 0.75rem', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setAdminCancelModal(null)}
                disabled={adminCancelLoading}
                className="btn btn-outline"
                style={{ borderRadius: '8px', padding: '0.6rem 1.25rem' }}
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleAdminCancelSubmit}
                disabled={adminCancelLoading}
                style={{
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 700,
                  cursor: adminCancelLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {adminCancelLoading ? 'Processing Refund...' : 'Confirm Cancel & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reschedule Modal (For unfortunate scenarios) */}
      {adminRescheduleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="admin-modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1E40AF', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={20} color="#1D4ED8" /> Reschedule Booking #{adminRescheduleModal.bookingId || adminRescheduleModal.id}
              </h3>
              <button
                onClick={() => setAdminRescheduleModal(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#1E40AF', fontSize: '0.82rem', lineHeight: 1.45 }}>
              <strong>⚠️ Unfortunate Scenarios Rescheduling:</strong> Use this panel to reschedule incomplete or assigned bookings during sudden heavy rain, waterlogging, employee vehicle breakdown, machinery malfunction, or direct customer requests. Both customer and technician will receive an instant browser push notification.
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.1rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div><strong>Customer:</strong> {adminRescheduleModal.user?.name || 'Customer'} (+91 {adminRescheduleModal.user?.phone || 'N/A'})</div>
              <div><strong>Vehicle:</strong> {adminRescheduleModal.carMake} {adminRescheduleModal.carModel} {adminRescheduleModal.carNumber && `(${adminRescheduleModal.carNumber})`}</div>
              <div><strong>Current Slot:</strong> {formatDateDMY(adminRescheduleModal.date)} &bull; {adminRescheduleModal.timeSlot}</div>
              {adminRescheduleModal.employee && (
                <div style={{ color: '#0369A1' }}><strong>Assigned Technician:</strong> {adminRescheduleModal.employee.name} (+91 {adminRescheduleModal.employee.phone})</div>
              )}
            </div>

            {/* Date selection */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                Select New Service Date <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleDate}
                onChange={e => {
                  setRescheduleDate(e.target.value);
                  fetchRescheduleSlots(e.target.value, adminRescheduleModal.serviceAreaId, adminRescheduleModal.address);
                }}
                className="form-input"
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0.55rem 0.75rem', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            {/* Time Slot selection */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
                  Select New Time Slot <span style={{ color: '#DC2626' }}>*</span>
                </label>
                {loadingRescheduleSlots && <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Checking slots...</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                {(rescheduleSlotsList.length > 0 
                  ? rescheduleSlotsList.map(s => s.slot) 
                  : ["08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"]
                ).map(slot => {
                  const isSelected = rescheduleSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setRescheduleSlot(slot)}
                      style={{
                        padding: '0.5rem 0.4rem',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #2563EB' : '1px solid #CBD5E1',
                        background: isSelected ? '#EFF6FF' : 'white',
                        color: isSelected ? '#1D4ED8' : '#334155',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mandatory Reason */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                Mandatory Reason for Rescheduling <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                rows={3}
                required
                className="form-input"
                placeholder="Enter unfortunate scenario / operational reason (e.g. Sudden severe cloudburst in area, technician motorcycle puncture, machinery replacement, customer emergency call)..."
                value={rescheduleReason}
                onChange={e => setRescheduleReason(e.target.value)}
                style={{ width: '100%', borderRadius: '8px', border: '1.5px solid #CBD5E1', padding: '0.6rem 0.75rem', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setAdminRescheduleModal(null)}
                disabled={adminRescheduleLoading}
                className="btn btn-outline"
                style={{ borderRadius: '8px', padding: '0.6rem 1.25rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdminRescheduleSubmit}
                disabled={adminRescheduleLoading || !rescheduleReason.trim() || !rescheduleDate || !rescheduleSlot}
                style={{
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 1.4rem',
                  fontWeight: 700,
                  cursor: (adminRescheduleLoading || !rescheduleReason.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (!rescheduleReason.trim() || adminRescheduleLoading) ? 0.7 : 1
                }}
              >
                {adminRescheduleLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Doorstep Rejection / Customer Unavailable Modal */}
      {adminDoorstepModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="admin-modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#C2410C', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={20} color="#EA580C" /> Doorstep Rejection #{adminDoorstepModal.bookingId || adminDoorstepModal.id}
              </h3>
              <button
                onClick={() => setAdminDoorstepModal(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
              Mark this service as <strong>Customer Not Available / Doorstep Rejection</strong> for <strong>{adminDoorstepModal.user?.name || 'Customer'}</strong> ({adminDoorstepModal.carMake} {adminDoorstepModal.carModel}).
            </p>

            <div style={{
              background: '#FFF7ED',
              border: '1.5px solid #FDBA74',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
              color: '#9A3412',
              fontSize: '0.82rem',
              lineHeight: 1.5
            }}>
              <div style={{ fontWeight: 800, marginBottom: '0.35rem', color: '#C2410C' }}>
                ⚖️ Doorstep Rejection & ₹99 Deduction Policy:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div>• <strong>Physical Payment:</strong> ₹99 technician visit/dispatch fee will be deducted; {adminDoorstepModal.price > 99 ? `remaining ₹${adminDoorstepModal.price - 99} will be refunded via Razorpay.` : 'no refund as booking price is <= ₹99.'}</div>
                <div>• <strong>Reward Coins:</strong> If paid by points, 99 points will be deducted and remaining restored.</div>
                <div>• <strong>Subscription VIP Pass:</strong> 1 subscription wash limit will be deducted with zero refund or compensation.</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                Rejection Note / Details
              </label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="e.g. Customer did not pick up phone calls, gated community access refused, customer declined wash upon technician arrival..."
                value={doorstepRejectionNote}
                onChange={e => setDoorstepRejectionNote(e.target.value)}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0.6rem 0.75rem', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setAdminDoorstepModal(null)}
                disabled={doorstepRejectionLoading}
                className="btn btn-outline"
                style={{ borderRadius: '8px', padding: '0.6rem 1.25rem' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleAdminDoorstepRejectionSubmit}
                disabled={doorstepRejectionLoading}
                style={{
                  background: '#C2410C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 700,
                  cursor: doorstepRejectionLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {doorstepRejectionLoading ? 'Processing...' : 'Confirm Rejection (Deduct ₹99)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Booking Modal */}
      {adminEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="admin-modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Edit2 size={18} color="var(--primary-blue)" /> Edit Booking Details #{adminEditModal.bookingId || adminEditModal.id}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Customer: <strong>{adminEditModal.user?.name || 'Customer'}</strong> &bull; Scheduled: {formatDateDMY(adminEditModal.date)} ({adminEditModal.timeSlot})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminEditModal(null)}
                style={{ background: '#E2E8F0', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleEditBookingSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              
              {/* 1. Vehicle Details */}
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  <Car size={14} /> Vehicle Information
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Car Number / Plate</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. AP 39 AB 1234"
                      value={editCarNumber}
                      onChange={e => setEditCarNumber(e.target.value.toUpperCase())}
                      style={{ marginTop: '0.2rem', textTransform: 'uppercase', fontWeight: 700 }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Company / Make</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Maruti, Tata, Hyundai"
                      value={editCarMake}
                      onChange={e => setEditCarMake(e.target.value)}
                      style={{ marginTop: '0.2rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Car Model</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Swift, Nexon, Creta"
                      value={editCarModel}
                      onChange={e => setEditCarModel(e.target.value)}
                      style={{ marginTop: '0.2rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Car Type</label>
                    <select
                      className="form-input"
                      value={editCarTypeId}
                      onChange={e => setEditCarTypeId(e.target.value)}
                      style={{ marginTop: '0.2rem' }}
                    >
                      <option value="">-- Choose Car Type --</option>
                      {carTypes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Customer Phone & Contact */}
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  <User size={14} /> Contact Information
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Primary Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="10-digit mobile number"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      style={{ marginTop: '0.2rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Alternate Phone Number (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Secondary contact for technician"
                      value={editAlternatePhone}
                      onChange={e => setEditAlternatePhone(e.target.value)}
                      style={{ marginTop: '0.2rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Address & Google Maps Location Link */}
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  <MapPin size={14} /> Service Address & Google Maps Location
                </span>
                
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Typed Doorstep Address</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    placeholder="Enter street, apartment/house no, landmark..."
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    style={{ marginTop: '0.2rem', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Google Maps Link / URL</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Paste Google Maps URL (e.g. https://maps.app.goo.gl/... or google.com/maps)"
                      value={editMapsUrl}
                      onChange={e => setEditMapsUrl(e.target.value)}
                      style={{ margin: 0, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleResolveMapsLink}
                      disabled={resolvingMaps || !editMapsUrl.trim()}
                      className="btn btn-outline"
                      style={{ whiteSpace: 'nowrap', padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: 700 }}
                    >
                      {resolvingMaps ? 'Resolving...' : 'Auto-Extract GPS'}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Paste customer's Google Maps link or WhatsApp shared location link to auto-fill latitude & longitude pins below.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="e.g. 17.7289"
                      value={editLatitude}
                      onChange={e => setEditLatitude(e.target.value)}
                      style={{ marginTop: '0.2rem', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="e.g. 83.3031"
                      value={editLongitude}
                      onChange={e => setEditLongitude(e.target.value)}
                      style={{ marginTop: '0.2rem', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                {editLatitude && editLongitude && (
                  <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${editLatitude},${editLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} /> Test GPS in Google Maps ↗
                    </a>
                  </div>
                )}
              </div>

              {/* 4. Wash Package & Service Region */}
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7E22CE', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  <Sparkles size={14} /> Service Details
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Wash Package</label>
                    <select
                      className="form-input"
                      value={editWashTypeId}
                      onChange={e => setEditWashTypeId(e.target.value)}
                      style={{ marginTop: '0.2rem' }}
                    >
                      <option value="">-- Choose Wash Package --</option>
                      {washTypes.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Service Region</label>
                    <select
                      className="form-input"
                      value={editServiceAreaId}
                      onChange={e => setEditServiceAreaId(e.target.value)}
                      style={{ marginTop: '0.2rem' }}
                    >
                      <option value="">-- Choose Region --</option>
                      {serviceAreas.map(sa => (
                        <option key={sa.id} value={sa.id}>{sa.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAdminEditModal(null)}
                  disabled={editBookingLoading}
                  className="btn btn-outline"
                  style={{ borderRadius: '8px', padding: '0.55rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editBookingLoading}
                  className="btn btn-primary"
                  style={{ borderRadius: '8px', padding: '0.55rem 1.4rem', fontWeight: 700 }}
                >
                  {editBookingLoading ? 'Saving Changes...' : 'Save Booking Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Admin Delete Booking Modal */}
      {adminDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="admin-modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#DC2626', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Trash2 size={20} color="#DC2626" /> Delete Booking #{adminDeleteModal.bookingId || adminDeleteModal.id}
              </h3>
              <button
                type="button"
                onClick={() => setAdminDeleteModal(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
              Are you sure you want to permanently delete this booking for <strong>{adminDeleteModal.user?.name || adminDeleteModal.user?.phone}</strong> ({adminDeleteModal.carMake || ''} {adminDeleteModal.carModel || ''} {adminDeleteModal.carNumber ? `• ${adminDeleteModal.carNumber}` : ''})?
            </p>

            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', color: '#991B1B', fontSize: '0.82rem', lineHeight: 1.45 }}>
              <strong>⚠️ Permanent Database Deletion:</strong> This action will permanently remove the booking record, any attached add-ons, technician allocations, and service verification photos from the system. This cannot be undone.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setAdminDeleteModal(null)}
                disabled={adminDeleteLoading}
                className="btn btn-outline"
                style={{ borderRadius: '8px', padding: '0.6rem 1.25rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBookingSubmit}
                disabled={adminDeleteLoading}
                style={{
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 700,
                  cursor: adminDeleteLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {adminDeleteLoading ? 'Deleting...' : 'Confirm Permanent Delete'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Custom Responsive & Hover CSS */}
      <style>{`
        tr.hover\\:bg-gray-50:hover { background-color: #F8FAFC; }
        .service-pics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (max-width: 680px) {
          .service-pics-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Bookings;
