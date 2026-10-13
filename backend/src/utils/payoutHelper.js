import prisma from '../config/db.js';

/**
 * Computes employee payout for a booking based on the 3-tier compensation model:
 * 1. FIXED_SALARY: 0 per job (employee receives monthly fixed salary)
 * 2. COMMISSION_ONLY: WashType.fullCommission (default 150)
 * 3. HYBRID: WashType.partialCommission (default 50)
 */
export const computeEmployeePayout = async (employeeId, washTypeId, carTypeId, originalPrice, priceSetting = null) => {
  if (!employeeId) {
    if (priceSetting) {
      return priceSetting.payoutType === 'PERCENTAGE'
        ? (originalPrice * priceSetting.payoutValue) / 100
        : priceSetting.payoutValue;
    }
    return 150.0;
  }

  const employee = await prisma.employee.findUnique({
    where: { id: Number(employeeId) }
  });

  if (!employee) return 0.0;

  const payType = employee.payType || 'COMMISSION_ONLY';

  // Fixed salary employee receives 0 per job
  if (payType === 'FIXED_SALARY') {
    return 0.0;
  }

  const washType = await prisma.washType.findUnique({
    where: { id: Number(washTypeId) }
  });

  if (payType === 'HYBRID') {
    return washType?.partialCommission !== undefined ? washType.partialCommission : 50.0;
  }

  // COMMISSION_ONLY
  if (washType?.fullCommission !== undefined) {
    return washType.fullCommission;
  }

  if (priceSetting) {
    return priceSetting.payoutType === 'PERCENTAGE'
      ? (originalPrice * priceSetting.payoutValue) / 100
      : priceSetting.payoutValue;
  }

  return 150.0;
};
