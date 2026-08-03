import prisma from '../config/db.js';

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
    
    const dynamicRewardPoints = (user.points || 0) + (totalWashes * 100);
 
    const nextBooking = await prisma.booking.findFirst({
      where: { userId: req.user.id, status: { in: ['PENDING', 'ASSIGNED', 'STARTED'] } },
      orderBy: { date: 'asc' },
      include: { carType: true, washType: true, serviceArea: true }
    });

    res.json({
      ...user,
      stats: {
        upcomingBookings,
        totalWashes,
        savedCars: savedCarsCount,
        rewardPoints: dynamicRewardPoints
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
        car: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
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
      addressName,
      couponCode,
      redeemPoints
    } = req.body;
    
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

    const originalPrice = priceSetting.price;
    let finalPrice = originalPrice;
    const companyCost = priceSetting.companyCost || 0.0;
    
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
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const monthlyCount = bookingsWithCoupon.filter(b => {
            const bDate = new Date(b.date);
            return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
          }).length;
          if (monthlyCount >= offer.usageLimit) {
            return res.status(400).json({ error: 'You have reached the monthly usage limit for this coupon' });
          }
        } else if (offer.rotation === 'YEARLY') {
          const now = new Date();
          const currentYear = now.getFullYear();
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
      } else {
        discount = (originalPrice * offer.discountPct) / 100;
        if (offer.limitOption === 'UP_TO' && offer.maxDiscountAmount) {
          discount = Math.min(discount, offer.maxDiscountAmount);
        }
      }

      finalPrice = Math.max(0, originalPrice - discount);
      appliedCode = offer.code;
    }

    // 2. Royalty Points Redemption
    let redeemedPoints = 0;
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } }) || {
      royaltyPointsEnabled: true,
      pointsToCashRatio: 4.0,
      rewardPointsRatio: 0.1
    };

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (redeemPoints && settings.royaltyPointsEnabled && user.points > 0) {
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
    const pointsEarned = settings.royaltyPointsEnabled
      ? Math.floor(finalPrice * settings.rewardPointsRatio)
      : 0;

    // Deduct and add points to User
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        points: Math.max(0, user.points - redeemedPoints + pointsEarned)
      }
    });

    let employeePayout = 0;
    if (priceSetting.payoutType === 'PERCENTAGE') {
      employeePayout = (originalPrice * priceSetting.payoutValue) / 100;
    } else {
      employeePayout = priceSetting.payoutValue;
    }

    // Save Car if requested
    let finalCarId = carId ? Number(carId) : null;
    if (!finalCarId && saveCar && carMake && carModel) {
      const newCar = await prisma.car.create({
        data: {
          userId: req.user.id,
          make: carMake,
          model: carModel,
          carTypeId: Number(carTypeId)
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

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        carTypeId: Number(carTypeId),
        washTypeId: Number(washTypeId),
        serviceAreaId: Number(serviceAreaId),
        carId: finalCarId,
        date: new Date(date),
        timeSlot: timeSlot || '10:00 AM',
        latitude: Number(latitude),
        longitude: Number(longitude),
        address,
        price: finalPrice,
        employeePayout,
        companyCost,
        appliedOfferCode: appliedCode,
        pointsRedeemed: redeemedPoints,
        pointsEarned: pointsEarned,
        paymentStatus: 'PAID', // payment is mock and completed online
        status: 'PENDING'
      }
    });

    // Auto assignment algorithm
    const candidates = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        onDuty: true,
        serviceAreas: {
          some: { id: Number(serviceAreaId) }
        }
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

    const eligible = candidates.filter(emp => {
      const slotBookingsCount = emp.bookings.filter(b => b.timeSlot === timeSlot).length;
      return slotBookingsCount < 2; // Cap: Max 2 bookings per slot per day
    });

    if (eligible.length > 0) {
      eligible.sort((a, b) => a.bookings.length - b.bookings.length);
      const chosenEmployee = eligible[0];
      
      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          employeeId: chosenEmployee.id,
          status: 'ASSIGNED'
        },
        include: { employee: true }
      });
      return res.json(updatedBooking);
    }

    res.json(booking);
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
    const { make, model, carTypeId } = req.body;
    const car = await prisma.car.create({
      data: { 
        userId: req.user.id, 
        make, 
        model, 
        carTypeId: Number(carTypeId) 
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
      if (carTypeId && offer.applicableCarTypeIds) {
        const allowedCarTypes = offer.applicableCarTypeIds.split(',').filter(Boolean).map(Number);
        if (allowedCarTypes.length > 0 && !allowedCarTypes.includes(Number(carTypeId))) {
          continue;
        }
      }

      // Check Wash Type Eligibility
      if (washTypeId && offer.applicableWashTypeIds) {
        const allowedWashTypes = offer.applicableWashTypeIds.split(',').filter(Boolean).map(Number);
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
        const bookingsWithCoupon = userBookings.filter(b => b.appliedOfferCode === offer.code);

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
          royaltyPointsEnabled: true,
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
          heroTitle: "Professional Car Wash at Your Doorstep",
          heroSubtitle: "Fast, affordable, and eco-friendly car cleaning in Visakhapatnam.",
          heroImage: "/images/hero_wash.png",
          aboutTitle: "Serving Visakhapatnam & Surrounds",
          aboutText: "We proudly serve all Visakhapatnam neighborhoods with professional care and premium equipment!",
          contactPhone: "+91 98765 43210",
          contactEmail: "washmycarorg@gmail.com",
          contactAddress: "Sujatha Nagar, Vizag",
          promoTitle: "Get 20% OFF Your First Wash!",
          promoText: "Claim Offer"
        }
      });
    }
    res.json(cms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
