import prisma from '../config/db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'wmc-secure-production-jwt-key-2026-auth';

// In-memory Waiting Queue for Slots currently locked in checkout
// Map: slotId -> Array<{ userId: number, joinedAt: Date }>
const slotWaitingQueue = new Map();

export const addToSlotWaitQueue = (slotId, userId) => {
  if (!slotId || !userId) return;
  const list = slotWaitingQueue.get(slotId) || [];
  if (!list.some(item => Number(item.userId) === Number(userId))) {
    list.push({ userId: Number(userId), joinedAt: new Date() });
    slotWaitingQueue.set(slotId, list);
  }
};

export const getSlotWaitQueueCount = (slotId) => {
  if (!slotId) return 0;
  const list = slotWaitingQueue.get(slotId) || [];
  return list.length;
};

export const clearSlotWaitQueue = (slotId) => {
  if (slotId) {
    slotWaitingQueue.delete(slotId);
  }
};

// Clean up expired slot payment locks (>7 mins unpaid)
export const cleanupExpiredSlotLocks = async () => {
  try {
    const now = new Date();
    await prisma.booking.updateMany({
      where: {
        paymentStatus: 'PENDING',
        status: { in: ['PENDING', 'PENDING_PAYMENT'] },
        paymentLockExpiresAt: {
          lt: now
        }
      },
      data: {
        status: 'CANCELLED',
        cancellationReason: 'Payment session expired / timed out (slot released to waiting customers)',
        paymentLockExpiresAt: null
      }
    });
  } catch (err) {
    console.warn('Error cleaning up expired slot locks:', err);
  }
};

// Distance matrix between Visakhapatnam primary zones (in km)
export const DEFAULT_ZONE_DISTANCES = {
  'NAD':          { 'NAD': 0, 'GAJUWAKA': 10, 'PENDURTHI': 10, 'MADDILAPALEM': 10, 'MADHURAWADA': 20 },
  'GAJUWAKA':     { 'NAD': 10, 'GAJUWAKA': 0, 'PENDURTHI': 18, 'MADDILAPALEM': 20, 'MADHURAWADA': 30 },
  'PENDURTHI':    { 'NAD': 10, 'GAJUWAKA': 18, 'PENDURTHI': 0, 'MADDILAPALEM': 18, 'MADHURAWADA': 25 },
  'MADDILAPALEM': { 'NAD': 10, 'GAJUWAKA': 20, 'PENDURTHI': 18, 'MADDILAPALEM': 0, 'MADHURAWADA': 12 },
  'MADHURAWADA':  { 'NAD': 20, 'GAJUWAKA': 30, 'PENDURTHI': 25, 'MADDILAPALEM': 12, 'MADHURAWADA': 0 }
};

export const DEFAULT_SLOTS = [
  '07:30 AM - 09:30 AM',
  '10:00 AM - 12:00 PM',
  '12:30 PM - 02:30 PM',
  '03:00 PM - 05:00 PM',
  '05:30 PM - 07:30 PM',
  '07:00 PM - 09:00 PM'
];

export const DEFAULT_WEEKLY_TEMPLATE = {
  'MONDAY': {
    enabled: true,
    slots: DEFAULT_SLOTS,
    capacity: 1
  },
  'TUESDAY': {
    enabled: true,
    slots: DEFAULT_SLOTS,
    capacity: 1
  },
  'WEDNESDAY': {
    enabled: true,
    slots: DEFAULT_SLOTS,
    capacity: 1
  },
  'THURSDAY': {
    enabled: true,
    slots: DEFAULT_SLOTS,
    capacity: 1
  },
  'FRIDAY': {
    enabled: true,
    slots: DEFAULT_SLOTS,
    capacity: 1
  },
  'SATURDAY': {
    enabled: true,
    slots: DEFAULT_SLOTS,
    capacity: 1
  },
  'SUNDAY': {
    enabled: true,
    slots: DEFAULT_SLOTS,
    capacity: 1
  }
};

