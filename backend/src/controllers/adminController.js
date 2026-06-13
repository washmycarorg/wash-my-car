import prisma from '../config/db.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalBookings = await prisma.booking.count();
    const activeBookings = await prisma.booking.count({ where: { status: { in: ['PENDING', 'ASSIGNED'] } } });
    const employeesOnline = await prisma.employee.count({ where: { onDuty: true, status: 'ACTIVE' } });
    
    // Calculate Revenue
    const completedBookings = await prisma.booking.findMany({
      where: { status: 'COMPLETED' },
      include: { service: true }
    });
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.service?.price || 0), 0);
    
    // Calculate Cost to Company (sum of all active employee salaries)
    const employees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
    const totalCostToCompany = employees.reduce((sum, e) => sum + (e.salary || 0), 0);

    res.json({
      totalRevenue,
      totalCostToCompany,
      activeBookings,
      employeesOnline,
      totalBookings
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        bookings: true,
        leaves: true
      }
    });
    res.json(employees);
  } catch (error) { res.status(500).json({ error: error.message }); }
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
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { salary, name, phone, email } = req.body;
    const data = {};
    if (salary !== undefined) data.salary = Number(salary);
    if (name) data.name = name;
    if (phone) data.phone = phone;
    if (email) data.email = email;
    
    const employee = await prisma.employee.update({
      where: { id: Number(id) },
      data
    });
    res.json(employee);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getLeaves = async (req, res) => {
  try {
    const leaves = await prisma.leave.findMany({ include: { employee: true } });
    res.json(leaves);
  } catch (error) { res.status(500).json({ error: error.message }); }
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
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getOffers = async (req, res) => {
  try {
    const offers = await prisma.offer.findMany();
    res.json(offers);
  } catch (error) { res.status(500).json({ error: error.message }); }
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
  } catch (error) { res.status(500).json({ error: error.message }); }
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
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.offer.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createService = async (req, res) => {
  try {
    const { name, description, price, type } = req.body;
    const service = await prisma.service.create({
      data: {
        name,
        description,
        price: Number(price),
        type
      }
    });
    res.json(service);
  } catch (error) { res.status(500).json({ error: error.message }); }
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
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        employee: true,
        car: true,
        service: true
      }
    });
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const assignSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;
    const booking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { 
        employeeId: Number(employeeId),
        status: 'ASSIGNED'
      }
    });
    res.json(booking);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
