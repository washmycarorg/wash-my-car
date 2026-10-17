import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MapPin, Car as CarIcon, CreditCard, CheckCircle, 
  Search, Compass, AlertCircle, Tag, Sparkles, Plus, Check,
  Shield, Bike, Droplets, Feather, Flame, Info, ArrowRight,
  ArrowLeft, ArrowDown, X, Gift, CheckSquare, Square, ChevronRight, ChevronLeft, ChevronDown, HelpCircle,
  Clock, Users, Navigation, CalendarX, Crown, RefreshCw, ShieldCheck
} from 'lucide-react';
import { 
  createBooking,
  verifyBookingPayment,
  cancelPendingPayment,
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
  getAvailableSlots,
  getMySubscriptions,
  resolveMapsUrl
} from '../api';
import SearchableDropdown from '../components/SearchableDropdown';
import { INDIAN_CAR_BRANDS } from '../data/indianCars';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const isValidCoord = (lat, lng) => {
  return typeof lat === 'number' && typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180;
};

// Robust helper to extract coordinates from direct lat/lng, DMS, or Google Maps URLs
const extractCoordinatesFromInput = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const text = raw.trim();

  // 1. Check for standard @lat,lng in Google Maps URLs
  const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidCoord(lat, lng)) return { lat, lng, source: 'maps_url_at' };
  }

  // 2. Check for !3dlat!4dlng in Google Maps URLs
  const dMatch = text.match(/!3d(-?\d+\.\d+).*?!4d(-?\d+\.\d+)/);
  if (dMatch) {
    const lat = parseFloat(dMatch[1]);
    const lng = parseFloat(dMatch[2]);
    if (isValidCoord(lat, lng)) return { lat, lng, source: 'maps_url_proto' };
  }

  // 3. Check for query parameters (?q=lat,lng or ?query=lat,lng or &ll=lat,lng or destination=lat,lng)
  const qParamMatch = text.match(/[?&](?:q|query|ll|destination|daddr|origin|center)=loc:?(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/i) ||
                      text.match(/[?&](?:q|query|ll|destination|daddr|origin|center)=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/i);
  if (qParamMatch) {
    const lat = parseFloat(qParamMatch[1]);
    const lng = parseFloat(qParamMatch[2]);
    if (isValidCoord(lat, lng)) return { lat, lng, source: 'maps_url_query' };
  }

  // 4. Check for /search/lat,lng or /place/lat,lng in Google Maps URLs
  const pathCoordMatch = text.match(/\/(?:search|place)\/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/i);
  if (pathCoordMatch) {
    const lat = parseFloat(pathCoordMatch[1]);
    const lng = parseFloat(pathCoordMatch[2]);
    if (isValidCoord(lat, lng)) return { lat, lng, source: 'maps_url_path' };
  }

  // 5. DMS (Degrees, Minutes, Seconds) format: e.g. 17°44'19.0"N 83°19'05.5"E
  const dmsRegex = /([0-9]{1,3})[°\s]+([0-9]{1,2})['′\s]+([0-9]{1,2}(?:\.[0-9]+)?)[″"]?\s*([NSEWnsew])[,\s]+([0-9]{1,3})[°\s]+([0-9]{1,2})['′\s]+([0-9]{1,2}(?:\.[0-9]+)?)[″"]?\s*([NSEWnsew])/i;
  const dmsMatch = text.match(dmsRegex);
  if (dmsMatch) {
    const latDeg = parseFloat(dmsMatch[1]);
    const latMin = parseFloat(dmsMatch[2]);
    const latSec = parseFloat(dmsMatch[3]);
    const latDir = dmsMatch[4].toUpperCase();

    const lngDeg = parseFloat(dmsMatch[5]);
    const lngMin = parseFloat(dmsMatch[6]);
    const lngSec = parseFloat(dmsMatch[7]);
    const lngDir = dmsMatch[8].toUpperCase();

    let lat = latDeg + (latMin / 60) + (latSec / 3600);
    if (latDir === 'S') lat = -lat;

    let lng = lngDeg + (lngMin / 60) + (lngSec / 3600);
    if (lngDir === 'W') lng = -lng;

    if (isValidCoord(lat, lng)) return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6, source: 'dms' };
  }

  // 6. Direct numeric coordinates: e.g. '17.7386, 83.3182' or '17.7386 83.3182' or '17.7386N, 83.3182E'
  const directCoordMatch = text.match(/(?:(?:lat|latitude)\s*[:=]\s*)?(-?\d{1,2}\.\d+)\s*([NSEWnsew])?\s*(?:[°\s,]+)\s*(?:(?:lng|lon|longitude)\s*[:=]\s*)?(-?\d{1,3}\.\d+)\s*([NSEWnsew])?/i);
  if (directCoordMatch) {
    let lat = parseFloat(directCoordMatch[1]);
    const latDir = (directCoordMatch[2] || '').toUpperCase();
    if (latDir === 'S') lat = -lat;

    let lng = parseFloat(directCoordMatch[3]);
    const lngDir = (directCoordMatch[4] || '').toUpperCase();
    if (lngDir === 'W') lng = -lng;

    if (isValidCoord(lat, lng)) {
      return { lat, lng, source: 'direct_numeric' };
    }
  }

  return null;
};

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

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateUpcomingDays = (count = 14) => {
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = d.getDate();
    
    let label = dayOfWeek;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';

    days.push({
      dateStr,
      label,
      dayOfWeek,
      dayNum,
      monthName,
      isToday: i === 0,
      isTomorrow: i === 1
    });
  }
  return days;
};

