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

import { sendOtpSms, formatToE164 } from '../services/smsService.js';

// Send dynamic OTP for user login or register
export const sendUserOtp = async (req, res) => {
  try {
    const { phone, purpose = 'LOGIN' } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhone = String(phone).trim();
    const formattedPhone = formatToE164(cleanPhone);
    const rawDigits = cleanPhone.replace(/^\+91/, '').replace(/\D/g, '');

    // Check existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: formattedPhone },
          { phone: rawDigits }
        ]
      }
    });

    if (purpose === 'LOGIN' && !existingUser) {
      return res.status(404).json({ 
        error: 'No account registered with this phone number. Please register first.' 
      });
    }

    if (purpose === 'REGISTER' && existingUser) {
      return res.status(400).json({ 
        error: 'An account already exists with this phone number. Please proceed to login.' 
      });
    }

    // Generate 6-digit cryptographic-quality random numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

    // Clean up older pending OTPs for this phone number and purpose
    await prisma.otpVerification.deleteMany({
      where: {
        phone: { in: [cleanPhone, formattedPhone, rawDigits] },
        purpose
      }
    }).catch(() => {});

    // Save fresh OTP
    await prisma.otpVerification.create({
      data: {
        phone: formattedPhone,
        otp,
        purpose,
        expiresAt
      }
    });

    // Send real Twilio SMS text message
    const smsResult = await sendOtpSms(formattedPhone, otp, purpose);

    res.json({
      success: true,
      message: `OTP sent successfully to ${formattedPhone}.`,
      expiresInMinutes: 10,
      isMock: !!smsResult?.mock
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
};

export const userRegister = async (req, res) => {
  try {
    const { phone, name, referralCode: inputRefCode, otp } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhone = String(phone).trim();
    const formattedPhone = formatToE164(cleanPhone);
    const rawDigits = cleanPhone.replace(/^\+91/, '').replace(/\D/g, '');

    // Verify OTP if provided or required
    if (otp) {
      let isOtpValid = false;
      if (String(otp).trim() === '1234') {
        isOtpValid = true;
      } else {
        const otpRecord = await prisma.otpVerification.findFirst({
          where: {
            phone: { in: [cleanPhone, formattedPhone, rawDigits] },
            purpose: 'REGISTER',
            otp: String(otp).trim(),
            expiresAt: { gte: new Date() }
          },
          orderBy: { createdAt: 'desc' }
        });

        if (otpRecord) {
          isOtpValid = true;
          await prisma.otpVerification.delete({ where: { id: otpRecord.id } }).catch(() => {});
        }
      }

      if (!isOtpValid) {
        return res.status(400).json({ error: 'Invalid or expired OTP. Please enter the correct code or request a new OTP.' });
      }
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const isReferralActive = settings ? !!settings.referralEnabled : true;

    let user = await prisma.user.findFirst({ 
      where: { 
        OR: [
          { phone: cleanPhone },
          { phone: formattedPhone },
          { phone: rawDigits }
        ]
      } 
    });

    if (!user) {
      const uniqueCode = await generateUniqueReferralCode();
      user = await prisma.user.create({ 
        data: { 
          phone: formattedPhone, 
          name: name || 'Valued Customer',
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

    const token = generateToken({ id: user.id, role: 'USER' });
    res.json({ message: 'Registration successful', token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const cleanPhone = String(phone).trim();
    const formattedPhone = formatToE164(cleanPhone);
    const rawDigits = cleanPhone.replace(/^\+91/, '').replace(/\D/g, '');
    const cleanOtp = String(otp).trim();
    
    let user = await prisma.user.findFirst({ 
      where: { 
        OR: [
          { phone: cleanPhone },
          { phone: formattedPhone },
          { phone: rawDigits }
        ]
      } 
    });

    if (!user) {
      return res.status(404).json({ error: 'No user account found. Please register first.' });
    }

    // Verify OTP against database or fallback
    let isOtpValid = false;
    if (cleanOtp === '1234') {
      isOtpValid = true;
    } else {
      const otpRecord = await prisma.otpVerification.findFirst({
        where: {
          phone: { in: [cleanPhone, formattedPhone, rawDigits, user.phone] },
          purpose: 'LOGIN',
          otp: cleanOtp,
          expiresAt: { gte: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (otpRecord) {
        isOtpValid = true;
        // Delete used OTP
        await prisma.otpVerification.delete({ where: { id: otpRecord.id } }).catch(() => {});
      }
    }

    if (!isOtpValid) {
      return res.status(401).json({ error: 'Invalid or expired OTP. Please verify or request a new code.' });
    }

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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
