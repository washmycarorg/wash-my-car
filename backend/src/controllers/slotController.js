import prisma from '../config/db.js';

// Distance matrix between Visakhapatnam primary zones (in km)
export const DEFAULT_ZONE_DISTANCES = {
  'NAD':          { 'NAD': 0, 'GAJUWAKA': 10, 'PENDURTHI': 10, 'MADDILAPALEM': 10, 'MADHURAWADA': 20 },
  'GAJUWAKA':     { 'NAD': 10, 'GAJUWAKA': 0, 'PENDURTHI': 18, 'MADDILAPALEM': 20, 'MADHURAWADA': 30 },
  'PENDURTHI':    { 'NAD': 10, 'GAJUWAKA': 18, 'PENDURTHI': 0, 'MADDILAPALEM': 18, 'MADHURAWADA': 25 },
  'MADDILAPALEM': { 'NAD': 10, 'GAJUWAKA': 20, 'PENDURTHI': 18, 'MADDILAPALEM': 0, 'MADHURAWADA': 12 },
  'MADHURAWADA':  { 'NAD': 20, 'GAJUWAKA': 30, 'PENDURTHI': 25, 'MADDILAPALEM': 12, 'MADHURAWADA': 0 }
};

export const DEFAULT_SLOTS = [
  '08:00 AM',
  '10:00 AM',
  '12:00 PM',
  '02:00 PM',
  '04:00 PM',
  '06:00 PM'
];

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

// Public: Get dynamically available slots for booking date with distance constraint
export const getAvailableBookingSlots = async (req, res) => {
  try {
    const { date, serviceAreaId, address = '', zone = '' } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter (YYYY-MM-DD) is required' });
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const allAreas = await prisma.serviceArea.findMany();
    
    // Configured slots (max 6)
    let configuredSlots = DEFAULT_SLOTS;
    if (settings?.configuredSlots) {
      try {
        const parsed = JSON.parse(settings.configuredSlots);
        if (Array.isArray(parsed) && parsed.length > 0) {
          configuredSlots = parsed.slice(0, 6);
        }
      } catch (e) {
        console.warn('Could not parse configuredSlots:', e);
      }
    }

    // Check monthly/date-specific overrides
    if (settings?.monthlySlotOverrides) {
      try {
        const overrides = JSON.parse(settings.monthlySlotOverrides);
        if (overrides[date] && Array.isArray(overrides[date])) {
          configuredSlots = overrides[date].slice(0, 6);
        }
      } catch (e) {
        console.warn('Could not parse monthlySlotOverrides:', e);
      }
    }

    const activeWorkers = Math.max(1, settings?.activeWorkers || 1);
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

    // Query all existing non-cancelled bookings for this date
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const existingBookings = await prisma.booking.findMany({
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

    // Custom distance matrix if stored
    let customMatrix = null;
    if (settings?.zoneDistanceMatrix) {
      try {
        customMatrix = JSON.parse(settings.zoneDistanceMatrix);
      } catch (e) {}
    }

    // Map each existing booking to its serviceArea and zone
    const bookingsBySlot = {};
    for (const b of existingBookings) {
      const bSlot = b.timeSlot;
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

    // Helper to calculate distance between a booking and candidate target
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

    // Evaluate each configured slot
    const slotsResult = configuredSlots.map((slotTime, idx) => {
      const bookingsInThisSlot = bookingsBySlot[slotTime] || [];

      // 1. Check direct capacity limit
      if (bookingsInThisSlot.length >= activeWorkers) {
        return {
          slot: slotTime,
          available: false,
          reason: 'Slot fully booked',
          bookedCount: bookingsInThisSlot.length,
          capacity: activeWorkers
        };
      }

      // 2. Routing & distance check when capacity is 1 field technician
      if (activeWorkers === 1) {
        // Check previous slot
        const prevSlot = idx > 0 ? configuredSlots[idx - 1] : null;
        if (prevSlot && bookingsBySlot[prevSlot] && bookingsBySlot[prevSlot].length > 0) {
          const prevBooking = bookingsBySlot[prevSlot][0];
          const dist = calcDistance(prevBooking);
          if (dist > maxTravelKm) {
            const areaLabel = prevBooking.areaName || prevBooking.zone;
            return {
              slot: slotTime,
              available: false,
              reason: `Technician in ${areaLabel} (${dist}km away). Cannot reach ${targetArea?.name || targetZone} in time.`,
              distanceKm: dist,
              conflictZone: areaLabel,
              bookedCount: bookingsInThisSlot.length,
              capacity: activeWorkers
            };
          }
        }

        // Check next slot
        const nextSlot = idx < configuredSlots.length - 1 ? configuredSlots[idx + 1] : null;
        if (nextSlot && bookingsBySlot[nextSlot] && bookingsBySlot[nextSlot].length > 0) {
          const nextBooking = bookingsBySlot[nextSlot][0];
          const dist = calcDistance(nextBooking);
          if (dist > maxTravelKm) {
            const areaLabel = nextBooking.areaName || nextBooking.zone;
            return {
              slot: slotTime,
              available: false,
              reason: `Technician scheduled in ${areaLabel} next slot (${dist}km away).`,
              distanceKm: dist,
              conflictZone: areaLabel,
              bookedCount: bookingsInThisSlot.length,
              capacity: activeWorkers
            };
          }
        }
      }

      // Available
      return {
        slot: slotTime,
        available: true,
        reason: 'Available',
        bookedCount: bookingsInThisSlot.length,
        capacity: activeWorkers
      };
    });

    res.json({
      date,
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

// Admin: Get current slots & dispatch settings
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
      monthlySlotOverrides,
      serviceAreas,
      zoneDistanceMatrix: dynamicMatrix
    });
  } catch (error) {
    console.error('Error getting slots config:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Save slots & dispatch settings
export const updateAdminSlotsConfig = async (req, res) => {
  try {
    const { activeWorkers, maxTravelKm, configuredSlots, monthlySlotOverrides, zoneDistanceMatrix } = req.body;

    const data = {};
    if (activeWorkers !== undefined) data.activeWorkers = Math.max(1, Number(activeWorkers));
    if (maxTravelKm !== undefined) data.maxTravelKm = Math.max(1, Number(maxTravelKm));
    if (configuredSlots !== undefined) {
      data.configuredSlots = JSON.stringify(Array.isArray(configuredSlots) ? configuredSlots.slice(0, 6) : DEFAULT_SLOTS);
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
