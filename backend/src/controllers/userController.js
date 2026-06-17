import prisma from '../config/db.js';

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      include: { cars: true }
    });
    
    // Calculate dynamic stats for the dashboard
    const upcomingBookings = await prisma.booking.count({
      where: { userId: req.user.id, status: { in: ['PENDING', 'ASSIGNED', 'CONFIRMED'] } }
    });
    
    const totalWashes = await prisma.booking.count({
      where: { userId: req.user.id, status: 'COMPLETED' }
    });
    
    const savedCars = await prisma.car.count({
      where: { userId: req.user.id }
    });
    
    // Dynamic reward points: 100 points per completed wash + base points from user table
    const dynamicRewardPoints = (user.points || 0) + (totalWashes * 100);

    const nextBooking = await prisma.booking.findFirst({
      where: { userId: req.user.id, status: { in: ['PENDING', 'ASSIGNED', 'CONFIRMED'] } },
      orderBy: { date: 'asc' },
      include: { service: true }
    });

    res.json({
      ...user,
      stats: {
        upcomingBookings,
        totalWashes,
        savedCars,
        rewardPoints: dynamicRewardPoints
      },
      nextBooking
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: req.body
    });
    res.json(user);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ 
      where: { userId: req.user.id },
      include: { service: true, car: true },
      orderBy: { date: 'desc' }
    });
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createBooking = async (req, res) => {
  try {
    const { serviceId, carId, date, timeSlot, latitude, longitude, address } = req.body;
    
    let finalCarId = carId ? Number(carId) : null;

    if (!finalCarId) {
      const firstCar = await prisma.car.findFirst({ where: { userId: req.user.id } });
      if (firstCar) {
        finalCarId = firstCar.id;
      } else {
        const newCar = await prisma.car.create({
          data: { userId: req.user.id, make: 'Unknown', model: 'Vehicle', type: 'Sedan' }
        });
        finalCarId = newCar.id;
      }
    }

    // Auto-assign to employee
    const activeEmployees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
          select: { bookings: { where: { status: 'ASSIGNED' } } }
        }
      }
    });

    let assignedEmployeeId = null;
    let initialStatus = 'PENDING';

    if (activeEmployees.length > 0) {
      activeEmployees.sort((a, b) => a._count.bookings - b._count.bookings);
      assignedEmployeeId = activeEmployees[0].id;
      initialStatus = 'ASSIGNED';
    }

    const booking = await prisma.booking.create({
      data: { 
        userId: req.user.id, 
        serviceId: Number(serviceId), 
        carId: finalCarId, 
        employeeId: assignedEmployeeId,
        status: initialStatus,
        date: new Date(date), 
        timeSlot, 
        latitude, 
        longitude, 
        address 
      }
    });
    res.json(booking);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// Also adding a CRUD for cars to complete the user module
export const getCars = async (req, res) => {
  try {
    const cars = await prisma.car.findMany({ where: { userId: req.user.id } });
    res.json(cars);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const addCar = async (req, res) => {
  try {
    const { make, model, type } = req.body;
    const car = await prisma.car.create({
      data: { userId: req.user.id, make, model, type }
    });
    res.json(car);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
