import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MapPin, Car as CarIcon, CreditCard, CheckCircle, 
  Search, Compass, AlertCircle, Tag, Sparkles, Plus, Check,
  Shield, Bike, Droplets, Feather, Flame, Info, ArrowRight,
  ArrowLeft, ArrowDown, X, Gift, CheckSquare, Square, ChevronRight, HelpCircle
} from 'lucide-react';
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
  getAddons,
  getAvailableSlots
} from '../api';
import SearchableDropdown from '../components/SearchableDropdown';
import { INDIAN_CAR_BRANDS } from '../data/indianCars';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const renderAddonIcon = (iconName, isChecked = false, size = 18) => {
  const color = isChecked ? '#047857' : 'var(--primary-blue)';
  if (!iconName) return <Sparkles size={size} color={color} />;
  const str = String(iconName).toLowerCase().trim();
  if (str.includes('shield') || str.includes('helmet') || str.includes('guard')) return <Shield size={size} color={color} />;
  if (str.includes('bike') || str.includes('scooter') || str.includes('two-wheeler')) return <Bike size={size} color={color} />;
  if (str.includes('droplet') || str.includes('rain') || str.includes('water') || str.includes('windshield')) return <Droplets size={size} color={color} />;
  if (str.includes('feather') || str.includes('pet') || str.includes('hair') || str.includes('fur')) return <Feather size={size} color={color} />;
  if (str.includes('flame') || str.includes('steam') || str.includes('engine') || str.includes('fire')) return <Flame size={size} color={color} />;
  if (str.includes('sparkle') || str.includes('ozone') || str.includes('clean') || str.includes('shine')) return <Sparkles size={size} color={color} />;

  if (iconName.length <= 4) return <span style={{ fontSize: `${size}px` }}>{iconName}</span>;
  return <Sparkles size={size} color={color} />;
};

const STEPS = [
  { id: 1, title: 'Vehicle', subtitle: 'Model & Number' },
  { id: 2, title: 'Wash Plan', subtitle: 'Select Package' },
  { id: 3, title: 'Terms', subtitle: 'Requirements' },
  { id: 4, title: 'Add-ons', subtitle: 'Optional Care' },
  { id: 5, title: 'Address', subtitle: 'Doorstep Location' },
  { id: 6, title: 'Confirm', subtitle: 'Slot & Payment' }
];

