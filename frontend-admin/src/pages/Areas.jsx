import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getServiceAreas, createServiceArea, updateServiceArea, deleteServiceArea } from '../api';
import { Trash2, MapPin, Plus, Edit3, Save, X, Compass, Search, ExternalLink, CheckCircle } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const VIZAG_COORDS = { lat: 17.7042, lng: 83.2980 }; // Center on Vizag

const Areas = () => {
  const [searchParams] = useSearchParams();
  const editParam = searchParams.get('edit');

  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusNotice, setStatusNotice] = useState('');
  
  // Form states
  const [editingId, setEditingId] = useState(null);
  const [areaName, setAreaName] = useState('');
  const [lat, setLat] = useState(VIZAG_COORDS.lat);
  const [lng, setLng] = useState(VIZAG_COORDS.lng);
  const [radius, setRadius] = useState(2000); // 2km default

  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const googleMapInstance = useRef(null);
  const activeMarkerRef = useRef(null);
  const activeCircleRef = useRef(null);
  const otherCirclesRef = useRef({});
  const autocompleteRef = useRef(null);

  useEffect(() => {
    fetchAreas();
  }, []);

  // Auto-focus region if directed from Slots Management (/areas?edit=ID)
  useEffect(() => {
    if (editParam && areas.length > 0) {
      const target = areas.find(a => String(a.id) === String(editParam));
      if (target) {
        handleEdit(target);
      }
    }
  }, [editParam, areas.length]);

  // Dynamically load Google Maps SDK with Places library
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [areas.length]);

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

  const initMap = () => {
    if (!mapRef.current || googleMapInstance.current || !window.google) return;

    const maps = window.google.maps;
    const map = new maps.Map(mapRef.current, {
      center: VIZAG_COORDS,
      zoom: 12,
      disableDefaultUI: false,
    });
    googleMapInstance.current = map;

    // Draggable marker for center point
    const marker = new maps.Marker({
      position: VIZAG_COORDS,
      map: map,
      draggable: true,
      title: 'Coverage Center Point',
    });
    activeMarkerRef.current = marker;

    // Radius Circle
    const circle = new maps.Circle({
      map: map,
      radius: radius,
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
      strokeColor: '#2563eb',
      strokeOpacity: 0.8,
      strokeWeight: 2,
    });
    activeCircleRef.current = circle;
    circle.bindTo('center', marker, 'position');

    // Autocomplete search integration
    if (searchInputRef.current) {
      const autocomplete = new maps.places.Autocomplete(searchInputRef.current);
      autocomplete.bindTo('bounds', map);
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          return;
        }

        const location = place.geometry.location;
        map.setCenter(location);
        map.setZoom(14);
        marker.setPosition(location);

        setLat(location.lat().toFixed(6));
        setLng(location.lng().toFixed(6));

        // Attempt to auto-fill area name if available
        if (place.name) {
          setAreaName(place.name);
        }
      });
    }

    // Drag Listener
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      setLat(pos.lat().toFixed(6));
      setLng(pos.lng().toFixed(6));
    });

    // Map Click Listener
    map.addListener('click', (e) => {
      const clickedPos = e.latLng;
      marker.setPosition(clickedPos);
      setLat(clickedPos.lat().toFixed(6));
      setLng(clickedPos.lng().toFixed(6));
    });

    // Draw other service areas
    renderExistingAreas();
  };

  const renderExistingAreas = () => {
    if (!googleMapInstance.current || !window.google) return;
    const maps = window.google.maps;

    // Clear old circles
    Object.values(otherCirclesRef.current).forEach(c => c.setMap(null));
    otherCirclesRef.current = {};

    areas.forEach(area => {
      if (area.latitude && area.longitude && area.radius) {
        const isEditingThis = editingId === area.id;
        
        // Don't draw editing circle twice
        if (isEditingThis) return;

        const c = new maps.Circle({
          map: googleMapInstance.current,
          center: { lat: area.latitude, lng: area.longitude },
          radius: area.radius,
          fillColor: '#10b981',
          fillOpacity: 0.15,
          strokeColor: '#059669',
          strokeOpacity: 0.7,
          strokeWeight: 1,
        });

        // Add tooltips (InfoWindow) on click
        const infoWindow = new maps.InfoWindow({
          content: `<div style="font-family: Outfit, sans-serif; color: var(--primary-navy); padding: 2px;">
            <strong style="font-size: 0.9rem;">${area.name}</strong><br/>
            Radius: ${(area.radius / 1000).toFixed(1)} km
          </div>`,
        });

        c.addListener('click', (e) => {
          infoWindow.setPosition(e.latLng);
          infoWindow.open(googleMapInstance.current);
        });

        otherCirclesRef.current[area.id] = c;
      }
    });
  };

  // Sync radius slider changes
  useEffect(() => {
    if (activeCircleRef.current) {
      activeCircleRef.current.setRadius(radius);
    }
  }, [radius]);

  // Sync manual inputs or click positions
  useEffect(() => {
    if (activeMarkerRef.current && window.google) {
      const latLng = new window.google.maps.LatLng(Number(lat), Number(lng));
      activeMarkerRef.current.setPosition(latLng);
    }
  }, [lat, lng]);

  // Sync active edit selection circle color updates
  useEffect(() => {
    renderExistingAreas();
  }, [areas, editingId]);

  const handleSaveArea = async (e) => {
    e.preventDefault();
    if (!areaName.trim()) return alert('Please enter a location/area name');
    
    const payload = {
      name: areaName.trim(),
      latitude: Number(lat),
      longitude: Number(lng),
      radius: Number(radius)
    };

    try {
      if (editingId) {
        await updateServiceArea(editingId, payload);
        setStatusNotice(`Service region "${areaName.trim()}" updated! Distance dispatch matrix recalculated.`);
      } else {
        await createServiceArea(payload);
        setStatusNotice(`New service region "${areaName.trim()}" added! It is now active in the Slot Dispatch Matrix.`);
      }
      setTimeout(() => setStatusNotice(''), 5000);
      resetForm();
      fetchAreas();
    } catch (err) {
      console.error(err);
      alert('Failed to save service area. Make sure it has a unique name.');
    }
  };

  const handleEdit = (area) => {
    setEditingId(area.id);
    setAreaName(area.name);
    setLat(area.latitude || VIZAG_COORDS.lat);
    setLng(area.longitude || VIZAG_COORDS.lng);
    setRadius(area.radius || 2000);

    if (googleMapInstance.current && window.google) {
      const center = { lat: area.latitude || VIZAG_COORDS.lat, lng: area.longitude || VIZAG_COORDS.lng };
      googleMapInstance.current.setCenter(center);
      googleMapInstance.current.setZoom(13);
    }
  };

  const handleDeleteArea = async (id) => {
    if (!confirm('Are you sure you want to delete this service area? Employees serving this area and saved addresses using it might be affected.')) return;
    try {
      await deleteServiceArea(id);
      setStatusNotice('Service area deleted. Distance dispatch matrix updated.');
      setTimeout(() => setStatusNotice(''), 4000);
      if (editingId === id) resetForm();
      fetchAreas();
    } catch (err) {
      console.error(err);
      alert('Failed to delete service area.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAreaName('');
    setLat(VIZAG_COORDS.lat);
    setLng(VIZAG_COORDS.lng);
    setRadius(2000);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: 'var(--primary-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        Loading service areas...
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Top Banner: Connected to Slot Dispatch Engine */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A, #1E293B)',
        borderRadius: '20px',
        padding: '1.5rem 2rem',
        color: 'white',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '0.3rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            <Compass size={14} />
            SYNCHRONIZED WITH SLOT DISPATCH ENGINE
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#FFFFFF' }}>
            Service Regions & Travel Routing Points
          </h3>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.88rem', maxWidth: '640px', lineHeight: 1.5 }}>
            GPS center coordinates and coverage radii configured here directly feed the road distance matrix in <strong>Slot Scheduling & Distance Dispatch</strong> for customer bookings.
          </p>
        </div>

        <Link
          to="/slots-management"
          className="btn btn-teal"
          style={{ padding: '0.8rem 1.4rem', fontSize: '0.92rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
        >
          <Compass size={18} />
          <span>View Slot Dispatch Matrix →</span>
        </Link>
      </div>

      {statusNotice && (
        <div style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC', color: '#166534', padding: '0.85rem 1.25rem', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Main Grid: Map & Form on Left, Configured Areas on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>
        
        {/* Left side Map & Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Map Card */}
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={18} /> Point Center & Set Radius
              </h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click map or drag marker</span>
            </div>

            {/* Autocomplete Search input */}
            <div style={{ position: 'relative' }}>
              <input 
                ref={searchInputRef}
                type="text" 
                className="form-input" 
                placeholder="Search location to pinpoint center..." 
                style={{ marginBottom: 0, paddingLeft: '2.5rem', background: '#F8FAFC' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            
            <div 
              ref={mapRef} 
              style={{ 
                height: '350px', 
                borderRadius: '8px', 
                border: '1px solid #E2E8F0',
                zIndex: 1
              }} 
            />
          </div>

          {/* Form Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem', color: 'var(--primary-navy)' }}>
              {editingId ? 'Edit Service Region' : 'Add New Service Region'}
            </h4>

            <form onSubmit={handleSaveArea} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Region/Area Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Sujatha Nagar, Nad Junction, Gajuwaka" 
                  value={areaName}
                  onChange={e => setAreaName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Latitude</label>
                  <input type="number" step="any" className="form-input" value={lat} onChange={e => setLat(e.target.value)} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Longitude</label>
                  <input type="number" step="any" className="form-input" value={lng} onChange={e => setLng(e.target.value)} required />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Coverage Radius</label>
                  <span style={{ fontSize: '0.82rem', color: 'var(--primary-blue)', fontWeight: 700 }}>{(radius / 1000).toFixed(1)} km</span>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="15000" 
                  step="500"
                  value={radius} 
                  onChange={e => setRadius(Number(e.target.value))} 
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-teal" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {editingId ? <Save size={16} /> : <Plus size={16} />}
                  {editingId ? 'Update Region' : 'Create Region'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <X size={16} /> Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>

        {/* Right side Configured Areas List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="var(--primary-blue)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)' }}>
                Configured Service Regions ({areas.length})
              </h3>
            </div>
            <Link
              to="/slots-management"
              style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>Dispatch Matrix</span>
              <ExternalLink size={13} />
            </Link>
          </div>

          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '580px', overflowY: 'auto' }}>
            {areas.map(area => (
              <div 
                key={area.id} 
                style={{
                  padding: '1rem',
                  border: editingId === area.id ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: editingId === area.id ? '#FEF3C7' : 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary-navy)', fontSize: '0.98rem' }}>{area.name}</span>
                    <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                      ✓ Routing Active
                    </span>
                  </div>
                  {area.latitude && area.radius ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Radius: {(area.radius / 1000).toFixed(1)} km · Center: {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#991B1B', fontStyle: 'italic', marginTop: '0.2rem' }}>
                      Coordinates not configured
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Link
                    to="/slots-management"
                    style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', cursor: 'pointer', padding: '0.35rem 0.5rem', color: 'var(--primary-blue)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}
                    title="View this region in the distance routing matrix"
                  >
                    <Compass size={14} />
                    <span>Matrix</span>
                  </Link>
                  <button 
                    onClick={() => handleEdit(area)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                    title="Edit Region on Map"
                  >
                    <Edit3 size={18} color="var(--primary-blue)" />
                  </button>
                  <button 
                    onClick={() => handleDeleteArea(area.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                    title="Delete Region"
                  >
                    <Trash2 size={18} color="var(--danger)" />
                  </button>
                </div>
              </div>
            ))}
            {areas.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
                <MapPin size={40} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
                <p style={{ margin: 0 }}>No service areas configured yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Areas;
