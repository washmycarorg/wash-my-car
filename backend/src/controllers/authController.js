import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-mocking';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

// Generate guaranteed unique referral code for users
const generateUniqueReferralCode = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 20; attempt++) {
    let randomPart = '';
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const candidate = 'WMC' + randomPart;
    const existing = await prisma.user.findUnique({ where: { referralCode: candidate } });
    if (!existing) {
      return candidate;
    }
  }
  return 'WMC' + Date.now().toString(36).slice(-5).toUpperCase();
};

export const userRegister = async (req, res) => {
  try {
    const { phone, name, referralCode: inputRefCode } = req.body;
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const isReferralActive = settings ? !!settings.referralEnabled : true;

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      const uniqueCode = await generateUniqueReferralCode();
      user = await prisma.user.create({ 
        data: { 
          phone, 
          name,
          referralCode: uniqueCode,
          referredByCode: (isReferralActive && inputRefCode) ? String(inputRefCode).trim().toUpperCase() : null
        } 
      });
    } else {
      if (!user.referralCode) {
        const uniqueCode = await generateUniqueReferralCode();
        user = await prisma.user.update({
          where: { id: user.id },
          data: { referralCode: uniqueCode }
        });
      }
      if (isReferralActive && inputRefCode && !user.referredByCode) {
        await prisma.user.update({
          where: { id: user.id },
          data: { referredByCode: String(inputRefCode).trim().toUpperCase() }
        });
      }
    }
    res.json({ message: 'OTP sent (mock)', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const userLogin = async (req, res) => {
  const { phone, otp } = req.body;
  if (otp !== '1234') return res.status(401).json({ error: 'Invalid OTP' });
  
  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Ensure user has a unique referralCode
  if (!user.referralCode) {
    const uniqueCode = await generateUniqueReferralCode();
    user = await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: uniqueCode }
    });
  }
  
  const token = generateToken({ id: user.id, role: 'USER' });
  res.json({ message: 'Login successful', token, user });
};

export const employeeLogin = async (req, res) => {
  const { phone, otp } = req.body;
  if (otp !== '1234') return res.status(401).json({ error: 'Invalid OTP' });

  let employee = await prisma.employee.findUnique({ where: { phone } });
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  if (employee.status === 'PENDING') {
    return res.status(403).json({ error: 'Your account is pending admin approval. You will receive access once approved.' });
  }

  const token = generateToken({ id: employee.id, role: 'EMPLOYEE' });
  res.json({ message: 'Login successful', token, employee });
};

export const employeeRegister = async (req, res) => {
  try {
    const { name, phone, email, photo, aadhaarNumber, address, idProofFile, serviceAreaIds } = req.body;
    
    // Check if employee already exists
    let existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { phone },
          { email }
        ]
      }
    });

    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee with this phone or email already exists' });
    }

    const data = {
      name,
      phone,
      email,
      photo,
      aadhaarNumber,
      address,
      idProofFile,
      status: 'PENDING'
    };

    const singleAreaIds = serviceAreaIds ? (Array.isArray(serviceAreaIds) ? serviceAreaIds.slice(0, 1) : [serviceAreaIds]) : [];
    if (singleAreaIds.length > 0) {
      data.serviceAreas = {
        connect: singleAreaIds.map(id => ({ id: Number(id) }))
      };
    }

    const newEmployee = await prisma.employee.create({
      data,
      include: { serviceAreas: true }
    });

    res.json({ message: 'Employee registered successfully', employeeId: newEmployee.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@washmycar.com' && password === 'admin123') {
     const token = generateToken({ id: 1, role: 'ADMIN' });
     res.json({ message: 'Admin login successful', token });
  } else {
     res.status(401).json({ error: 'Invalid credentials' });
  }
};
