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
    
    // Cost to Company (sum of employee payouts + additional company cost like chemicals/materials)
    const totalCostToCompany = completedBookings.reduce(
      (sum, b) => sum + (b.employeePayout || 0) + (b.companyCost || 0),
      0
    );

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

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
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
    const { salary, name, phone, email, serviceAreaIds, allowProfileUpdate } = req.body;
    const data = {};
    if (salary !== undefined) data.salary = Number(salary);
    if (name) data.name = name;
    if (phone) data.phone = phone;
    if (email) data.email = email;
    if (allowProfileUpdate !== undefined) data.allowProfileUpdate = Boolean(allowProfileUpdate);
    
    if (serviceAreaIds) {
      const singleAreaIds = Array.isArray(serviceAreaIds) ? serviceAreaIds.slice(0, 1) : [serviceAreaIds];
      data.serviceAreas = {
        set: singleAreaIds.map(areaId => ({ id: Number(areaId) }))
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
    const offers = await prisma.offer.findMany({
      include: {
        eligibleUsers: {
          select: { id: true, name: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(offers);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const createOffer = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      discountType,
      discountPct, 
      discountAmount,
      limitOption,
      maxDiscountAmount,
      applicableCarTypeIds,
      applicableWashTypeIds,
      validUntil, 
      active, 
      code, 
      userType, 
      usageLimit, 
      rotation, 
      eligibleUserIds 
    } = req.body;
    
    // Check if code already exists
    const existing = await prisma.offer.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ error: `Coupon code '${code}' already exists` });
    }

    const offer = await prisma.offer.create({
      data: {
        title,
        description,
        discountType: discountType || 'PERCENTAGE',
        discountPct: discountPct !== undefined ? Number(discountPct) : 0.0,
        discountAmount: discountAmount !== undefined ? Number(discountAmount) : 0.0,
        limitOption: limitOption || 'UNLIMITED',
        maxDiscountAmount: maxDiscountAmount !== undefined && maxDiscountAmount !== null ? Number(maxDiscountAmount) : null,
        applicableCarTypeIds: applicableCarTypeIds || '',
        applicableWashTypeIds: applicableWashTypeIds || '',
        validUntil: new Date(validUntil),
        active: active ?? true,
        code,
        userType: userType || 'ALL',
        usageLimit: usageLimit !== undefined ? Number(usageLimit) : 0,
        rotation: rotation || 'UNLIMITED',
        eligibleUsers: userType === 'SELECTED' && eligibleUserIds
          ? { connect: eligibleUserIds.map(userId => ({ id: Number(userId) })) }
          : undefined
      },
      include: {
        eligibleUsers: {
          select: { id: true, name: true, phone: true }
        }
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
    const { 
      title, 
      description, 
      discountType,
      discountPct, 
      discountAmount,
      limitOption,
      maxDiscountAmount,
      applicableCarTypeIds,
      applicableWashTypeIds,
      validUntil, 
      active, 
      code, 
      userType, 
      usageLimit, 
      rotation, 
      eligibleUserIds 
    } = req.body;
    
    if (code) {
      const existing = await prisma.offer.findUnique({ where: { code } });
      if (existing && existing.id !== Number(id)) {
        return res.status(400).json({ error: `Coupon code '${code}' already exists` });
      }
    }

    const offer = await prisma.offer.update({
      where: { id: Number(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(discountType && { discountType }),
        ...(discountPct !== undefined && { discountPct: Number(discountPct) }),
        ...(discountAmount !== undefined && { discountAmount: Number(discountAmount) }),
        ...(limitOption && { limitOption }),
        ...(maxDiscountAmount !== undefined && { maxDiscountAmount: maxDiscountAmount !== null ? Number(maxDiscountAmount) : null }),
        ...(applicableCarTypeIds !== undefined && { applicableCarTypeIds: applicableCarTypeIds }),
        ...(applicableWashTypeIds !== undefined && { applicableWashTypeIds: applicableWashTypeIds }),
        ...(validUntil && { validUntil: new Date(validUntil) }),
        ...(active !== undefined && { active }),
        ...(code && { code }),
        ...(userType && { userType }),
        ...(usageLimit !== undefined && { usageLimit: Number(usageLimit) }),
        ...(rotation && { rotation }),
        ...(userType === 'SELECTED' && eligibleUserIds
          ? {
              eligibleUsers: {
                set: eligibleUserIds.map(userId => ({ id: Number(userId) }))
              }
            }
          : userType && userType !== 'SELECTED'
          ? {
              eligibleUsers: {
                set: []
              }
            }
          : undefined)
      },
      include: {
        eligibleUsers: {
          select: { id: true, name: true, phone: true }
        }
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
    const { name, latitude, longitude, radius } = req.body;
    const area = await prisma.serviceArea.create({
      data: {
        name,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        radius: radius ? Number(radius) : null
      }
    });
    res.json(area);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const updateServiceArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, radius } = req.body;
    const area = await prisma.serviceArea.update({
      where: { id: Number(id) },
      data: {
        name,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        radius: radius ? Number(radius) : null
      }
    });
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
    const { carTypeId, washTypeId, price, payoutType, payoutValue, companyCost } = req.body;
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
        payoutValue: Number(payoutValue),
        companyCost: companyCost !== undefined ? Number(companyCost) : 0.0
      },
      create: {
        carTypeId: Number(carTypeId),
        washTypeId: Number(washTypeId),
        price: Number(price),
        payoutType,
        payoutValue: Number(payoutValue),
        companyCost: companyCost !== undefined ? Number(companyCost) : 0.0
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
        serviceArea: true,
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
    const candidates = await prisma.employee.findMany({
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

    const eligible = candidates.filter(emp => {
      const slotBookingsCount = emp.bookings.filter(b => b.timeSlot === booking.timeSlot).length;
      return slotBookingsCount < 2; // Cap: Max 2 bookings per slot per day
    });

    if (eligible.length === 0) {
      return res.status(400).json({ error: 'No available employees under slot booking limit (max 2 per slot) in this area.' });
    }

    // Sort by workload (least bookings today first)
    eligible.sort((a, b) => a.bookings.length - b.bookings.length);
    const chosenEmployee = eligible[0];

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

export const getEmployeesWorkload = async (req, res) => {
  try {
    const { date, timeSlot } = req.query;
    if (!date || !timeSlot) {
      return res.status(400).json({ error: 'Date and timeSlot are required query parameters' });
    }

    const startOfDay = new Date(new Date(date).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999));

    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: {
        serviceAreas: true,
        bookings: {
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay
            },
            status: { in: ['ASSIGNED', 'STARTED'] }
          }
        }
      }
    });

    const workloadList = employees.map(emp => {
      const dailyCount = emp.bookings.length;
      const slotCount = emp.bookings.filter(b => b.timeSlot === timeSlot).length;
      
      return {
        id: emp.id,
        name: emp.name,
        onDuty: emp.onDuty,
        serviceAreas: emp.serviceAreas,
        dailyCount,
        slotCount
      };
    });

    res.json(workloadList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Inventory Management
export const getInventoryItems = async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        allocations: {
          include: {
            employee: {
              select: { id: true, name: true, phone: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createInventoryItem = async (req, res) => {
  try {
    const { name, type, totalQuantity, washesPerUnit } = req.body;
    const item = await prisma.inventoryItem.create({
      data: {
        name,
        type,
        totalQuantity: Number(totalQuantity),
        washesPerUnit: Number(washesPerUnit)
      }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.inventoryItem.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const allocateInventory = async (req, res) => {
  try {
    const { inventoryItemId, employeeId, quantity } = req.body;
    
    // 1. Verify item exists and has enough quantity
    const item = await prisma.inventoryItem.findUnique({
      where: { id: Number(inventoryItemId) }
    });
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    const qtyToAllocate = Number(quantity);
    if (item.totalQuantity < qtyToAllocate) {
      return res.status(400).json({ error: `Not enough stock in warehouse. Available: ${item.totalQuantity}` });
    }

    // 2. Decrement main warehouse inventory
    await prisma.inventoryItem.update({
      where: { id: Number(inventoryItemId) },
      data: { totalQuantity: item.totalQuantity - qtyToAllocate }
    });

    // 3. Create or update Employee's allocation
    const existing = await prisma.inventoryAllocation.findFirst({
      where: {
        inventoryItemId: Number(inventoryItemId),
        employeeId: Number(employeeId)
      }
    });

    let allocation;
    if (existing) {
      allocation = await prisma.inventoryAllocation.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + qtyToAllocate
        }
      });
    } else {
      allocation = await prisma.inventoryAllocation.create({
        data: {
          inventoryItemId: Number(inventoryItemId),
          employeeId: Number(employeeId),
          quantity: qtyToAllocate,
          washesUsed: 0
        }
      });
    }

    res.json(allocation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find allocation to get quantity back
    const allocation = await prisma.inventoryAllocation.findUnique({
      where: { id: Number(id) }
    });
    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    // Return stock to warehouse
    await prisma.inventoryItem.update({
      where: { id: allocation.inventoryItemId },
      data: {
        totalQuantity: { increment: allocation.quantity }
      }
    });

    // Delete allocation record
    await prisma.inventoryAllocation.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Allocation returned/deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// System Settings CRUD
export const getSystemSettings = async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 1 }
    });
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

export const updateSystemSettings = async (req, res) => {
  try {
    const { autoAssignment, pointsRedemption, pointsReward, pointsToCashRatio, rewardPointsRatio } = req.body;
    
    const settings = await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: {
        ...(autoAssignment !== undefined && { autoAssignment: Boolean(autoAssignment) }),
        ...(pointsRedemption !== undefined && { pointsRedemption: Boolean(pointsRedemption) }),
        ...(pointsReward !== undefined && { pointsReward: Boolean(pointsReward) }),
        ...(pointsToCashRatio !== undefined && { pointsToCashRatio: Number(pointsToCashRatio) }),
        ...(rewardPointsRatio !== undefined && { rewardPointsRatio: Number(rewardPointsRatio) })
      },
      create: {
        id: 1,
        autoAssignment: autoAssignment !== undefined ? Boolean(autoAssignment) : true,
        pointsRedemption: pointsRedemption !== undefined ? Boolean(pointsRedemption) : true,
        pointsReward: pointsReward !== undefined ? Boolean(pointsReward) : true,
        pointsToCashRatio: pointsToCashRatio !== undefined ? Number(pointsToCashRatio) : 4.0,
        rewardPointsRatio: rewardPointsRatio !== undefined ? Number(rewardPointsRatio) : 0.1
      }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// ADDONS MANAGEMENT
// ========================
export const getAddons = async (req, res) => {
  try {
    let addons = await prisma.addon.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // Seed default addons if none exist yet
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
      addons = await prisma.addon.findMany({ orderBy: { createdAt: 'asc' } });
    }

    res.json(addons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAddon = async (req, res) => {
  try {
    const { name, price, description, icon, active } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const addon = await prisma.addon.create({
      data: {
        name,
        price: Number(price),
        description: description || '',
        icon: icon || 'Sparkles',
        active: active !== undefined ? Boolean(active) : true
      }
    });
    res.status(201).json(addon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAddon = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, icon, active } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (price !== undefined) data.price = Number(price);
    if (description !== undefined) data.description = description;
    if (icon !== undefined) data.icon = icon;
    if (active !== undefined) data.active = Boolean(active);

    const addon = await prisma.addon.update({
      where: { id: Number(id) },
      data
    });
    res.json(addon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAddon = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.addon.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Add-on deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// HOMEPAGE CMS MANAGEMENT
// ========================
export const getCmsContent = async (req, res) => {
  try {
    let cms = await prisma.cmsContent.findUnique({ where: { id: 1 } });
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
          quickBarLive: "● LIVE DOORSTEP SPA",
          quickBarTitle: "App & Online Booking is Live.",
          quickBarSubtitle: "Book doorstep vehicle detailing in seconds.",
          aboutTitle: "Serving Visakhapatnam & Surrounds",
          aboutText: "We proudly serve all Visakhapatnam neighborhoods with professional care and premium equipment!",
          servicesTitle: "EVERYDAY CARE. PREMIUM SHINE.",
          servicesSubtitle: "One destination for your vehicle's everyday wash, interior deep steam, and premium shine.",
          whyTitle: "SMARTER CAR CARE. BUILT AROUND YOU.",
          whySubtitle: "Convenience-first automotive detailing with professional equipment and RO water efficiency.",
          whyCard1Title: "YOUR CAR STAYS. WE COME TO YOU.",
          whyCard1Text: "No queues. No driving to wash centres. Our technicians arrive at your home or office with high-pressure machines and RO water.",
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

export const updateCmsContent = async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;

    // Convert object or array faqs to string if needed
    if (data.faqs && typeof data.faqs !== 'string') {
      data.faqs = JSON.stringify(data.faqs);
    }

    const cms = await prisma.cmsContent.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ...data
      }
    });
    res.json(cms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
