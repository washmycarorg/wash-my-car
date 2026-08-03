import prisma from '../config/db.js';

export const getProfile = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({ 
      where: { id: req.user.id },
      include: { serviceAreas: true }
    });
    
    // Dynamic stats
    const completedJobs = await prisma.booking.count({
      where: { employeeId: req.user.id, status: 'COMPLETED' }
    });
    
    const pendingJobs = await prisma.booking.count({
      where: { employeeId: req.user.id, status: { in: ['ASSIGNED', 'STARTED'] } }
    });

    const completedBookingsList = await prisma.booking.findMany({
      where: { employeeId: req.user.id, status: 'COMPLETED' },
      include: { washType: true, user: true },
      orderBy: { date: 'desc' },
      take: 10
    });

    const allCompletedBookings = await prisma.booking.findMany({
      where: { employeeId: req.user.id, status: 'COMPLETED' }
    });

    const earnings = allCompletedBookings.reduce((sum, b) => sum + (b.employeePayout || 0), 0);
    const recentPayouts = completedBookingsList.map(b => ({
      id: b.id,
      job: b.washType?.name || 'Wash Service',
      date: b.date,
      customer: b.user.name || b.user.phone,
      amount: b.employeePayout || 0
    }));

    res.json({
      ...employee,
      earnings,
      recentPayouts,
      stats: {
        completedJobs,
        pendingJobs
      }
    });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, email, photo, serviceAreaIds, aadhaarNumber, address, idProofFile } = req.body;
    const data = {};
    if (name) data.name = name;
    if (phone) data.phone = phone;
    if (email) data.email = email;
    if (photo !== undefined) data.photo = photo;
    if (aadhaarNumber !== undefined) data.aadhaarNumber = aadhaarNumber;
    if (address !== undefined) data.address = address;
    if (idProofFile !== undefined) data.idProofFile = idProofFile;
    
    if (serviceAreaIds) {
      data.serviceAreas = {
        set: serviceAreaIds.map(areaId => ({ id: Number(areaId) }))
      };
    }
    
    const employee = await prisma.employee.update({
      where: { id: req.user.id },
      data,
      include: { serviceAreas: true }
    });

    // Calculate dynamic stats just like getProfile
    const completedJobs = await prisma.booking.count({
      where: { employeeId: req.user.id, status: 'COMPLETED' }
    });
    
    const pendingJobs = await prisma.booking.count({
      where: { employeeId: req.user.id, status: { in: ['ASSIGNED', 'STARTED'] } }
    });

    const completedBookingsList = await prisma.booking.findMany({
      where: { employeeId: req.user.id, status: 'COMPLETED' },
      include: { washType: true, user: true },
      orderBy: { date: 'desc' },
      take: 10
    });

    const allCompletedBookings = await prisma.booking.findMany({
      where: { employeeId: req.user.id, status: 'COMPLETED' }
    });

    const earnings = allCompletedBookings.reduce((sum, b) => sum + (b.employeePayout || 0), 0);
    const recentPayouts = completedBookingsList.map(b => ({
      id: b.id,
      job: b.washType?.name || 'Wash Service',
      date: b.date,
      customer: b.user.name || b.user.phone,
      amount: b.employeePayout || 0
    }));

    res.json({
      ...employee,
      earnings,
      recentPayouts,
      stats: {
        completedJobs,
        pendingJobs
      }
    });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const toggleDuty = async (req, res) => {
  try {
    let { onDuty } = req.body;
    if (onDuty === undefined) {
      const current = await prisma.employee.findUnique({ where: { id: req.user.id } });
      onDuty = !current.onDuty;
    }
    const employee = await prisma.employee.update({
      where: { id: req.user.id },
      data: { onDuty }
    });
    res.json(employee);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const getAssignedBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ 
      where: { employeeId: req.user.id },
      include: { 
        user: true, 
        car: true, 
        carType: true, 
        washType: true, 
        serviceArea: true 
      },
      orderBy: { date: 'asc' }
    });
    res.json(bookings);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Start booking with photo and coordinates
export const startBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { photo, latitude, longitude } = req.body;
    
    const booking = await prisma.booking.findUnique({ where: { id: Number(id) } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to service this booking' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { 
        status: 'STARTED',
        startImage: photo,
        startLatitude: latitude ? Number(latitude) : null,
        startLongitude: longitude ? Number(longitude) : null,
        startAt: new Date()
      }
    });
    res.json(updatedBooking);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Complete booking with photo and coordinates
export const completeBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { photo, latitude, longitude } = req.body;
    
    const booking = await prisma.booking.findUnique({ where: { id: Number(id) } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to service this booking' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { 
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        endImage: photo,
        endLatitude: latitude ? Number(latitude) : null,
        endLongitude: longitude ? Number(longitude) : null,
        endAt: new Date()
      }
    });

    // Increment washesUsed on active inventory allocations
    try {
      await prisma.inventoryAllocation.updateMany({
        where: { employeeId: req.user.id },
        data: {
          washesUsed: {
            increment: 1
          }
        }
      });
    } catch (err) {
      console.error('Failed to increment washesUsed:', err);
    }

    res.json(updatedBooking);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// Employee Inventory Allocation fetch
export const getEmployeeInventory = async (req, res) => {
  try {
    const allocations = await prisma.inventoryAllocation.findMany({
      where: { employeeId: req.user.id },
      include: {
        inventoryItem: true
      },
      orderBy: { inventoryItem: { name: 'asc' } }
    });
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
