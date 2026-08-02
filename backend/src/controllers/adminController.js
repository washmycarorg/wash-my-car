import prisma from '../config/db.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalBookings = await prisma.booking.count();
    const activeBookings = await prisma.booking.count({ 
      where: { status: { in: ['PENDING', 'ASSIGNED', 'STARTED'] } } 
    });
    const employeesOnline = await prisma.employee.count({ 
      where: { onDuty: true, status: 'ACTIVE' } 
    });
    
    // Calculate Revenue
    const completedBookings = await prisma.booking.findMany({
      where: { status: 'COMPLETED' }
    });
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    
    // Cost to Company (sum of employee payouts)
    const totalCostToCompany = completedBookings.reduce((sum, b) => sum + (b.employeePayout || 0), 0);

    res.json({
      totalRevenue,
      totalCostToCompany,
      activeBookings,
      employeesOnline,
      totalBookings
    });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        bookings: true,
        leaves: true,
        serviceAreas: true
      }
    });

    const employeesWithEarnings = employees.map(emp => {
      const completedBookings = emp.bookings.filter(b => b.status === 'COMPLETED');
      const earnings = completedBookings.reduce((sum, b) => sum + (b.employeePayout || 0), 0);
      return { ...emp, earnings };
    });

    res.json(employeesWithEarnings);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const employee = await prisma.employee.update({
      where: { id: Number(id) },
      data: { status }
    });
    res.json(employee);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { salary, name, phone, email, serviceAreaIds } = req.body;
    const data = {};
    if (salary !== undefined) data.salary = Number(salary);
    if (name) data.name = name;
    if (phone) data.phone = phone;
    if (email) data.email = email;
    
    if (serviceAreaIds) {
      data.serviceAreas = {
        set: serviceAreaIds.map(areaId => ({ id: Number(areaId) }))
      };
    }
    
    const employee = await prisma.employee.update({
      where: { id: Number(id) },
      data,
      include: { serviceAreas: true }
    });
    res.json(employee);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const getLeaves = async (req, res) => {
  try {
    const leaves = await prisma.leave.findMany({ include: { employee: true } });
    res.json(leaves);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const leave = await prisma.leave.update({
      where: { id: Number(id) },
      data: { status }
    });
    res.json(leave);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const getOffers = async (req, res) => {
  try {
    const offers = await prisma.offer.findMany();
    res.json(offers);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const createOffer = async (req, res) => {
  try {
    const { title, description, discountPct, validUntil, active } = req.body;
    const offer = await prisma.offer.create({
      data: {
        title,
        description,
        discountPct: Number(discountPct),
        validUntil: new Date(validUntil),
        active: active ?? true
      }
    });
    res.json(offer);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, discountPct, validUntil, active } = req.body;
    const offer = await prisma.offer.update({
      where: { id: Number(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(discountPct !== undefined && { discountPct: Number(discountPct) }),
        ...(validUntil && { validUntil: new Date(validUntil) }),
        ...(active !== undefined && { active })
      }
    });
    res.json(offer);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.offer.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Fallback Services CRUD
export const getServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const createService = async (req, res) => {
  try {
    const { name, description, price, type } = req.body;
    const service = await prisma.service.create({
      data: { name, description, price: Number(price), type }
    });
    res.json(service);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, type } = req.body;
    const service = await prisma.service.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(type && { type })
      }
    });
    res.json(service);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Service Areas
export const getServiceAreas = async (req, res) => {
  try {
    const areas = await prisma.serviceArea.findMany({ orderBy: { name: 'asc' } });
    res.json(areas);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const createServiceArea = async (req, res) => {
  try {
    const { name } = req.body;
    const area = await prisma.serviceArea.create({ data: { name } });
    res.json(area);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const deleteServiceArea = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.serviceArea.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Car Types
export const getCarTypes = async (req, res) => {
  try {
    const types = await prisma.carType.findMany({ orderBy: { name: 'asc' } });
    res.json(types);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const createCarType = async (req, res) => {
  try {
    const { name } = req.body;
    const type = await prisma.carType.create({ data: { name } });
    res.json(type);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const updateCarType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const type = await prisma.carType.update({
      where: { id: Number(id) },
      data: { name }
    });
    res.json(type);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const deleteCarType = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.carType.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Wash Types
export const getWashTypes = async (req, res) => {
  try {
    const types = await prisma.washType.findMany({ orderBy: { name: 'asc' } });
    res.json(types);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const createWashType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const type = await prisma.washType.create({ data: { name, description } });
    res.json(type);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const updateWashType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const type = await prisma.washType.update({
      where: { id: Number(id) },
      data: { name, description }
    });
    res.json(type);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const deleteWashType = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.washType.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Wash Prices Matrix
export const getWashPrices = async (req, res) => {
  try {
    const prices = await prisma.washPrice.findMany({
      include: { carType: true, washType: true }
    });
    res.json(prices);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const saveWashPrice = async (req, res) => {
  try {
    const { carTypeId, washTypeId, price, payoutType, payoutValue } = req.body;
    const washPrice = await prisma.washPrice.upsert({
      where: {
        carTypeId_washTypeId: {
          carTypeId: Number(carTypeId),
          washTypeId: Number(washTypeId)
        }
      },
      update: {
        price: Number(price),
        payoutType,
        payoutValue: Number(payoutValue)
      },
      create: {
        carTypeId: Number(carTypeId),
        washTypeId: Number(washTypeId),
        price: Number(price),
        payoutType,
        payoutValue: Number(payoutValue)
      }
    });
    res.json(washPrice);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Bookings List (Latest to Old)
export const getBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        employee: true,
        car: true,
        carType: true,
        washType: true,
        serviceArea: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Manual Assign Slot
export const assignSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;
    
    const booking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { 
        employeeId: employeeId ? Number(employeeId) : null,
        status: employeeId ? 'ASSIGNED' : 'PENDING'
      },
      include: { employee: true }
    });
    res.json(booking);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Auto Assign Slot Logic
export const autoAssignSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) }
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Find active, on-duty employees serving this service area
    const activeEmployees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        onDuty: true,
        serviceAreas: {
          some: { id: booking.serviceAreaId }
        }
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

    if (activeEmployees.length === 0) {
      return res.status(400).json({ error: 'No on-duty employees available in this service area' });
    }

    // Sort by workload (least bookings today first)
    activeEmployees.sort((a, b) => a.bookings.length - b.bookings.length);
    const chosenEmployee = activeEmployees[0];

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: {
        employeeId: chosenEmployee.id,
        status: 'ASSIGNED'
      },
      include: { employee: true }
    });

    res.json({ message: 'Auto-assigned successfully', booking: updatedBooking });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};
