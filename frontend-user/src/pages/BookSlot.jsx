import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Car as CarIcon, CreditCard, CheckCircle, Search, Compass, AlertCircle, Tag, Sparkles, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  createBooking, 
  getCarTypes, 
  getWashTypes, 
  getServiceAreas, 
  getWashPrice, 
  getCars, 
  getSavedAddresses,
  getEligibleCoupons,
  getSettings,
  getProfile,
  getAddons
} from '../api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const CustomSelect = ({ options, value, onChange, placeholder = 'Select option' }) => {
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

  const selectedOption = options.find(opt => opt.value === value) || null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.75rem 1rem',
          border: '1px solid #CBD5E1',
          borderRadius: 'var(--radius-md)',
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.95rem',
          color: selectedOption ? 'var(--primary-navy)' : 'var(--text-muted)',
          fontWeight: 500,
          boxShadow: 'var(--shadow-sm)',
          userSelect: 'none'
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.5rem',
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          maxHeight: '220px',
          overflowY: 'auto',
          padding: '0.5rem 0'
        }}>
          {options.map(opt => (
            <div 
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: opt.value === value ? 'white' : 'var(--text-main)',
                background: opt.value === value ? 'var(--primary-blue)' : 'transparent',
                fontWeight: opt.value === value ? 600 : 400,
                transition: 'background 0.15s, color 0.15s'
              }}
              onMouseEnter={e => {
                if (opt.value !== value) {
                  e.target.style.background = '#F1F5F9';
                  e.target.style.color = 'var(--primary-navy)';
                }
              }}
              onMouseLeave={e => {
                if (opt.value !== value) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--text-main)';
                }
              }}
            >
              {opt.label}
            </div>
          ))}
          {options.length === 0 && (
            <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No options available</div>
          )}
        </div>
      )}
    </div>
  );
};

