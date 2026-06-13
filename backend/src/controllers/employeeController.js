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

    res.json({
      ...employee,
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
