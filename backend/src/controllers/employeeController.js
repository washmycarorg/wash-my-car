import prisma from '../config/db.js';

export const getProfile = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({ 
      where: { id: req.user.id } 
    });
    
    // Dynamic stats
    const completedJobs = await prisma.booking.count({
      where: { employeeId: req.user.id, status: 'COMPLETED' }
    });
    
    const pendingJobs = await prisma.booking.count({
      where: { employeeId: req.user.id, status: 'ASSIGNED' }
    });

    const completedBookingsList = await prisma.booking.findMany({
      where: { employeeId: req.user.id, status: 'COMPLETED' },
      include: { service: true, user: true },
      orderBy: { date: 'desc' },
      take: 10
    });

    const allCompletedBookings = await prisma.booking.findMany({
      where: { employeeId: req.user.id, status: 'COMPLETED' },
      include: { service: true }
    });

    const earnings = allCompletedBookings.reduce((sum, b) => sum + (b.service.price * 0.50), 0);
    const recentPayouts = completedBookingsList.map(b => ({
      id: b.id,
      job: b.service.name,
      date: b.date,
      customer: b.user.name || b.user.phone,
      amount: b.service.price * 0.50
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
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const toggleDuty = async (req, res) => {
  try {
    const { onDuty } = req.body;
    const employee = await prisma.employee.update({
      where: { id: req.user.id },
      data: { onDuty }
    });
    res.json(employee);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getAssignedBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ 
      where: { employeeId: req.user.id },
      include: { service: true, user: true, car: true },
      orderBy: { date: 'asc' }
    });
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// Allow employees to update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if assigned to this employee
    const booking = await prisma.booking.findUnique({ where: { id: Number(id) } });
    if (booking.employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { status }
    });
    res.json(updatedBooking);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
