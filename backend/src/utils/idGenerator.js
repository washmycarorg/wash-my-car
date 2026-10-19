import prisma from '../config/db.js';

/**
 * Format any date input to DDMMYY string
 * e.g. "2026-10-19" or Date object -> "191026"
 */
export const getBookingDateDDMMYY = (dateInput) => {
  if (!dateInput) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    return `${day}${month}${year}`;
  }

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const [year, month, day] = dateInput.substring(0, 10).split('-');
    return `${day}${month}${year.slice(-2)}`;
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    return `${day}${month}${year}`;
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
};

/**
 * Generate next serial Employee ID: "WMCO-E-XXX"
 * e.g. WMCO-E-001, WMCO-E-002...
 */
export const generateEmployeeId = async () => {
  const allEmployees = await prisma.employee.findMany({
    select: { id: true, employeeId: true }
  });

  let maxSerial = 0;
  for (const emp of allEmployees) {
    if (emp.employeeId) {
      const match = emp.employeeId.match(/WMCO-E-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSerial) maxSerial = num;
      }
    }
  }

  if (maxSerial === 0 && allEmployees.length > 0) {
    maxSerial = allEmployees.length;
  }

  const nextSerial = maxSerial + 1;
  const serialStr = String(nextSerial).padStart(3, '0');
  return `WMCO-E-${serialStr}`;
};

/**
 * Generate next serial Booking ID: "WMC-DDMMYY-XXX"
 * e.g. WMC-191026-001, WMC-191026-002...
 */
export const generateDailyBookingId = async (targetDate) => {
  const ddmmyy = getBookingDateDDMMYY(targetDate);
  const prefix = `WMC-${ddmmyy}-`;

  const existingBookings = await prisma.booking.findMany({
    where: {
      bookingId: { startsWith: prefix }
    },
    select: { bookingId: true }
  });

  let maxSerial = 0;
  for (const b of existingBookings) {
    if (b.bookingId) {
      const parts = b.bookingId.split('-');
      const numStr = parts[parts.length - 1];
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxSerial) {
        maxSerial = num;
      }
    }
  }

  const nextSerial = maxSerial + 1;
  const serialStr = String(nextSerial).padStart(3, '0');
  return `${prefix}${serialStr}`;
};

/**
 * Backfill existing employees missing employeeId
 */
export const backfillExistingEmployeeIds = async () => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { id: 'asc' }
    });

    let serial = 1;
    for (const emp of employees) {
      if (!emp.employeeId) {
        const generated = `WMCO-E-${String(serial).padStart(3, '0')}`;
        await prisma.employee.update({
          where: { id: emp.id },
          data: { employeeId: generated }
        });
        console.log(`[Backfill] Assigned employeeId ${generated} to Employee #${emp.id} (${emp.name})`);
      } else {
        const match = emp.employeeId.match(/WMCO-E-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= serial) serial = num;
        }
      }
      serial++;
    }
  } catch (err) {
    console.error('[Backfill Employee IDs Error]:', err);
  }
};

/**
 * Backfill existing bookings missing bookingId
 */
export const backfillExistingBookingIds = async () => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: [{ date: 'asc' }, { id: 'asc' }]
    });

    const dayCounters = {};

    for (const b of bookings) {
      const ddmmyy = getBookingDateDDMMYY(b.date);
      if (!dayCounters[ddmmyy]) {
        dayCounters[ddmmyy] = 1;
      }

      if (!b.bookingId) {
        const generated = `WMC-${ddmmyy}-${String(dayCounters[ddmmyy]).padStart(3, '0')}`;
        await prisma.booking.update({
          where: { id: b.id },
          data: { bookingId: generated }
        });
        console.log(`[Backfill] Assigned bookingId ${generated} to Booking #${b.id}`);
      } else {
        const parts = b.bookingId.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum) && lastNum >= dayCounters[ddmmyy]) {
          dayCounters[ddmmyy] = lastNum;
        }
      }
      dayCounters[ddmmyy]++;
    }
  } catch (err) {
    console.error('[Backfill Booking IDs Error]:', err);
  }
};
