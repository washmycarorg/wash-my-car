import prisma from '../config/db.js';
import { sendPushNotification } from '../utils/pushNotification.js';
import { getRazorpayInstance } from '../config/razorpay.js';
import { sendDoorstepRejectionEmail } from '../utils/mailer.js';


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

    const commissionEarnings = allCompletedBookings.reduce((sum, b) => sum + (b.employeePayout || 0), 0);
    const payType = employee.payType || 'COMMISSION_ONLY';
    let earnings = 0;
    if (payType === 'FIXED_SALARY') {
      earnings = employee.salary || employee.baseSalary || 0;
    } else if (payType === 'COMMISSION_ONLY') {
      earnings = commissionEarnings;
    } else if (payType === 'HYBRID') {
      earnings = (employee.baseSalary || 0) + commissionEarnings;
    } else {
      earnings = commissionEarnings;
    }

    const recentPayouts = completedBookingsList.map(b => ({
      id: b.id,
      job: b.washType?.name || 'Wash Service',
      date: b.date,
      customer: b.user.name || b.user.phone,
      amount: b.employeePayout || 0
    }));

    // Active & Next Job details for employee dashboard
    const activeJobs = await prisma.booking.findMany({
      where: {
        employeeId: req.user.id,
        paymentStatus: 'PAID',
        status: { in: ['ASSIGNED', 'STARTED'] }
      },
      include: {
        user: true,
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
      orderBy: { date: 'asc' },
      take: 5
    });

    const nextJob = activeJobs[0] || null;

    res.json({
      ...employee,
      earnings,
      commissionEarnings,
      recentPayouts,
      nextJob,
      activeJobs,
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
    const existingEmp = await prisma.employee.findUnique({
      where: { id: req.user.id }
    });
    if (!existingEmp) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    if (!existingEmp.allowProfileUpdate) {
      return res.status(403).json({ error: 'Profile editing is locked by admin. Contact admin to unlock.' });
    }

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
      const singleAreaIds = Array.isArray(serviceAreaIds) ? serviceAreaIds.slice(0, 1) : [serviceAreaIds];
      data.serviceAreas = {
        set: singleAreaIds.map(areaId => ({ id: Number(areaId) }))
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

    const commissionEarnings = allCompletedBookings.reduce((sum, b) => sum + (b.employeePayout || 0), 0);
    const payType = employee.payType || 'COMMISSION_ONLY';
    let earnings = 0;
    if (payType === 'FIXED_SALARY') {
      earnings = employee.salary || employee.baseSalary || 0;
    } else if (payType === 'COMMISSION_ONLY') {
      earnings = commissionEarnings;
    } else if (payType === 'HYBRID') {
      earnings = (employee.baseSalary || 0) + commissionEarnings;
    } else {
      earnings = commissionEarnings;
    }

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
      commissionEarnings,
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
      where: { 
        employeeId: req.user.id,
        paymentStatus: 'PAID',
        status: { not: 'CANCELLED' }
      },
      include: { 
        user: true, 
        car: true, 
        carType: true, 
        washType: true, 
        serviceArea: true,
        review: true,
        addons: {
          include: {
            addon: true
          }
        }
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
    
    const booking = await prisma.booking.findUnique({ 
      where: { id: Number(id) },
      include: { washType: true }
    });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to service this booking' });
    }

    // Determine payout snapshot based on employee pay type
    const employee = await prisma.employee.findUnique({ where: { id: req.user.id } });
    const empPayType = employee?.payType || 'COMMISSION_ONLY';
    let washPayout = 0;
    if (empPayType === 'FIXED_SALARY') {
      washPayout = 0; // Fixed salary employee receives 0 per-wash commission
    } else if (empPayType === 'COMMISSION_ONLY') {
      washPayout = (booking.washType?.fullCommission !== undefined && booking.washType?.fullCommission !== null)
        ? booking.washType.fullCommission
        : (booking.employeePayout || 100);
    } else if (empPayType === 'HYBRID') {
      washPayout = (booking.washType?.partialCommission !== undefined && booking.washType?.partialCommission !== null)
        ? booking.washType.partialCommission
        : (booking.employeePayout ? booking.employeePayout * 0.5 : 50);
    } else {
      washPayout = booking.employeePayout || 0;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { 
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        endImage: photo,
        endLatitude: latitude ? Number(latitude) : null,
        endLongitude: longitude ? Number(longitude) : null,
        endAt: new Date(),
        employeePayout: washPayout
      },
      include: {
        user: true
      }
    });

    // Check and trigger referral program reward on 1st completed wash
    try {
      const customer = updatedBooking.user;
      if (customer && customer.referredByCode) {
        // Check if this is the customer's first completed wash
        const prevCompletedCount = await prisma.booking.count({
          where: {
            userId: customer.id,
            status: 'COMPLETED',
            id: { not: updatedBooking.id }
          }
        });

        if (prevCompletedCount === 0) {
          const referrer = await prisma.user.findUnique({
            where: { referralCode: customer.referredByCode }
          });

          if (referrer && referrer.id !== customer.id) {
            const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
            if (settings && settings.referralEnabled === false) {
              // Referral program is disabled by administration
              return;
            }
            const basePoints = settings?.referralRewardPoints ?? 50;
            const maxLimit = settings?.referralMaxLimit ?? 10;
            const streakBonus = settings?.referralStreakBonus ?? 25;

            // Count how many previous referrals this referrer has completed
            const completedReferrals = await prisma.user.count({
              where: {
                referredByCode: referrer.referralCode,
                bookings: { some: { status: 'COMPLETED' } }
              }
            });

            // If maxLimit > 0 and limit is reached, do not grant further reward points
            if (maxLimit === 0 || completedReferrals <= maxLimit) {
              let pointsToAward = basePoints;

              // Check if custom streak config exists
              if (settings?.referralStreakConfig) {
                try {
                  const tiers = JSON.parse(settings.referralStreakConfig);
                  if (Array.isArray(tiers)) {
                    // Match tier for this referral number (1-based)
                    const matchedTier = tiers.find(t => Number(t.count) === completedReferrals);
                    if (matchedTier && matchedTier.points) {
                      pointsToAward = Number(matchedTier.points);
                    } else if (completedReferrals > 1 && streakBonus > 0) {
                      pointsToAward = basePoints + ((completedReferrals - 1) * streakBonus);
                    }
                  }
                } catch (e) {
                  // Fallback to streak bonus calculation
                  if (completedReferrals > 1 && streakBonus > 0) {
                    pointsToAward = basePoints + ((completedReferrals - 1) * streakBonus);
                  }
                }
              }

              await prisma.user.update({
                where: { id: referrer.id },
                data: {
                  points: { increment: pointsToAward }
                }
              });
              console.log(`Awarded ${pointsToAward} referral points to referrer ${referrer.id} for customer ${customer.id}`);
            }
          }
        }
      }
    } catch (refErr) {
      console.error('Error processing referral bonus:', refErr);
    }

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

    sendPushNotification('USER', updatedBooking.userId, {
      title: 'Wash Completed ✨ Give Review & Rating',
      body: `Your vehicle doorstep wash is completed! Please rate your technician and share your feedback.`,
      url: `/bookings?review=${updatedBooking.id}`
    }).catch(e => console.error('[Push Complete User Error]:', e));

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

// Report doorstep issue (Customer Not Available, Not Lifting Call, Wrong Location, etc.)
export const reportBookingIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { issueType, note } = req.body;

    if (!issueType) {
      return res.status(400).json({ error: 'Please select an issue type to report.' });
    }

    const booking = await prisma.booking.findUnique({ where: { id: Number(id) } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to report issues for this booking.' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: {
        reportedIssue: issueType,
        reportedIssueNote: note ? String(note).trim() : null,
        reportedIssueAt: new Date()
      },
      include: {
        user: true,
        car: true,
        carType: true,
        washType: true,
        serviceArea: true,
        addons: {
          include: { addon: true }
        }
      }
    });

    res.json({
      message: 'Issue reported to administration successfully.',
      booking: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to report issue.' });
  }
};

// Employee marks doorstep rejection / customer unavailable
export const markDoorstepRejectionByEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { note = 'Customer not available / rejected upon arrival' } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: { user: true, washType: true, carType: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this booking.' });
    }

    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return res.status(400).json({ error: `Cannot mark rejection on a ${booking.status.toLowerCase()} booking.` });
    }

    let refundDetails = {
      refundId: null,
      refundAmount: 0,
      refundStatus: 'NONE'
    };

    const isSubscription = Boolean(booking.userSubscriptionId || booking.subscriptionCovered);

    // 1. Physical payment deduction:
    if (booking.paymentStatus === 'PAID' && booking.razorpayPaymentId && booking.price > 0) {
      const payableAmount = booking.price;
      const refundAmt = Math.max(0, payableAmount - 99);

      if (refundAmt > 0) {
        try {
          const razorpay = getRazorpayInstance();
          const refundResponse = await razorpay.payments.refund(booking.razorpayPaymentId, {
            amount: Math.round(refundAmt * 100),
            notes: {
              bookingId: booking.id,
              reason: 'Customer Not Available / Doorstep Rejection (₹99 fee deducted)'
            }
          });

          refundDetails = {
            refundId: refundResponse.id,
            refundAmount: refundAmt,
            refundStatus: 'PROCESSED'
          };
        } catch (err) {
          console.error('Razorpay refund error on employee doorstep rejection:', err);
          refundDetails = {
            refundId: null,
            refundAmount: refundAmt,
            refundStatus: 'FAILED'
          };
        }
      } else {
        refundDetails = {
          refundId: null,
          refundAmount: 0,
          refundStatus: 'NONE'
        };
      }
    }

    // 2. Reward points adjustment & reversal of points earned
    const freshUserRejection = await prisma.user.findUnique({ where: { id: booking.userId } });
    if (freshUserRejection) {
      let netPointsChange = 0;
      // If customer paid through reward points: deduct 99 points doorstep visit fee, restore remaining points
      if (booking.pointsRedeemed > 0) {
        const pointsRestored = Math.max(0, booking.pointsRedeemed - 99);
        netPointsChange += pointsRestored;
      }
      // Revert reward points earned on successful payment if any
      if (booking.paymentStatus === 'PAID' && booking.pointsEarned > 0) {
        netPointsChange -= booking.pointsEarned;
      }
      if (netPointsChange !== 0) {
        await prisma.user.update({
          where: { id: booking.userId },
          data: {
            points: Math.max(0, freshUserRejection.points + netPointsChange)
          }
        });
      }
    }

    // 3. Subscription booking: 1 wash quota burned, zero refund/compensation

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: `Customer Not Available / Doorstep Rejection (₹99 fee deducted). Note: ${note}`,
        reportedIssue: 'DOORSTEP_REJECTION',
        reportedIssueNote: note,
        reportedIssueAt: new Date(),
        doorstepFeeDeducted: 99.0,
        paymentStatus: refundDetails.refundStatus === 'PROCESSED' ? 'REFUNDED' : (booking.price > 99 ? 'REFUND_PENDING' : 'PAID'),
        refundId: refundDetails.refundId,
        refundAmount: refundDetails.refundAmount,
        refundStatus: refundDetails.refundStatus
      },
      include: { user: true, washType: true, carType: true }
    });

    // Notify customer via Web Push
    sendPushNotification('USER', booking.userId, {
      title: 'Doorstep Visit Update ⚠️',
      body: isSubscription
        ? `Booking #${booking.id} was marked as customer unavailable upon technician arrival. 1 subscription wash limit was deducted per policy.`
        : `Booking #${booking.id} was marked as customer unavailable. ₹99 visit fee was deducted${refundDetails.refundAmount > 0 ? ` (₹${refundDetails.refundAmount} refunded)` : ''}.`,
      url: '/bookings'
    }).catch(err => console.error('[Push Rejection Error]:', err));

    // Send Doorstep Rejection / Unavailability Notice Email with super CSS styling
    if (booking.user?.email) {
      sendDoorstepRejectionEmail({
        to: booking.user.email,
        name: booking.user.name,
        booking: updatedBooking,
        refundDetails,
        note
      }).catch(err => console.error('[Email Employee Rejection Error]:', err));
    }

    res.json({
      message: isSubscription
        ? 'Reported as customer unavailable. 1 subscription wash limit deducted with zero refund.'
        : `Reported as customer unavailable. ₹99 fee deducted${refundDetails.refundAmount > 0 ? `, ₹${refundDetails.refundAmount} refunded` : ''}.`,
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Employee doorstep rejection error:', error);
    res.status(500).json({ error: error.message || 'Failed to report doorstep rejection.' });
  }
};

