import prisma from '../config/db.js';
import { parseSlotTimeWindow, cleanupExpiredSlotLocks } from './slotController.js';
import { getRazorpayInstance, verifyRazorpaySignature } from '../config/razorpay.js';
import { computeEmployeePayout } from '../utils/payoutHelper.js';
import { sendBookingConfirmationSms, sendCancellationRefundSms } from '../services/smsService.js';

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      include: { 
        cars: { include: { carType: true } }, 
        savedAddresses: { include: { serviceArea: true } } 
      }
    });
    
    // Calculate dynamic stats
    const upcomingBookings = await prisma.booking.count({
      where: { userId: req.user.id, status: { in: ['PENDING', 'ASSIGNED', 'STARTED'] } }
    });
    
    const totalWashes = await prisma.booking.count({
      where: { userId: req.user.id, status: 'COMPLETED' }
    });
    
    const savedCarsCount = await prisma.car.count({
      where: { userId: req.user.id }
    });
    
    const actualRewardPoints = user.points || 0;
 
    const nextBooking = await prisma.booking.findFirst({
      where: { userId: req.user.id, status: { in: ['PENDING', 'ASSIGNED', 'STARTED'] } },
      orderBy: { date: 'asc' },
      include: { carType: true, washType: true, serviceArea: true }
    });

    // Referral stats
    let referralCount = 0;
    let completedReferralsCount = 0;
    if (user.referralCode) {
      referralCount = await prisma.user.count({
        where: { referredByCode: user.referralCode }
      });
      completedReferralsCount = await prisma.user.count({
        where: {
          referredByCode: user.referralCode,
          bookings: { some: { status: 'COMPLETED' } }
        }
      });
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });

    res.json({
      ...user,
      stats: {
        upcomingBookings,
        totalWashes,
        savedCars: savedCarsCount,
        rewardPoints: actualRewardPoints,
        referralCount,
        completedReferralsCount,
        referralSettings: {
          enabled: settings?.referralEnabled ?? true,
          rewardPoints: settings?.referralRewardPoints ?? 50,
          maxLimit: settings?.referralMaxLimit ?? 10,
          streakBonus: settings?.referralStreakBonus ?? 25,
          streakConfig: settings?.referralStreakConfig ?? null
        }
      },
      nextBooking
    });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: req.body
    });
    res.json(user);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const getBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ 
      where: { userId: req.user.id },
      include: { 
        carType: true, 
        washType: true, 
        serviceArea: true, 
        employee: true,
        car: true,
        addons: {
          include: {
            addon: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const getAddons = async (req, res) => {
  try {
    let addons = await prisma.addon.findMany({
      where: { active: true },
      orderBy: { price: 'asc' }
    });

    if (addons.length === 0) {
      const defaultAddons = [
        {
          name: 'Helmet Deep Foam Wash & Sanitization',
          price: 99,
          description: 'High-temperature antibacterial steam and visor polish for bike helmets.',
          icon: 'Shield',
          active: true
        },
        {
          name: 'Two-Wheeler / Bike Foam Wash',
          price: 199,
          description: 'High-pressure foam wash, chain lube spray, and tyre dressing for any bike or scooter.',
          icon: 'Bike',
          active: true
        },
        {
          name: 'Engine Bay Steam Degreasing',
          price: 299,
          description: 'Safe high-pressure dry steam cleaning and dressing for engine compartment grime.',
          icon: 'Flame',
          active: true
        },
        {
          name: 'Interior Ozone Deep Sanitization',
          price: 349,
          description: 'Hospital-grade ozone treatment eliminating 99.9% bacteria, odor, and allergens.',
          icon: 'Sparkles',
          active: true
        },
        {
          name: 'Pet Hair & Deep Fabric Extraction',
          price: 249,
          description: 'Specialized rubber extraction brushes and high-suction vacuuming for pet fur.',
          icon: 'Feather',
          active: true
        },
        {
          name: 'Windshield Hydrophobic Rain Repellent',
          price: 199,
          description: 'Ceramic glass coating for crystal clear visibility during heavy rain.',
          icon: 'Droplets',
          active: true
        }
      ];

      for (const item of defaultAddons) {
        await prisma.addon.create({ data: item });
      }
      addons = await prisma.addon.findMany({ where: { active: true }, orderBy: { price: 'asc' } });
    }

    res.json(addons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { 
      carTypeId, 
      washTypeId, 
      serviceAreaId, 
      date, 
      timeSlot, 
      latitude, 
      longitude, 
      address, 
      carId, 
      saveCar, 
      saveAddress,
      carMake,
      carModel,
      carNumber,
      addressName,
      couponCode,
      redeemPoints,
      addonIds = []
    } = req.body;
    
    if (!carTypeId || !washTypeId) {
      return res.status(400).json({ 
        error: 'A vehicle car type and car wash package must be selected. Add-ons cannot be booked individually.' 
      });
    }

    // Check if bookings are paused by admin
    const sysSettings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (sysSettings && sysSettings.bookingsEnabled === false) {
      return res.status(400).json({ 
        error: 'Doorstep car wash bookings are currently paused by administration. New slot reservations are temporarily disabled. Please check back later.' 
      });
    }

    // Validate booking date and time slot relative to current IST time
    const now = new Date();
    const istDateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const todayIst = istDateFormatter.format(now); // 'YYYY-MM-DD'

    const bookingDateStr = String(date).split('T')[0];

    if (bookingDateStr < todayIst) {
      return res.status(400).json({ 
        error: 'Cannot book for a past date. Please select today or a future date.' 
      });
    }

    if (bookingDateStr === todayIst && timeSlot) {
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
      const curMinutes = curH * 60 + curM;

      const slotWindow = parseSlotTimeWindow(timeSlot);
      if (slotWindow && slotWindow.startMinutes <= curMinutes) {
        return res.status(400).json({
          error: 'This time slot has already passed or is currently in progress for today. Please select an upcoming slot.'
        });
      }
    }

    // Validate that the slot is an approved admin-configured slot for this date
    let configuredSlots = [
      '08:30 AM - 10:30 AM',
      '10:30 AM - 12:30 PM',
      '12:30 PM - 02:30 PM',
      '02:30 PM - 04:30 PM',
      '04:30 PM - 06:30 PM',
      '06:30 PM - 08:30 PM'
    ];
    if (sysSettings?.configuredSlots) {
      try {
        const parsed = JSON.parse(sysSettings.configuredSlots);
        if (Array.isArray(parsed) && parsed.length > 0) configuredSlots = parsed.slice(0, 6);
      } catch (e) {}
    }
    if (sysSettings?.monthlySlotOverrides) {
      try {
        const overrides = JSON.parse(sysSettings.monthlySlotOverrides);
        const monthKey = String(date).substring(0, 7);
        if (overrides[date] && Array.isArray(overrides[date]) && overrides[date].length > 0) {
          configuredSlots = overrides[date].slice(0, 6);
        } else if (overrides[monthKey] && Array.isArray(overrides[monthKey]) && overrides[monthKey].length > 0) {
          configuredSlots = overrides[monthKey].slice(0, 6);
        }
      } catch (e) {}
    }
    const norm = (str) => (str || '').toUpperCase().replace(/\s+/g, ' ').trim();
    const isSlotApproved = configuredSlots.some(s => norm(s) === norm(timeSlot));
    if (timeSlot && !isSlotApproved) {
      return res.status(400).json({ 
        error: `Selected slot (${timeSlot}) is not an approved active slot for date ${date}.` 
      });
    }

    // Double-confirmation: Ensure the slot is currently available and not locked by another customer
    await cleanupExpiredSlotLocks();
    const startOfDay = new Date(`${bookingDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${bookingDateStr}T23:59:59.999Z`);
    const nowTime = new Date();

    const rawBookingsInSlot = await prisma.booking.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        timeSlot: timeSlot,
        status: { not: 'CANCELLED' }
      }
    });

    const activeInSlot = rawBookingsInSlot.filter(b => {
      if (b.status === 'CANCELLED') return false;
      if (b.paymentStatus === 'PAID') return true;
      if (b.paymentStatus === 'PENDING') {
        if (!b.paymentLockExpiresAt) return true;
        return new Date(b.paymentLockExpiresAt) > nowTime;
      }
      return false;
    });

    const maxCapacity = Math.max(1, sysSettings?.activeWorkers || 1);
    if (activeInSlot.length >= maxCapacity) {
      return res.status(409).json({
        error: 'This arrival window has just been booked by another customer. Please select another time window to proceed.'
      });
    }

    // Fetch price setting for the combination
    const priceSetting = await prisma.washPrice.findUnique({
      where: {
        carTypeId_washTypeId: {
          carTypeId: Number(carTypeId),
          washTypeId: Number(washTypeId)
        }
      }
    });

    if (!priceSetting) {
      return res.status(400).json({ error: 'Selected service combination is not priced yet' });
    }

    // Fetch and calculate selected addons
    let finalAddonIds = Array.isArray(addonIds) ? addonIds.map(Number) : [];
    if (couponCode) {
      const offerCheck = await prisma.offer.findUnique({ where: { code: couponCode, active: true } });
      if (offerCheck) {
        if (offerCheck.freeAddonId && !finalAddonIds.includes(Number(offerCheck.freeAddonId))) {
          finalAddonIds.push(Number(offerCheck.freeAddonId));
        }
        if (offerCheck.discountAddonId && !finalAddonIds.includes(Number(offerCheck.discountAddonId))) {
          finalAddonIds.push(Number(offerCheck.discountAddonId));
        }
      }
    }

    let selectedAddons = [];
    let addonsTotal = 0;
    if (finalAddonIds.length > 0) {
      selectedAddons = await prisma.addon.findMany({
        where: {
          id: { in: finalAddonIds },
          active: true
        }
      });
      addonsTotal = selectedAddons.reduce((sum, item) => sum + item.price, 0);
    }

    const baseWashPrice = priceSetting.price;
    const originalPrice = baseWashPrice + addonsTotal;
    let finalPrice = originalPrice;
    const companyCost = (priceSetting.companyCost || 0.0);
    
    // 1. Coupon Discount Calculation
    let appliedCode = null;
    if (couponCode) {
      const offer = await prisma.offer.findUnique({
        where: { code: couponCode, active: true },
        include: { eligibleUsers: true }
      });
      
      if (!offer || new Date(offer.validUntil) < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired coupon code' });
      }

      // Check category eligibility
      if (offer.applicableCarTypeIds) {
        const allowedCarTypes = offer.applicableCarTypeIds.split(',').filter(Boolean).map(Number);
        if (allowedCarTypes.length > 0 && !allowedCarTypes.includes(Number(carTypeId))) {
          return res.status(400).json({ error: 'This coupon is not applicable for your car type' });
        }
      }

      if (offer.applicableWashTypeIds) {
        const allowedWashTypes = offer.applicableWashTypeIds.split(',').filter(Boolean).map(Number);
        if (allowedWashTypes.length > 0 && !allowedWashTypes.includes(Number(washTypeId))) {
          return res.status(400).json({ error: 'This coupon is not applicable for your wash type' });
        }
      }

      // Check eligibility
      const userBookings = await prisma.booking.findMany({ where: { userId: req.user.id } });
      const completedCount = userBookings.filter(b => b.status === 'COMPLETED').length;

      if (offer.userType === 'NEW' && completedCount > 0) {
        return res.status(400).json({ error: 'Coupon is only valid for new users' });
      }
      if (offer.userType === 'SELECTED') {
        const isEligible = offer.eligibleUsers.some(u => u.id === req.user.id);
        if (!isEligible) {
          return res.status(400).json({ error: 'You are not eligible for this coupon' });
        }
      }

      // Check rotation limits
      if (offer.rotation !== 'UNLIMITED' && offer.usageLimit > 0) {
        const bookingsWithCoupon = userBookings.filter(b => b.appliedOfferCode === offer.code);
        if (offer.rotation === 'OVERALL' && bookingsWithCoupon.length >= offer.usageLimit) {
          return res.status(400).json({ error: 'You have reached the overall usage limit for this coupon' });
        } else if (offer.rotation === 'MONTHLY') {
          const nowMonth = new Date();
          const currentMonth = nowMonth.getMonth();
          const currentYear = nowMonth.getFullYear();
          const monthlyCount = bookingsWithCoupon.filter(b => {
            const bDate = new Date(b.date);
            return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
          }).length;
          if (monthlyCount >= offer.usageLimit) {
            return res.status(400).json({ error: 'You have reached the monthly usage limit for this coupon' });
          }
        } else if (offer.rotation === 'YEARLY') {
          const nowYr = new Date();
          const currentYear = nowYr.getFullYear();
          const yearlyCount = bookingsWithCoupon.filter(b => {
            const bDate = new Date(b.date);
            return bDate.getFullYear() === currentYear;
          }).length;
          if (yearlyCount >= offer.usageLimit) {
            return res.status(400).json({ error: 'You have reached the yearly usage limit for this coupon' });
          }
        }
      }

      let discount = 0;
      if (offer.discountType === 'FLAT') {
        discount = offer.discountAmount;
      } else if (offer.discountType === 'PERCENTAGE') {
        discount = (baseWashPrice * offer.discountPct) / 100;
        if (offer.limitOption === 'UP_TO' && offer.maxDiscountAmount) {
          discount = Math.min(discount, offer.maxDiscountAmount);
        }
      } else {
        discount = 0;
      }

      // Addon-specific coupon discount
      let addonDiscount = 0;
      if (offer.freeAddonId) {
        const freeAddonMatch = selectedAddons.find(a => a.id === offer.freeAddonId);
        if (freeAddonMatch) {
          addonDiscount += freeAddonMatch.price;
        }
      }
      if (offer.discountAddonId) {
        const discAddonMatch = selectedAddons.find(a => a.id === offer.discountAddonId);
        if (discAddonMatch) {
          if (offer.addonDiscountType === 'FREE') {
            addonDiscount += discAddonMatch.price;
          } else if (offer.addonDiscountType === 'FLAT') {
            addonDiscount += Math.min(discAddonMatch.price, offer.addonDiscountValue || 0);
          } else if (offer.addonDiscountType === 'PERCENTAGE') {
            addonDiscount += (discAddonMatch.price * (offer.addonDiscountValue || 0)) / 100;
          }
        }
      }

      discount += addonDiscount;
      finalPrice = Math.max(0, originalPrice - discount);
      appliedCode = offer.code;
    }

    // 2. Royalty Points Redemption
    let redeemedPoints = 0;
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } }) || {
      autoAssignment: true,
      pointsRedemption: true,
      pointsReward: true,
      pointsToCashRatio: 4.0,
      rewardPointsRatio: 0.1
    };

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (redeemPoints && settings.pointsRedemption && user.points > 0) {
      const userPointsCashValue = user.points / settings.pointsToCashRatio;
      if (userPointsCashValue >= finalPrice) {
        redeemedPoints = Math.ceil(finalPrice * settings.pointsToCashRatio);
        finalPrice = 0;
      } else {
        redeemedPoints = user.points;
        finalPrice = finalPrice - userPointsCashValue;
      }
    }

    // Earn points based on cash paid
    const pointsEarned = settings.pointsReward
      ? Math.floor(finalPrice * settings.rewardPointsRatio)
      : 0;

    let employeePayout = 0;
    if (priceSetting.payoutType === 'PERCENTAGE') {
      employeePayout = (originalPrice * priceSetting.payoutValue) / 100;
    } else {
      employeePayout = priceSetting.payoutValue;
    }

    // Normalize car registration number
    let cleanCarNumber = carNumber ? String(carNumber).trim().toUpperCase() : null;

    // Save/link Car so car details & license registration number are ALWAYS preserved
    let finalCarId = carId ? Number(carId) : null;
    if (finalCarId) {
      const existingCar = await prisma.car.findUnique({ where: { id: finalCarId } });
      if (existingCar) {
        if (!cleanCarNumber && existingCar.carNumber) {
          cleanCarNumber = existingCar.carNumber;
        } else if (cleanCarNumber && existingCar.carNumber !== cleanCarNumber) {
          await prisma.car.update({
            where: { id: finalCarId },
            data: { carNumber: cleanCarNumber }
          }).catch(() => {});
        }
        if (!carMake) carMake = existingCar.make;
        if (!carModel) carModel = existingCar.model;
      }
    } else if (carMake || carModel || cleanCarNumber) {
      const newCar = await prisma.car.create({
        data: {
          userId: req.user.id,
          make: carMake || 'Car',
          model: carModel || 'Model',
          carTypeId: Number(carTypeId),
          carNumber: cleanCarNumber
        }
      });
      finalCarId = newCar.id;
    }

    // Save Address if requested
    if (saveAddress && addressName && address && latitude && longitude) {
      await prisma.savedAddress.create({
        data: {
          userId: req.user.id,
          name: addressName,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
          serviceAreaId: Number(serviceAreaId)
        }
      });
    }

    // If finalPrice is 0 (100% coupon or points): confirm booking immediately
    if (finalPrice <= 0) {
      if (redeemedPoints > 0 || pointsEarned > 0) {
        await prisma.user.update({
          where: { id: req.user.id },
          data: {
            points: Math.max(0, user.points - redeemedPoints + pointsEarned)
          }
        });
      }

      const booking = await prisma.booking.create({
        data: {
          userId: req.user.id,
          carTypeId: Number(carTypeId),
          washTypeId: Number(washTypeId),
          serviceAreaId: Number(serviceAreaId),
          carId: finalCarId,
          carNumber: cleanCarNumber,
          carMake: carMake || null,
          carModel: carModel || null,
          date: new Date(date),
          timeSlot: timeSlot || '10:00 AM',
          latitude: Number(latitude),
          longitude: Number(longitude),
          address,
          price: 0,
          addonsTotal,
          employeePayout,
          companyCost,
          appliedOfferCode: appliedCode,
          pointsRedeemed: redeemedPoints,
          pointsEarned: pointsEarned,
          paymentStatus: 'PAID',
          status: 'PENDING',
          ...(selectedAddons.length > 0 && {
            addons: {
              create: selectedAddons.map(addon => ({
                addonId: addon.id,
                price: addon.price,
                quantity: 1
              }))
            }
          })
        },
        include: {
          addons: { include: { addon: true } },
          carType: true,
          washType: true
        }
      });

      // Auto assignment if enabled
      if (settings.autoAssignment) {
        const regionCandidates = await prisma.employee.findMany({
          where: {
            status: 'ACTIVE',
            serviceAreas: { some: { id: Number(serviceAreaId) } }
          },
          include: {
            bookings: {
              where: {
                date: {
                  gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                  lte: new Date(new Date(date).setHours(23, 59, 59, 999))
                },
                status: { in: ['ASSIGNED', 'STARTED'] }
              }
            }
          }
        });

        if (regionCandidates.length > 0) {
          const onDutyInRegion = regionCandidates.filter(emp => emp.onDuty);
          const candidatePool = onDutyInRegion.length > 0 ? onDutyInRegion : regionCandidates;
          const eligible = candidatePool.filter(emp => {
            const count = emp.bookings.filter(b => b.timeSlot === timeSlot).length;
            return count < 2;
          });
          const targetList = eligible.length > 0 ? eligible : candidatePool;
          targetList.sort((a, b) => a.bookings.length - b.bookings.length);
          const chosenEmployee = targetList[0];

          const calculatedPayout = await computeEmployeePayout(
            chosenEmployee.id,
            Number(washTypeId),
            Number(carTypeId),
            originalPrice,
            priceSetting
          );

          const updatedBooking = await prisma.booking.update({
            where: { id: booking.id },
            data: {
              employeeId: chosenEmployee.id,
              status: 'ASSIGNED',
              employeePayout: calculatedPayout
            }
          });
          const confirmedBkg = updatedBooking;
          sendBookingConfirmationSms(user.phone, confirmedBkg).catch(err => console.error('[SMS Booking Confirmation error]:', err));
          return res.json({ requiresPayment: false, booking: confirmedBkg });
        }
      }

      sendBookingConfirmationSms(user.phone, booking).catch(err => console.error('[SMS Booking Confirmation error]:', err));
      return res.json({ requiresPayment: false, booking });
    }

    // Online Razorpay Payment required (> 0)
    // 1. Create order on Razorpay
    const razorpay = getRazorpayInstance();
    let rzpOrder = null;
    try {
      rzpOrder = await razorpay.orders.create({
        amount: Math.round(finalPrice * 100), // in paise
        currency: 'INR',
        receipt: `bkg_${Date.now()}_${req.user.id}`.slice(-40),
        notes: {
          userId: String(req.user.id),
          date: String(date),
          timeSlot: String(timeSlot),
          carTypeId: String(carTypeId),
          washTypeId: String(washTypeId)
        }
      });
    } catch (rzpErr) {
      console.error('Razorpay order creation error:', rzpErr);
      return res.status(500).json({
        error: `Could not initiate Razorpay order: ${rzpErr.message || 'Check Razorpay API keys in backend .env'}`
      });
    }

    // 2. Create provisional booking holding a 10-minute slot lock
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        carTypeId: Number(carTypeId),
        washTypeId: Number(washTypeId),
        serviceAreaId: Number(serviceAreaId),
        carId: finalCarId,
        carNumber: cleanCarNumber,
        carMake: carMake || null,
        carModel: carModel || null,
        date: new Date(date),
        timeSlot: timeSlot || '10:00 AM',
        latitude: Number(latitude),
        longitude: Number(longitude),
        address,
        price: finalPrice,
        addonsTotal,
        employeePayout,
        companyCost,
        appliedOfferCode: appliedCode,
        pointsRedeemed: redeemedPoints,
        pointsEarned: pointsEarned,
        paymentStatus: 'PENDING',
        status: 'PENDING_PAYMENT',
        razorpayOrderId: rzpOrder.id,
        paymentLockExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes lock
        ...(selectedAddons.length > 0 && {
          addons: {
            create: selectedAddons.map(addon => ({
              addonId: addon.id,
              price: addon.price,
              quantity: 1
            }))
          }
        })
      },
      include: {
        addons: { include: { addon: true } },
        washType: true,
        carType: true
      }
    });

    return res.json({
      success: true,
      requiresPayment: true,
      bookingId: booking.id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount, // in paise
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || '',
      finalPayable: finalPrice,
      rzpOrder: {
        id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key: process.env.RAZORPAY_KEY_ID || ''
      },
      booking
    });

  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Verify Razorpay Payment and Confirm Booking
