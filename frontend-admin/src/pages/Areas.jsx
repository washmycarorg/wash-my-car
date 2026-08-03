import React, { useState, useEffect, useRef } from 'react';
import { getServiceAreas, createServiceArea, updateServiceArea, deleteServiceArea } from '../api';
import { Trash2, MapPin, Plus, Edit3, Save, X, Compass, Search } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const VIZAG_COORDS = { lat: 17.7042, lng: 83.2980 }; // Center on Vizag

const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
        alert('Service area updated successfully');
      } else {
        await createServiceArea(payload);
        alert('New service area added successfully');
      }
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="animate-fade-in">
      
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
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={20} color="var(--primary-blue)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-navy)' }}>Configured Service Regions</h3>
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
                <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{area.name}</div>
                {area.latitude && area.radius ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Radius: {(area.radius / 1000).toFixed(1)} km · Center: {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#991B1B', fontStyle: 'italic', marginTop: '0.2rem' }}>
                    Coordinates not configured
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleEdit(area)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                  title="Edit Region"
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
  );
};

export default Areas;