const formatSelectedDate = (dateString) => {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch (e) {
    return dateString;
  }
  return dateString;
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
  const autocompleteInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const activeZoneCircleRef = useRef(null);
  const termsCheckboxRef = useRef(null);
  const datePickerInputRef = useRef(null);
  const calendarDropdownRef = useRef(null);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [locating, setLocating] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [matchedZoneInfo, setMatchedZoneInfo] = useState(null);

  // Close custom calendar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarDropdownRef.current && !calendarDropdownRef.current.contains(event.target)) {
        setShowCustomCalendar(false);
      }
    };
    if (showCustomCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showCustomCalendar]);

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
  const [userProfile, setUserProfile] = useState(null);

  // Plan Prices Map: { [washTypeId]: price }
  const [planPrices, setPlanPrices] = useState({});
  const [actualPrices, setActualPrices] = useState({});
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
  const [autoAddedCouponAddonIds, setAutoAddedCouponAddonIds] = useState([]);
  const [addonOfferNotice, setAddonOfferNotice] = useState('');

  // STEP 5: Address States
  const [addressSource, setAddressSource] = useState('saved'); // 'saved' or 'new'
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState('');
  const [selectedServiceAreaId, setSelectedServiceAreaId] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(17.7386);
  const [longitude, setLongitude] = useState(83.3182);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [saveAddress, setSaveAddress] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [addressError, setAddressError] = useState('');

  // STEP 6: Slot, Coupon & Review
  const [date, setDate] = useState(() => getTodayDateString());
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [availableSlotsList, setAvailableSlotsList] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [dispatchCapacity, setDispatchCapacity] = useState(1);
  const [slotNotice, setSlotNotice] = useState('');
  const [selectedCouponCode, setSelectedCouponCode] = useState('');
  const [manualCouponInput, setManualCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [infoModalCoupon, setInfoModalCoupon] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [userSubscriptions, setUserSubscriptions] = useState([]);

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
      getProfile().catch(() => null),
      getMySubscriptions().catch(() => ({ activeSubscriptions: [], activeSubscription: null }))
    ]).then(([carsT, washT, areas, cars, addrs, addonsList, settingsRes, profileRes, subRes]) => {
      setCarTypes(carsT);
      setWashTypes(washT);
      setServiceAreas(areas);
      setSavedCars(cars);
      setSavedAddresses(addrs);
      setAvailableAddons(addonsList || []);
      setSystemSettings(settingsRes);

      if (profileRes) {
        setUserProfile(profileRes);
        setUserPoints(profileRes.points || 0);
      }

      if (subRes) {
        const subs = subRes.activeSubscriptions || (subRes.activeSubscription ? [subRes.activeSubscription] : []);
        setUserSubscriptions(subs);
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
  const refreshSlots = (targetDate = date, targetAreaId = selectedServiceAreaId, targetAddress = address) => {
    if (!targetDate) return Promise.resolve();
    setLoadingSlots(true);
    return getAvailableSlots(targetDate, targetAreaId, targetAddress)
      .then(res => {
        if (res && Array.isArray(res.slots)) {
          setAvailableSlotsList(res.slots);
          if (res.activeWorkers !== undefined) {
            setDispatchCapacity(Number(res.activeWorkers) || 1);
          }
          if (res.targetZone) {
            setSlotNotice(`Assigned Service Hub: ${res.targetZone}`);
          }
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
  };

  useEffect(() => {
    refreshSlots();
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
            .then(res => ({
              id: wt.id, 
              price: Number(res.price) || 0,
              actualPrice: Number(res.actualPrice) || Number(res.price) || 0
            }))
            .catch(() => ({ id: wt.id, price: 0, actualPrice: 0 }))
        )
      ).then(results => {
        const priceMap = {};
        const actualMap = {};
        results.forEach(r => { 
          priceMap[r.id] = r.price; 
          actualMap[r.id] = r.actualPrice;
        });
        setPlanPrices(priceMap);
        setActualPrices(actualMap);
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
            // If current coupon is no longer eligible, clean up any auto-added addons
            if (autoAddedCouponAddonIds.length > 0) {
              setSelectedAddonIds(prev => prev.filter(id => !autoAddedCouponAddonIds.includes(id)));
              setAutoAddedCouponAddonIds([]);
            }
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

  // Active User Subscription for Selected Vehicle (Strict vehicle binding verification)
  const now = new Date();
  const normCarNum = (n) => (n || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const currentSelectedCar = carSource === 'saved' ? savedCars.find(c => c.id.toString() === selectedSavedCarId) : null;
  const currentBookingCarNumberNorm = normCarNum(carSource === 'saved' ? (currentSelectedCar?.carNumber || carNumber) : carNumber);
  const currentBookingCarId = carSource === 'saved' && selectedSavedCarId ? Number(selectedSavedCarId) : null;

  const activeSubscription = userSubscriptions.find(sub => {
    if (sub.status !== 'ACTIVE' || Number(sub.washesRemaining) <= 0 || new Date(sub.endDate) <= now) return false;
    if (Number(sub.carTypeId) !== Number(selectedCarTypeId)) return false;

    // Check strict vehicle binding:
    if (currentBookingCarId && sub.carId && Number(sub.carId) === currentBookingCarId) return true;
    if (sub.carNumber && currentBookingCarNumberNorm && normCarNum(sub.carNumber) === currentBookingCarNumberNorm) return true;
    if (sub.car?.carNumber && currentBookingCarNumberNorm && normCarNum(sub.car.carNumber) === currentBookingCarNumberNorm) return true;
    return false;
  }) || null;

  let subWashesList = [];
  try {
    subWashesList = typeof activeSubscription?.washesBreakdown === 'string'
      ? JSON.parse(activeSubscription.washesBreakdown)
      : (activeSubscription?.washesBreakdown || []);
  } catch (e) {
    subWashesList = [];
  }

  let subAddonsList = [];
  try {
    subAddonsList = typeof activeSubscription?.addonsBreakdown === 'string'
      ? JSON.parse(activeSubscription.addonsBreakdown)
      : (activeSubscription?.addonsBreakdown || []);
  } catch (e) {
    subAddonsList = [];
  }

  // Helper: check if a specific washTypeId is covered by the active subscription pass
  const getSubWashCoverage = (washTypeId) => {
    if (!activeSubscription) return null;
    if (subWashesList && subWashesList.length > 0) {
      const match = subWashesList.find(w => (Number(w.washTypeId) === Number(washTypeId) || w.washTypeId === null) && Number(w.remaining) > 0);
      if (match) return { isCovered: true, remaining: Number(match.remaining), planName: activeSubscription.plan?.name || 'VIP Pass' };
    } else if (Number(activeSubscription.washesRemaining) > 0) {
      return { isCovered: true, remaining: Number(activeSubscription.washesRemaining), planName: activeSubscription.plan?.name || 'VIP Pass' };
    }
    return null;
  };

  // Helper: check if a specific addonId is covered as complimentary free by active subscription
  const getSubAddonCoverage = (addonId) => {
    if (!activeSubscription) return null;
    if (subAddonsList && subAddonsList.length > 0) {
      const match = subAddonsList.find(a => (Number(a.addonId) === Number(addonId) || a.addonId === null) && Number(a.remaining) > 0);
      if (match) return { isFree: true, remaining: Number(match.remaining), planName: activeSubscription.plan?.name || 'VIP Pass' };
    } else if (Number(activeSubscription.freeAddonsRemaining) > 0) {
      return { isFree: true, remaining: Number(activeSubscription.freeAddonsRemaining), planName: activeSubscription.plan?.name || 'VIP Pass' };
    }
    return null;
  };

  // VIP Wash Coverage check
  const currentWashVipCoverage = getSubWashCoverage(selectedWashTypeId);
  const isWashCoveredBySub = Boolean(currentWashVipCoverage?.isCovered);

  const handleApplyCoupon = (codeToApply) => {
    setCouponError('');
    if (isWashCoveredBySub) {
      setCouponError('This wash is 100% covered by your active VIP subscription. Coupons cannot be applied.');
      return;
    }
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

      // Auto-add Free or Discounted Add-on to cart if coupon includes one
      const newlyAutoAdded = [];
      const addonsToEnsure = [];

      if (found.freeAddonId) {
        addonsToEnsure.push(Number(found.freeAddonId));
      }
      if (found.discountAddonId) {
        addonsToEnsure.push(Number(found.discountAddonId));
      }

      if (addonsToEnsure.length > 0) {
        setSelectedAddonIds(prev => {
          const updated = [...prev];
          addonsToEnsure.forEach(addonId => {
            if (!updated.includes(addonId)) {
              updated.push(addonId);
              newlyAutoAdded.push(addonId);
            }
          });
          return updated;
        });

        if (newlyAutoAdded.length > 0) {
          setAutoAddedCouponAddonIds(prev => {
            const combined = [...prev];
            newlyAutoAdded.forEach(id => {
              if (!combined.includes(id)) combined.push(id);
            });
            return combined;
          });
        }
      }
    } else {
      setCouponError(`Coupon "${code}" is invalid or not eligible for this wash package.`);
    }
  };

  const handleRemoveCoupon = () => {
    // If any add-on was auto-added by this coupon, remove it from cart
    if (autoAddedCouponAddonIds.length > 0) {
      setSelectedAddonIds(prev => prev.filter(id => !autoAddedCouponAddonIds.includes(id)));
      setAutoAddedCouponAddonIds([]);
    }
    setSelectedCouponCode('');
    setManualCouponInput('');
    setCouponError('');
    setAddonOfferNotice('');
  };

  // If the booking becomes covered by active subscription, immediately remove any coupons or coupon-add-ons
  useEffect(() => {
    if (isWashCoveredBySub && (selectedCouponCode || autoAddedCouponAddonIds.length > 0)) {
      handleRemoveCoupon();
    }
  }, [isWashCoveredBySub]);

  // Add-on selection toggle: checks for matching free/discounted coupon offers
  const handleToggleAddon = (addon) => {
    const isSelected = selectedAddonIds.includes(addon.id);

    if (isSelected) {
      setSelectedAddonIds(prev => prev.filter(id => id !== addon.id));
      setAutoAddedCouponAddonIds(prev => prev.filter(id => id !== addon.id));
    } else {
      // Check if any eligible coupon provides this addon for FREE or DISCOUNTED (only if NOT covered by subscription)
      const matchingCoupon = !isWashCoveredBySub ? eligibleCoupons.find(c => 
        Number(c.freeAddonId) === Number(addon.id) || Number(c.discountAddonId) === Number(addon.id)
      ) : null;

      // If matching coupon exists and no coupon is active (or current coupon has no addon perk), auto-apply it!
      if (matchingCoupon && (!selectedCouponCode || (selectedCouponCode !== matchingCoupon.code && (!activeCoupon?.freeAddonId && !activeCoupon?.discountAddonId)))) {
        setSelectedCouponCode(matchingCoupon.code);
        setCouponError('');

        const updatedAddons = selectedAddonIds.includes(addon.id)
          ? [...selectedAddonIds]
          : [...selectedAddonIds, addon.id];

        const newlyAutoAdded = [];
        if (matchingCoupon.freeAddonId && Number(matchingCoupon.freeAddonId) !== Number(addon.id) && !updatedAddons.includes(Number(matchingCoupon.freeAddonId))) {
          updatedAddons.push(Number(matchingCoupon.freeAddonId));
          newlyAutoAdded.push(Number(matchingCoupon.freeAddonId));
        }
        if (matchingCoupon.discountAddonId && Number(matchingCoupon.discountAddonId) !== Number(addon.id) && !updatedAddons.includes(Number(matchingCoupon.discountAddonId))) {
          updatedAddons.push(Number(matchingCoupon.discountAddonId));
          newlyAutoAdded.push(Number(matchingCoupon.discountAddonId));
        }

        setSelectedAddonIds(updatedAddons);
        if (newlyAutoAdded.length > 0) {
          setAutoAddedCouponAddonIds(prev => {
            const combined = [...prev];
            newlyAutoAdded.forEach(id => {
              if (!combined.includes(id)) combined.push(id);
            });
            return combined;
          });
        }

        const isFree = Number(matchingCoupon.freeAddonId) === Number(addon.id) || matchingCoupon.addonDiscountType === 'FREE';
        const msg = isFree
          ? `🎉 Offer applied! Coupon "${matchingCoupon.code}" activated — "${addon.name}" is now ₹0 FREE!`
          : `🎉 Offer applied! Coupon "${matchingCoupon.code}" activated — special discount applied on "${addon.name}"!`;
        setAddonOfferNotice(msg);
      } else {
        setSelectedAddonIds(prev => [...prev, addon.id]);
      }
    }
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

  // Visual Map Circle for Active Service Area Coverage Radius
  const updateZoneCircle = (centerLat, centerLng, radiusMeters) => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    if (activeZoneCircleRef.current) {
      activeZoneCircleRef.current.setMap(null);
      activeZoneCircleRef.current = null;
    }
    if (centerLat && centerLng && radiusMeters) {
      const circle = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center: { lat: Number(centerLat), lng: Number(centerLng) },
        radius: Number(radiusMeters),
        fillColor: '#0284C7',
        fillOpacity: 0.12,
        strokeColor: '#0284C7',
        strokeOpacity: 0.65,
        strokeWeight: 1.5,
        clickable: false
      });
      activeZoneCircleRef.current = circle;
    }
  };

  // Auto-Match Service Area / Zone based on Pin (lat, lng) and Configured Radius
  const autoMatchServiceArea = (pinLat, pinLng) => {
    if (!serviceAreas || serviceAreas.length === 0 || !pinLat || !pinLng) return null;

    const toRad = deg => (deg * Math.PI) / 180;
    const calcDistMeters = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3; // Earth radius in meters
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const zoneCoordsFallback = {
      'maddilapalem': { lat: 17.7389, lng: 83.3184, radius: 5000 },
      'madhurawada': { lat: 17.8180, lng: 83.3512, radius: 5000 },
      'nad junction': { lat: 17.7428, lng: 83.2353, radius: 5000 },
      'old gajuwaka': { lat: 17.6863, lng: 83.2041, radius: 5000 },
      'gajuwaka': { lat: 17.6863, lng: 83.2041, radius: 5000 },
      'pendurthi': { lat: 17.8286, lng: 83.1973, radius: 5000 },
    };

    let bestWithinArea = null;
    let minWithinDist = Infinity;
    let closestAreaOverall = null;
    let minOverallDist = Infinity;

    for (const area of serviceAreas) {
      const nameKey = (area.name || '').toLowerCase().trim();
      const fallback = zoneCoordsFallback[nameKey] || {};

      const areaLat = area.latitude || fallback.lat;
      const areaLng = area.longitude || fallback.lng;
      const radiusMeters = Number(area.radius) || Number(fallback.radius) || 5000;

      if (areaLat && areaLng) {
        const dist = calcDistMeters(Number(pinLat), Number(pinLng), Number(areaLat), Number(areaLng));

        if (dist <= radiusMeters) {
          if (dist < minWithinDist) {
            minWithinDist = dist;
            bestWithinArea = { area, dist, radius: radiusMeters, isWithin: true, centerLat: areaLat, centerLng: areaLng };
          }
        }

        if (dist < minOverallDist) {
          minOverallDist = dist;
          closestAreaOverall = { area, dist, radius: radiusMeters, isWithin: false, centerLat: areaLat, centerLng: areaLng };
        }
      }
    }

    const matched = bestWithinArea || closestAreaOverall;
    if (matched && matched.area) {
      setSelectedServiceAreaId(matched.area.id.toString());
      setMatchedZoneInfo({
        name: matched.area.name,
        distanceKm: (matched.dist / 1000).toFixed(1),
        radiusKm: (matched.radius / 1000).toFixed(1),
        isWithin: matched.isWithin
      });
      updateZoneCircle(matched.centerLat, matched.centerLng, matched.radius);
      return matched;
    }
    return null;
  };

  // Reverse Geocode Helper: populates address text from lat/lng
  const reverseGeocode = (lat, lng) => {
    if (!window.google || !window.google.maps || !window.google.maps.Geocoder) return;
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const fullAddr = results[0].formatted_address;
          setAddress(fullAddr);
          if (autocompleteInputRef.current) {
            autocompleteInputRef.current.value = fullAddr;
          }
        }
      });
    } catch (err) {
      console.warn('Geocoding error:', err);
    }
  };

  // GPS "Use Current Location" Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const curLat = pos.coords.latitude;
        const curLng = pos.coords.longitude;
        setLatitude(curLat);
        setLongitude(curLng);
        if (mapInstanceRef.current && markerInstanceRef.current && window.google?.maps) {
          const latLng = new window.google.maps.LatLng(curLat, curLng);
          mapInstanceRef.current.panTo(latLng);
          mapInstanceRef.current.setZoom(16);
          markerInstanceRef.current.setPosition(latLng);
        }
        autoMatchServiceArea(curLat, curLng);
        reverseGeocode(curLat, curLng);
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error:', err);
        alert('Could not detect your current location. Please check browser location permissions or click directly on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Centralized coordinate application: pans map, updates pin, reverse-geocodes & auto-matches service area
  const applyCoordinates = (newLat, newLng, customAddressLabel) => {
    setLatitude(newLat);
    setLongitude(newLng);

    if (mapInstanceRef.current && window.google?.maps) {
      const latLng = new window.google.maps.LatLng(newLat, newLng);
      mapInstanceRef.current.panTo(latLng);
      mapInstanceRef.current.setZoom(16);
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setPosition(latLng);
      }
    }

    autoMatchServiceArea(newLat, newLng);

    if (customAddressLabel) {
      setAddress(customAddressLabel);
      if (autocompleteInputRef.current) {
        autocompleteInputRef.current.value = customAddressLabel;
      }
    } else {
      reverseGeocode(newLat, newLng);
    }
  };

  // Geocode an address/place search query, accept Google Maps links and coordinates, and update pin, map & zone
  const handleSearchLocation = async (overrideQuery) => {
    const rawQuery = typeof overrideQuery === 'string' ? overrideQuery : (autocompleteInputRef.current ? autocompleteInputRef.current.value : '');
    const query = (rawQuery || '').trim();
    if (!query) return;

    // 1. Direct coordinate extraction (decimal coordinates, DMS, or standard Google Maps URL)
    const localCoords = extractCoordinatesFromInput(query);
    if (localCoords) {
      applyCoordinates(localCoords.lat, localCoords.lng);
      return;
    }

    // 2. Short link or external share link resolution (maps.app.goo.gl, goo.gl/maps, etc.)
    if (query.startsWith('http://') || query.startsWith('https://') || query.includes('goo.gl') || query.includes('maps.app') || query.includes('google.com/maps')) {
      setSearchingLocation(true);
      try {
        const resolved = await resolveMapsUrl(query);
        if (resolved && resolved.lat && resolved.lng) {
          applyCoordinates(resolved.lat, resolved.lng);
          setSearchingLocation(false);
          return;
        }
      } catch (err) {
        console.warn('Backend URL resolution failed:', err);
      } finally {
        setSearchingLocation(false);
      }
    }

    // 3. Fallback: Geocode text address / landmark / place with Google Maps Geocoder
    if (!window.google?.maps?.Geocoder) return;
    setSearchingLocation(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: query, componentRestrictions: { country: 'in' } }, (results, status) => {
        setSearchingLocation(false);
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          const sLat = loc.lat();
          const sLng = loc.lng();
          const fullAddr = results[0].formatted_address || query;
          applyCoordinates(sLat, sLng, fullAddr);
        } else {
          alert('Could not locate that address, link, or coordinates. Please check the spelling or format.');
        }
      });
    } catch (err) {
      setSearchingLocation(false);
      console.warn('Geocoding search error:', err);
    }
  };

  // Service Area / Zone selection with map fly-to and coordinate sync
  const handleServiceAreaSelect = (areaId) => {
    setSelectedServiceAreaId(areaId ? areaId.toString() : '');
    const matched = serviceAreas.find(a => a.id.toString() === String(areaId));
    if (!matched) return;

    // Immediately update search bar placeholder/value to reflect selected zone
    if (autocompleteInputRef.current) {
      autocompleteInputRef.current.value = `${matched.name}, Visakhapatnam`;
    }

    // Approximate center coordinates for Visakhapatnam operational zones
    const zoneCoordsFallback = {
      'maddilapalem': { lat: 17.7389, lng: 83.3184, radius: 5000 },
      'madhurawada': { lat: 17.8180, lng: 83.3512, radius: 5000 },
      'nad junction': { lat: 17.7428, lng: 83.2353, radius: 5000 },
      'old gajuwaka': { lat: 17.6863, lng: 83.2041, radius: 5000 },
      'gajuwaka': { lat: 17.6863, lng: 83.2041, radius: 5000 },
      'pendurthi': { lat: 17.8286, lng: 83.1973, radius: 5000 },
    };

    const areaNameLower = matched.name.toLowerCase().trim();
    let targetLat = matched.latitude;
    let targetLng = matched.longitude;
    let targetRadius = matched.radius;

    if (!targetLat || !targetLng) {
      if (zoneCoordsFallback[areaNameLower]) {
        targetLat = zoneCoordsFallback[areaNameLower].lat;
        targetLng = zoneCoordsFallback[areaNameLower].lng;
        targetRadius = zoneCoordsFallback[areaNameLower].radius;
      }
    }

    if (targetLat && targetLng) {
      setLatitude(targetLat);
      setLongitude(targetLng);
      if (mapInstanceRef.current && markerInstanceRef.current && window.google?.maps) {
        const pos = new window.google.maps.LatLng(targetLat, targetLng);
        mapInstanceRef.current.panTo(pos);
        mapInstanceRef.current.setZoom(15);
        markerInstanceRef.current.setPosition(pos);
      }
      updateZoneCircle(targetLat, targetLng, targetRadius || 5000);
      setMatchedZoneInfo({
        name: matched.name,
        distanceKm: '0.0',
        radiusKm: ((targetRadius || 5000) / 1000).toFixed(1),
        isWithin: true
      });
      reverseGeocode(targetLat, targetLng);
    } else if (window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: `${matched.name}, Visakhapatnam, Andhra Pradesh, India` }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          setLatitude(lat);
          setLongitude(lng);
          if (mapInstanceRef.current && markerInstanceRef.current) {
            mapInstanceRef.current.panTo(loc);
            mapInstanceRef.current.setZoom(15);
            markerInstanceRef.current.setPosition(loc);
          }
          updateZoneCircle(lat, lng, 5000);
          setMatchedZoneInfo({
            name: matched.name,
            distanceKm: '0.0',
            radiusKm: '5.0',
            isWithin: true
          });
          reverseGeocode(lat, lng);
        }
      });
    }
  };

  const initMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) return;
    const pos = { lat: Number(latitude) || 17.7386, lng: Number(longitude) || 83.3182 };
    const newMap = new window.google.maps.Map(mapRef.current, {
      center: pos,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      gestureHandling: 'greedy', // Enables single-finger touch dragging/panning on mobile!
    });
    const newMarker = new window.google.maps.Marker({
      position: pos,
      map: newMap,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      title: 'Technician Wash Spot'
    });

    mapInstanceRef.current = newMap;
    markerInstanceRef.current = newMarker;
    setMap(newMap);
    setMarker(newMarker);

    // 1. Click anywhere on map to pin spot, auto-detect zone & auto-fill address
    newMap.addListener('click', (e) => {
      const clickLat = e.latLng.lat();
      const clickLng = e.latLng.lng();
      newMarker.setPosition(e.latLng);
      setLatitude(clickLat);
      setLongitude(clickLng);
      autoMatchServiceArea(clickLat, clickLng);
      reverseGeocode(clickLat, clickLng);
    });

    // 2. Drag marker to pin exact spot, auto-detect zone & auto-fill address
    newMarker.addListener('dragend', () => {
      const newPos = newMarker.getPosition();
      const dragLat = newPos.lat();
      const dragLng = newPos.lng();
      setLatitude(dragLat);
      setLongitude(dragLng);
      autoMatchServiceArea(dragLat, dragLng);
      reverseGeocode(dragLat, dragLng);
    });

    // 3. Attach Google Places Autocomplete to address search input
    if (autocompleteInputRef.current && window.google?.maps?.places?.Autocomplete) {
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
          componentRestrictions: { country: 'in' },
          fields: ['geometry', 'formatted_address', 'name']
        });
        autocompleteRef.current = autocomplete;
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            // User might have typed/pasted a maps URL or coordinates directly
            const rawVal = autocompleteInputRef.current?.value || '';
            if (rawVal) {
              handleSearchLocation(rawVal);
            }
            return;
          }
          const placeLoc = place.geometry.location;
          const pLat = placeLoc.lat();
          const pLng = placeLoc.lng();
          applyCoordinates(pLat, pLng, place.formatted_address || place.name || '');
        });
      } catch (e) {
        console.warn('Autocomplete init error:', e);
      }
    }

    // Auto match zone & circle for initial position
    autoMatchServiceArea(pos.lat, pos.lng);

    // Auto reverse geocode initial position if address is empty
    if (!address) {
      reverseGeocode(pos.lat, pos.lng);
    }
  };

  // Price Calculations & Add-on Coupon Breakdown
  const baseWashPrice = planPrices[selectedWashTypeId] || 0;
  const actualWashPrice = (actualPrices[selectedWashTypeId] && actualPrices[selectedWashTypeId] > baseWashPrice)
    ? actualPrices[selectedWashTypeId]
    : baseWashPrice;
  const planDiscount = Math.max(0, actualWashPrice - baseWashPrice);
  const subWashDiscount = isWashCoveredBySub ? baseWashPrice : 0;
  
  const selectedAddonsList = availableAddons.filter(a => selectedAddonIds.includes(a.id));
  const addonsTotal = selectedAddonsList.reduce((sum, a) => sum + (a.price || 0), 0);
  
  // Find active coupon
  const activeCoupon = eligibleCoupons.find(c => c.code === selectedCouponCode) || null;
  const remainingCoupons = eligibleCoupons.filter(c => (c.code || '').toUpperCase() !== (selectedCouponCode || '').toUpperCase());

  // Helper to determine exact pricing, discount & perk status of an add-on
  const getAddonPricing = (addon) => {
    if (!addon) return { originalPrice: 0, effectivePrice: 0, discount: 0, isFree: false, isDiscounted: false, isVipFree: false };
    const orig = Number(addon.price) || 0;

    // 1. VIP Subscription Free Add-on check
    const vipAddonPerk = getSubAddonCoverage(addon.id);
    if (vipAddonPerk?.isFree) {
      return {
        originalPrice: orig,
        effectivePrice: 0,
        discount: orig,
        isFree: true,
        isDiscounted: true,
        isVipFree: true,
        vipPlanName: vipAddonPerk.planName,
        vipRemaining: vipAddonPerk.remaining
      };
    }

    // Per policy: If wash is covered by active subscription, NO coupons can be applied (not even free add-on coupons)
    if (!activeCoupon || isWashCoveredBySub) {
      return { originalPrice: orig, effectivePrice: orig, discount: 0, isFree: false, isDiscounted: false, isVipFree: false };
    }

    // 2. 100% Free Add-on Perk via Coupon (only if booking is NOT covered by subscription)
    if (activeCoupon.freeAddonId && Number(activeCoupon.freeAddonId) === Number(addon.id)) {
      return { originalPrice: orig, effectivePrice: 0, discount: orig, isFree: true, isDiscounted: true, isVipFree: false };
    }

    // 3. Discounted Add-on Perk via Coupon (only if booking is NOT covered by subscription)
    if (activeCoupon.discountAddonId && Number(activeCoupon.discountAddonId) === Number(addon.id)) {
      if (activeCoupon.addonDiscountType === 'FREE') {
        return { originalPrice: orig, effectivePrice: 0, discount: orig, isFree: true, isDiscounted: true, isVipFree: false };
      } else if (activeCoupon.addonDiscountType === 'FLAT') {
        const disc = Math.min(orig, Number(activeCoupon.addonDiscountValue) || 0);
        return { originalPrice: orig, effectivePrice: Math.max(0, orig - disc), discount: disc, isFree: disc >= orig, isDiscounted: disc > 0, isVipFree: false };
      } else if (activeCoupon.addonDiscountType === 'PERCENTAGE') {
        const disc = (orig * (Number(activeCoupon.addonDiscountValue) || 0)) / 100;
        return { originalPrice: orig, effectivePrice: Math.max(0, orig - disc), discount: disc, isFree: disc >= orig, isDiscounted: disc > 0, isVipFree: false };
      }
    }

    return { originalPrice: orig, effectivePrice: orig, discount: 0, isFree: false, isDiscounted: false, isVipFree: false };
  };
  
  let washCouponDiscount = 0;
  let totalCouponAddonSavings = 0;
  let totalVipAddonSavings = 0;
  let freeAddonBonus = null;
  let discountedAddonBonus = null;

  selectedAddonsList.forEach(a => {
    const pricing = getAddonPricing(a);
    if (pricing.isVipFree) {
      totalVipAddonSavings += pricing.discount;
    }
  });

  // Coupons cannot be applied if wash is already covered by VIP subscription
  if (activeCoupon && !isWashCoveredBySub) {
    if (activeCoupon.discountType === 'FLAT') {
      washCouponDiscount = activeCoupon.discountAmount || 0;
    } else if (activeCoupon.discountType === 'PERCENTAGE') {
      washCouponDiscount = (baseWashPrice * (activeCoupon.discountPct || 0)) / 100;
      if (activeCoupon.limitOption === 'UP_TO' && activeCoupon.maxDiscountAmount) {
        washCouponDiscount = Math.min(washCouponDiscount, activeCoupon.maxDiscountAmount);
      }
    } else {
      washCouponDiscount = 0;
    }

    // Coupon Add-on perks
    selectedAddonsList.forEach(a => {
      const pricing = getAddonPricing(a);
      if (!pricing.isVipFree && pricing.discount > 0) {
        totalCouponAddonSavings += pricing.discount;
        if (pricing.isFree) {
          freeAddonBonus = a.name;
        } else {
          discountedAddonBonus = a.name;
        }
      }
    });
  }

  const totalSubDiscount = subWashDiscount + totalVipAddonSavings;
  const totalAddonsEffective = selectedAddonsList.reduce((sum, a) => sum + getAddonPricing(a).effectivePrice, 0);
  const couponDiscount = washCouponDiscount + totalCouponAddonSavings;
  const totalAddonSavings = totalCouponAddonSavings;
  const washPayableAfterSubAndCoupon = Math.max(0, baseWashPrice - subWashDiscount - washCouponDiscount);
  const subtotalAfterDiscounts = Math.max(0, washPayableAfterSubAndCoupon + totalAddonsEffective);

  // Royalty Points Calculation
  let pointsDiscount = 0;
  let pointsToRedeem = 0;
  const ratio = Number(systemSettings?.pointsToCashRatio) > 0 ? Number(systemSettings.pointsToCashRatio) : 1;

  if (redeemPoints && userPoints > 0) {
    const maxCashValue = userPoints / ratio;
    if (maxCashValue >= subtotalAfterDiscounts) {
      pointsDiscount = subtotalAfterDiscounts;
      pointsToRedeem = Math.ceil(subtotalAfterDiscounts * ratio);
    } else {
      pointsDiscount = maxCashValue;
      pointsToRedeem = userPoints;
    }
  }

  const finalPayable = Math.max(0, subtotalAfterDiscounts - pointsDiscount);
  const totalSavings = Math.round((planDiscount + totalSubDiscount + couponDiscount + pointsDiscount) * 100) / 100;

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
        alert(selectedSlotObj.reason || 'This arrival window is currently unavailable. Please select an available time window.');
        return;
      }
    } else if (!loadingSlots) {
      alert('No approved slots are configured by administration for this date. Please choose another date.');
      return;
    }

    setLoading(true);

    // Verify live system booking status (guards against low network / cached screens)
    try {
      const liveSettings = await getSettings();
      if (liveSettings && liveSettings.bookingsEnabled === false) {
        setSystemSettings(liveSettings);
        setLoading(false);
        alert('Doorstep car wash bookings are currently paused by administration. You cannot proceed to book or pay at this moment. Please check back later.');
        return;
      }
    } catch (checkErr) {
      console.warn('Could not re-verify live booking status before checkout:', checkErr);
    }

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
        couponCode: isWashCoveredBySub ? null : (selectedCouponCode || null),
        redeemPoints: redeemPoints,
        addonIds: selectedAddonIds
      };

      const res = await createBooking(payload);

      // Check if online Razorpay payment is required
      const isOnlinePayment = res.requiresPayment && (res.rzpOrder || res.razorpayOrderId);
      if (isOnlinePayment) {
        const orderId = res.rzpOrder?.id || res.razorpayOrderId;
        const orderAmount = res.rzpOrder?.amount || res.amount;
        const orderCurrency = res.rzpOrder?.currency || res.currency || 'INR';
        const keyId = res.rzpOrder?.key || res.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
        const targetBookingId = res.booking?.id || res.bookingId;

        // Dynamically load Razorpay SDK if not already in window
        if (!window.Razorpay) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          }).catch(() => null);
        }

        if (!window.Razorpay) {
          alert('Razorpay payment gateway script not loaded. Please refresh the page and try again.');
          try {
            await cancelPendingPayment(targetBookingId, 'RAZORPAY_SCRIPT_UNAVAILABLE');
          } catch (e) {}
          refreshSlots();
          setLoading(false);
          return;
        }

        const rzpOptions = {
          key: keyId,
          amount: orderAmount,
          currency: orderCurrency,
          name: 'Wash My Car',
          description: `Doorstep Car Wash (${selectedWashTypeObj?.name || 'Package'})`,
          order_id: orderId,
          prefill: {
            name: userProfile?.name || '',
            email: userProfile?.email || '',
            contact: userProfile?.phone || ''
          },
          theme: {
            color: '#0284C7'
          },
          modal: {
            ondismiss: async function () {
              // Customer dismissed / timed out on Razorpay checkout without completing payment
              try {
                await cancelPendingPayment(targetBookingId, 'PAYMENT_ABANDONED_OR_TIMEOUT');
              } catch (e) {
                console.warn('Slot unlock notice:', e);
              }
              refreshSlots();
              setLoading(false);
              alert('Payment was not completed. Your temporary slot reservation has been released for other customers.');
            }
          },
          handler: async function (paymentResponse) {
            try {
              setLoading(true);
              const verifyRes = await verifyBookingPayment({
                bookingId: targetBookingId,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature
              });
              setBookingSuccess(verifyRes.booking || res.booking);
            } catch (verErr) {
              console.error('Verification error:', verErr);
              alert('Payment verification failed: ' + (verErr.message || 'Please contact support'));
              refreshSlots();
            } finally {
              setLoading(false);
            }
          }
        };

        const rzpInstance = new window.Razorpay(rzpOptions);
        rzpInstance.on('payment.failed', async function (failedResp) {
          try {
            await cancelPendingPayment(targetBookingId, failedResp.error?.description || 'PAYMENT_FAILED');
          } catch (e) {}
          refreshSlots();
          setLoading(false);
          alert('Payment Failed: ' + (failedResp.error?.description || 'Transaction unsuccessful') + '. Your temporary slot lock has been released.');
        });

        rzpInstance.open();
      } else {
        // Zero payable booking (100% coupon discount or points covered)
        setBookingSuccess(res.booking || res);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.message || 'Please check your inputs';
      if (errMsg.toLowerCase().includes('reserved') || errMsg.toLowerCase().includes('locked') || errMsg.toLowerCase().includes('conflict')) {
        alert('⚠️ Slot Concurrency Notice: ' + errMsg + '\nRefreshing available slots for you...');
        refreshSlots();
      } else {
        alert('Failed to place booking: ' + errMsg);
      }
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
            marginBottom: '1.25rem',
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

            {/* Savings & Price Breakdown */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.6rem', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Actual Standard Price</span>
                <span style={{ color: '#94A3B8', textDecoration: planDiscount > 0 ? 'line-through' : 'none', fontWeight: 600 }}>
                  ₹{actualWashPrice}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Giving Offer Price</span>
                <span style={{ color: 'var(--primary-navy)', fontWeight: 700 }}>₹{baseWashPrice}</span>
              </div>
              {subWashDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309', fontWeight: 700 }}>
                  <span>• 👑 VIP Subscription Pass Benefit</span>
                  <span>-₹{subWashDiscount.toFixed(2)} (Wash Covered)</span>
                </div>
              )}
              {totalVipAddonSavings > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309', fontWeight: 700 }}>
                  <span>• 👑 VIP Complimentary Add-on Savings</span>
                  <span>-₹{totalVipAddonSavings.toFixed(2)}</span>
                </div>
              )}
              {planDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                  <span>• Plan Special Offer Discount</span>
                  <span>-₹{planDiscount.toFixed(2)}</span>
                </div>
              )}
              {washCouponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                  <span>• Coupon Discount ({selectedCouponCode})</span>
                  <span>-₹{washCouponDiscount.toFixed(2)}</span>
                </div>
              )}
              {totalCouponAddonSavings > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                  <span>• Free / Offer Add-on Savings</span>
                  <span>-₹{totalCouponAddonSavings.toFixed(2)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 600 }}>
                  <span>• Reward Coins Redeemed ({pointsToRedeem} pts)</span>
                  <span>-₹{pointsDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Total Amount Paid</span>
              <span style={{ fontWeight: 800, color: '#16A34A', fontSize: '1.15rem' }}>₹{finalPayable}</span>
            </div>
          </div>

          {/* Celebratory Total Savings Banner */}
          {totalSavings > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: 'white',
              borderRadius: '16px',
              padding: '1.25rem',
              textAlign: 'center',
              marginBottom: '2rem',
              boxShadow: '0 10px 25px rgba(5, 150, 105, 0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <Sparkles size={18} color="#FDE047" /> Congratulations! You Saved
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, margin: '0.3rem 0', color: '#FEF08A' }}>
                ₹{totalSavings.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.95, lineHeight: 1.4 }}>
                Total savings applied from package special offer, promotional coupons & loyalty reward coins!
              </div>
            </div>
          )}

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

  // Master switch check: if bookings are turned off by admin
  if (systemSettings && systemSettings.bookingsEnabled === false) {
    return (
      <div style={{ maxWidth: '640px', margin: '2.5rem auto', padding: '0 1rem' }}>
        <div className="card animate-fade-in" style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          borderRadius: '24px',
          border: '1.5px solid #FECACA',
          background: 'linear-gradient(180deg, #FFFDFD 0%, #FFFFFF 100%)',
          boxShadow: '0 20px 40px -10px rgba(220, 38, 38, 0.1)'
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 6px 16px rgba(220, 38, 38, 0.2)'
          }}>
            <CalendarX size={34} strokeWidth={2.2} />
          </div>

          <span style={{
            background: '#FEE2E2',
            color: '#B91C1C',
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '4px 14px',
            borderRadius: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            SLOT RESERVATIONS PAUSED
          </span>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: '1rem 0 0.75rem' }}>
            Doorstep Bookings Temporarily Closed
          </h2>

          <p style={{ color: '#64748B', lineHeight: 1.6, fontSize: '0.95rem', margin: '0 auto 2rem', maxWidth: '460px' }}>
            Doorstep slot bookings are temporarily suspended by the administration for maintenance or heavy weather dispatch. Existing bookings remain unaffected. Please check back shortly!
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.75rem',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate('/subscriptions')}
              style={{
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                color: '#92400E',
                border: '1.5px solid #F59E0B',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Crown size={16} color="#D97706" /> Explore VIP Passes
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
              const cov = getSubWashCoverage(plan.id);
              const isVipCovered = Boolean(cov?.isCovered);

              let cardBorder = isSelected ? '2px solid var(--primary-blue)' : '1px solid #E2E8F0';
              let cardBg = isSelected ? '#F0F9FF' : 'white';
              if (isVipCovered) {
                cardBorder = isSelected ? '2px solid #D97706' : '1.5px solid #FCD34D';
                cardBg = isSelected ? '#FEFCE8' : '#FFFDF5';
              }

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedWashTypeId(plan.id.toString())}
                  style={{
                    border: cardBorder,
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    background: cardBg,
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

                        {/* VIP Pass Coverage Badge */}
                        {isVipCovered && (
                          <span style={{
                            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                            color: '#92400E',
                            border: '1px solid #F59E0B',
                            padding: '0.15rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            👑 {cov.planName} ({cov.remaining} left)
                          </span>
                        )}

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
                      {isVipCovered ? (
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
                            ₹{actualPrices[plan.id] || planPrice}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D97706' }}>
                            ₹0 FREE
                          </div>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            background: '#FEF3C7',
                            color: '#92400E',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            display: 'inline-block',
                            marginTop: '2px'
                          }}>
                            VIP COVERED
                          </span>
                        </div>
                      ) : (
                        <div>
                          {actualPrices[plan.id] > planPrice && (
                            <div style={{ fontSize: '0.85rem', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
                              ₹{actualPrices[plan.id]}
                            </div>
                          )}
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: actualPrices[plan.id] > planPrice ? '#059669' : 'var(--primary-navy)' }}>
                            {loadingPrices ? '...' : `₹${planPrice}`}
                          </div>
                          {actualPrices[plan.id] > planPrice && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              background: '#DCFCE7',
                              color: '#15803D',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              display: 'inline-block',
                              marginTop: '2px'
                            }}>
                              Save ₹{actualPrices[plan.id] - planPrice}
                            </span>
                          )}
                        </div>
                      )}

                      <div style={{
                        marginTop: '0.4rem',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: isSelected ? 'none' : '2px solid #CBD5E1',
                        background: isSelected ? (isVipCovered ? '#D97706' : 'var(--primary-blue)') : 'white',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
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
                Sufficient clearance space around all 4 doors and boot for technician detailing.
              </p>
            </div>

            <div style={{ background: '#ECFDF5', border: '1.5px solid #86EFAC', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803D', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <RefreshCw size={16} /> Fair Refund System
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#14532D', lineHeight: 1.4 }}>
                100% full refund up to 9 hours before slot. If not cancelled before 9 hours or if any doorstep rejection is found, no refund will be initiated.
              </p>
            </div>
          </div>

          {/* Dedicated Cancellation & 100% Refund Policy Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
            border: '1.5px solid #86EFAC',
            borderRadius: '14px',
            padding: '1.1rem 1.25rem',
            marginBottom: '1.25rem',
            boxShadow: '0 2px 10px rgba(34, 197, 94, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                <RefreshCw size={17} />
              </div>
              <h4 style={{ margin: 0, color: '#14532D', fontSize: '0.98rem', fontWeight: 800 }}>
                Transparent Cancellation & Refund Policy
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem', color: '#166534', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#16A34A', fontWeight: 800, marginTop: '2px' }}>•</span>
                <div>
                  <strong style={{ color: '#14532D' }}>Prior to 9 Hours to Slot:</strong> Full <strong>100% refund</strong> is immediately allocated and initiated back to your original payment method with zero cancellation fees.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#DC2626', fontWeight: 800, marginTop: '2px' }}>•</span>
                <div>
                  <strong style={{ color: '#991B1B' }}>Within 9 Hours of Slot Time:</strong> If not cancelled at least 9 hours prior, <strong>no refund will be issued</strong> and cancellation is closed, as our service technician equipped on scooty/bike with wash & detailing kit and vehicle care amenities (floor papers, car fresheners, cleaning liquids & detailing supplies) is already committed and reserved for your vehicle.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#DC2626', fontWeight: 800, marginTop: '2px' }}>•</span>
                <div>
                  <strong style={{ color: '#991B1B' }}>Doorstep Rejection / Access Denial:</strong> If any doorstep rejection is found upon technician arrival (including customer refusal, lack of domestic water/electricity access, gated entry denial, or customer unavailability), <strong>no refund will be initiated</strong> under any circumstances.
                </div>
              </div>
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
              {systemSettings?.bookingTermsText || "1. Access Requirements: Customer agrees to provide adequate water tap access and a standard electric plug point for the technician to perform the doorstep car wash service safely.\n2. Vehicle Parking: The vehicle must be parked in a safe area with sufficient clearance around all sides.\n3. Valuable Items: Please remove all personal belongings and valuables from inside the car prior to service commencement.\n4. Cancellation & Refund Policy: Full 100% refund is allocated if cancelled up to 9 hours before scheduled slot time. If not cancelled before 9 hours or if any doorstep rejection is found upon arrival, no refund will be initiated."}
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
                I agree and accept the service requirements, 9-hour cancellation & doorstep rejection refund policy
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                I confirm water/power tap access and understand that 100% full refund applies only if cancelled at least 9 hours prior to slot time. If not cancelled before 9 hours or if any doorstep rejection is found upon arrival, no refund will be initiated.
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
            marginBottom: '1.25rem',
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

          {/* Add-on Promo Announcement Banner if eligible coupons offer add-on perks (Non-subscription bookings only) */}
          {!isWashCoveredBySub && eligibleCoupons.some(c => c.freeAddonId || c.discountAddonId) && (
            <div style={{
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
              border: '1.5px solid #6EE7B7',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <Sparkles size={18} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.82rem', color: '#065F46', lineHeight: 1.4 }}>
                <strong>Special Coupon Perks:</strong> Select any add-on marked with 🎁 or ⚡ below to instantly activate that complimentary or discounted offer!
              </div>
            </div>
          )}

          {/* Active Add-on Offer Notice */}
          {!isWashCoveredBySub && addonOfferNotice && (
            <div style={{
              marginBottom: '1rem',
              background: '#EFF6FF',
              border: '1.5px solid #93C5FD',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.65rem',
              color: '#1E40AF',
              fontSize: '0.84rem',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={18} color="#2563EB" />
                <span>{addonOfferNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAddonOfferNotice('')}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.1rem' }}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Addons Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', marginBottom: '1.75rem' }}>
            {availableAddons.map(addon => {
              const isSelected = selectedAddonIds.includes(addon.id);
              const pricing = getAddonPricing(addon);
              const matchingOffer = !isWashCoveredBySub ? eligibleCoupons.find(c => 
                Number(c.freeAddonId) === Number(addon.id) || Number(c.discountAddonId) === Number(addon.id)
              ) : null;

              const isVipFree = Boolean(pricing.isVipFree);
              const isFreeViaActiveCoupon = isSelected && pricing.isFree && !isVipFree;
              const isDiscountedViaActiveCoupon = isSelected && pricing.isDiscounted && !pricing.isFree && !isVipFree;

              // Border and background highlighting
              let cardBorder = '1px solid #E2E8F0';
              let cardBg = '#FFFFFF';
              if (isVipFree) {
                cardBorder = isSelected ? '2px solid #D97706' : '1.5px solid #FCD34D';
                cardBg = isSelected ? '#FEFCE8' : '#FFFDF5';
              } else if (isFreeViaActiveCoupon) {
                cardBorder = '2px solid #10B981';
                cardBg = '#F0FDF4';
              } else if (isDiscountedViaActiveCoupon) {
                cardBorder = '2px solid #0284C7';
                cardBg = '#F0F9FF';
              } else if (isSelected) {
                cardBorder = '2px solid #10B981';
                cardBg = '#F0FDF4';
              } else if (!isWashCoveredBySub && matchingOffer && !activeCoupon) {
                cardBorder = '1.5px dashed #F59E0B';
                cardBg = '#FFFDF5';
              }

              return (
                <div
                  key={addon.id}
                  onClick={() => handleToggleAddon(addon)}
                  style={{
                    border: cardBorder,
                    borderRadius: '14px',
                    padding: '1rem',
                    background: cardBg,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: isVipFree ? '#FEF3C7' : isSelected ? '#DCFCE7' : (matchingOffer && !activeCoupon ? '#FEF3C7' : '#F8FAFC'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {renderAddonIcon(addon.icon, isSelected, 18)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.92rem', display: 'block' }}>
                          {addon.name}
                        </span>
                      </div>

                      {/* Add-on Pricing Badge */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {isVipFree ? (
                          <div>
                            <span style={{ fontSize: '0.78rem', textDecoration: 'line-through', color: '#94A3B8', display: 'block' }}>
                              ₹{pricing.originalPrice}
                            </span>
                            <span style={{ fontWeight: 800, color: '#D97706', fontSize: '0.95rem' }}>
                              ₹0 FREE
                            </span>
                          </div>
                        ) : isFreeViaActiveCoupon ? (
                          <div>
                            <span style={{ fontSize: '0.78rem', textDecoration: 'line-through', color: '#94A3B8', display: 'block' }}>
                              ₹{pricing.originalPrice}
                            </span>
                            <span style={{ fontWeight: 800, color: '#16A34A', fontSize: '0.95rem' }}>
                              ₹0 FREE
                            </span>
                          </div>
                        ) : isDiscountedViaActiveCoupon ? (
                          <div>
                            <span style={{ fontSize: '0.78rem', textDecoration: 'line-through', color: '#94A3B8', display: 'block' }}>
                              ₹{pricing.originalPrice}
                            </span>
                            <span style={{ fontWeight: 800, color: '#0284C7', fontSize: '0.95rem' }}>
                              +₹{pricing.effectivePrice}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontWeight: 800, color: isSelected ? '#15803D' : 'var(--primary-navy)', fontSize: '0.92rem' }}>
                              +₹{addon.price}
                            </span>
                            {!isWashCoveredBySub && !activeCoupon && matchingOffer && (
                              <span style={{ fontSize: '0.7rem', color: '#059669', display: 'block', fontWeight: 700 }}>
                                (Offer Avail.)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {addon.description && (
                      <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {addon.description}
                      </p>
                    )}

                    {/* Promotional Badges */}
                    {isVipFree && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                          color: '#92400E',
                          border: '1px solid #F59E0B',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          👑 100% FREE with {pricing.vipPlanName} ({pricing.vipRemaining} left)
                        </span>
                      </div>
                    )}
                    {!isWashCoveredBySub && !isVipFree && isFreeViaActiveCoupon && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          background: '#DCFCE7',
                          color: '#166534',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          🎁 100% FREE with Coupon {activeCoupon?.code}
                        </span>
                      </div>
                    )}
                    {!isWashCoveredBySub && !isVipFree && isDiscountedViaActiveCoupon && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          ⚡ Special Price with Coupon {activeCoupon?.code}
                        </span>
                      </div>
                    )}
                    {!isWashCoveredBySub && !isVipFree && !activeCoupon && matchingOffer && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          background: '#FEF3C7',
                          color: '#92400E',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {Number(matchingOffer.freeAddonId) === Number(addon.id) || matchingOffer.addonDiscountType === 'FREE'
                            ? `🎁 FREE with coupon ${matchingOffer.code} (Click to apply)`
                            : `✨ Discount with coupon ${matchingOffer.code} (Click to apply)`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    border: isSelected ? 'none' : '2px solid #CBD5E1',
                    background: isSelected ? (isVipFree ? '#D97706' : '#10B981') : 'white',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              
              {/* 1. Service Area / Zone Selector with Searchable Dropdown & Quick Chips */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E293B', margin: 0 }}>
                    Service Area / Zone <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  {matchedZoneInfo && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      color: matchedZoneInfo.isWithin ? '#047857' : '#B45309',
                      background: matchedZoneInfo.isWithin ? '#ECFDF5' : '#FFFBEB',
                      border: matchedZoneInfo.isWithin ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px'
                    }}>
                      <span>{matchedZoneInfo.isWithin ? '🎯 Auto-Matched by Pin:' : '📍 Nearest Hub:'}</span>
                      <span>{matchedZoneInfo.name} ({matchedZoneInfo.distanceKm} km from hub · {matchedZoneInfo.radiusKm} km radius)</span>
                    </div>
                  )}
                </div>
                <SearchableDropdown
                  options={serviceAreas.map(area => ({ value: area.id.toString(), label: area.name }))}
                  value={selectedServiceAreaId ? selectedServiceAreaId.toString() : ''}
                  onChange={(val) => handleServiceAreaSelect(val)}
                  placeholder="-- Select Your Service Area --"
                  searchPlaceholder="Search service area or zone..."
                  allowOther={false}
                />

                {/* Quick Area / Zone Selection Pills */}
                {serviceAreas.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {serviceAreas.map(area => {
                      const isSelected = selectedServiceAreaId === area.id.toString();
                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => handleServiceAreaSelect(area.id.toString())}
                          style={{
                            background: isSelected ? '#EFF6FF' : '#FFFFFF',
                            border: isSelected ? '1.5px solid var(--primary-blue)' : '1px solid #CBD5E1',
                            color: isSelected ? 'var(--primary-blue)' : '#334155',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: isSelected ? 800 : 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none'
                          }}
                        >
                          <span>📍 {area.name}</span>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Map Pointing Section FIRST (Address Search + Current Location + Interactive Map) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1E293B', fontSize: '0.88rem' }}>
                    <Compass size={16} color="var(--primary-blue)" /> Pinpoint Exact Technician Spot
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: '#047857', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                      👆 1-Finger Move
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#0369A1', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                      Tap map or drag pin
                    </span>
                  </div>
                </div>

                {/* Map Search Bar & Use Current Location Button */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px', display: 'flex' }}>
                    <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      ref={autocompleteInputRef}
                      type="text"
                      placeholder="Search address, paste Google Maps link or lat, lng..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchLocation();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData?.getData('text') || '';
                        if (pasted) {
                          const isUrl = pasted.includes('http') || pasted.includes('goo.gl') || pasted.includes('maps');
                          const isCoords = extractCoordinatesFromInput(pasted);
                          if (isUrl || isCoords) {
                            setTimeout(() => {
                              handleSearchLocation(pasted);
                            }, 50);
                          }
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0.55rem 4.6rem 0.55rem 2rem',
                        borderRadius: '8px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.82rem',
                        outline: 'none',
                        background: '#FFFFFF',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary-blue)'}
                      onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                    />
                    <button
                      type="button"
                      onClick={() => handleSearchLocation()}
                      disabled={searchingLocation}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'var(--primary-blue)',
                        border: 'none',
                        color: 'white',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: searchingLocation ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        boxShadow: '0 1px 3px rgba(2, 132, 199, 0.25)',
                        opacity: searchingLocation ? 0.75 : 1
                      }}
                      title="Search place, Google Maps link, or coordinates"
                    >
                      {searchingLocation ? (
                        <>
                          <RefreshCw size={11} className="animate-spin" />
                          <span>Locating...</span>
                        </>
                      ) : (
                        <>
                          <Search size={11} strokeWidth={2.5} />
                          <span>Find</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: locating ? '#E2E8F0' : '#F0FDF4',
                      border: '1.5px solid #86EFAC',
                      color: '#166534',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: locating ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                    title="Detect GPS Location"
                  >
                    <Navigation size={14} className={locating ? 'animate-spin' : ''} />
                    <span>{locating ? 'Locating...' : 'Use Current Location'}</span>
                  </button>
                </div>

                {/* Google Map Container */}
                <div style={{ position: 'relative' }}>
                  <div
                    ref={mapRef}
                    style={{
                      width: '100%',
                      height: '230px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      background: '#F1F5F9',
                      overflow: 'hidden'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(4px)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    color: '#334155',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontWeight: 600
                  }}>
                    <span>📍 Lat: {Number(latitude).toFixed(4)}, Lng: {Number(longitude).toFixed(4)}</span>
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(4px)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    color: '#047857',
                    border: '1px solid #A7F3D0',
                    fontWeight: 700,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>👆 1-Finger Touch</span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <span>💡</span> <strong>1-Finger Touch:</strong> Move or scroll map with a single finger. In search box, you can paste full/short Google Maps links (e.g. <code>maps.app.goo.gl/...</code>) or coordinates (e.g. <code>17.7386, 83.3182</code>).
                </p>
              </div>

              {/* 3. Complete Doorstep Address SECOND (Editable without changing map point, with optional update button) */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0, fontSize: '0.88rem', color: '#1E293B' }}>
                    Complete Doorstep Address <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleSearchLocation(address)}
                      style={{
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: 'var(--primary-blue)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s ease'
                      }}
                      title="Pinpoint this edited address on map and auto-detect zone"
                    >
                      <MapPin size={12} /> Pinpoint Address on Map
                    </button>
                    <span style={{ fontSize: '0.72rem', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                      ✏️ Editable
                    </span>
                  </div>
                </div>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Apartment/Villa No., Building Name, Street, Landmark..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.85rem',
                    lineHeight: '1.45',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Auto-filled from map selection. You can freely edit or add Flat No., Floor, Tower, or Gate instructions without changing your pinned spot.
                </span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} color="var(--primary-blue)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.15rem', fontWeight: 800 }}>
                    Select Service Date & Arrival Window
                  </h3>
                  <p style={{ margin: '0.15rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Choose your service date and preferred doorstep arrival window
                  </p>
                </div>
              </div>

              {/* Modern Interactive Booking Date Selector (Horizontal Date Cards) */}
              <div style={{ marginBottom: '1.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span>Select Service Date</span>
                    <span style={{ color: '#EF4444' }}>*</span>
                    <span style={{ fontSize: '0.78rem', color: '#0284C7', fontWeight: 700, background: '#E0F2FE', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
                      {formatSelectedDate(date)}
                    </span>
                  </label>

                  {/* Clean Pick From Calendar Action Button & Desktop Custom Dropdown */}
                  <div style={{ position: 'relative' }} ref={calendarDropdownRef}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const isMobile = typeof window !== 'undefined' && 
                          (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && 
                          /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

                        if (isMobile && datePickerInputRef.current && typeof datePickerInputRef.current.showPicker === 'function') {
                          try {
                            datePickerInputRef.current.showPicker();
                            return;
                          } catch (err) {
                            // Fallback to custom dropdown if mobile native picker fails
                          }
                        }

                        // Desktop or fallback: toggle custom styled calendar dropdown
                        setShowCustomCalendar(prev => {
                          const nextState = !prev;
                          if (nextState && date) {
                            try {
                              const parts = date.split('-');
                              if (parts.length === 3) {
                                setViewMonth(new Date(Number(parts[0]), Number(parts[1]) - 1, 1));
                              }
                            } catch (err) {
                              setViewMonth(new Date());
                            }
                          }
                          return nextState;
                        });
                      }}
                      style={{
                        background: showCustomCalendar ? '#E0F2FE' : '#F1F5F9',
                        border: showCustomCalendar ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                        color: showCustomCalendar ? '#0284C7' : '#334155',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s',
                        boxShadow: showCustomCalendar ? '0 0 0 3px rgba(2, 132, 199, 0.15)' : 'none'
                      }}
                      onMouseEnter={e => {
                        if (!showCustomCalendar) {
                          e.currentTarget.style.background = '#E2E8F0';
                          e.currentTarget.style.borderColor = '#94A3B8';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!showCustomCalendar) {
                          e.currentTarget.style.background = '#F1F5F9';
                          e.currentTarget.style.borderColor = '#CBD5E1';
                        }
                      }}
                    >
                      <Calendar size={13} color="#0284C7" />
                      <span>Choose Other Date</span>
                      <ChevronDown 
                        size={12} 
                        color={showCustomCalendar ? '#0284C7' : '#64748B'} 
                        style={{ 
                          transform: showCustomCalendar ? 'rotate(180deg)' : 'none', 
                          transition: 'transform 0.2s ease' 
                        }} 
                      />
                    </button>

                    {/* Desktop Custom Styled Dropdown Calendar */}
                    {showCustomCalendar && (() => {
                      const currentYear = viewMonth.getFullYear();
                      const currentMonth = viewMonth.getMonth();
                      const monthTitle = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      const today = new Date();
                      const todayStr = getTodayDateString();

                      const isPrevDisabled = (currentYear < today.getFullYear()) || 
                        (currentYear === today.getFullYear() && currentMonth <= today.getMonth());

                      const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
                      const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                      const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

                      const prevDays = [];
                      for (let i = firstDayIndex - 1; i >= 0; i--) {
                        prevDays.push(daysInPrevMonth - i);
                      }

                      const currentDays = [];
                      for (let d = 1; d <= daysInCurrentMonth; d++) {
                        const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        currentDays.push({
                          dayNum: d,
                          dateStr: dStr,
                          isPast: dStr < todayStr,
                          isToday: dStr === todayStr,
                          isSelected: dStr === date
                        });
                      }

                      const totalCells = prevDays.length + currentDays.length;
                      const nextDaysCount = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);
                      const nextDays = [];
                      for (let i = 1; i <= nextDaysCount; i++) {
                        nextDays.push(i);
                      }

                      return (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            right: 0,
                            width: '310px',
                            maxWidth: 'calc(100vw - 32px)',
                            background: '#FFFFFF',
                            borderRadius: '16px',
                            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.22), 0 8px 16px -4px rgba(15, 23, 42, 0.08)',
                            border: '1px solid #E2E8F0',
                            padding: '1.1rem',
                            zIndex: 9999,
                            boxSizing: 'border-box'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Month Navigation Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                            <button
                              type="button"
                              disabled={isPrevDisabled}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewMonth(new Date(currentYear, currentMonth - 1, 1));
                              }}
                              style={{
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '0.35rem 0.5rem',
                                cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
                                opacity: isPrevDisabled ? 0.35 : 1,
                                color: '#334155',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s'
                              }}
                            >
                              <ChevronLeft size={16} />
                            </button>

                            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>
                              {monthTitle}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewMonth(new Date(currentYear, currentMonth + 1, 1));
                              }}
                              style={{
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '0.35rem 0.5rem',
                                cursor: 'pointer',
                                color: '#334155',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s'
                              }}
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>

                          {/* Days of Week Header */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', marginBottom: '0.35rem' }}>
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd, idx) => (
                              <div key={idx} style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', padding: '0.25rem 0' }}>
                                {wd}
                              </div>
                            ))}
                          </div>

                          {/* Calendar Days Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                            {prevDays.map((dNum, idx) => (
                              <div key={`prev-${idx}`} style={{
                                fontSize: '0.78rem',
                                color: '#CBD5E1',
                                padding: '0.35rem 0',
                                opacity: 0.45,
                                userSelect: 'none'
                              }}>
                                {dNum}
                              </div>
                            ))}

                            {currentDays.map((item) => {
                              return (
                                <button
                                  key={item.dateStr}
                                  type="button"
                                  disabled={item.isPast}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDate(item.dateStr);
                                    setShowCustomCalendar(false);
                                  }}
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: item.isSelected ? 800 : item.isToday ? 700 : 500,
                                    color: item.isSelected 
                                      ? '#FFFFFF' 
                                      : item.isPast 
                                        ? '#CBD5E1' 
                                        : item.isToday 
                                          ? '#0284C7' 
                                          : '#1E293B',
                                    background: item.isSelected 
                                      ? 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)' 
                                      : item.isToday 
                                        ? '#E0F2FE' 
                                        : 'transparent',
                                    border: item.isToday && !item.isSelected ? '1px solid #7DD3FC' : 'none',
                                    borderRadius: '9999px',
                                    width: '32px',
                                    height: '32px',
                                    margin: '0 auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: item.isPast ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: item.isSelected ? '0 3px 8px rgba(14, 165, 233, 0.4)' : 'none'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!item.isPast && !item.isSelected) {
                                      e.currentTarget.style.background = '#F1F5F9';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!item.isPast && !item.isSelected) {
                                      e.currentTarget.style.background = item.isToday ? '#E0F2FE' : 'transparent';
                                    }
                                  }}
                                >
                                  {item.dayNum}
                                </button>
                              );
                            })}

                            {nextDays.map((dNum, idx) => (
                              <div key={`next-${idx}`} style={{
                                fontSize: '0.78rem',
                                color: '#CBD5E1',
                                padding: '0.35rem 0',
                                opacity: 0.45,
                                userSelect: 'none'
                              }}>
                                {dNum}
                              </div>
                            ))}
                          </div>

                          {/* Footer Quick Pick Actions */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '0.85rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid #F1F5F9'
                          }}>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDate(todayStr);
                                  setShowCustomCalendar(false);
                                }}
                                style={{
                                  background: '#F0F9FF',
                                  border: '1px solid #BAE6FD',
                                  color: '#0284C7',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                Today
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  const y = tomorrow.getFullYear();
                                  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
                                  const d = String(tomorrow.getDate()).padStart(2, '0');
                                  setDate(`${y}-${m}-${d}`);
                                  setShowCustomCalendar(false);
                                }}
                                style={{
                                  background: '#F8FAFC',
                                  border: '1px solid #E2E8F0',
                                  color: '#475569',
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                Tomorrow
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowCustomCalendar(false);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94A3B8',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '0.25rem 0.5rem'
                              }}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Native date input cleanly hidden offscreen and accessible for mobile native pickers */}
                    <input
                      ref={datePickerInputRef}
                      type="date"
                      required
                      min={getTodayDateString()}
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        pointerEvents: 'none',
                        bottom: 0,
                        right: 0,
                        width: '1px',
                        height: '1px'
                      }}
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Horizontal Date Cards Carousel */}
                <div style={{
                  display: 'flex',
                  gap: '0.6rem',
                  overflowX: 'auto',
                  paddingBottom: '0.4rem',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}>
                  {generateUpcomingDays(14).map(item => {
                    const isSelected = date === item.dateStr;
                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        onClick={() => setDate(item.dateStr)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #0284C7' : '1.5px solid #E2E8F0',
                          background: isSelected 
                            ? 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)' 
                            : item.isToday 
                              ? '#F0F9FF' 
                              : '#FFFFFF',
                          color: isSelected ? '#FFFFFF' : '#0F172A',
                          minWidth: '68px',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: isSelected 
                            ? '0 6px 16px rgba(14, 165, 233, 0.35)' 
                            : '0 1px 3px rgba(0,0,0,0.04)',
                          flexShrink: 0
                        }}
                      >
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: isSelected 
                            ? 'rgba(255,255,255,0.92)' 
                            : item.isToday 
                              ? '#0284C7' 
                              : '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px'
                        }}>
                          {item.label}
                        </span>

                        <span style={{
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          lineHeight: 1.15,
                          margin: '0.15rem 0'
                        }}>
                          {item.dayNum}
                        </span>

                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: isSelected ? 'rgba(255,255,255,0.85)' : '#94A3B8'
                        }}>
                          {item.monthName}
                        </span>
                      </button>
                    );
                  })}

                  {/* Active Card for Custom Picked Date if Outside Upcoming 14 Days */}
                  {(() => {
                    const upcomingList = generateUpcomingDays(14);
                    const isCustomOutside = date && !upcomingList.some(item => item.dateStr === date);
                    if (!isCustomOutside) return null;

                    let dayOfWeek = 'Custom';
                    let monthName = '';
                    let dayNum = '';
                    try {
                      const parts = date.split('-');
                      if (parts.length === 3) {
                        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                        dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
                        monthName = d.toLocaleDateString('en-US', { month: 'short' });
                        dayNum = d.getDate();
                      }
                    } catch (e) {
                      dayOfWeek = 'Custom';
                    }

                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => {}}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '14px',
                          border: '2px solid #0284C7',
                          background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
                          color: '#FFFFFF',
                          minWidth: '68px',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: '0 6px 16px rgba(14, 165, 233, 0.35)',
                          flexShrink: 0
                        }}
                      >
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: 'rgba(255,255,255,0.92)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px'
                        }}>
                          {dayOfWeek}
                        </span>

                        <span style={{
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          lineHeight: 1.15,
                          margin: '0.15rem 0'
                        }}>
                          {dayNum}
                        </span>

                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: 'rgba(255,255,255,0.85)'
                        }}>
                          {monthName}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Service Arrival Window Header with Prominent Dispatch Capacity */}
              <div style={{ marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E293B', margin: 0 }}>
                  Doorstep Arrival Window <span style={{ color: '#EF4444' }}>*</span>
                </label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {/* Prominent Dispatch Capacity Badge */}
                  <span style={{
                    fontSize: '0.78rem',
                    color: '#1E40AF',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <Users size={13} color="#2563EB" />
                    <span>Dispatch Capacity: {dispatchCapacity} {dispatchCapacity === 1 ? 'Technician' : 'Technicians'}</span>
                  </span>

                  {!loadingSlots && availableSlotsList.length > 0 && (
                    <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 800, background: '#DCFCE7', padding: '0.25rem 0.65rem', borderRadius: '8px' }}>
                      {availableSlotsList.filter(s => s.available).length} of {availableSlotsList.length} Available
                    </span>
                  )}
                </div>
              </div>

              {/* Hidden select kept for DOM compatibility & form accessibility */}
              <select
                id="time-slot-select"
                required
                value={timeSlot}
                onChange={e => setTimeSlot(e.target.value)}
                style={{ display: 'none' }}
              >
                {availableSlotsList.map(s => (
                  <option key={s.slot} value={s.slot} disabled={!s.available}>{s.slot}</option>
                ))}
              </select>

              {/* Responsive Slot Selection Grid */}
              {loadingSlots ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '14px', border: '1.5px dashed #CBD5E1', color: 'var(--primary-blue)', fontSize: '0.88rem', fontWeight: 700 }}>
                  Loading approved arrival windows for {date}...
                </div>
              ) : availableSlotsList.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', background: '#FEF2F2', borderRadius: '14px', border: '1.5px solid #FCA5A5', color: '#991B1B', fontSize: '0.88rem', fontWeight: 600 }}>
                  <AlertCircle size={22} color="#DC2626" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                  No approved arrival windows configured by admin for this date. Please select another date.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {availableSlotsList.map(item => {
                    const isSelected = timeSlot === item.slot;
                    const isAvail = item.available;

                    return (
                      <div
                        key={item.slot}
                        title={item.reason || ''}
                        onClick={() => {
                          if (isAvail) {
                            setTimeSlot(item.slot);
                          } else {
                            alert(item.reason || 'This arrival window is currently unavailable. Please choose an available window.');
                          }
                        }}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '14px',
                          border: isSelected 
                            ? '2px solid var(--primary-blue)' 
                            : isAvail 
                              ? '1.5px solid #E2E8F0' 
                              : '1px solid #E2E8F0',
                          background: isSelected 
                            ? '#F0F9FF' 
                            : isAvail 
                              ? '#FFFFFF' 
                              : '#F8FAFC',
                          boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.18)' : '0 1px 3px rgba(0,0,0,0.03)',
                          cursor: isAvail ? 'pointer' : 'not-allowed',
                          opacity: isAvail ? 1 : 0.65,
                          transition: 'all 0.18s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.65rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isSelected ? 'var(--primary-blue)' : isAvail ? '#E0F2FE' : '#E2E8F0',
                            color: isSelected ? '#FFFFFF' : isAvail ? 'var(--primary-blue)' : '#94A3B8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Clock size={16} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              color: isSelected ? '#0369A1' : isAvail ? 'var(--primary-navy)' : '#64748B',
                              letterSpacing: '0.01em',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.slot}
                            </div>
                            <div style={{
                              fontSize: '0.74rem',
                              color: isAvail ? '#16A34A' : '#DC2626',
                              fontWeight: 700,
                              marginTop: '0.1rem',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}>
                              {isAvail 
                                ? '✓ Available Window' 
                                : (item.reason?.includes('passed') 
                                    ? '⏳ Window Passed' 
                                    : item.reason?.includes('progress') 
                                      ? '⏳ In Progress' 
                                      : item.reason?.includes('away') || item.reason?.includes('reach') || item.reason?.includes('Technician')
                                        ? '🚫 Location Conflict'
                                        : '🚫 Booked')}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: isSelected ? 'none' : '2px solid #CBD5E1',
                          background: isSelected ? 'var(--primary-blue)' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loadingSlots && availableSlotsList.length > 0 && !availableSlotsList.some(s => s.available) && (
                <div style={{ marginTop: '0.85rem', padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#991B1B', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                  <span>All arrival windows for {date === getTodayDateString() ? 'today have passed or are fully booked' : 'this date are currently unavailable'}. Please choose tomorrow or an upcoming date to schedule your wash!</span>
                </div>
              )}

              {/* Informative Service Window Banner */}
              {timeSlot && availableSlotsList.some(s => s.slot === timeSlot && s.available) && (
                <div style={{ marginTop: '0.9rem', fontSize: '0.8rem', color: '#0369A1', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '0.6rem 0.85rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Clock size={15} color="#0284C7" style={{ flexShrink: 0 }} />
                  <span>Doorstep Service Window: Technician will arrive and wash vehicle between <strong>{timeSlot}</strong>.</span>
                </div>
              )}

              {slotNotice && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.76rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Compass size={13} color="var(--primary-blue)" />
                  <span>{slotNotice}</span>
                </div>
              )}
            </div>

            {/* Coupons & Loyalty Rewards Card */}
            <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: isWashCoveredBySub ? '#FEF3C7' : '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isWashCoveredBySub ? '#D97706' : '#059669'
                  }}>
                    {isWashCoveredBySub ? <Crown size={18} /> : <Tag size={18} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 700 }}>
                      {isWashCoveredBySub ? 'VIP Subscription Active' : 'Offers & Coupons'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {isWashCoveredBySub 
                        ? 'Wash package is 100% covered under your VIP pass' 
                        : 'Apply discounts and save on your wash'}
                    </p>
                  </div>
                </div>

                {!isWashCoveredBySub && (
                  selectedCouponCode ? (
                    remainingCoupons.length > 0 ? (
                      <span style={{
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {remainingCoupons.length} More {remainingCoupons.length === 1 ? 'Offer' : 'Offers'}
                      </span>
                    ) : (
                      <span style={{
                        background: '#DCFCE7',
                        color: '#166534',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        1 Applied
                      </span>
                    )
                  ) : eligibleCoupons.length > 0 ? (
                    <span style={{
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {eligibleCoupons.length} {eligibleCoupons.length === 1 ? 'Offer' : 'Offers'}
                    </span>
                  ) : null
                )}
                {isWashCoveredBySub && (
                  <span style={{
                    background: '#FEF3C7',
                    color: '#92400E',
                    border: '1px solid #F59E0B',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    👑 VIP COVERED
                  </span>
                )}
              </div>

              {/* If Covered by VIP Subscription: Inform user that coupons cannot be added to subscription wash */}
              {isWashCoveredBySub ? (
                <div style={{
                  background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                  border: '1.5px solid #FCD34D',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#F59E0B',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                    boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)'
                  }}>
                    <Crown size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, color: '#92400E', fontSize: '1rem', fontWeight: 800 }}>
                        {currentWashVipCoverage?.planName || 'VIP Subscription Pass'} Active
                      </h4>
                      <span style={{
                        background: '#FEF3C7',
                        color: '#B45309',
                        border: '1px solid #F59E0B',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}>
                        {currentWashVipCoverage?.remaining} WASHES REMAINING
                      </span>
                    </div>
                    <p style={{ margin: '0.45rem 0 0', color: '#78350F', fontSize: '0.85rem', lineHeight: 1.5 }}>
                      This wash is <strong>100% covered (₹0 Free)</strong> under your active subscription for <strong>{carNumber || currentSelectedCar?.carNumber || 'your registered car'}</strong>. Promotional coupons (including free add-on coupons) cannot be added for subscription wash bookings.
                    </p>
                    <div style={{
                      marginTop: '0.65rem',
                      fontSize: '0.76rem',
                      color: '#92400E',
                      background: 'rgba(255, 255, 255, 0.75)',
                      padding: '0.45rem 0.7rem',
                      borderRadius: '8px',
                      border: '1px dashed #F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      lineHeight: 1.4
                    }}>
                      <span>ℹ️</span>
                      <span>Booking a wash for another car not covered by this subscription? You can apply coupons normally.</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-Subscription Bookings: Full Coupon System Active */
                <>
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
                              <button
                                type="button"
                                onClick={() => setInfoModalCoupon(activeCoupon)}
                                style={{
                                  background: '#DCFCE7',
                                  border: '1px solid #86EFAC',
                                  color: '#166534',
                                  borderRadius: '6px',
                                  padding: '0.15rem 0.5rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <Info size={12} /> Details
                              </button>
                            </div>
                            <div style={{ color: '#166534', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.2rem' }}>
                              🎉 You save ₹{couponDiscount.toFixed(2)} with this offer!
                            </div>
                            {freeAddonBonus && (
                              <div style={{ marginTop: '0.4rem', fontWeight: 700, color: '#166534', background: '#DCFCE7', border: '1px solid #86EFAC', padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Check size={14} color="#16A34A" strokeWidth={3} />
                                <span>🎁 Free Add-on Perk: <strong>"{freeAddonBonus}"</strong> was automatically added to your cart for ₹0 FREE!</span>
                              </div>
                            )}
                            {discountedAddonBonus && (
                              <div style={{ marginTop: '0.4rem', fontWeight: 700, color: '#1E40AF', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Sparkles size={14} color="#2563EB" />
                                <span>✨ Add-on Perk: Special discount applied on <strong>"{discountedAddonBonus}"</strong>!</span>
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

                  {/* Eligible Coupons List - If coupon is applied, show only remaining coupons */}
                  {selectedCouponCode ? (
                    remainingCoupons.length > 0 && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                            Other Available Offers ({remainingCoupons.length})
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            Tap Apply to switch offer
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {remainingCoupons.map(coupon => {
                            const discountTag = coupon.discountType === 'FLAT'
                              ? `₹${coupon.discountAmount} FLAT OFF`
                              : coupon.discountType === 'NONE'
                                ? (coupon.freeAddonId ? '🎁 FREE ADD-ON' : '⚡ ADD-ON DISCOUNT')
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
                                  border: '1px solid #E2E8F0',
                                  background: '#FFFFFF',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                  transition: 'all 0.2s ease',
                                  gap: '0.75rem'
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                    <span style={{
                                      fontWeight: 800,
                                      fontSize: '0.88rem',
                                      color: 'var(--primary-blue)',
                                      background: '#EFF6FF',
                                      padding: '0.2rem 0.55rem',
                                      borderRadius: '6px',
                                      border: '1px dashed #3B82F6',
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
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setInfoModalCoupon(coupon);
                                      }}
                                      style={{
                                        background: '#F1F5F9',
                                        border: '1px solid #CBD5E1',
                                        color: '#0284C7',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '6px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}
                                    >
                                      <Info size={12} /> Details
                                    </button>
                                  </div>
                                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1E293B' }}>
                                    {coupon.title}
                                  </div>

                                  {/* Free or Discounted Add-on Perk Indicator */}
                                  {coupon.freeAddonId && (
                                    <div style={{ marginTop: '0.3rem', fontSize: '0.74rem', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <span>🎁 Includes FREE Add-on:</span>
                                      <span style={{ textDecoration: 'underline' }}>
                                        {availableAddons.find(a => Number(a.id) === Number(coupon.freeAddonId))?.name || 'Add-on'} (Auto-added with ₹0 value)
                                      </span>
                                    </div>
                                  )}
                                  {coupon.discountAddonId && (
                                    <div style={{ marginTop: '0.3rem', fontSize: '0.74rem', color: '#1D4ED8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <span>⚡ Includes Discounted Add-on:</span>
                                      <span>
                                        {availableAddons.find(a => Number(a.id) === Number(coupon.discountAddonId))?.name || 'Add-on'} ({coupon.addonDiscountType === 'FREE' ? '100% FREE' : coupon.addonDiscountType === 'FLAT' ? `₹${coupon.addonDiscountValue} OFF` : `${coupon.addonDiscountValue}% OFF`})
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div style={{ flexShrink: 0 }}>
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
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  ) : (
                    /* No coupon currently applied: Show all eligible coupons */
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
                            const discountTag = coupon.discountType === 'FLAT'
                              ? `₹${coupon.discountAmount} FLAT OFF`
                              : coupon.discountType === 'NONE'
                                ? (coupon.freeAddonId ? '🎁 FREE ADD-ON' : '⚡ ADD-ON DISCOUNT')
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
                                  border: '1px solid #E2E8F0',
                                  background: '#FFFFFF',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                  transition: 'all 0.2s ease',
                                  gap: '0.75rem'
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                    <span style={{
                                      fontWeight: 800,
                                      fontSize: '0.88rem',
                                      color: 'var(--primary-blue)',
                                      background: '#EFF6FF',
                                      padding: '0.2rem 0.55rem',
                                      borderRadius: '6px',
                                      border: '1px dashed #3B82F6',
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
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setInfoModalCoupon(coupon);
                                      }}
                                      style={{
                                        background: '#F1F5F9',
                                        border: '1px solid #CBD5E1',
                                        color: '#0284C7',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '6px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}
                                    >
                                      <Info size={12} /> Details
                                    </button>
                                  </div>
                                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1E293B' }}>
                                    {coupon.title}
                                  </div>

                                  {/* Free or Discounted Add-on Perk Indicator */}
                                  {coupon.freeAddonId && (
                                    <div style={{ marginTop: '0.3rem', fontSize: '0.74rem', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <span>🎁 Includes FREE Add-on:</span>
                                      <span style={{ textDecoration: 'underline' }}>
                                        {availableAddons.find(a => Number(a.id) === Number(coupon.freeAddonId))?.name || 'Add-on'} (Auto-added with ₹0 value)
                                      </span>
                                    </div>
                                  )}
                                  {coupon.discountAddonId && (
                                    <div style={{ marginTop: '0.3rem', fontSize: '0.74rem', color: '#1D4ED8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <span>⚡ Includes Discounted Add-on:</span>
                                      <span>
                                        {availableAddons.find(a => Number(a.id) === Number(coupon.discountAddonId))?.name || 'Add-on'} ({coupon.addonDiscountType === 'FREE' ? '100% FREE' : coupon.addonDiscountType === 'FLAT' ? `₹${coupon.addonDiscountValue} OFF` : `${coupon.addonDiscountValue}% OFF`})
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div style={{ flexShrink: 0 }}>
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
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

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
                  <span>
                    {planDiscount > 0 && (
                      <span style={{ textDecoration: 'line-through', color: '#94A3B8', marginRight: '0.4rem', fontSize: '0.85rem' }}>
                        ₹{actualWashPrice}
                      </span>
                    )}
                    <strong style={{ color: 'var(--primary-navy)' }}>₹{baseWashPrice}</strong>
                  </span>
                </div>

                {subWashDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#92400E', fontWeight: 700 }}>
                    <span>• 👑 VIP Pass Benefit ({currentWashVipCoverage?.planName})</span>
                    <span>-₹{subWashDiscount.toFixed(2)} (Wash Covered)</span>
                  </div>
                )}

                {totalVipAddonSavings > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#92400E', fontWeight: 700 }}>
                    <span>• 👑 VIP Complimentary Add-on Savings</span>
                    <span>-₹{totalVipAddonSavings.toFixed(2)}</span>
                  </div>
                )}

                {planDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                    <span>• Plan Special Offer Discount</span>
                    <span>-₹{planDiscount.toFixed(2)}</span>
                  </div>
                )}

                {selectedAddonsList.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 700 }}>
                      <span>Add-on Services ({selectedAddonsList.length})</span>
                      <span>+₹{totalAddonsEffective}</span>
                    </div>

                    {/* Itemized addon breakdown */}
                    <div style={{
                      background: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}>
                      {selectedAddonsList.map(addon => {
                        const pricing = getAddonPricing(addon);
                        return (
                          <div key={addon.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}>
                              <span>• {addon.name}</span>
                              {pricing.isVipFree && (
                                <span style={{
                                  background: '#FEF3C7',
                                  color: '#92400E',
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800
                                }}>
                                  👑 FREE via VIP Pass
                                </span>
                              )}
                              {!pricing.isVipFree && pricing.isFree && (
                                <span style={{
                                  background: '#DCFCE7',
                                  color: '#166534',
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800
                                }}>
                                  🎁 FREE via {activeCoupon?.code}
                                </span>
                              )}
                              {!pricing.isVipFree && pricing.isDiscounted && !pricing.isFree && (
                                <span style={{
                                  background: '#EFF6FF',
                                  color: '#1D4ED8',
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800
                                }}>
                                  ⚡ Deal via {activeCoupon?.code}
                                </span>
                              )}
                            </div>

                            <div>
                              {pricing.isFree ? (
                                <span>
                                  <span style={{ textDecoration: 'line-through', color: '#94A3B8', marginRight: '0.35rem', fontSize: '0.78rem' }}>₹{pricing.originalPrice}</span>
                                  <strong style={{ color: pricing.isVipFree ? '#D97706' : '#16A34A', fontSize: '0.9rem' }}>₹0</strong>
                                </span>
                              ) : pricing.isDiscounted ? (
                                <span>
                                  <span style={{ textDecoration: 'line-through', color: '#94A3B8', marginRight: '0.35rem', fontSize: '0.78rem' }}>₹{pricing.originalPrice}</span>
                                  <strong style={{ color: '#0369A1', fontSize: '0.9rem' }}>₹{pricing.effectivePrice}</strong>
                                </span>
                              ) : (
                                <span style={{ color: '#475569', fontWeight: 600 }}>+₹{pricing.originalPrice}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {washCouponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                    <span>Coupon Package Discount ({selectedCouponCode})</span>
                    <span>-₹{washCouponDiscount.toFixed(2)}</span>
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
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: (finalPayable === 0 && (isWashCoveredBySub || totalVipAddonSavings > 0)) ? '#D97706' : '#0284C7' }}>
                    ₹{finalPayable}
                  </div>
                </div>

                {totalSavings > 0 && (
                  <div style={{
                    marginTop: '0.75rem',
                    background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                    border: '1px solid #A7F3D0',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#065F46', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      🎉 Total You Save on this Booking
                    </span>
                    <span style={{ color: '#047857', fontWeight: 900, fontSize: '1.05rem' }}>
                      ₹{totalSavings.toFixed(2)}
                    </span>
                  </div>
                )}
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
                    background: (finalPayable === 0 && (isWashCoveredBySub || totalVipAddonSavings > 0))
                      ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
                      : 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)',
                    boxShadow: (finalPayable === 0 && (isWashCoveredBySub || totalVipAddonSavings > 0))
                      ? '0 8px 24px rgba(217, 119, 6, 0.4)'
                      : '0 8px 24px rgba(6, 182, 212, 0.4)'
                  }}
                >
                  {loading 
                    ? 'Processing Booking...' 
                    : (finalPayable === 0 && (isWashCoveredBySub || totalVipAddonSavings > 0))
                      ? '👑 Confirm VIP Booking (₹0 - Direct Slot Booking)'
                      : finalPayable === 0 
                        ? 'Confirm Booking (₹0)' 
                        : `Pay & Confirm Booking (₹${finalPayable})`}
                </button>
              </div>
            </div>

          </div>
        </form>
      )}

      {/* Complete Coupon Details Popup Modal */}
      {infoModalCoupon && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setInfoModalCoupon(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '480px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setInfoModalCoupon(null)}
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

            {/* Header: Coupon Code + Status Tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
              <span style={{
                fontWeight: 900,
                fontSize: '1.1rem',
                color: 'var(--primary-blue)',
                background: '#EFF6FF',
                padding: '0.3rem 0.8rem',
                borderRadius: '8px',
                border: '1.5px dashed #3B82F6',
                letterSpacing: '0.05em'
              }}>
                {infoModalCoupon.code}
              </span>

              {selectedCouponCode === infoModalCoupon.code ? (
                <span style={{
                  background: '#16A34A',
                  color: '#FFF',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <Check size={13} strokeWidth={3} /> APPLIED
                </span>
              ) : (
                <span style={{
                  background: '#D1FAE5',
                  color: '#047857',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '8px'
                }}>
                  {infoModalCoupon.discountType === 'FLAT'
                    ? `₹${infoModalCoupon.discountAmount} FLAT OFF`
                    : infoModalCoupon.discountType === 'NONE'
                      ? (infoModalCoupon.freeAddonId ? '🎁 FREE ADD-ON' : '⚡ ADD-ON DISCOUNT')
                      : `${infoModalCoupon.discountPct}% OFF`}
                </span>
              )}
            </div>

            {/* Coupon Title */}
            <h3 style={{ margin: '0.25rem 0 0.85rem', color: 'var(--primary-navy)', fontSize: '1.18rem', fontWeight: 800 }}>
              {infoModalCoupon.title}
            </h3>

            {/* Perks Summary if Add-ons included */}
            {infoModalCoupon.freeAddonId && (
              <div style={{
                background: '#DCFCE7',
                border: '1px solid #86EFAC',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                color: '#166534',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <span>🎁 Includes Free Add-on:</span>
                <span style={{ textDecoration: 'underline' }}>
                  {availableAddons.find(a => Number(a.id) === Number(infoModalCoupon.freeAddonId))?.name || 'Add-on'} (Auto-added with ₹0 value)
                </span>
              </div>
            )}

            {infoModalCoupon.discountAddonId && (
              <div style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                color: '#1E40AF',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <span>⚡ Includes Discounted Add-on:</span>
                <span>
                  {availableAddons.find(a => Number(a.id) === Number(infoModalCoupon.discountAddonId))?.name || 'Add-on'} ({infoModalCoupon.addonDiscountType === 'FREE' ? '100% FREE' : infoModalCoupon.addonDiscountType === 'FLAT' ? `₹${infoModalCoupon.addonDiscountValue} OFF` : `${infoModalCoupon.addonDiscountValue}% OFF`})
                </span>
              </div>
            )}

            {/* Complete Description and Offer Terms */}
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--primary-navy)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Complete Offer Details & Terms
              </h4>
              <div style={{
                color: '#334155',
                fontSize: '0.88rem',
                lineHeight: 1.65,
                whiteSpace: 'pre-line',
                background: '#F8FAFC',
                padding: '0.9rem 1.1rem',
                borderRadius: '12px',
                border: '1px solid #E2E8F0'
              }}>
                {infoModalCoupon.description || 'Enjoy this exclusive promotional offer when scheduling your car wash!'}
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #F1F5F9', paddingTop: '1.15rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setInfoModalCoupon(null)}
                className="btn btn-outline"
                style={{ borderRadius: '10px', padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}
              >
                Close
              </button>
              {selectedCouponCode === infoModalCoupon.code ? (
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveCoupon();
                    setInfoModalCoupon(null);
                  }}
                  style={{
                    background: '#FEE2E2',
                    color: '#DC2626',
                    border: '1px solid #FCA5A5',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Remove Coupon
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleApplyCoupon(infoModalCoupon.code);
                    setInfoModalCoupon(null);
                  }}
                  className="btn btn-primary"
                  style={{ borderRadius: '10px', padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  Apply This Offer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookSlot;