// Helper to parse time window string into minute values from midnight
export const parseSlotTimeWindow = (slotStr) => {
  if (!slotStr || typeof slotStr !== 'string') return null;

  const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi;
  const matches = [...slotStr.matchAll(timeRegex)];

  if (matches.length === 0) return null;

  const parseSingleTime = (match) => {
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();

    if (meridiem === 'PM' && hour !== 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;

    return hour * 60 + minute;
  };

  const startMinutes = parseSingleTime(matches[0]);
  const endMinutes = matches.length > 1 ? parseSingleTime(matches[1]) : startMinutes + 120;

  return { startMinutes, endMinutes };
};

// Calculate realistic road transit distance from GPS coordinates (km)
export const calculateCoordDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined ||
      lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
    return null;
  }
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null;

  const R = 6371; // Earth radius in km
  const dLat = (nLat2 - nLat1) * Math.PI / 180;
  const dLon = (nLon2 - nLon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(nLat1 * Math.PI / 180) * Math.cos(nLat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightKm = R * c;
  // Road factor for Visakhapatnam urban transit (~1.3x)
  return Math.round(straightKm * 1.3 * 10) / 10;
};

// Helper to normalize address / area name to one of 5 zones
export const normalizeToZone = (text = '') => {
  const t = text.toUpperCase();
  if (t.includes('GAJUWAKA') || t.includes('STEEL') || t.includes('KURMANNAPALEM') || t.includes('SHEELA')) return 'GAJUWAKA';
  if (t.includes('PENDURTHI') || t.includes('SUJATHA') || t.includes('SIMHACHALAM') || t.includes('VEPAGUNTA')) return 'PENDURTHI';
  if (t.includes('MADHURAWADA') || t.includes('RUSHIKONDA') || t.includes('PM PALEM') || t.includes('KOMMADI') || t.includes('YENDADA')) return 'MADHURAWADA';
  if (t.includes('MADDILAPALEM') || t.includes('SIRIPURAM') || t.includes('MVP') || t.includes('DWARAKA') || t.includes('AKKAYYAPALEM') || t.includes('RTC')) return 'MADDILAPALEM';
  return 'NAD'; // Central hub default
};

export const getZoneDistance = (zoneA, zoneB, customMatrix = null) => {
  const matrix = customMatrix || DEFAULT_ZONE_DISTANCES;
  const zA = normalizeToZone(zoneA);
  const zB = normalizeToZone(zoneB);
  if (matrix[zA] && matrix[zA][zB] !== undefined) {
    return matrix[zA][zB];
  }
  if (matrix[zB] && matrix[zB][zA] !== undefined) {
    return matrix[zB][zA];
  }
  return 15; // default fallback
};

// Build distance matrix between all configured service regions
export const buildDynamicDistanceMatrix = (serviceAreas, customMatrix = null) => {
  const matrix = {};
  const areas = Array.isArray(serviceAreas) ? serviceAreas : [];
  
  for (const a of areas) {
    matrix[a.name] = {};
    for (const b of areas) {
      if (a.id === b.id || a.name === b.name) {
        matrix[a.name][b.name] = 0;
      } else if (customMatrix && customMatrix[a.name] && customMatrix[a.name][b.name] !== undefined) {
        matrix[a.name][b.name] = Number(customMatrix[a.name][b.name]);
      } else if (customMatrix && customMatrix[b.name] && customMatrix[b.name][a.name] !== undefined) {
        matrix[a.name][b.name] = Number(customMatrix[b.name][a.name]);
      } else if (a.latitude && a.longitude && b.latitude && b.longitude) {
        const km = calculateCoordDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
        matrix[a.name][b.name] = km !== null ? km : 15;
      } else {
        const zA = normalizeToZone(a.name);
        const zB = normalizeToZone(b.name);
        matrix[a.name][b.name] = DEFAULT_ZONE_DISTANCES[zA]?.[zB] ?? 15;
      }
    }
  }
  return matrix;
};

// Public: Get dynamically available slots for booking date with strict locking and queue status
export const getAvailableBookingSlots = async (req, res) => {
  try {
    const { date, serviceAreaId, address = '', zone = '' } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter (YYYY-MM-DD) is required' });
    }

    const reqDateStr = String(date).split('T')[0];

    // Optional user identification from token
    let requestingUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader.split(' ')[1];
        if (token) {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.id) requestingUserId = decoded.id;
        }
      } catch (e) {}
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    
    if (settings && settings.bookingsEnabled === false) {
      return res.json({
        date: reqDateStr,
        zone: 'NAD',
        activeWorkers: 0,
        configuredSlots: [],
        slots: [],
        isReleased: false,
        bookingsEnabled: false,
        message: 'Doorstep car wash bookings are currently paused by administration. Please check back later.'
      });
    }

    // 1. Check if the date is approved and released by admin
    let releasedDatesList = [];
    if (settings?.releasedDates) {
      try {
        const parsed = JSON.parse(settings.releasedDates);
        if (Array.isArray(parsed)) releasedDatesList = parsed;
      } catch (e) {}
    }

    // If releasedDatesList has been configured and the date is not in the list:
    // (If releasedDatesList is empty, allow open access or default template dates)
    const isExplicitlyReleased = releasedDatesList.length === 0 || releasedDatesList.includes(reqDateStr);
    if (!isExplicitlyReleased) {
      return res.json({
        date: reqDateStr,
        zone: 'NAD',
        activeWorkers: 0,
        configuredSlots: [],
        slots: [],
        isReleased: false,
        bookingsEnabled: true,
        message: 'No approved slots released by administration for this date. Please choose another date.'
      });
    }

    const allAreas = await prisma.serviceArea.findMany();

    // 2. Parse Weekly Template & Monthly Overrides to resolve slots for this date
    let weeklyTemplate = DEFAULT_WEEKLY_TEMPLATE;
    if (settings?.weeklySlotTemplate) {
      try {
        const parsed = JSON.parse(settings.weeklySlotTemplate);
        if (typeof parsed === 'object' && parsed !== null) weeklyTemplate = parsed;
      } catch (e) {}
    }

    let monthlyOverrides = {};
    if (settings?.monthlySlotOverrides) {
      try {
        const parsed = JSON.parse(settings.monthlySlotOverrides);
        if (typeof parsed === 'object' && parsed !== null) monthlyOverrides = parsed;
      } catch (e) {}
    }

    // Determine Day of Week for requested date (in UTC/IST safe parsing)
    const dParts = reqDateStr.split('-');
    const dayDate = new Date(Number(dParts[0]), Number(dParts[1]) - 1, Number(dParts[2]));
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeekName = dayNames[dayDate.getDay()];

    const monthKey = reqDateStr.substring(0, 7); // 'YYYY-MM'

    let configuredSlots = DEFAULT_SLOTS;
    let dayCapacity = Math.max(1, settings?.activeWorkers || 1);
    let isDayClosed = false;

    // Check specific date override first
    if (monthlyOverrides[reqDateStr]) {
      const overrideVal = monthlyOverrides[reqDateStr];
      if (Array.isArray(overrideVal) && overrideVal.length > 0) {
        configuredSlots = overrideVal.slice(0, 6);
      } else if (typeof overrideVal === 'object' && overrideVal !== null) {
        if (overrideVal.enabled === false) isDayClosed = true;
        if (Array.isArray(overrideVal.slots)) configuredSlots = overrideVal.slots.slice(0, 6);
        if (overrideVal.capacity) dayCapacity = Math.max(1, Number(overrideVal.capacity));
      }
    } else if (monthlyOverrides[monthKey] && Array.isArray(monthlyOverrides[monthKey])) {
      // Month-wide override
      configuredSlots = monthlyOverrides[monthKey].slice(0, 6);
    } else if (weeklyTemplate[dayOfWeekName]) {
      // Weekly template configuration
      const tDay = weeklyTemplate[dayOfWeekName];
      if (tDay.enabled === false) isDayClosed = true;
      if (Array.isArray(tDay.slots) && tDay.slots.length > 0) configuredSlots = tDay.slots.slice(0, 6);
      if (tDay.capacity) dayCapacity = Math.max(1, Number(tDay.capacity));
    } else if (settings?.configuredSlots) {
      try {
        const parsed = JSON.parse(settings.configuredSlots);
        if (Array.isArray(parsed) && parsed.length > 0) configuredSlots = parsed.slice(0, 6);
      } catch (e) {}
    }

    if (isDayClosed) {
      return res.json({
        date: reqDateStr,
        zone: 'NAD',
        activeWorkers: 0,
        configuredSlots: [],
        slots: [],
        isReleased: true,
        isClosed: true,
        message: 'Administration has marked this day closed for doorstep services.'
      });
    }

    const activeWorkers = dayCapacity;
    const maxTravelKm = Number(settings?.maxTravelKm || 15.0);

    // Determine target booking service area & zone
    let targetArea = null;
    let targetZone = 'NAD';
    if (serviceAreaId) {
      targetArea = allAreas.find(a => a.id === Number(serviceAreaId));
      if (targetArea) targetZone = normalizeToZone(targetArea.name);
    } else if (zone) {
      targetArea = allAreas.find(a => a.name.toLowerCase().includes(zone.toLowerCase()) || zone.toLowerCase().includes(a.name.toLowerCase()));
      targetZone = normalizeToZone(zone);
    } else if (address) {
      targetArea = allAreas.find(a => address.toLowerCase().includes(a.name.toLowerCase()));
      targetZone = normalizeToZone(address);
    }

    // Auto-release any expired payment locks (>7 minutes)
    await cleanupExpiredSlotLocks();

    // Query all bookings for this date (confirmed or valid unexpired lock)
    const startOfDay = new Date(`${reqDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${reqDateStr}T23:59:59.999Z`);
    const nowTime = new Date();

    const rawBookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { not: 'CANCELLED' }
      },
      include: {
        serviceArea: true
      }
    });

    // Map confirmed vs currently locked bookings
    const confirmedBookings = [];
    const activePaymentLocks = [];

    rawBookings.forEach(b => {
      if (b.status === 'CANCELLED') return;
      if (b.paymentStatus === 'PAID') {
        confirmedBookings.push(b);
      } else if (b.paymentStatus === 'PENDING') {
        if (b.paymentLockExpiresAt && new Date(b.paymentLockExpiresAt) > nowTime) {
          activePaymentLocks.push(b);
        }
      }
    });

    const norm = (str) => (str || '').toUpperCase().replace(/\s+/g, ' ').trim();

    // Map existing bookings per slot
    const bookingsBySlot = {};
    for (const b of confirmedBookings) {
      const bSlot = norm(b.timeSlot);
      if (!bookingsBySlot[bSlot]) bookingsBySlot[bSlot] = [];
      const bArea = b.serviceArea || allAreas.find(a => a.id === b.serviceAreaId) || null;
      bookingsBySlot[bSlot].push({
        id: b.id,
        employeeId: b.employeeId,
        serviceArea: bArea,
        areaName: bArea?.name || normalizeToZone(b.address || ''),
        zone: normalizeToZone(bArea?.name || b.address || '')
      });
    }

    // Distance calculation helper
    let customMatrix = null;
    if (settings?.zoneDistanceMatrix) {
      try {
        customMatrix = JSON.parse(settings.zoneDistanceMatrix);
      } catch (e) {}
    }

    const calcDistance = (bBookingItem) => {
      const prevArea = bBookingItem.serviceArea;
      if (prevArea && targetArea) {
        if (customMatrix && customMatrix[prevArea.name] && customMatrix[prevArea.name][targetArea.name] !== undefined) {
          return Number(customMatrix[prevArea.name][targetArea.name]);
        }
        if (customMatrix && customMatrix[targetArea.name] && customMatrix[targetArea.name][prevArea.name] !== undefined) {
          return Number(customMatrix[targetArea.name][prevArea.name]);
        }
        if (prevArea.latitude && prevArea.longitude && targetArea.latitude && targetArea.longitude) {
          const gpsKm = calculateCoordDistanceKm(prevArea.latitude, prevArea.longitude, targetArea.latitude, targetArea.longitude);
          if (gpsKm !== null) return gpsKm;
        }
      }
      return getZoneDistance(bBookingItem.zone, targetZone, customMatrix);
    };

    // Current IST date and time (Asia/Kolkata timezone)
    const now = new Date();
    const istDateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const todayIst = istDateFormatter.format(now); // 'YYYY-MM-DD'

    const istTimeParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }).formatToParts(now);

    let curH = 0;
    let curM = 0;
    for (const p of istTimeParts) {
      if (p.type === 'hour') curH = parseInt(p.value, 10);
      if (p.type === 'minute') curM = parseInt(p.value, 10);
    }
    const currentTotalMinutes = curH * 60 + curM;

    const isPastDate = reqDateStr < todayIst;
    const isToday = reqDateStr === todayIst;

    // Evaluate each configured approved slot
    const slotsResult = configuredSlots.map((slotTime, idx) => {
      const normalizedSlot = norm(slotTime);
      const slotId = `SLOT_${reqDateStr.replace(/-/g, '')}_${String(idx + 1).padStart(2, '0')}`;

      const confirmedInThisSlot = confirmedBookings.filter(b => norm(b.timeSlot) === normalizedSlot);
      const locksInThisSlot = activePaymentLocks.filter(b => norm(b.timeSlot) === normalizedSlot);
      const myLock = requestingUserId ? locksInThisSlot.find(b => Number(b.userId) === Number(requestingUserId)) : null;
      const isLockedByYou = Boolean(myLock);

      const waitingCount = getSlotWaitQueueCount(slotId);

      // 1. Past date check
      if (isPastDate) {
        return {
          id: slotId,
          slot: slotTime,
          available: false,
          status: 'PAST',
          reason: 'This date has already passed. Please select an upcoming date.',
          bookedCount: confirmedInThisSlot.length,
          lockedCount: 0,
          capacity: activeWorkers,
          isPastSlot: true
        };
      }

      // 2. Past or ongoing slot for today
      if (isToday) {
        const slotWindow = parseSlotTimeWindow(slotTime);
        if (slotWindow && slotWindow.startMinutes <= currentTotalMinutes) {
          const isOngoing = currentTotalMinutes < slotWindow.endMinutes;
          return {
            id: slotId,
            slot: slotTime,
            available: false,
            status: 'PAST',
            reason: isOngoing 
              ? 'This arrival window is currently in progress. Please select an upcoming slot.'
              : 'This arrival window has already passed for today. Please select an upcoming slot.',
            bookedCount: confirmedInThisSlot.length,
            lockedCount: 0,
            capacity: activeWorkers,
            isPastSlot: true
          };
        }
      }

      // 3. Fully confirmed/paid bookings check
      if (confirmedInThisSlot.length >= activeWorkers) {
        return {
          id: slotId,
          slot: slotTime,
          available: false,
          status: 'BOOKED',
          reason: 'Slot fully booked and confirmed by customer',
          bookedCount: confirmedInThisSlot.length,
          lockedCount: 0,
          capacity: activeWorkers
        };
      }

      // 4. Temporary Payment Lock Check (Slot in checkout)
      if (confirmedInThisSlot.length + locksInThisSlot.length >= activeWorkers) {
        if (isLockedByYou) {
          return {
            id: slotId,
            slot: slotTime,
            available: true,
            status: 'LOCKED_BY_YOU',
            isLockedByYou: true,
            lockExpiresAt: myLock.paymentLockExpiresAt,
            bookingId: myLock.id,
            reason: 'You have reserved this slot for checkout. Complete payment to confirm.',
            bookedCount: confirmedInThisSlot.length,
            lockedCount: locksInThisSlot.length,
            capacity: activeWorkers
          };
        }

        // Locked by another customer completing checkout
        const earliestExpiry = locksInThisSlot[0]?.paymentLockExpiresAt;
        return {
          id: slotId,
          slot: slotTime,
          available: false,
          status: 'LOCKED',
          lockExpiresAt: earliestExpiry,
          reason: 'Proceeding to payment gateway - Please choose another slot (Warning: Do not refresh or close)',
          bookedCount: confirmedInThisSlot.length,
          lockedCount: locksInThisSlot.length,
          capacity: activeWorkers
        };
      }

      // 5. Intelligent routing & distance check when capacity is 1 field technician
      if (activeWorkers === 1) {
        const prevSlot = idx > 0 ? norm(configuredSlots[idx - 1]) : null;
        if (prevSlot && bookingsBySlot[prevSlot] && bookingsBySlot[prevSlot].length > 0) {
          const prevBooking = bookingsBySlot[prevSlot][0];
          const dist = calcDistance(prevBooking);
          if (dist > maxTravelKm) {
            const areaLabel = prevBooking.areaName || prevBooking.zone;
            return {
              id: slotId,
              slot: slotTime,
              available: false,
              status: 'DISTANCE_CONFLICT',
              reason: `Technician in ${areaLabel} (${dist}km away). Cannot reach ${targetArea?.name || targetZone} in time.`,
              distanceKm: dist,
              conflictZone: areaLabel,
              bookedCount: confirmedInThisSlot.length,
              lockedCount: locksInThisSlot.length,
              capacity: activeWorkers
            };
          }
        }

        const nextSlot = idx < configuredSlots.length - 1 ? norm(configuredSlots[idx + 1]) : null;
        if (nextSlot && bookingsBySlot[nextSlot] && bookingsBySlot[nextSlot].length > 0) {
          const nextBooking = bookingsBySlot[nextSlot][0];
          const dist = calcDistance(nextBooking);
          if (dist > maxTravelKm) {
            const areaLabel = nextBooking.areaName || nextBooking.zone;
            return {
              id: slotId,
              slot: slotTime,
              available: false,
              status: 'DISTANCE_CONFLICT',
              reason: `Technician scheduled in ${areaLabel} next slot (${dist}km away).`,
              distanceKm: dist,
              conflictZone: areaLabel,
              bookedCount: confirmedInThisSlot.length,
              lockedCount: locksInThisSlot.length,
              capacity: activeWorkers
            };
          }
        }
      }

      // 6. Available Slot
      return {
        id: slotId,
        slot: slotTime,
        available: true,
        status: 'AVAILABLE',
        reason: 'Available',
        bookedCount: confirmedInThisSlot.length,
        lockedCount: locksInThisSlot.length,
        capacity: activeWorkers,
        waitingCount
      };
    });

    res.json({
      date: reqDateStr,
      isReleased: true,
      targetZone: targetArea?.name || targetZone,
      activeWorkers,
      maxTravelKm,
      slots: slotsResult
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: error.message });
  }
};