const BookSlot = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const autocompleteInputRef = useRef(null);

  // Lists
  const [carTypes, setCarTypes] = useState([]);
  const [washTypes, setWashTypes] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [savedCars, setSavedCars] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [eligibleCoupons, setEligibleCoupons] = useState([]);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [userPoints, setUserPoints] = useState(0);

  // Selections
  const [selectedCarType, setSelectedCarType] = useState('');
  const [selectedWashType, setSelectedWashType] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedCarSource, setSelectedCarSource] = useState('saved');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [selectedAddressSource, setSelectedAddressSource] = useState('saved');
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Promo and Loyalty State
  const [selectedCouponCode, setSelectedCouponCode] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Form State
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('09:00 AM');
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [saveCar, setSaveCar] = useState(false);

  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(19.0760); // Default Mumbai
  const [longitude, setLongitude] = useState(72.8777);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [saveAddress, setSaveAddress] = useState(false);

  // Price & Loading States
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Modal / Checkout
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Map references
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  // Load Lists
  useEffect(() => {
    Promise.all([
      getCarTypes(),
      getWashTypes(),
      getServiceAreas(),
      getCars(),
      getSavedAddresses(),
      getAddons().catch(() => []),
      getSettings().catch(() => null),
      getProfile().catch(() => null)
    ]).then(([carsT, washT, areas, cars, addrs, addonsList, settingsRes, profileRes]) => {
      setCarTypes(carsT);
      setWashTypes(washT);
      setServiceAreas(areas);
      setSavedCars(cars);
      setSavedAddresses(addrs);
      setAvailableAddons(addonsList || []);
      setSystemSettings(settingsRes);
      if (profileRes) {
        setUserPoints(profileRes.points || 0);
      }

      if (carsT.length > 0) setSelectedCarType(carsT[0].id.toString());
      if (washT.length > 0) setSelectedWashType(washT[0].id.toString());
      if (areas.length > 0) setSelectedArea(areas[0].id.toString());
      if (cars.length > 0) {
        setSelectedCarId(cars[0].id.toString());
        setSelectedCarType(cars[0].carTypeId.toString());
      } else {
        setSelectedCarSource('new');
      }
      if (addrs.length > 0) {
        setSelectedAddressId(addrs[0].id.toString());
        setSelectedArea(addrs[0].serviceAreaId.toString());
        setAddress(addrs[0].address);
        setLatitude(addrs[0].latitude);
        setLongitude(addrs[0].longitude);
      } else {
        setSelectedAddressSource('new');
      }
    }).catch(err => console.error('Error fetching dynamic lists:', err));
  }, []);

  // Fetch Eligible Coupons dynamically based on selected Car Type and Wash Type
  useEffect(() => {
    if (selectedCarType && selectedWashType) {
      getEligibleCoupons(selectedCarType, selectedWashType)
        .then((coupons) => {
          setEligibleCoupons(coupons);
          // If the previously selected coupon code is no longer eligible, clear it
          if (selectedCouponCode && !coupons.some(c => c.code === selectedCouponCode)) {
            setSelectedCouponCode('');
          }
        })
        .catch(err => console.error('Error fetching eligible coupons:', err));
    } else {
      setEligibleCoupons([]);
      setSelectedCouponCode('');
    }
  }, [selectedCarType, selectedWashType]);

  // Fetch Pricing based on Car Type & Wash Type selection
  useEffect(() => {
    if (selectedCarType && selectedWashType) {
      setPriceLoading(true);
      getWashPrice(selectedCarType, selectedWashType)
        .then(res => {
          setPrice(res.price || 0);
        })
        .catch(err => console.error(err))
        .finally(() => setPriceLoading(false));
    }
  }, [selectedCarType, selectedWashType]);

  // Adjust car type when selecting a saved car
  const handleSavedCarChange = (e) => {
    const carId = e.target.value;
    setSelectedCarId(carId);
    const car = savedCars.find(c => c.id.toString() === carId);
    if (car) {
      setSelectedCarType(car.carTypeId.toString());
    }
  };

  // Adjust coordinates/address when selecting a saved address
  const handleSavedAddressChange = (e) => {
    const addrId = e.target.value;
    setSelectedAddressId(addrId);
    const addr = savedAddresses.find(a => a.id.toString() === addrId);
    if (addr) {
      setAddress(addr.address);
      setLatitude(addr.latitude);
      setLongitude(addr.longitude);
      setSelectedArea(addr.serviceAreaId.toString());
      if (map && marker) {
        const pos = { lat: addr.latitude, lng: addr.longitude };
        map.setCenter(pos);
        marker.setPosition(pos);
      }
    }
  };

  // Load Google Maps SDK
  useEffect(() => {
    if (selectedAddressSource === 'new') {
      if (window.google && window.google.maps) {
        setMapsLoaded(true);
        setTimeout(initMap, 200);
      } else {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setMapsLoaded(true);
          initMap();
        };
        script.onerror = () => {
          console.warn("Failed to load Google Maps SDK. Using fallback coordinates.");
        };
        document.head.appendChild(script);
      }
    }
  }, [selectedAddressSource]);

  const initMap = () => {
    if (!mapRef.current) return;
    const defaultPos = { lat: latitude, lng: longitude };
    
    const newMap = new window.google.maps.Map(mapRef.current, {
      center: defaultPos,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
    });

    const newMarker = new window.google.maps.Marker({
      position: defaultPos,
      map: newMap,
      draggable: true,
      animation: window.google.maps.Animation.DROP
    });

    setMap(newMap);
    setMarker(newMarker);

    // Geocoding helper on dragend
    newMarker.addListener('dragend', () => {
      const position = newMarker.getPosition();
      const lat = position.lat();
      const lng = position.lng();
      setLatitude(lat);
      setLongitude(lng);
      geocodeCoords(lat, lng);
    });

    // Autocomplete Input Setup
    if (autocompleteInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current);
      autocomplete.bindTo('bounds', newMap);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        if (place.geometry.viewport) {
          newMap.fitBounds(place.geometry.viewport);
        } else {
          newMap.setCenter(place.geometry.location);
          newMap.setZoom(17);
        }
        newMarker.setPosition(place.geometry.location);
        setLatitude(place.geometry.location.lat());
        setLongitude(place.geometry.location.lng());
        setAddress(place.formatted_address || autocompleteInputRef.current.value);
      });
    }
  };

  // Reverse Geocoding Coordinates to Text Address
  const geocodeCoords = (lat, lng) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setAddress(results[0].formatted_address);
      }
    });
  };

  // Capture user current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation is not supported by your browser.');
    
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);
      geocodeCoords(lat, lng);

      if (map && marker) {
        const newPos = { lat, lng };
        map.setCenter(newPos);
        marker.setPosition(newPos);
      }
    }, (err) => {
      alert('Unable to retrieve location. Please permit GPS access.');
    });
  };

  const handleToggleAddon = (addonId) => {
    setSelectedAddonIds(prev => 
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  const handleBookingSubmit = async () => {
    if (!selectedCarType || !selectedWashType) {
      return alert('Please select a car type and car wash package. Add-ons cannot be booked individually.');
    }
    if (!date) return alert('Please choose a service date.');
    if (!timeSlot) return alert('Please select a time slot.');
    if (selectedCarSource === 'new' && (!carMake || !carModel)) {
      return alert('Please enter your car details.');
    }
    if (!address) return alert('Please enter/pinpoint your address.');
    if (!selectedArea) return alert('Please select your service area.');

    // Open checkout modal
    setShowCheckout(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
      return alert('Please fill in card details.');
    }
    
    setLoading(true);
    // Simulate Payment processing
    setTimeout(async () => {
      try {
        const payload = {
          carTypeId: Number(selectedCarType),
          washTypeId: Number(selectedWashType),
          serviceAreaId: Number(selectedArea),
          date: new Date(date).toISOString(),
          timeSlot,
          latitude,
          longitude,
          address,
          carId: selectedCarSource === 'saved' ? Number(selectedCarId) : null,
          saveCar: selectedCarSource === 'new' && saveCar,
          carMake: selectedCarSource === 'new' ? carMake : '',
          carModel: selectedCarSource === 'new' ? carModel : '',
          saveAddress: selectedAddressSource === 'new' && saveAddress,
          addressName: selectedAddressSource === 'new' ? addressLabel : '',
          couponCode: selectedCouponCode || undefined,
          redeemPoints: redeemPoints,
          addonIds: selectedAddonIds
        };

        await createBooking(payload);
        setPaymentSuccess(true);
        setTimeout(() => {
          setShowCheckout(false);
          navigate('/bookings');
        }, 2000);
      } catch (err) {
        console.error(err);
        alert(err.message || 'Failed to complete booking. Please check details.');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  const selectedAddonsList = availableAddons.filter(a => selectedAddonIds.includes(a.id));
  const addonsTotal = selectedAddonsList.reduce((sum, a) => sum + a.price, 0);
  const baseWashPrice = price || 0;
  const initialTotal = baseWashPrice + addonsTotal;

  const appliedCoupon = eligibleCoupons.find(c => c.code === selectedCouponCode);
  
  let discountVal = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'FLAT') {
      discountVal = appliedCoupon.discountAmount || 0;
    } else {
      discountVal = (initialTotal * (appliedCoupon.discountPct || 0)) / 100;
      if (appliedCoupon.limitOption === 'UP_TO' && appliedCoupon.maxDiscountAmount) {
        discountVal = Math.min(discountVal, appliedCoupon.maxDiscountAmount);
      }
    }
  }
  const subtotal = Math.max(0, initialTotal - discountVal);
  
  const redemptionEnabled = !systemSettings || systemSettings.pointsRedemption !== false;
  const rewardEnabled = !systemSettings || systemSettings.pointsReward !== false;
  const pointsToCashRatio = systemSettings?.pointsToCashRatio || 4;
  const rewardPointsRatio = systemSettings?.rewardPointsRatio || 0.1;
  const maxPointsCashValue = userPoints / pointsToCashRatio;
  
  let pointsCashValueUsed = 0;
  let pointsRedeemedUsed = 0;
  if (redeemPoints && redemptionEnabled && userPoints > 0) {
    if (maxPointsCashValue >= subtotal) {
      pointsCashValueUsed = subtotal;
      pointsRedeemedUsed = Math.ceil(subtotal * pointsToCashRatio);
    } else {
      pointsCashValueUsed = maxPointsCashValue;
      pointsRedeemedUsed = userPoints;
    }
  }
  
  const finalPrice = Math.max(0, subtotal - pointsCashValueUsed);
  const pointsEarned = rewardEnabled ? Math.floor(finalPrice * rewardPointsRatio) : 0;

  const currentCarTypeName = carTypes.find(c => c.id.toString() === selectedCarType)?.name || '';
  const currentWashTypeName = washTypes.find(w => w.id.toString() === selectedWashType)?.name || '';

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* 1. Vehicle Selection */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-navy)', marginBottom: '1.25rem' }}>
          <CarIcon size={20} color="var(--primary-blue)" /> Choose Vehicle
        </h3>
        
        {savedCars.length > 0 && (
          <div className="flex gap-4" style={{ marginBottom: '1.25rem' }}>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm">
              <input 
                type="radio" 
                name="carSource" 
                checked={selectedCarSource === 'saved'} 
                onChange={() => {
                  setSelectedCarSource('saved');
                  if (savedCars.length > 0) {
                    setSelectedCarId(savedCars[0].id.toString());
                    setSelectedCarType(savedCars[0].carTypeId.toString());
                  }
                }}
              /> Use Saved Car
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm">
              <input 
                type="radio" 
                name="carSource" 
                checked={selectedCarSource === 'new'} 
                onChange={() => setSelectedCarSource('new')}
              /> Enter New Car
            </label>
          </div>
        )}

        {selectedCarSource === 'saved' && savedCars.length > 0 ? (
          <div className="form-group">
            <label className="form-label">Select Saved Car</label>
            <CustomSelect 
              options={savedCars.map(c => ({ value: c.id.toString(), label: `${c.make} ${c.model} (${c.carType?.name})` }))}
              value={selectedCarId}
              onChange={(val) => handleSavedCarChange({ target: { value: val } })}
              placeholder="Choose saved car"
            />
          </div>
        ) : (
          <div className="flex-col gap-3" style={{ display: 'flex' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Make / Brand</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Maruti, Honda" 
                  value={carMake} 
                  onChange={e => setCarMake(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Model</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Swift, City" 
                  value={carModel} 
                  onChange={e => setCarModel(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Car Type</label>
              <CustomSelect 
                options={carTypes.map(c => ({ value: c.id.toString(), label: c.name }))}
                value={selectedCarType}
                onChange={setSelectedCarType}
                placeholder="Select car type"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted">
              <input type="checkbox" checked={saveCar} onChange={e => setSaveCar(e.target.checked)} />
              Save this car details for quick booking next time
            </label>
          </div>
        )}
      </div>

      {/* 2. Select Wash Type */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--primary-navy)', marginBottom: '1rem' }}>Select Wash Plan</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {washTypes.map(wt => {
            const isSelected = selectedWashType === wt.id.toString();
            return (
              <div 
                key={wt.id} 
                onClick={() => setSelectedWashType(wt.id.toString())}
                style={{
                  padding: '1.25rem',
                  border: isSelected ? '2px solid var(--primary-blue)' : '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: isSelected ? '#F0F9FF' : 'white',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary-navy)', fontWeight: 600 }}>{wt.name}</h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{wt.description}</p>
                </div>
                {isSelected && <CheckCircle size={22} color="var(--primary-blue)" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2.5 Add-on Services (Optional) */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #E0E7FF', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-navy)', margin: 0 }}>
            <Sparkles size={20} color="var(--accent-teal)" /> Add-on Services (Optional)
          </h3>
          <span style={{ fontSize: '0.75rem', background: '#E0F2FE', color: '#0369A1', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 600 }}>
            Add with any Wash
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
          Pamper your ride with extra specialized care. Add-ons must accompany a car wash package.
        </p>

        {availableAddons.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No active add-ons available right now.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {availableAddons.map(addon => {
              const isChecked = selectedAddonIds.includes(addon.id);
              return (
                <div
                  key={addon.id}
                  onClick={() => handleToggleAddon(addon.id)}
                  style={{
                    border: isChecked ? '2px solid var(--accent-teal)' : '1px solid #E2E8F0',
                    background: isChecked ? '#F0FDF4' : 'white',
                    borderRadius: '10px',
                    padding: '0.9rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    transition: 'all 0.2s',
                    boxShadow: isChecked ? '0 2px 8px rgba(16, 185, 129, 0.15)' : 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isChecked ? '#DCFCE7' : '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      flexShrink: 0
                    }}>
                      {addon.icon || '✨'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{addon.name}</span>
                      </div>
                      {addon.description && (
                        <p style={{ margin: '0.15rem 0 0', color: 'var(--text-muted)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {addon.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{ fontWeight: 800, color: isChecked ? '#047857' : 'var(--primary-navy)', fontSize: '0.95rem' }}>
                      +₹{addon.price}
                    </span>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: isChecked ? '2px solid #059669' : '2px solid #CBD5E1',
                      background: isChecked ? '#059669' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      {isChecked ? <Check size={14} strokeWidth={3} /> : <Plus size={14} color="#94A3B8" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Address Map Pinpoint */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-navy)', marginBottom: '1.25rem' }}>
          <MapPin size={20} color="var(--primary-blue)" /> Service Address
        </h3>

        {savedAddresses.length > 0 && (
          <div className="flex gap-4" style={{ marginBottom: '1.25rem' }}>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm">
              <input 
                type="radio" 
                name="addrSource" 
                checked={selectedAddressSource === 'saved'} 
                onChange={() => {
                  setSelectedAddressSource('saved');
                  if (savedAddresses.length > 0) {
                    const primaryAddr = savedAddresses[0];
                    setAddress(primaryAddr.address);
                    setLatitude(primaryAddr.latitude);
                    setLongitude(primaryAddr.longitude);
                    setSelectedArea(primaryAddr.serviceAreaId.toString());
                  }
                }}
              /> Choose Saved Address
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm">
              <input 
                type="radio" 
                name="addrSource" 
                checked={selectedAddressSource === 'new'} 
                onChange={() => setSelectedAddressSource('new')}
              /> Type & Pinpoint Map
            </label>
          </div>
        )}

        {selectedAddressSource === 'saved' && savedAddresses.length > 0 ? (
          <div className="flex-col gap-3" style={{ display: 'flex' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Saved Address</label>
              <CustomSelect 
                options={savedAddresses.map(a => ({ value: a.id.toString(), label: `${a.name} - ${a.address}` }))}
                value={selectedAddressId}
                onChange={(val) => handleSavedAddressChange({ target: { value: val } })}
                placeholder="Choose saved address"
              />
            </div>
            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-teal)', fontSize: '0.85rem' }}>
              <strong>Area:</strong> {savedAddresses.find(a => a.id.toString() === selectedAddressId)?.serviceArea?.name || 'Selected'}
            </div>
          </div>
        ) : (
          <div className="flex-col gap-3" style={{ display: 'flex' }}>
            
            <div className="form-group" style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <label className="form-label">Search Address or Drag Pin</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  ref={autocompleteInputRef}
                  className="form-input" 
                  placeholder="Search location in Google Maps..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Search size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <button 
                type="button" 
                onClick={handleCurrentLocation}
                className="btn btn-outline"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-sm)' }}
              >
                <Compass size={16} /> Use Current Location
              </button>
            </div>

            {/* Google Map Container */}
            <div 
              ref={mapRef}
              style={{
                height: '240px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #CBD5E1',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#F1F5F9'
              }}
            >
              {!GOOGLE_MAPS_API_KEY && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.9rem' }}>Google Maps Key is missing in .env.</p>
                  <p style={{ fontSize: '0.8rem' }}>Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Choose Near-by Area</label>
              <CustomSelect 
                options={serviceAreas.map(sa => ({ value: sa.id.toString(), label: sa.name }))}
                value={selectedArea}
                onChange={setSelectedArea}
                placeholder="Select nearest region"
              />
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted">
                <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} />
                Save this address for future bookings
              </label>
              {saveAddress && (
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Address Label (e.g. Home, Office, Work)" 
                  value={addressLabel} 
                  onChange={e => setAddressLabel(e.target.value)} 
                  style={{ marginTop: '0.5rem' }}
                />
              )}
            </div>

          </div>
        )}
      </div>

      {/* 4. Scheduling */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-navy)', marginBottom: '1.25rem' }}>
          <Calendar size={20} color="var(--primary-blue)" /> Service Slot
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              min={new Date().toISOString().split('T')[0]} 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Time Slot</label>
            <CustomSelect 
              options={[
                { value: "08:00 AM", label: "08:00 AM - 10:00 AM" },
                { value: "10:00 AM", label: "10:00 AM - 12:00 PM" },
                { value: "12:00 PM", label: "12:00 PM - 02:00 PM" },
                { value: "02:00 PM", label: "02:00 PM - 04:00 PM" },
                { value: "04:00 PM", label: "04:00 PM - 06:00 PM" }
              ]}
              value={timeSlot}
              onChange={setTimeSlot}
              placeholder="Choose time slot"
            />
          </div>
        </div>
      </div>

      {/* 4.5 Promotions & Loyalty Points */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-navy)', marginBottom: '1.25rem' }}>
          <Tag size={20} color="var(--primary-blue)" /> Promotions & Loyalty
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Coupon Selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Apply Coupon Code</label>
            <select
              className="form-input"
              value={selectedCouponCode}
              onChange={e => setSelectedCouponCode(e.target.value)}
              style={{ marginTop: '0.25rem' }}
            >
              <option value="">-- No Coupon Code --</option>
              {eligibleCoupons.map(c => (
                <option key={c.id} value={c.code}>
                  {c.code} ({c.discountType === 'FLAT' ? `₹${c.discountAmount} FLAT OFF` : `${c.discountPct}% OFF${c.limitOption === 'UP_TO' ? ` up to ₹${c.maxDiscountAmount}` : ''}`}) - {c.title}
                </option>
              ))}
            </select>
            {eligibleCoupons.length === 0 && (
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                No active coupon codes eligible for your account currently.
              </small>
            )}
          </div>

          {/* Loyalty Points redemption checkbox */}
          {redemptionEnabled && userPoints > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              background: '#F8FAFC',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              marginTop: '0.5rem'
            }}>
              <input
                type="checkbox"
                id="redeemPoints"
                checked={redeemPoints}
                onChange={e => setRedeemPoints(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '0.1rem' }}
              />
              <label htmlFor="redeemPoints" style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}>
                <strong>Redeem Royalty Points</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Use points to get cashback. You have <strong>{userPoints} points</strong> worth <strong>₹{maxPointsCashValue.toFixed(2)}</strong>.
                </div>
              </label>
            </div>
          )}

        </div>
      </div>

      {/* 5. Pricing and Checkout Trigger */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '4px solid var(--accent-teal)' }}>
        <h3 style={{ margin: 0, color: 'var(--primary-navy)' }}>Total Summary</h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          {currentCarTypeName} · {currentWashTypeName}
        </span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Base Wash Plan ({currentWashTypeName || 'Wash'}):</span>
            <span>₹{priceLoading ? '...' : baseWashPrice}</span>
          </div>

          {selectedAddonsList.length > 0 && (
            <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
                <span>Add-on Services ({selectedAddonsList.length}):</span>
                <span>+₹{addonsTotal}</span>
              </div>
              {selectedAddonsList.map(addon => (
                <div key={addon.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>• {addon.name}</span>
                  <span>+₹{addon.price}</span>
                </div>
              ))}
            </div>
          )}

          {discountVal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-teal)', fontWeight: 600 }}>
              <span>Coupon Discount ({selectedCouponCode}):</span>
              <span>-₹{discountVal.toFixed(2)}</span>
            </div>
          )}
          {pointsCashValueUsed > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309', fontWeight: 600 }}>
              <span>Royalty Cashback ({pointsRedeemedUsed} pts):</span>
              <span>-₹{pointsCashValueUsed.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary-navy)' }}>
            <span>Final Amount to Pay:</span>
            <span>₹{priceLoading ? '...' : finalPrice.toFixed(2)}</span>
          </div>
          {pointsEarned > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: 600, display: 'flex', gap: '0.2rem', alignItems: 'center', marginTop: '0.25rem' }}>
              <span>✓ You will earn <strong>{pointsEarned} loyalty reward points</strong> on this wash!</span>
            </div>
          )}
        </div>

        <button 
          onClick={handleBookingSubmit}
          className="btn btn-teal"
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }}
        >
          Book Slot & Proceed to Pay (Mock Checkout)
        </button>
      </div>

      {/* Mock Online Checkout Modal */}
      {showCheckout && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(13, 38, 80, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {paymentSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }} className="animate-fade-in">
                <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem auto' }} />
                <h2 style={{ color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>Payment Successful!</h2>
                <p style={{ color: 'var(--text-muted)' }}>Your slot is locked and auto-assignment processed.</p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <h3 style={{ color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <CreditCard color="var(--primary-blue)" /> Pay Online
                </h3>
                
                {/* Order Summary inside Modal */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-navy)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span>{currentWashTypeName} ({currentCarTypeName})</span>
                    <span>₹{baseWashPrice}</span>
                  </div>
                  {selectedAddonsList.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <span>+ {a.name}</span>
                      <span>₹{a.price}</span>
                    </div>
                  ))}
                  {discountVal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-teal)', fontSize: '0.8rem' }}>
                      <span>Coupon Discount</span>
                      <span>-₹{discountVal.toFixed(2)}</span>
                    </div>
                  )}
                  {pointsCashValueUsed > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309', fontSize: '0.8rem' }}>
                      <span>Royalty Cashback</span>
                      <span>-₹{pointsCashValueUsed.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #CBD5E1', paddingTop: '0.4rem', marginTop: '0.4rem', fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                    <span>Total to Pay:</span>
                    <span>₹{finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Cardholder Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Ramesh Sharma" 
                      required 
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Card Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="4111 2222 3333 4444" 
                      required 
                      maxLength="19"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Expiry Date</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="MM/YY" 
                        required 
                        maxLength="5"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">CVV</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="•••" 
                        required 
                        maxLength="3"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowCheckout(false)} 
                      className="btn btn-outline"
                      style={{ flex: 1, borderRadius: 'var(--radius-sm)' }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{ flex: 1, borderRadius: 'var(--radius-sm)' }}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Pay & Book'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default BookSlot;