const BookSlot = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const termsCheckboxRef = useRef(null);

  // Stepper State (1 to 6)
  const [currentStep, setCurrentStep] = useState(1);

  // Always reset scroll position to top whenever currentStep changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [currentStep]);

  // Lists from DB
  const [carTypes, setCarTypes] = useState([]);
  const [washTypes, setWashTypes] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [savedCars, setSavedCars] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [eligibleCoupons, setEligibleCoupons] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [userPoints, setUserPoints] = useState(0);

  // Plan Prices Map: { [washTypeId]: price }
  const [planPrices, setPlanPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // STEP 1: Vehicle States
  const [carSource, setCarSource] = useState('saved'); // 'saved' or 'new'
  const [selectedSavedCarId, setSelectedSavedCarId] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [selectedCarTypeId, setSelectedCarTypeId] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [saveCar, setSaveCar] = useState(false);
  const [vehicleError, setVehicleError] = useState('');

  // STEP 2: Wash Plan States
  const [selectedWashTypeId, setSelectedWashTypeId] = useState('');
  const [infoModalPlan, setInfoModalPlan] = useState(null);

  // STEP 3: Terms Acceptance
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState('');

  // STEP 4: Add-ons States
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);

  // STEP 5: Address States
  const [addressSource, setAddressSource] = useState('saved'); // 'saved' or 'new'
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState('');
  const [selectedServiceAreaId, setSelectedServiceAreaId] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(19.0760);
  const [longitude, setLongitude] = useState(72.8777);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [saveAddress, setSaveAddress] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [addressError, setAddressError] = useState('');

  // STEP 6: Slot, Coupon & Review
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [availableSlotsList, setAvailableSlotsList] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotNotice, setSlotNotice] = useState('');
  const [selectedCouponCode, setSelectedCouponCode] = useState('');
  const [manualCouponInput, setManualCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    Promise.all([
      getCarTypes(),
      getWashTypes(),
      getServiceAreas(),
      getCars().catch(() => []),
      getSavedAddresses().catch(() => []),
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

      // Default selections
      if (cars.length > 0) {
        setCarSource('saved');
        setSelectedSavedCarId(cars[0].id.toString());
        setSelectedCarTypeId(cars[0].carTypeId.toString());
        setCarNumber(cars[0].carNumber || '');
      } else {
        setCarSource('new');
        if (carsT.length > 0) setSelectedCarTypeId(carsT[0].id.toString());
      }

      if (washT.length > 0) {
        setSelectedWashTypeId(washT[0].id.toString());
      }

      if (addrs.length > 0) {
        setAddressSource('saved');
        setSelectedSavedAddressId(addrs[0].id.toString());
        setSelectedServiceAreaId(addrs[0].serviceAreaId.toString());
        setAddress(addrs[0].address);
        setLatitude(addrs[0].latitude);
        setLongitude(addrs[0].longitude);
      } else {
        setAddressSource('new');
        if (areas.length > 0) setSelectedServiceAreaId(areas[0].id.toString());
      }
    }).catch(err => console.error('Error fetching dynamic lists:', err));
  }, []);

  // Fetch dynamically configured slots & distance validation
  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    getAvailableSlots(date, selectedServiceAreaId, address)
      .then(res => {
        if (res && Array.isArray(res.slots)) {
          setAvailableSlotsList(res.slots);
          if (res.targetZone) {
            setSlotNotice(`Zone: ${res.targetZone} (Dispatch Capacity: ${res.activeWorkers || 1} tech)`);
          }
          // If selected slot is disabled or unavailable, default to first available
          const currentIsAvailable = res.slots.some(s => s.slot === timeSlot && s.available);
          if (!currentIsAvailable) {
            const firstAvail = res.slots.find(s => s.available);
            if (firstAvail) {
              setTimeSlot(firstAvail.slot);
            } else {
              setTimeSlot('');
            }
          }
        } else {
          setAvailableSlotsList([]);
          setTimeSlot('');
        }
      })
      .catch(err => {
        console.warn('Failed to load available slots:', err);
        setAvailableSlotsList([]);
        setTimeSlot('');
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [date, selectedServiceAreaId, address, currentStep]);

  // Sync saved car selection
  useEffect(() => {
    if (carSource === 'saved' && selectedSavedCarId) {
      const car = savedCars.find(c => c.id.toString() === selectedSavedCarId);
      if (car) {
        setSelectedCarTypeId(car.carTypeId.toString());
        setCarNumber(car.carNumber || '');
      }
    }
  }, [carSource, selectedSavedCarId, savedCars]);

  // Sync saved address selection
  useEffect(() => {
    if (addressSource === 'saved' && selectedSavedAddressId) {
      const addr = savedAddresses.find(a => a.id.toString() === selectedSavedAddressId);
      if (addr) {
        setAddress(addr.address);
        setLatitude(addr.latitude);
        setLongitude(addr.longitude);
        setSelectedServiceAreaId(addr.serviceAreaId.toString());
      }
    }
  }, [addressSource, selectedSavedAddressId, savedAddresses]);

  // When a model is chosen from Indian cars list, auto-match car type
  useEffect(() => {
    if (carSource === 'new' && selectedBrand && selectedBrand !== '__OTHER__' && selectedModel && selectedModel !== '__OTHER__') {
      const brandData = INDIAN_CAR_BRANDS.find(b => b.name === selectedBrand);
      if (brandData) {
        const modelData = brandData.models.find(m => m.name === selectedModel);
        if (modelData && modelData.type && carTypes.length > 0) {
          const match = carTypes.find(ct => ct.name.toLowerCase().includes(modelData.type.toLowerCase()) || modelData.type.toLowerCase().includes(ct.name.toLowerCase()));
          if (match) {
            setSelectedCarTypeId(match.id.toString());
          }
        }
      }
    }
  }, [carSource, selectedBrand, selectedModel, carTypes]);

  // Fetch prices for all wash types whenever selectedCarTypeId changes
  useEffect(() => {
    if (selectedCarTypeId && washTypes.length > 0) {
      setLoadingPrices(true);
      Promise.all(
        washTypes.map(wt => 
          getWashPrice(selectedCarTypeId, wt.id)
            .then(res => ({ id: wt.id, price: res.price || 0 }))
            .catch(() => ({ id: wt.id, price: 0 }))
        )
      ).then(results => {
        const priceMap = {};
        results.forEach(r => { priceMap[r.id] = r.price; });
        setPlanPrices(priceMap);
        setLoadingPrices(false);
      });
    }
  }, [selectedCarTypeId, washTypes]);

  // Fetch eligible coupons for selected car type and wash type
  useEffect(() => {
    if (selectedCarTypeId && selectedWashTypeId) {
      setLoadingCoupons(true);
      getEligibleCoupons(selectedCarTypeId, selectedWashTypeId)
        .then(coupons => {
          const list = Array.isArray(coupons) ? coupons : [];
          setEligibleCoupons(list);
          if (selectedCouponCode && !list.some(c => c.code === selectedCouponCode)) {
            setSelectedCouponCode('');
          }
        })
        .catch(err => {
          console.error('Error fetching eligible coupons:', err);
          setEligibleCoupons([]);
        })
        .finally(() => setLoadingCoupons(false));
    }
  }, [selectedCarTypeId, selectedWashTypeId, currentStep]);

  const handleApplyCoupon = (codeToApply) => {
    setCouponError('');
    const code = (codeToApply || manualCouponInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    const found = eligibleCoupons.find(c => c.code.toUpperCase() === code);
    if (found) {
      setSelectedCouponCode(found.code);
      setManualCouponInput('');
      setCouponError('');
    } else {
      setCouponError(`Coupon "${code}" is invalid or not eligible for this wash package.`);
    }
  };

  const handleRemoveCoupon = () => {
    setSelectedCouponCode('');
    setManualCouponInput('');
    setCouponError('');
  };

  // Format Car Number input: only uppercase letters, numbers, and hyphens (-)
  const handleCarNumberChange = (e) => {
    const raw = e.target.value;
    const formatted = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCarNumber(formatted);
  };

  // Google Maps initialization on Step 5 if adding new address
  useEffect(() => {
    if (currentStep === 5 && addressSource === 'new') {
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
        document.head.appendChild(script);
      }
    }
  }, [currentStep, addressSource]);

  const initMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) return;
    const pos = { lat: latitude, lng: longitude };
    const newMap = new window.google.maps.Map(mapRef.current, {
      center: pos,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
    });
    const newMarker = new window.google.maps.Marker({
      position: pos,
      map: newMap,
      draggable: true,
      animation: window.google.maps.Animation.DROP
    });
    setMap(newMap);
    setMarker(newMarker);
    newMarker.addListener('dragend', () => {
      const newPos = newMarker.getPosition();
      setLatitude(newPos.lat());
      setLongitude(newPos.lng());
    });
  };

  // Price Calculations
  const baseWashPrice = planPrices[selectedWashTypeId] || 0;
  
  const selectedAddonsList = availableAddons.filter(a => selectedAddonIds.includes(a.id));
  const addonsTotal = selectedAddonsList.reduce((sum, a) => sum + (a.price || 0), 0);
  
  // Find active coupon
  const activeCoupon = eligibleCoupons.find(c => c.code === selectedCouponCode) || null;
  
  let couponDiscount = 0;
  let freeAddonBonus = null;
  let discountedAddonBonus = null;

  if (activeCoupon) {
    if (activeCoupon.discountType === 'FLAT') {
      couponDiscount = activeCoupon.discountAmount || 0;
    } else {
      couponDiscount = (baseWashPrice * (activeCoupon.discountPct || 0)) / 100;
      if (activeCoupon.limitOption === 'UP_TO' && activeCoupon.maxDiscountAmount) {
        couponDiscount = Math.min(couponDiscount, activeCoupon.maxDiscountAmount);
      }
    }

    // Add-on perks
    if (activeCoupon.freeAddonId) {
      const match = selectedAddonsList.find(a => a.id === activeCoupon.freeAddonId);
      if (match) {
        couponDiscount += match.price;
        freeAddonBonus = match.name;
      }
    }
    if (activeCoupon.discountAddonId) {
      const match = selectedAddonsList.find(a => a.id === activeCoupon.discountAddonId);
      if (match) {
        let disc = 0;
        if (activeCoupon.addonDiscountType === 'FREE') {
          disc = match.price;
        } else if (activeCoupon.addonDiscountType === 'FLAT') {
          disc = Math.min(match.price, activeCoupon.addonDiscountValue || 0);
        } else if (activeCoupon.addonDiscountType === 'PERCENTAGE') {
          disc = (match.price * (activeCoupon.addonDiscountValue || 0)) / 100;
        }
        couponDiscount += disc;
        discountedAddonBonus = match.name;
      }
    }
  }

  const subtotalAfterCoupon = Math.max(0, (baseWashPrice + addonsTotal) - couponDiscount);

  // Royalty Points Calculation
  let pointsDiscount = 0;
  let pointsToRedeem = 0;
  const ratio = systemSettings?.pointsToCashRatio || 4.0;

  if (redeemPoints && userPoints > 0) {
    const maxCashValue = userPoints / ratio;
    if (maxCashValue >= subtotalAfterCoupon) {
      pointsDiscount = subtotalAfterCoupon;
      pointsToRedeem = Math.ceil(subtotalAfterCoupon * ratio);
    } else {
      pointsDiscount = maxCashValue;
      pointsToRedeem = userPoints;
    }
  }

  const finalPayable = Math.max(0, subtotalAfterCoupon - pointsDiscount);

  // Stepper Validations & Navigation
  const handleNextFromStep1 = () => {
    setVehicleError('');
    if (carSource === 'saved') {
      if (!selectedSavedCarId) {
        setVehicleError('Please select a saved vehicle or switch to enter a new car.');
        return;
      }
    } else {
      const makeName = selectedBrand === '__OTHER__' ? customBrand.trim() : selectedBrand.trim();
      const modelName = selectedModel === '__OTHER__' ? customModel.trim() : selectedModel.trim();
      if (!makeName) {
        setVehicleError('Please select or enter the car manufacturer/brand.');
        return;
      }
      if (!modelName) {
        setVehicleError('Please select or enter the car model.');
        return;
      }
      if (!selectedCarTypeId) {
        setVehicleError('Please select the vehicle category type.');
        return;
      }
      if (!carNumber || carNumber.trim().length < 4) {
        setVehicleError('Please enter a valid car registration number (letters, digits, and hyphens only).');
        return;
      }
    }
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    if (!selectedWashTypeId) return;
    setCurrentStep(3);
  };

  const handleNextFromStep3 = () => {
    setTermsError('');
    if (!acceptedTerms) {
      setTermsError('You must acknowledge and accept the service requirements to proceed.');
      return;
    }
    setCurrentStep(4);
  };

  const handleNextFromStep4 = () => {
    setCurrentStep(5);
  };

  const handleNextFromStep5 = () => {
    setAddressError('');
    if (addressSource === 'saved') {
      if (!selectedSavedAddressId) {
        setAddressError('Please select a saved address or enter a new address.');
        return;
      }
    } else {
      if (!selectedServiceAreaId) {
        setAddressError('Please select your service city/area.');
        return;
      }
      if (!address || address.trim().length < 5) {
        setAddressError('Please provide a complete doorstep service address.');
        return;
      }
    }
    setCurrentStep(6);
  };

  // Submit Booking
  const handleFinalBookingSubmit = async (e) => {
    e.preventDefault();

    if (!timeSlot) {
      alert('Please select an available approved time slot before confirming your booking.');
      return;
    }

    if (availableSlotsList.length > 0) {
      const selectedSlotObj = availableSlotsList.find(s => s.slot === timeSlot);
      if (!selectedSlotObj) {
        alert('The selected time slot is not approved by administration for this date.');
        return;
      }
      if (!selectedSlotObj.available) {
        alert(`This slot cannot be booked: ${selectedSlotObj.reason || 'Unavailable'}`);
        return;
      }
    } else if (!loadingSlots) {
      alert('No approved slots are configured by administration for this date. Please choose another date.');
      return;
    }

    setLoading(true);

    try {
      let finalCarMake = '';
      let finalCarModel = '';
      let finalCarId = null;

      if (carSource === 'saved') {
        finalCarId = Number(selectedSavedCarId);
        const car = savedCars.find(c => c.id.toString() === selectedSavedCarId);
        if (car) {
          finalCarMake = car.make;
          finalCarModel = car.model;
        }
      } else {
        finalCarMake = selectedBrand === '__OTHER__' ? customBrand.trim() : selectedBrand.trim();
        finalCarModel = selectedModel === '__OTHER__' ? customModel.trim() : selectedModel.trim();
      }

      const payload = {
        carTypeId: Number(selectedCarTypeId),
        washTypeId: Number(selectedWashTypeId),
        serviceAreaId: Number(selectedServiceAreaId),
        date,
        timeSlot,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        carId: finalCarId,
        saveCar: carSource === 'new' ? saveCar : false,
        carMake: finalCarMake,
        carModel: finalCarModel,
        carNumber: carNumber ? carNumber.trim() : null,
        saveAddress: addressSource === 'new' ? saveAddress : false,
        addressName: addressLabel,
        couponCode: selectedCouponCode || null,
        redeemPoints: redeemPoints,
        addonIds: selectedAddonIds
      };

      const res = await createBooking(payload);
      setBookingSuccess(res);
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert('Failed to place booking: ' + (err.message || 'Please check your inputs'));
      setLoading(false);
    }
  };

  // Brand and Model dropdown options
  const brandOptions = INDIAN_CAR_BRANDS.map(b => b.name);
  const currentBrandObj = INDIAN_CAR_BRANDS.find(b => b.name === selectedBrand);
  const modelOptions = currentBrandObj ? currentBrandObj.models.map(m => m.name) : [];

  // Selected details labels
  const selectedCarTypeObj = carTypes.find(c => c.id.toString() === selectedCarTypeId);
  const selectedWashTypeObj = washTypes.find(w => w.id.toString() === selectedWashTypeId);

  // Success Screen
  if (bookingSuccess) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem 2rem', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)'
          }}>
            <Check size={40} color="white" strokeWidth={3} />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 0.5rem' }}>
            Car Wash Booked Successfully!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0 0 1.5rem' }}>
            Your service technician will arrive at your doorstep on <strong>{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong> during the window <strong>{timeSlot}</strong> to wash your vehicle.
          </p>

          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Booking ID</span>
              <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>#{bookingSuccess.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Service Plan</span>
              <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{selectedWashTypeObj?.name}</span>
            </div>
            {carNumber && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vehicle Reg.</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-blue)', letterSpacing: '0.05em' }}>{carNumber}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Amount Paid</span>
              <span style={{ fontWeight: 800, color: '#16A34A', fontSize: '1.05rem' }}>₹{finalPayable}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/bookings')}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.75rem', borderRadius: '12px' }}
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline"
              style={{ padding: '0.75rem 1.75rem', borderRadius: '12px' }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', paddingBottom: '7rem' }}>
      
      {/* Page Title */}
      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 0.25rem' }}>
          Book Doorstep Car Wash
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Follow the quick steps below to schedule a sparkling shine for your ride
        </p>
      </div>

      {/* ========================================================
          STEP 1: VEHICLE DETAILS
      ======================================================== */}
      {currentStep === 1 && (
        <div className="card animate-fade-in" style={{ padding: '2rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CarIcon size={20} color="var(--primary-blue)" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem', fontWeight: 700 }}>
                Vehicle Selection & Specifications
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Select your vehicle to retrieve the exact tailored package pricing
              </p>
            </div>
          </div>

          {/* Toggle: Saved Car vs New Car */}
          {savedCars.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: '#F8FAFC', padding: '0.4rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setCarSource('saved')}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  fontWeight: carSource === 'saved' ? 700 : 500,
                  fontSize: '0.9rem',
                  background: carSource === 'saved' ? 'white' : 'transparent',
                  color: carSource === 'saved' ? 'var(--primary-blue)' : 'var(--text-muted)',
                  boxShadow: carSource === 'saved' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Use Saved Vehicle ({savedCars.length})
              </button>
              <button
                type="button"
                onClick={() => setCarSource('new')}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  fontWeight: carSource === 'new' ? 700 : 500,
                  fontSize: '0.9rem',
                  background: carSource === 'new' ? 'white' : 'transparent',
                  color: carSource === 'new' ? 'var(--primary-blue)' : 'var(--text-muted)',
                  boxShadow: carSource === 'new' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                + Enter New Vehicle
              </button>
            </div>
          )}

          {/* If Saved Car Selected */}
          {carSource === 'saved' && savedCars.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Choose from Your Registered Cars</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {savedCars.map(car => {
                  const isSelected = selectedSavedCarId === car.id.toString();
                  return (
                    <div
                      key={car.id}
                      onClick={() => {
                        setSelectedSavedCarId(car.id.toString());
                        setSelectedCarTypeId(car.carTypeId.toString());
                        setCarNumber(car.carNumber || '');
                      }}
                      style={{
                        padding: '1rem',
                        border: isSelected ? '2px solid var(--primary-blue)' : '1px solid #E2E8F0',
                        borderRadius: '12px',
                        background: isSelected ? '#F0F9FF' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                          {car.make} {car.model}
                        </span>
                        {isSelected && <Check size={16} color="var(--primary-blue)" />}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '0.1rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                          {car.carType?.name || 'Vehicle'}
                        </span>
                        {car.carNumber && (
                          <span style={{ fontSize: '0.75rem', background: '#E0F2FE', color: '#0369A1', padding: '0.1rem 0.5rem', borderRadius: '6px', fontWeight: 700, letterSpacing: '0.05em' }}>
                            {car.carNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* New Car Configuration */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.5rem' }}>
              
              {/* Brand & Model Searchable Dropdowns */}
              <div className="booking-car-fields-grid">
                {/* Brand Selection */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Car Brand / Company <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <SearchableDropdown
                    options={brandOptions}
                    value={selectedBrand}
                    onChange={(val) => {
                      setSelectedBrand(val);
                      setSelectedModel(''); // Reset model on brand change
                    }}
                    placeholder="Search brand (e.g. Maruti, Tata)"
                    searchPlaceholder="Type company name..."
                    allowOther={true}
                    otherLabel="+ Other Brand (Manual)"
                  />
                  {selectedBrand === '__OTHER__' && (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type custom brand name..."
                      value={customBrand}
                      onChange={e => setCustomBrand(e.target.value)}
                      style={{ marginTop: '0.5rem' }}
                    />
                  )}
                </div>

                {/* Model Selection */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Car Model <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <SearchableDropdown
                    options={modelOptions}
                    value={selectedModel}
                    onChange={(val) => setSelectedModel(val)}
                    placeholder={selectedBrand ? "Search model..." : "Select brand first"}
                    searchPlaceholder="Type model name..."
                    allowOther={true}
                    otherLabel="+ Other Model (Manual)"
                    disabled={!selectedBrand}
                  />
                  {selectedModel === '__OTHER__' && (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type custom car model..."
                      value={customModel}
                      onChange={e => setCustomModel(e.target.value)}
                      style={{ marginTop: '0.5rem' }}
                    />
                  )}
                </div>
              </div>

              {/* Vehicle Type Selection Pills */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Vehicle Body Category <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {carTypes.map(ct => {
                    const isSelected = selectedCarTypeId === ct.id.toString();
                    return (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => setSelectedCarTypeId(ct.id.toString())}
                        style={{
                          padding: '0.55rem 1rem',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid var(--primary-blue)' : '1px solid #CBD5E1',
                          background: isSelected ? '#EFF6FF' : 'white',
                          color: isSelected ? 'var(--primary-blue)' : 'var(--text-main)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {ct.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Car Registration Number Input */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Car Registration Number <span style={{ color: '#EF4444' }}>*</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
                    (Only letters, digits & hyphens allowed, auto-capitalized)
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={carNumber}
                    onChange={handleCarNumberChange}
                    placeholder="e.g. TS-09-EA-1234 or MH02AB1234"
                    className="form-input"
                    style={{
                      letterSpacing: '0.1em',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: 'var(--primary-navy)'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.7rem',
                    background: '#F1F5F9',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    color: '#64748B',
                    fontWeight: 700
                  }}>
                    IND
                  </span>
                </div>
              </div>

              {/* Save Car Details Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--primary-navy)', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={saveCar}
                  onChange={e => setSaveCar(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary-blue)' }}
                />
                <span>Save this vehicle in my profile for future washes</span>
              </label>

            </div>
          )}

          {vehicleError && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.65rem 0.85rem', borderRadius: '8px', color: '#991B1B', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={16} /> {vehicleError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderRadius: '12px', fontSize: '0.95rem' }}
            >
              Continue to Wash Plan <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 2: WASH PLAN SELECTION
      ======================================================== */}
      {currentStep === 2 && (
        <div className="card animate-fade-in" style={{ padding: '2rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="var(--primary-blue)" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem', fontWeight: 700 }}>
                Select Your Wash Plan
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Configured packages for <strong>{selectedCarTypeObj?.name || 'Selected Vehicle'}</strong>
              </p>
            </div>
          </div>

          {/* Wash Plans Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
            {washTypes.map(plan => {
              const isSelected = selectedWashTypeId === plan.id.toString();
              const planPrice = planPrices[plan.id] || 0;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedWashTypeId(plan.id.toString())}
                  style={{
                    border: isSelected ? '2px solid var(--primary-blue)' : '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    background: isSelected ? '#F0F9FF' : 'white',
                    boxShadow: isSelected ? '0 8px 20px rgba(2, 132, 199, 0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.1rem', fontWeight: 800 }}>
                          {plan.name}
                        </h4>
                        {/* Quick Byte Pill */}
                        {plan.quickByte && (
                          <span style={{
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #BFDBFE',
                            padding: '0.15rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            ⚡ {plan.quickByte}
                          </span>
                        )}
                      </div>

                      {/* Short Description */}
                      {plan.description && (
                        <p style={{
                          margin: '0.45rem 0 0',
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {plan.description}
                        </p>
                      )}

                      {/* Info Button trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoModalPlan(plan);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--primary-blue)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '0.35rem 0 0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Info size={14} /> View Detailed Inclusions & Steps
                      </button>
                    </div>

                    {/* Price and Checkmark */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                        {loadingPrices ? '...' : `₹${planPrice}`}
                      </div>
                      <div style={{
                        marginTop: '0.4rem',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: isSelected ? 'none' : '2px solid #CBD5E1',
                        background: isSelected ? 'var(--primary-blue)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 'auto'
                      }}>
                        {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '12px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              onClick={handleNextFromStep2}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '12px', padding: '0.75rem 1.75rem' }}
            >
              Continue to Service Terms <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Detailed Description Popup Modal */}
      {infoModalPlan && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setInfoModalPlan(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} color="#64748B" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles size={20} color="var(--primary-blue)" />
              <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.3rem', fontWeight: 800 }}>
                {infoModalPlan.name}
              </h3>
            </div>

            {infoModalPlan.quickByte && (
              <div style={{
                background: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                padding: '0.35rem 0.75rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginBottom: '1rem'
              }}>
                ⚡ Quick Byte: {infoModalPlan.quickByte}
              </div>
            )}

            <div style={{ margin: '0 0 1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--primary-navy)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Complete Inclusions & Procedure
              </h4>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {infoModalPlan.description || 'No detailed description provided by administration.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Package Price</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                  ₹{planPrices[infoModalPlan.id] || 0}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedWashTypeId(infoModalPlan.id.toString());
                  setInfoModalPlan(null);
                }}
                className="btn btn-primary"
                style={{ borderRadius: '10px', padding: '0.6rem 1.25rem' }}
              >
                Choose This Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 3: TERMS & SERVICE CONDITIONS DISCLAIMER
      ======================================================== */}
      {currentStep === 3 && (
        <div className="card animate-fade-in" style={{ padding: '2rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="#D97706" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem', fontWeight: 700 }}>
                Service Requirements & Terms
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Please review and acknowledge the requirements for doorstep execution
              </p>
            </div>
          </div>

          {/* Action Required Alert Banner */}
          <div 
            onClick={() => termsCheckboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            style={{
              background: acceptedTerms 
                ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' 
                : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
              border: acceptedTerms ? '1.5px solid #86EFAC' : '1.5px solid #F59E0B',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              boxShadow: acceptedTerms ? '0 2px 8px rgba(34, 197, 94, 0.12)' : '0 2px 10px rgba(245, 158, 11, 0.18)',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: acceptedTerms ? '#16A34A' : '#D97706',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {acceptedTerms ? (
                <Check size={18} strokeWidth={3} />
              ) : (
                <ArrowDown size={18} strokeWidth={2.5} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: acceptedTerms ? '#14532D' : '#92400E', fontSize: '0.88rem' }}>
                {acceptedTerms ? 'Terms Accepted ✓ You can continue below' : 'Scroll Down & Accept to Continue'}
              </div>
              <div style={{ color: acceptedTerms ? '#166534' : '#78350F', fontSize: '0.78rem', marginTop: '0.15rem', lineHeight: 1.35 }}>
                {acceptedTerms 
                  ? 'Requirements acknowledged. Tap "Continue to Add-ons" at the bottom to proceed.' 
                  : 'Please scroll down, review doorstep requirements, and tick the acceptance box.'}
              </div>
            </div>
            {!acceptedTerms && (
              <span style={{
                background: '#D97706',
                color: '#FFF',
                padding: '0.25rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                flexShrink: 0
              }}>
                Scroll Down ↓
              </span>
            )}
          </div>

          {/* Key Requirement Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369A1', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <Droplets size={16} /> Water Supply
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#0C4A6E', lineHeight: 1.4 }}>
                A working water tap access point within reasonable hose reach of your vehicle parking.
              </p>
            </div>

            <div style={{ background: '#FEF9C3', border: '1px solid #FEF08A', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#854D0E', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <Flame size={16} /> Electricity Socket
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#713F12', lineHeight: 1.4 }}>
                A standard domestic 3-pin electric plug point to power vacuum and high-pressure pumps.
              </p>
            </div>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <CarIcon size={16} /> Parking Clearance
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#14532D', lineHeight: 1.4 }}>
                Sufficient clearance space around all 4 doors and boot for the technician to detail safely.
              </p>
            </div>
          </div>

          {/* Admin Defined Terms Matter */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: 'var(--primary-navy)', fontSize: '0.92rem', fontWeight: 700 }}>
              Official Service Disclaimer & Terms
            </h4>
            <div style={{ color: '#475569', fontSize: '0.86rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {systemSettings?.bookingTermsText || "1. Access Requirements: Customer agrees to provide adequate water tap access and a standard electric plug point for the technician to perform the doorstep car wash service safely.\n2. Vehicle Parking: The vehicle must be parked in a safe area with sufficient clearance around all sides.\n3. Valuable Items: Please remove all personal belongings and valuables from inside the car prior to service commencement."}
            </div>
          </div>

          {/* Mandatory Checkbox */}
          <div 
            id="terms-acceptance-checkbox"
            ref={termsCheckboxRef}
            onClick={() => {
              setAcceptedTerms(!acceptedTerms);
              if (termsError) setTermsError('');
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '1rem',
              borderRadius: '12px',
              border: acceptedTerms ? '2px solid #10B981' : '1px solid #CBD5E1',
              background: acceptedTerms ? '#F0FDF4' : 'white',
              transition: 'all 0.2s',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '6px',
              border: acceptedTerms ? 'none' : '2px solid #94A3B8',
              background: acceptedTerms ? '#10B981' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '1px'
            }}>
              {acceptedTerms && <Check size={16} color="white" strokeWidth={3} />}
            </div>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.92rem', display: 'block' }}>
                I agree and accept the service terms & requirements
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                I confirm that water tap access, electricity, and parking permissions will be made available.
              </span>
            </div>
          </div>

          {termsError && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.65rem 0.85rem', borderRadius: '8px', color: '#991B1B', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={16} /> {termsError}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '12px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              id="continue-to-addons-btn"
              type="button"
              onClick={handleNextFromStep3}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '12px', padding: '0.75rem 1.75rem' }}
            >
              Continue to Add-ons <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 4: ADD-ON SERVICES (SKIPPABLE)
      ======================================================== */}
      {currentStep === 4 && (
        <div className="card animate-fade-in" style={{ padding: '2rem 1.75rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.35rem',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', flex: 1, minWidth: 0 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Plus size={18} color="#16A34A" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.25 }}>
                  Add-on Services (Optional)
                </h3>
                <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.35 }}>
                  Pamper your vehicle with extra specialized care. You can skip anytime.
                </p>
              </div>
            </div>

            <button
              id="skip-addons-btn"
              type="button"
              onClick={handleNextFromStep4}
              style={{
                flexShrink: 0,
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                border: '1.5px solid #2563EB',
                padding: '0.5rem 0.95rem',
                borderRadius: '999px',
                color: '#1D4ED8',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 3px 10px rgba(37, 99, 235, 0.2)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>Skip Add-ons</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Addons Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', marginBottom: '1.75rem' }}>
            {availableAddons.map(addon => {
              const isSelected = selectedAddonIds.includes(addon.id);

              return (
                <div
                  key={addon.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedAddonIds(selectedAddonIds.filter(id => id !== addon.id));
                    } else {
                      setSelectedAddonIds([...selectedAddonIds, addon.id]);
                    }
                  }}
                  style={{
                    border: isSelected ? '2px solid #10B981' : '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '1rem',
                    background: isSelected ? '#F0FDF4' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: isSelected ? '#DCFCE7' : '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {renderAddonIcon(addon.icon, isSelected, 18)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.92rem' }}>
                        {addon.name}
                      </span>
                      <span style={{ fontWeight: 800, color: isSelected ? '#15803D' : 'var(--primary-navy)', fontSize: '0.92rem' }}>
                        +₹{addon.price}
                      </span>
                    </div>
                    {addon.description && (
                      <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {addon.description}
                      </p>
                    )}
                  </div>

                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    border: isSelected ? 'none' : '2px solid #CBD5E1',
                    background: isSelected ? '#10B981' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '12px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              onClick={handleNextFromStep4}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '12px', padding: '0.75rem 1.75rem' }}
            >
              {selectedAddonIds.length > 0 
                ? `Continue with ${selectedAddonIds.length} Add-on${selectedAddonIds.length > 1 ? 's' : ''}` 
                : 'Continue to Address'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 5: SERVICE ADDRESS
      ======================================================== */}
      {currentStep === 5 && (
        <div className="card animate-fade-in" style={{ padding: '2rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={20} color="var(--primary-blue)" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem', fontWeight: 700 }}>
                Service Doorstep Address
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Where should our mobile car wash technician arrive?
              </p>
            </div>
          </div>

          {/* Toggle: Saved Address vs New Address */}
          {savedAddresses.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: '#F8FAFC', padding: '0.4rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setAddressSource('saved')}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  fontWeight: addressSource === 'saved' ? 700 : 500,
                  fontSize: '0.9rem',
                  background: addressSource === 'saved' ? 'white' : 'transparent',
                  color: addressSource === 'saved' ? 'var(--primary-blue)' : 'var(--text-muted)',
                  boxShadow: addressSource === 'saved' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Use Saved Address ({savedAddresses.length})
              </button>
              <button
                type="button"
                onClick={() => setAddressSource('new')}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  fontWeight: addressSource === 'new' ? 700 : 500,
                  fontSize: '0.9rem',
                  background: addressSource === 'new' ? 'white' : 'transparent',
                  color: addressSource === 'new' ? 'var(--primary-blue)' : 'var(--text-muted)',
                  boxShadow: addressSource === 'new' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                + Enter New Address
              </button>
            </div>
          )}

          {/* Saved Address Selection */}
          {addressSource === 'saved' && savedAddresses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Choose from Your Saved Addresses</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                {savedAddresses.map(addr => {
                  const isSelected = selectedSavedAddressId === addr.id.toString();
                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedSavedAddressId(addr.id.toString());
                        setAddress(addr.address);
                        setLatitude(addr.latitude);
                        setLongitude(addr.longitude);
                        setSelectedServiceAreaId(addr.serviceAreaId.toString());
                      }}
                      style={{
                        padding: '1rem',
                        border: isSelected ? '2px solid var(--primary-blue)' : '1px solid #E2E8F0',
                        borderRadius: '12px',
                        background: isSelected ? '#F0F9FF' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                          📍 {addr.name}
                        </span>
                        {isSelected && <Check size={16} color="var(--primary-blue)" />}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {addr.address}
                      </p>
                      {addr.serviceArea && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--primary-blue)', background: '#EFF6FF', padding: '0.1rem 0.5rem', borderRadius: '4px', width: 'fit-content', marginTop: '0.2rem' }}>
                          Area: {addr.serviceArea.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* New Address Entry */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.5rem' }}>
              
              {/* Service Area Selector */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Service Area / Zone <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  className="form-input"
                  value={selectedServiceAreaId}
                  onChange={e => setSelectedServiceAreaId(e.target.value)}
                >
                  <option value="">-- Select Your Service Area --</option>
                  {serviceAreas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Address Input */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Complete Doorstep Address <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Apartment/Villa No., Street/Road, Landmark..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              {/* Map View */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Compass size={14} /> Pinpoint Exact Technician Spot (Drag Marker)
                </label>
                <div
                  ref={mapRef}
                  style={{
                    width: '100%',
                    height: '200px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    background: '#F1F5F9'
                  }}
                />
              </div>

              {/* Save Address Checkbox */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--primary-navy)', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={e => setSaveAddress(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-blue)' }}
                  />
                  <span>Save this address for future bookings</span>
                </label>

                {saveAddress && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Label (e.g. Home, Office, Villa)"
                    value={addressLabel}
                    onChange={e => setAddressLabel(e.target.value)}
                    style={{ width: '180px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  />
                )}
              </div>
            </div>
          )}

          {addressError && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.65rem 0.85rem', borderRadius: '8px', color: '#991B1B', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={16} /> {addressError}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '12px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              onClick={handleNextFromStep5}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '12px', padding: '0.75rem 1.75rem' }}
            >
              Review & Schedule Slot <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 6: SCHEDULE, COUPON & FINAL PAYMENT REVIEW
      ======================================================== */}
      {currentStep === 6 && (
        <form onSubmit={handleFinalBookingSubmit} className="animate-fade-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Schedule Slot Card */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Calendar size={18} color="var(--primary-blue)" />
                <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.1rem', fontWeight: 700 }}>
                  Select Service Date & Preferred Time Slot
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Booking Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="time-slot-select" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Service Arrival Window</span>
                    {loadingSlots && <span style={{ fontSize: '0.75rem', color: 'var(--primary-blue)' }}>Checking availability...</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="time-slot-select"
                      required
                      value={timeSlot}
                      onChange={e => setTimeSlot(e.target.value)}
                      className="form-input"
                      disabled={loadingSlots || availableSlotsList.length === 0}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: 'var(--primary-navy)',
                        background: (loadingSlots || availableSlotsList.length === 0) ? '#F1F5F9' : 'white',
                        cursor: (loadingSlots || availableSlotsList.length === 0) ? 'not-allowed' : 'pointer',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {loadingSlots ? (
                        <option value="" disabled>Loading approved arrival windows for this date...</option>
                      ) : availableSlotsList.length > 0 ? (
                        <>
                          <option value="" disabled>-- Select Service Arrival Window --</option>
                          {availableSlotsList.map(item => {
                            const isAvail = item.available;
                            let label = item.slot;
                            if (!isAvail) {
                              label = `${item.slot} — 🚫 ${item.reason || 'Unavailable'}`;
                            } else {
                              label = `${item.slot} — Available (Service Window)`;
                            }
                            return (
                              <option 
                                key={item.slot} 
                                value={item.slot} 
                                disabled={!isAvail}
                                style={{ 
                                  color: isAvail ? '#0F172A' : '#94A3B8',
                                  background: isAvail ? 'white' : '#F8FAFC',
                                  fontWeight: isAvail ? 600 : 400
                                }}
                              >
                                {label}
                              </option>
                            );
                          })}
                        </>
                      ) : (
                        <option value="" disabled>No service windows configured by admin for this date</option>
                      )}
                    </select>
                  </div>

                  {timeSlot && availableSlotsList.length > 0 && (
                    <div style={{ marginTop: '0.45rem', fontSize: '0.76rem', color: '#0369A1', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '0.45rem 0.65rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} color="#0284C7" style={{ flexShrink: 0 }} />
                      <span>Technician arrives & washes your vehicle between <strong>{timeSlot}</strong>.</span>
                    </div>
                  )}

                  {!loadingSlots && availableSlotsList.length === 0 && (
                    <div style={{ marginTop: '0.45rem', fontSize: '0.8rem', color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertCircle size={14} color="#DC2626" />
                      <span>No approved service windows available for this date. Please pick another date.</span>
                    </div>
                  )}

                  {slotNotice && (
                    <div style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Compass size={13} color="var(--primary-blue)" />
                      <span>{slotNotice}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Coupons & Loyalty Rewards Card */}
            <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669'
                  }}>
                    <Tag size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 700 }}>
                      Offers & Coupons
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Apply discounts and save on your wash
                    </p>
                  </div>
                </div>

                {eligibleCoupons.length > 0 && (
                  <span style={{
                    background: '#EFF6FF',
                    color: '#1D4ED8',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {eligibleCoupons.length} Offers
                  </span>
                )}
              </div>

              {/* Promo Code Input Bar */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
                  Apply Promo Code
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. WC50, SAVE99, FESTIVE20"
                      value={manualCouponInput}
                      onChange={e => {
                        setManualCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ''));
                        if (couponError) setCouponError('');
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      style={{
                        margin: 0,
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        paddingRight: manualCouponInput ? '2rem' : '0.85rem'
                      }}
                    />
                    {manualCouponInput && (
                      <button
                        type="button"
                        onClick={() => setManualCouponInput('')}
                        style={{
                          position: 'absolute',
                          right: '0.6rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          padding: '0.2rem'
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="btn btn-primary"
                    style={{
                      padding: '0 1.25rem',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <div style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.82rem',
                    color: '#DC2626'
                  }}>
                    <AlertCircle size={14} />
                    <span>{couponError}</span>
                  </div>
                )}
              </div>

              {/* Active Applied Coupon Banner */}
              {activeCoupon && (
                <div style={{
                  marginBottom: '1.25rem',
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                  border: '1.5px solid #86EFAC',
                  borderRadius: '12px',
                  padding: '1rem',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#16A34A',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '0.1rem'
                      }}>
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: '#14532D', fontSize: '0.98rem' }}>
                            {activeCoupon.code}
                          </span>
                          <span style={{
                            background: '#16A34A',
                            color: '#FFF',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '10px'
                          }}>
                            APPLIED
                          </span>
                        </div>
                        <div style={{ color: '#166534', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.2rem' }}>
                          🎉 You save ₹{couponDiscount.toFixed(2)} with this offer!
                        </div>
                        {activeCoupon.description && (
                          <div style={{ color: '#15803D', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                            {activeCoupon.description}
                          </div>
                        )}
                        {freeAddonBonus && (
                          <div style={{ marginTop: '0.35rem', fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem', width: 'fit-content' }}>
                            🎁 Free Add-on Perk: {freeAddonBonus} is 100% Free!
                          </div>
                        )}
                        {discountedAddonBonus && (
                          <div style={{ marginTop: '0.35rem', fontWeight: 700, color: '#1E40AF', background: '#EFF6FF', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem', width: 'fit-content' }}>
                            ✨ Add-on Perk: Special discount applied on {discountedAddonBonus}!
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        color: '#DC2626',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Eligible Coupons List */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    Available Offers for Your Car Wash
                  </span>
                  {eligibleCoupons.length > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Tap Apply to redeem
                    </span>
                  )}
                </div>

                {loadingCoupons ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    Loading available offers...
                  </div>
                ) : eligibleCoupons.length === 0 ? (
                  <div style={{
                    padding: '1rem',
                    textAlign: 'center',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px dashed #CBD5E1',
                    color: '#64748B',
                    fontSize: '0.82rem'
                  }}>
                    No special coupons available for the chosen package right now.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {eligibleCoupons.map(coupon => {
                      const isApplied = selectedCouponCode === coupon.code;
                      const discountTag = coupon.discountType === 'FLAT'
                        ? `₹${coupon.discountAmount} FLAT OFF`
                        : `${coupon.discountPct}% OFF${coupon.limitOption === 'UP_TO' && coupon.maxDiscountAmount ? ` (UP TO ₹${coupon.maxDiscountAmount})` : ''}`;

                      return (
                        <div
                          key={coupon.id || coupon.code}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.85rem 1rem',
                            borderRadius: '12px',
                            border: isApplied ? '2px solid #16A34A' : '1px solid #E2E8F0',
                            background: isApplied ? '#F0FDF4' : '#FFFFFF',
                            boxShadow: isApplied ? '0 2px 6px rgba(22, 163, 74, 0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s ease',
                            gap: '0.75rem'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                              <span style={{
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                color: isApplied ? '#166534' : 'var(--primary-blue)',
                                background: isApplied ? '#DCFCE7' : '#EFF6FF',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                border: isApplied ? '1px dashed #16A34A' : '1px dashed #3B82F6',
                                letterSpacing: '0.04em'
                              }}>
                                {coupon.code}
                              </span>
                              <span style={{
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                color: '#047857',
                                background: '#D1FAE5',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px'
                              }}>
                                {discountTag}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1E293B' }}>
                              {coupon.title}
                            </div>
                            {coupon.description && (
                              <div style={{
                                fontSize: '0.76rem',
                                color: '#64748B',
                                marginTop: '0.15rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {coupon.description}
                              </div>
                            )}
                          </div>

                          <div style={{ flexShrink: 0 }}>
                            {isApplied ? (
                              <button
                                type="button"
                                onClick={handleRemoveCoupon}
                                className="btn"
                                style={{
                                  background: '#DCFCE7',
                                  color: '#166534',
                                  border: '1px solid #86EFAC',
                                  padding: '0.45rem 0.85rem',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  borderRadius: '8px',
                                  cursor: 'pointer'
                                }}
                              >
                                Applied ✓
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleApplyCoupon(coupon.code)}
                                className="btn btn-outline"
                                style={{
                                  padding: '0.45rem 1rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  borderRadius: '8px',
                                  borderColor: 'var(--primary-blue)',
                                  color: 'var(--primary-blue)'
                                }}
                              >
                                APPLY
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Loyalty Points Redemption */}
              {userPoints > 0 && systemSettings?.pointsRedemption && (
                <div style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Gift size={16} /> Redeem Your Reward Points
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#B45309' }}>
                      You have <strong>{userPoints} points</strong> (Worth ₹{(userPoints / ratio).toFixed(2)})
                    </span>
                  </div>

                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={redeemPoints}
                      onChange={e => setRedeemPoints(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      inset: 0,
                      backgroundColor: redeemPoints ? '#D97706' : '#CBD5E1',
                      transition: '0.3s',
                      borderRadius: '34px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '0.3s',
                        borderRadius: '50%',
                        transform: redeemPoints ? 'translateX(22px)' : 'none'
                      }} />
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Comprehensive Order Review & Payment Card */}
            <div className="card" style={{ padding: '1.75rem', background: '#FAFBFD' }}>
              <h3 style={{ margin: '0 0 1rem', color: 'var(--primary-navy)', fontSize: '1.15rem', fontWeight: 800 }}>
                Booking Summary & Breakdown
              </h3>

              {/* Vehicle & Plan Info */}
              <div style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Vehicle</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                    {carSource === 'saved' 
                      ? `${savedCars.find(c => c.id.toString() === selectedSavedCarId)?.make} ${savedCars.find(c => c.id.toString() === selectedSavedCarId)?.model}`
                      : `${selectedBrand === '__OTHER__' ? customBrand : selectedBrand} ${selectedModel === '__OTHER__' ? customModel : selectedModel}`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {carNumber}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Wash Package</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                    {selectedWashTypeObj?.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {date} • Window: <strong>{timeSlot}</strong>
                  </div>
                </div>
              </div>

              {/* Price Calculation Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Base Wash Package ({selectedCarTypeObj?.name})</span>
                  <span>₹{baseWashPrice}</span>
                </div>

                {selectedAddonsList.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534' }}>
                    <span>Add-on Services ({selectedAddonsList.length})</span>
                    <span>+₹{addonsTotal}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                    <span>Coupon Discount ({selectedCouponCode})</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 600 }}>
                    <span>Loyalty Points Redeemed ({pointsToRedeem} pts)</span>
                    <span>-₹{pointsDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div style={{
                  borderTop: '2px dashed #CBD5E1',
                  marginTop: '0.5rem',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                      Total Final Payable
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Inclusive of all taxes & doorstep service fees
                    </span>
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284C7' }}>
                    ₹{finalPayable}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="btn btn-outline"
                  style={{ borderRadius: '12px', padding: '0.75rem 1.25rem' }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    borderRadius: '12px',
                    padding: '0.85rem',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)',
                    boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4)'
                  }}
                >
                  {loading ? 'Processing Booking...' : `Pay & Confirm Booking (₹${finalPayable})`}
                </button>
              </div>
            </div>

          </div>
        </form>
      )}

    </div>
  );
};

export default BookSlot;