export const verifyBookingPayment = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: { washType: true, carType: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to verify this booking' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'This booking was cancelled or the payment session expired.' });
    }

    // Verify HMAC signature
    if (process.env.RAZORPAY_KEY_SECRET) {
      const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid Razorpay payment signature' });
      }
    }

    // Apply points redemption and rewards now that payment is confirmed
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } }) || {
      autoAssignment: true,
      pointsRedemption: true,
      pointsReward: true,
      pointsToCashRatio: 4.0,
      rewardPointsRatio: 0.1
    };

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (booking.pointsRedeemed > 0 || booking.pointsEarned > 0) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          points: Math.max(0, user.points - booking.pointsRedeemed + booking.pointsEarned)
        }
      });
    }

    // Auto assignment logic and 3-tier employee payout calculation
    let assignedEmployeeId = null;
    let finalEmployeePayout = booking.employeePayout;

    if (settings.autoAssignment) {
      const regionCandidates = await prisma.employee.findMany({
        where: {
          status: 'ACTIVE',
          serviceAreas: { some: { id: booking.serviceAreaId } }
        },
        include: {
          bookings: {
            where: {
              date: {
                gte: new Date(new Date(booking.date).setHours(0, 0, 0, 0)),
                lte: new Date(new Date(booking.date).setHours(23, 59, 59, 999))
              },
              status: { in: ['ASSIGNED', 'STARTED'] }
            }
          }
        }
      });

      if (regionCandidates.length > 0) {
        const onDutyInRegion = regionCandidates.filter(emp => emp.onDuty);
        const candidatePool = onDutyInRegion.length > 0 ? onDutyInRegion : regionCandidates;
        const eligible = candidatePool.filter(emp => {
          const count = emp.bookings.filter(b => b.timeSlot === booking.timeSlot).length;
          return count < 2;
        });
        const targetList = eligible.length > 0 ? eligible : candidatePool;
        targetList.sort((a, b) => a.bookings.length - b.bookings.length);
        const chosenEmployee = targetList[0];
        assignedEmployeeId = chosenEmployee.id;

        finalEmployeePayout = await computeEmployeePayout(
          chosenEmployee.id,
          booking.washTypeId,
          booking.carTypeId,
          booking.price
        );
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'PAID',
        razorpayPaymentId,
        razorpaySignature,
        status: assignedEmployeeId ? 'ASSIGNED' : 'PENDING',
        employeeId: assignedEmployeeId,
        employeePayout: finalEmployeePayout,
        paymentLockExpiresAt: null
      },
      include: {
        addons: { include: { addon: true } },
        car: true,
        carType: true,
        washType: true,
        employee: true
      }
    });

    // Send Booking Confirmation SMS with booking details & Payment ID
    sendBookingConfirmationSms(user.phone, updatedBooking).catch(err => console.error('[SMS Booking Confirmation error]:', err));

    res.json({ message: 'Payment verified and booking confirmed successfully', booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Release provisional slot lock if user dismisses modal or payment fails
export const cancelPendingPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (booking.paymentStatus === 'PENDING' && (booking.status === 'PENDING_PAYMENT' || booking.status === 'PENDING')) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: 'Payment cancelled / modal dismissed by user',
          paymentLockExpiresAt: null
        }
      });
    }

    res.json({ message: 'Provisional lock released successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Customer Cancellation with Automatic Razorpay Refund
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: { employee: true, user: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'This booking is already cancelled.' });
    }

    if (booking.status === 'STARTED' || booking.status === 'COMPLETED') {
      return res.status(400).json({
        error: `Cannot cancel booking because technician has already ${booking.status.toLowerCase()} service.`
      });
    }

    // Cancellation policy: Permitted ONLY up to 7 hours before scheduled slot arrival
    if (booking.date && booking.timeSlot) {
      const slotWindow = parseSlotTimeWindow(booking.timeSlot);
      if (slotWindow) {
        const istDateParts = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).formatToParts(new Date(booking.date));
        let bYear, bMonth, bDay;
        for (const p of istDateParts) {
          if (p.type === 'year') bYear = p.value;
          if (p.type === 'month') bMonth = p.value;
          if (p.type === 'day') bDay = p.value;
        }

        const slotHour = Math.floor(slotWindow.startMinutes / 60);
        const slotMinute = slotWindow.startMinutes % 60;
        const slotIso = `${bYear}-${bMonth}-${bDay}T${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}:00+05:30`;
        const slotStartTime = new Date(slotIso).getTime();

        const cutoffTime = slotStartTime - (7 * 60 * 60 * 1000);
        const nowTime = Date.now();

        if (nowTime > cutoffTime) {
          return res.status(400).json({
            error: 'Cancellations are only permitted up to 7 hours before your scheduled slot arrival time.'
          });
        }
      }
    }

    let refundDetails = {
      refundId: null,
      refundAmount: 0,
      refundStatus: 'NONE'
    };

    // Automatic Razorpay refund if paid online with Razorpay
    if (booking.paymentStatus === 'PAID' && booking.razorpayPaymentId && booking.price > 0) {
      try {
        const razorpay = getRazorpayInstance();
        const refundResponse = await razorpay.payments.refund(booking.razorpayPaymentId, {
          amount: Math.round(booking.price * 100),
          notes: {
            bookingId: booking.id,
            reason: reason
          }
        });

        refundDetails = {
          refundId: refundResponse.id,
          refundAmount: booking.price,
          refundStatus: 'PROCESSED'
        };
      } catch (refundErr) {
        console.error('Razorpay automatic refund error:', refundErr);
        refundDetails = {
          refundId: null,
          refundAmount: booking.price,
          refundStatus: 'FAILED'
        };
      }
    }

    // Refund redeemed loyalty points back to customer
    if (booking.pointsRedeemed > 0) {
      await prisma.user.update({
        where: { id: booking.userId },
        data: {
          points: { increment: booking.pointsRedeemed }
        }
      });
    }

    // Revert earned points
    if (booking.pointsEarned > 0) {
      await prisma.user.update({
        where: { id: booking.userId },
        data: {
          points: { decrement: Math.min(booking.user.points, booking.pointsEarned) }
        }
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
        paymentStatus: refundDetails.refundStatus === 'PROCESSED' ? 'REFUNDED' : (booking.paymentStatus === 'PAID' ? 'REFUND_PENDING' : 'CANCELLED'),
        refundId: refundDetails.refundId,
        refundAmount: refundDetails.refundAmount,
        refundStatus: refundDetails.refundStatus
      },
      include: {
        employee: true,
        car: true,
        washType: true,
        carType: true
      }
    });

    // Send Cancellation & Refund Initiation SMS to user
    if (booking.user?.phone) {
      sendCancellationRefundSms(booking.user.phone, updatedBooking, refundDetails).catch(err => console.error('[SMS Cancel/Refund error]:', err));
    }

    res.json({
      message: refundDetails.refundStatus === 'PROCESSED'
        ? `Booking cancelled successfully and automatic refund of ₹${booking.price} initiated.`
        : 'Booking cancelled successfully.',
      booking: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CRUD for Cars
export const getCars = async (req, res) => {
  try {
    const cars = await prisma.car.findMany({ 
      where: { userId: req.user.id },
      include: { carType: true }
    });
    res.json(cars);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const addCar = async (req, res) => {
  try {
    const { make, model, carTypeId, carNumber } = req.body;
    const car = await prisma.car.create({
      data: { 
        userId: req.user.id, 
        make, 
        model, 
        carTypeId: Number(carTypeId),
        carNumber: carNumber ? String(carNumber).trim().toUpperCase() : null
      },
      include: { carType: true }
    });
    res.json(car);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.car.delete({ where: { id: Number(id) } });
    res.json({ message: 'Car deleted' });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Services fallback
export const getServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// New Lookup routes
export const getCarTypes = async (req, res) => {
  try {
    const types = await prisma.carType.findMany({ orderBy: { name: 'asc' } });
    res.json(types);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const getWashTypes = async (req, res) => {
  try {
    const types = await prisma.washType.findMany({ orderBy: { name: 'asc' } });
    res.json(types);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const getServiceAreas = async (req, res) => {
  try {
    const areas = await prisma.serviceArea.findMany({ orderBy: { name: 'asc' } });
    res.json(areas);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const getWashPrice = async (req, res) => {
  try {
    const { carTypeId, washTypeId } = req.query;
    const priceSetting = await prisma.washPrice.findUnique({
      where: {
        carTypeId_washTypeId: {
          carTypeId: Number(carTypeId),
          washTypeId: Number(washTypeId)
        }
      }
    });
    res.json(priceSetting || { price: 0, payoutType: 'PERCENTAGE', payoutValue: 0 });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const getAllWashPrices = async (req, res) => {
  try {
    const prices = await prisma.washPrice.findMany({
      include: { carType: true, washType: true }
    });
    res.json(prices);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Saved Addresses
export const getSavedAddresses = async (req, res) => {
  try {
    const addresses = await prisma.savedAddress.findMany({
      where: { userId: req.user.id },
      include: { serviceArea: true }
    });
    res.json(addresses);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const addSavedAddress = async (req, res) => {
  try {
    const { name, address, latitude, longitude, serviceAreaId } = req.body;
    const saved = await prisma.savedAddress.create({
      data: {
        userId: req.user.id,
        name,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        serviceAreaId: Number(serviceAreaId)
      },
      include: { serviceArea: true }
    });
    res.json(saved);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const deleteSavedAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.savedAddress.delete({ where: { id: Number(id) } });
    res.json({ message: 'Address deleted' });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Get Eligible Coupons for the current User
export const getEligibleCoupons = async (req, res) => {
  try {
    const userId = req.user.id;
    const { carTypeId, washTypeId } = req.query;
    const now = new Date();

    const offers = await prisma.offer.findMany({
      where: {
        active: true,
        validUntil: { gte: now }
      },
      include: {
        eligibleUsers: {
          select: { id: true }
        }
      }
    });

    const eligibleOffers = [];

    const userBookings = await prisma.booking.findMany({
      where: { userId }
    });

    const completedBookingsCount = userBookings.filter(b => b.status === 'COMPLETED').length;

    for (const offer of offers) {
      // Check Car Type Eligibility
      if (carTypeId && offer.applicableCarTypeIds && offer.applicableCarTypeIds.trim()) {
        const allowedCarTypes = offer.applicableCarTypeIds.split(',').filter(Boolean).map(s => Number(s.trim()));
        if (allowedCarTypes.length > 0 && !allowedCarTypes.includes(Number(carTypeId))) {
          continue;
        }
      }

      // Check Wash Type Eligibility
      if (washTypeId && offer.applicableWashTypeIds && offer.applicableWashTypeIds.trim()) {
        const allowedWashTypes = offer.applicableWashTypeIds.split(',').filter(Boolean).map(s => Number(s.trim()));
        if (allowedWashTypes.length > 0 && !allowedWashTypes.includes(Number(washTypeId))) {
          continue;
        }
      }

      if (offer.userType === 'NEW' && completedBookingsCount > 0) {
        continue;
      }

      if (offer.userType === 'SELECTED') {
        const isEligible = offer.eligibleUsers.some(u => u.id === userId);
        if (!isEligible) {
          continue;
        }
      }

      if (offer.rotation !== 'UNLIMITED' && offer.usageLimit > 0) {
        const bookingsWithCoupon = userBookings.filter(b => b.appliedOfferCode === offer.code && b.status !== 'CANCELLED');

        if (offer.rotation === 'OVERALL') {
          if (bookingsWithCoupon.length >= offer.usageLimit) {
            continue;
          }
        } else if (offer.rotation === 'MONTHLY') {
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const monthlyCount = bookingsWithCoupon.filter(b => {
            const bDate = new Date(b.date);
            return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
          }).length;

          if (monthlyCount >= offer.usageLimit) {
            continue;
          }
        } else if (offer.rotation === 'YEARLY') {
          const currentYear = now.getFullYear();
          const yearlyCount = bookingsWithCoupon.filter(b => {
            const bDate = new Date(b.date);
            return bDate.getFullYear() === currentYear;
          }).length;

          if (yearlyCount >= offer.usageLimit) {
            continue;
          }
        }
      }

      eligibleOffers.push(offer);
    }

    res.json(eligibleOffers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Public System Settings
export const getPublicSettings = async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 1,
          autoAssignment: true,
          pointsRedemption: true,
          pointsReward: true,
          pointsToCashRatio: 4.0,
          rewardPointsRatio: 0.1
        }
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPublicHomeContent = async (req, res) => {
  try {
    let cms = await prisma.cmsContent.findUnique({
      where: { id: 1 }
    });
    if (!cms) {
      cms = await prisma.cmsContent.create({
        data: {
          id: 1,
          heroKicker: "WASH MY CAR • DOORSTEP CAR WASH",
          heroTitle: "WE WASH.\nYOU RELAX.",
          heroSubtitle: "Premium vehicle spa and car detailing at your doorstep. Save time, skip the queue, and let trained professionals care for your car.",
          heroImage: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=2200&q=95",
          heroBadgeText: "WATER EFFICIENT & RO CARE",
          heroCtaPrimary: "Book Doorstep Wash",
          heroCtaSecondary: "Explore Packages",
          quickBarLive: "● LIVE DOORSTEP CAR WASH",
          quickBarTitle: "App & Online Booking is Live.",
          quickBarSubtitle: "Book doorstep vehicle detailing in seconds.",
          aboutTitle: "Serving Visakhapatnam & Surrounds",
          aboutText: "We proudly serve all Visakhapatnam neighborhoods with professional care and premium equipment!",
          servicesTitle: "EVERYDAY CARE. PREMIUM SHINE.",
          servicesSubtitle: "One destination for your vehicle's everyday wash, interior deep steam, and premium shine.",
          whyTitle: "SMARTER CAR CARE. BUILT AROUND YOU.",
          whySubtitle: "Convenience-first automotive detailing with professional high-pressure equipment and deionized spot-free water.",
          whyCard1Title: "YOUR CAR STAYS. WE COME TO YOU.",
          whyCard1Text: "No queues. No driving to wash centres. Our technicians arrive at your home or office with high-pressure machines and spot-free deionized water.",
          whyCard2Title: "Book in Seconds",
          whyCard2Text: "Choose your wash package, select your slot, and track everything live.",
          whyCard3Title: "Trained Specialists",
          whyCard3Text: "Background-verified, trained vehicle care professionals using pH-neutral premium shampoos.",
          whyCard4Title: "Water-Efficient Care",
          whyCard4Text: "Eco-conscious steam & pressure washing saves up to 80% water compared to traditional washing.",
          statCustomers: "10K+",
          statCustomersLabel: "Happy Vehicle Owners",
          statCities: "2+",
          statCitiesLabel: "Service Hubs Live",
          statDuration: "30–90",
          statDurationLabel: "Minutes Service Time",
          statPrice: "₹299+",
          statPriceLabel: "Starting Wash Price",
          partnerTitle: "BUILD THE NEXT CAR CARE BUSINESS",
          partnerSubtitle: "Choose the operating model that fits your city — doorstep franchise partner or fixed branded outlet.",
          doorstepPlanTitle: "Doorstep Franchise Partner",
          doorstepPlanPrice: "₹1.8 LAKH",
          doorstepPlanPerks: "Low investment,No shop required,Proven high margin model,Machinery & launch support",
          outletPlanTitle: "Branded Outlet Partner",
          outletPlanPrice: "₹3.5 LAKH",
          outletPlanPerks: "Storefront branding,Interior setup,High-end pressure equipment,Technology & SOPs",
          contactPhone: "+91 98765 43210",
          contactEmail: "washmycarorg@gmail.com",
          contactAddress: "Sujatha Nagar, Visakhapatnam, Andhra Pradesh",
          whatsappNumber: "+919876543210",
          promoTitle: "Get 20% OFF Your First Doorstep Wash!",
          promoText: "Claim Offer Now"
        }
      });
    }
    res.json(cms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Public Active Coupons for Homepage & Visitors
export const getPublicActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const offers = await prisma.offer.findMany({
      where: {
        active: true,
        validUntil: { gte: now }
      },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        discountType: true,
        discountPct: true,
        discountAmount: true,
        limitOption: true,
        maxDiscountAmount: true,
        freeAddonId: true,
        discountAddonId: true,
        addonDiscountType: true,
        addonDiscountValue: true,
        applicableCarTypeIds: true,
        applicableWashTypeIds: true,
        validUntil: true,
        userType: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Populate addon names if freeAddonId or discountAddonId exist
    const addonIds = [...new Set(offers.flatMap(o => [o.freeAddonId, o.discountAddonId]).filter(Boolean).map(Number))];
    let addonMap = {};
    if (addonIds.length > 0) {
      const addons = await prisma.addon.findMany({
        where: { id: { in: addonIds } },
        select: { id: true, name: true, price: true }
      });
      addonMap = Object.fromEntries(addons.map(a => [a.id, a]));
    }

    const enhancedOffers = offers.map(o => ({
      ...o,
      freeAddon: o.freeAddonId ? addonMap[o.freeAddonId] || null : null,
      discountAddon: o.discountAddonId ? addonMap[o.discountAddonId] || null : null
    }));

    res.json(enhancedOffers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// SUBSCRIPTIONS (USER)
// ==========================================
export const getUserSubscriptionPlans = async (req, res) => {
  try {
    const { carTypeId } = req.query;
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (settings && settings.subscriptionsEnabled === false) {
      return res.json({ subscriptionsEnabled: false, plans: [] });
    }

    const where = { active: true };
    if (carTypeId) {
      where.carTypeId = Number(carTypeId);
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where,
      include: {
        carType: true
      },
      orderBy: [
        { carTypeId: 'asc' },
        { price: 'asc' }
      ]
    });

    res.json({ subscriptionsEnabled: true, plans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMySubscriptions = async (req, res) => {
  try {
    const now = new Date();

    // Auto-expire any active subscriptions whose validity ended or remaining washes completed
    await prisma.userSubscription.updateMany({
      where: {
        userId: req.user.id,
        status: 'ACTIVE',
        OR: [
          { washesRemaining: { lte: 0 } },
          { endDate: { lt: now } }
        ]
      },
      data: { status: 'EXPIRED' }
    });

    const subscriptions = await prisma.userSubscription.findMany({
      where: { userId: req.user.id },
      include: {
        plan: true,
        carType: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const activeSubscription = subscriptions.find(s => 
      s.status === 'ACTIVE' && 
      s.paymentStatus === 'PAID' && 
      s.washesRemaining > 0 &&
      new Date(s.endDate) > now
    );

    res.json({
      activeSubscription: activeSubscription || null,
      history: subscriptions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const subscribeToPlan = async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'Subscription plan ID is required.' });
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (settings && settings.subscriptionsEnabled === false) {
      return res.status(400).json({ error: 'Subscriptions are currently not active. Please check back later.' });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: Number(planId) },
      include: { carType: true }
    });

    if (!plan || !plan.active) {
      return res.status(404).json({ error: 'Subscription plan not found or is currently inactive.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (plan.durationDays || 30) * 24 * 60 * 60 * 1000);

    if (plan.price > 0) {
      const razorpay = getRazorpayInstance();
      let rzpOrder = null;
      try {
        rzpOrder = await razorpay.orders.create({
          amount: Math.round(plan.price * 100),
          currency: 'INR',
          receipt: `sub_${Date.now()}_${user.id}`.slice(-40),
          notes: {
            userId: String(user.id),
            planId: String(plan.id),
            planName: plan.name,
            carTypeId: String(plan.carTypeId)
          }
        });
      } catch (rzpErr) {
        console.warn('Razorpay order creation fallback for subscription:', rzpErr.message);
      }

      const subscription = await prisma.userSubscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          carTypeId: plan.carTypeId,
          startDate,
          endDate,
          price: plan.price,
          washesTotal: plan.washesCount,
          washesRemaining: plan.washesCount,
          freeAddonsTotal: plan.freeAddonsCount,
          freeAddonsRemaining: plan.freeAddonsCount,
          status: rzpOrder ? 'PENDING' : 'ACTIVE',
          paymentStatus: rzpOrder ? 'PENDING' : 'PAID',
          razorpayOrderId: rzpOrder ? rzpOrder.id : null
        },
        include: {
          plan: true,
          carType: true
        }
      });

      return res.json({
        requiresPayment: !!rzpOrder,
        rzpOrder,
        subscription,
        keyId: process.env.RAZORPAY_KEY_ID || ''
      });
    }

    const subscription = await prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        carTypeId: plan.carTypeId,
        startDate,
        endDate,
        price: 0,
        washesTotal: plan.washesCount,
        washesRemaining: plan.washesCount,
        freeAddonsTotal: plan.freeAddonsCount,
        freeAddonsRemaining: plan.freeAddonsCount,
        status: 'ACTIVE',
        paymentStatus: 'PAID'
      },
      include: {
        plan: true,
        carType: true
      }
    });

    res.json({ requiresPayment: false, subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifySubscriptionPayment = async (req, res) => {
  try {
    const { subscriptionId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required.' });
    }

    const subscription = await prisma.userSubscription.findUnique({
      where: { id: Number(subscriptionId) },
      include: { plan: true, carType: true }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription record not found.' });
    }

    if (razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        return res.status(400).json({ error: 'Payment signature verification failed.' });
      }
    }

    const updatedSubscription = await prisma.userSubscription.update({
      where: { id: Number(subscriptionId) },
      data: {
        status: 'ACTIVE',
        paymentStatus: 'PAID',
        razorpayPaymentId: razorpayPaymentId || subscription.razorpayPaymentId,
        razorpayOrderId: razorpayOrderId || subscription.razorpayOrderId
      },
      include: {
        plan: true,
        carType: true
      }
    });

    res.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


