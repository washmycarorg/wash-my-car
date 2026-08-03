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
      addressName
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

    const price = priceSetting.price;
    const companyCost = priceSetting.companyCost || 0.0;
    let employeePayout = 0;
    if (priceSetting.payoutType === 'PERCENTAGE') {
      employeePayout = (price * priceSetting.payoutValue) / 100;
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
        price,
        employeePayout,
        companyCost,
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
