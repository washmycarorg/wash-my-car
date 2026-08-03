import React, { useState, useEffect, useRef } from 'react';
import { getServiceAreas, createServiceArea, updateServiceArea, deleteServiceArea } from '../api';
import { Trash2, MapPin, Plus, Edit3, Save, X, Compass } from 'lucide-react';

const VIZAG_COORDS = [17.7042, 83.2980]; // Center on Vizag

const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [editingId, setEditingId] = useState(null);
  const [areaName, setAreaName] = useState('');
  const [lat, setLat] = useState(VIZAG_COORDS[0]);
  const [lng, setLng] = useState(VIZAG_COORDS[1]);
  const [radius, setRadius] = useState(2000); // 2km default

  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const allCirclesRef = useRef({});

  useEffect(() => {
    fetchAreas();
  }, []);

  // Dynamically load Leaflet
  useEffect(() => {
    const loadLeaflet = () => {
      if (window.L) {
        initMap();
        return;
      }

      // CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.body.appendChild(script);
    };

    loadLeaflet();

    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, [areas.length]); // Re-draw markers when count changes

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
    if (!mapRef.current || leafletMapInstance.current) return;

    const L = window.L;
    // Map instance
    const map = L.map(mapRef.current).setView(VIZAG_COORDS, 12);
    leafletMapInstance.current = map;

    // Tile layer (Clean Light Mode Map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    // Current selection Marker & Circle
    const marker = L.marker(VIZAG_COORDS, { draggable: true }).addTo(map);
    markerRef.current = marker;

    const circle = L.circle(VIZAG_COORDS, {
      radius: radius,
      color: 'var(--primary-blue)',
      fillColor: '#3b82f6',
      fillOpacity: 0.2
    }).addTo(map);
    circleRef.current = circle;

    // Click handler to move marker
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setLat(lat.toFixed(6));
      setLng(lng.toFixed(6));
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
    });

    // Drag handler
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setLat(position.lat.toFixed(6));
      setLng(position.lng.toFixed(6));
      circle.setLatLng(position);
    });

    // Render all existing areas
    renderExistingAreasOnMap();
  };

  const renderExistingAreasOnMap = () => {
    if (!leafletMapInstance.current || !window.L) return;
    const L = window.L;

    // Clear old circles
    Object.values(allCirclesRef.current).forEach(c => c.remove());
    allCirclesRef.current = {};

    areas.forEach(area => {
      if (area.latitude && area.longitude && area.radius) {
        const c = L.circle([area.latitude, area.longitude], {
          radius: area.radius,
          color: editingId === area.id ? '#F59E0B' : '#10B981',
          fillColor: editingId === area.id ? '#F59E0B' : '#10B981',
          fillOpacity: 0.15,
          weight: editingId === area.id ? 3 : 1
        }).addTo(leafletMapInstance.current);

        c.bindTooltip(`<strong>${area.name}</strong><br/>Radius: ${(area.radius / 1000).toFixed(1)} km`, {
          permanent: false,
          direction: 'top'
        });

        allCirclesRef.current[area.id] = c;
      }
    });
  };

  // Update center circle dynamically when values change
  useEffect(() => {
    if (circleRef.current && markerRef.current && window.L) {
      circleRef.current.setRadius(radius);
      const latLng = [Number(lat), Number(lng)];
      circleRef.current.setLatLng(latLng);
      markerRef.current.setLatLng(latLng);
    }
  }, [lat, lng, radius]);

  // Re-render when list or editing targets change
  useEffect(() => {
    renderExistingAreasOnMap();
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
    setLat(area.latitude || VIZAG_COORDS[0]);
    setLng(area.longitude || VIZAG_COORDS[1]);
    setRadius(area.radius || 2000);

    if (leafletMapInstance.current) {
      leafletMapInstance.current.setView([area.latitude || VIZAG_COORDS[0], area.longitude || VIZAG_COORDS[1]], 13);
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
    setLat(VIZAG_COORDS[0]);
    setLng(VIZAG_COORDS[1]);
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