// User: Join waiting queue for a locked slot
export const joinSlotQueue = async (req, res) => {
  try {
    const { slotId } = req.body;
    if (!slotId) return res.status(400).json({ error: 'slotId is required' });

    addToSlotWaitQueue(slotId, req.user.id);
    const count = getSlotWaitQueueCount(slotId);

    res.json({
      success: true,
      slotId,
      waitingCount: count,
      message: 'You have been placed in the waiting queue. If the customer does not complete payment, this slot will automatically become available for you.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Get current slots, weekly template, and dispatch configuration
export const getAdminSlotsConfig = async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const serviceAreas = await prisma.serviceArea.findMany({ orderBy: { id: 'asc' } });
    
    let configuredSlots = DEFAULT_SLOTS;
    if (settings?.configuredSlots) {
      try {
        const p = JSON.parse(settings.configuredSlots);
        if (Array.isArray(p)) configuredSlots = p.slice(0, 6);
      } catch (e) {}
    }

    let weeklySlotTemplate = DEFAULT_WEEKLY_TEMPLATE;
    if (settings?.weeklySlotTemplate) {
      try {
        const p = JSON.parse(settings.weeklySlotTemplate);
        if (typeof p === 'object' && p !== null) weeklySlotTemplate = p;
      } catch (e) {}
    }

    let releasedDates = [];
    if (settings?.releasedDates) {
      try {
        const p = JSON.parse(settings.releasedDates);
        if (Array.isArray(p)) releasedDates = p;
      } catch (e) {}
    }

    let monthlySlotOverrides = {};
    if (settings?.monthlySlotOverrides) {
      try {
        monthlySlotOverrides = JSON.parse(settings.monthlySlotOverrides);
      } catch (e) {}
    }

    let customMatrix = null;
    if (settings?.zoneDistanceMatrix) {
      try {
        customMatrix = JSON.parse(settings.zoneDistanceMatrix);
      } catch (e) {}
    }

    const dynamicMatrix = buildDynamicDistanceMatrix(serviceAreas, customMatrix);

    res.json({
      activeWorkers: settings?.activeWorkers || 1,
      maxTravelKm: settings?.maxTravelKm || 15.0,
      configuredSlots,
      weeklySlotTemplate,
      releasedDates,
      monthlySlotOverrides,
      serviceAreas,
      zoneDistanceMatrix: dynamicMatrix
    });
  } catch (error) {
    console.error('Error getting slots config:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Update slots, weekly template, released dates and dispatch settings
export const updateAdminSlotsConfig = async (req, res) => {
  try {
    const { 
      activeWorkers, 
      maxTravelKm, 
      configuredSlots, 
      weeklySlotTemplate, 
      releasedDates, 
      monthlySlotOverrides, 
      zoneDistanceMatrix 
    } = req.body;

    const data = {};
    if (activeWorkers !== undefined) data.activeWorkers = Math.max(1, Number(activeWorkers));
    if (maxTravelKm !== undefined) data.maxTravelKm = Math.max(1, Number(maxTravelKm));
    if (configuredSlots !== undefined) {
      data.configuredSlots = JSON.stringify(Array.isArray(configuredSlots) ? configuredSlots.slice(0, 6) : DEFAULT_SLOTS);
    }
    if (weeklySlotTemplate !== undefined) {
      data.weeklySlotTemplate = typeof weeklySlotTemplate === 'string' ? weeklySlotTemplate : JSON.stringify(weeklySlotTemplate);
    }
    if (releasedDates !== undefined) {
      data.releasedDates = typeof releasedDates === 'string' ? releasedDates : JSON.stringify(releasedDates);
    }
    if (monthlySlotOverrides !== undefined) {
      data.monthlySlotOverrides = typeof monthlySlotOverrides === 'string' ? monthlySlotOverrides : JSON.stringify(monthlySlotOverrides);
    }
    if (zoneDistanceMatrix !== undefined) {
      data.zoneDistanceMatrix = typeof zoneDistanceMatrix === 'string' ? zoneDistanceMatrix : JSON.stringify(zoneDistanceMatrix);
    }

    const updated = await prisma.systemSettings.update({
      where: { id: 1 },
      data
    });

    res.json({
      success: true,
      message: 'Slot scheduling and dispatch configuration updated successfully',
      settings: updated
    });
  } catch (error) {
    console.error('Error updating slots config:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin Helper: Batch Release a Week based on Default Weekly Template
export const adminReleaseWeek = async (req, res) => {
  try {
    const { weekStartDate } = req.body; // e.g. '2026-11-02'
    if (!weekStartDate) return res.status(400).json({ error: 'weekStartDate (YYYY-MM-DD) is required' });

    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    let weeklyTemplate = DEFAULT_WEEKLY_TEMPLATE;
    if (settings?.weeklySlotTemplate) {
      try {
        const p = JSON.parse(settings.weeklySlotTemplate);
        if (typeof p === 'object' && p !== null) weeklyTemplate = p;
      } catch (e) {}
    }

    let existingReleased = [];
    if (settings?.releasedDates) {
      try {
        const p = JSON.parse(settings.releasedDates);
        if (Array.isArray(p)) existingReleased = p;
      } catch (e) {}
    }

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const parts = weekStartDate.split('-');
    const baseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    const newReleasedDates = [...existingReleased];
    const generatedWeekDays = [];

    for (let i = 0; i < 7; i++) {
      const cur = new Date(baseDate);
      cur.setDate(baseDate.getDate() + i);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const dayName = dayNames[cur.getDay()];
      const dayTemplate = weeklyTemplate[dayName] || { enabled: true, slots: DEFAULT_SLOTS, capacity: 1 };

      if (dayTemplate.enabled !== false) {
        if (!newReleasedDates.includes(dateStr)) {
          newReleasedDates.push(dateStr);
        }
      }
      generatedWeekDays.push({ date: dateStr, dayName, slots: dayTemplate.slots, capacity: dayTemplate.capacity, enabled: dayTemplate.enabled !== false });
    }

    newReleasedDates.sort();

    await prisma.systemSettings.update({
      where: { id: 1 },
      data: { releasedDates: JSON.stringify(newReleasedDates) }
    });

    res.json({
      success: true,
      message: `Week released successfully! ${generatedWeekDays.length} days populated with default weekly template.`,
      releasedDates: newReleasedDates,
      days: generatedWeekDays
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin Helper: Batch Release an Entire Month based on Default Weekly Template
export const adminReleaseMonth = async (req, res) => {
  try {
    const { month } = req.body; // e.g. '2026-11'
    if (!month) return res.status(400).json({ error: 'month (YYYY-MM) is required' });

    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    let weeklyTemplate = DEFAULT_WEEKLY_TEMPLATE;
    if (settings?.weeklySlotTemplate) {
      try {
        const p = JSON.parse(settings.weeklySlotTemplate);
        if (typeof p === 'object' && p !== null) weeklyTemplate = p;
      } catch (e) {}
    }

    let existingReleased = [];
    if (settings?.releasedDates) {
      try {
        const p = JSON.parse(settings.releasedDates);
        if (Array.isArray(p)) existingReleased = p;
      } catch (e) {}
    }

    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const newReleasedDates = [...existingReleased];
    let releasedCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const cur = new Date(year, monthIndex, day);
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayName = dayNames[cur.getDay()];
      const dayTemplate = weeklyTemplate[dayName] || { enabled: true };

      if (dayTemplate.enabled !== false) {
        if (!newReleasedDates.includes(dateStr)) {
          newReleasedDates.push(dateStr);
          releasedCount++;
        }
      }
    }

    newReleasedDates.sort();

    await prisma.systemSettings.update({
      where: { id: 1 },
      data: { releasedDates: JSON.stringify(newReleasedDates) }
    });

    res.json({
      success: true,
      message: `Month ${month} released successfully! ${releasedCount} new dates approved for booking.`,
      releasedDates: newReleasedDates
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
