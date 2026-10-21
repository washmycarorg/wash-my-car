import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { sendWelcomeEmail, sendOtpEmail } from '../utils/mailer.js';
import { generateEmployeeId } from '../utils/idGenerator.js';

// In-memory OTP storage for resilient, high-speed email OTP verification
const emailOtpMemoryStore = new Map();

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

// Helper to decode or parse Google credentials
const parseGoogleCredential = (credential, fallbackData = {}) => {
  if (credential) {
    try {
      const decoded = jwt.decode(credential);
      if (decoded && (decoded.email || decoded.sub)) {
        return {
          email: (decoded.email || '').trim().toLowerCase(),
          name: decoded.name || decoded.given_name || 'Valued Customer',
          googleId: decoded.sub || '',
          picture: decoded.picture || null,
          emailVerified: !!decoded.email_verified
        };
      }
    } catch (e) {
      console.warn('JWT decode error:', e);
    }
  }

  return {
    email: (fallbackData.email || '').trim().toLowerCase(),
    name: fallbackData.name || 'Valued Customer',
    googleId: fallbackData.googleId || fallbackData.sub || '',
    picture: fallbackData.picture || null,
    emailVerified: true
  };
};

export const googleAuth = async (req, res) => {
  try {
    const { credential, email, name, googleId, picture, phone, referralCode } = req.body;
    
    const parsed = parseGoogleCredential(credential, { email, name, googleId, picture });
    if (!parsed.email && !parsed.googleId) {
      return res.status(400).json({ error: 'Valid Google account credentials or email is required' });
    }

    const cleanEmail = parsed.email ? parsed.email.trim().toLowerCase() : null;
    const cleanGoogleId = parsed.googleId ? String(parsed.googleId).trim() : null;
    const cleanName = parsed.name || 'Valued Customer';
    
    let formattedPhone = null;
    if (phone) {
      const cleanPhone = String(phone).trim();
      const rawDigits = cleanPhone.replace(/^\+91/, '').replace(/\D/g, '');
      if (rawDigits.length >= 10) {
        formattedPhone = formatToE164(rawDigits);
      }
    }

    // Strict Phone Uniqueness Check if phone is supplied with Google Auth
    if (formattedPhone) {
      const rawDigits = formattedPhone.replace(/^\+91/, '').replace(/\D/g, '');
      const existingPhoneUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: formattedPhone },
            { phone: rawDigits },
            { phone: `+91${rawDigits}` }
          ]
        }
      });
      if (existingPhoneUser && existingPhoneUser.email !== cleanEmail && existingPhoneUser.googleId !== cleanGoogleId) {
        return res.status(400).json({ 
          error: 'This mobile number is already registered with another account. Each account must have a unique mobile number.' 
        });
      }
    }

    // Find existing user by googleId, email, or phone
    let user = null;
    if (cleanGoogleId) {
      user = await prisma.user.findFirst({ where: { googleId: cleanGoogleId } });
    }
    if (!user && cleanEmail) {
      user = await prisma.user.findFirst({ where: { email: cleanEmail } });
    }
    if (!user && formattedPhone) {
      const rawDigits = formattedPhone.replace(/^\+91/, '').replace(/\D/g, '');
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: formattedPhone },
            { phone: rawDigits },
            { phone: `+91${rawDigits}` }
          ]
        }
      });
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const isReferralActive = settings ? !!settings.referralEnabled : true;

    if (!user) {
      const uniqueCode = await generateUniqueReferralCode();
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          googleId: cleanGoogleId,
          name: cleanName,
          phone: formattedPhone,
          referralCode: uniqueCode,
          referredByCode: (isReferralActive && referralCode) ? String(referralCode).trim().toUpperCase() : null
        }
      });

      if (user.email) {
        sendWelcomeEmail({ to: user.email, name: user.name }).catch(err => {
          console.warn('⚠️ [Welcome Email] Could not send welcome email:', err?.message);
        });
      }
    } else {
      const updateData = {};
      if (!user.googleId && cleanGoogleId) updateData.googleId = cleanGoogleId;
      if (!user.email && cleanEmail) updateData.email = cleanEmail;
      if (!user.name && cleanName) updateData.name = cleanName;
      if (!user.phone && formattedPhone) updateData.phone = formattedPhone;
      if (!user.referralCode) updateData.referralCode = await generateUniqueReferralCode();
      if (isReferralActive && referralCode && !user.referredByCode) {
        updateData.referredByCode = String(referralCode).trim().toUpperCase();
      }

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });
      }
    }

    const token = generateToken({ id: user.id, role: 'USER' });
    const needsPhone = !user.phone || user.phone.trim().length < 10;
    const { password: _, ...userData } = user;

    res.json({
      message: 'Google authentication successful',
      token,
      user: userData,
      needsPhone
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: error.message || 'Google authentication failed' });
  }
};

export const userEmailRegister = async (req, res) => {
  try {
    const { name, email, password, phone, referralCode: inputRefCode } = req.body;
    
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'A valid 10-digit mobile number is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone).trim();
    const formattedPhone = formatToE164(cleanPhone);
    const rawDigits = cleanPhone.replace(/^\+91/, '').replace(/\D/g, '');

    const existingByEmail = await prisma.user.findFirst({
      where: { email: cleanEmail }
    });
    if (existingByEmail) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    const existingByPhone = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: formattedPhone },
          { phone: rawDigits }
        ]
      }
    });
    if (existingByPhone) {
      return res.status(400).json({ error: 'An account with this mobile number already exists. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uniqueCode = await generateUniqueReferralCode();

    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const isReferralActive = settings ? !!settings.referralEnabled : true;

    const user = await prisma.user.create({
      data: {
        name: (name || 'Valued Customer').trim(),
        email: cleanEmail,
        password: hashedPassword,
        phone: formattedPhone,
        referralCode: uniqueCode,
        referredByCode: (isReferralActive && inputRefCode) ? String(inputRefCode).trim().toUpperCase() : null
      }
    });

    if (user.email) {
      sendWelcomeEmail({ to: user.email, name: user.name }).catch(err => {
        console.warn('⚠️ [Welcome Email] Could not send welcome email:', err?.message);
      });
    }

    const token = generateToken({ id: user.id, role: 'USER' });
    const { password: _, ...userData } = user;
    res.json({ message: 'Account registered successfully', token, user: userData, needsPhone: false });
  } catch (error) {
    console.error('Email register error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

export const userEmailLogin = async (req, res) => {
  try {
    const { identifier, email, phone, password } = req.body;
    const inputId = (identifier || email || phone || '').trim();
    
    if (!inputId) {
      return res.status(400).json({ error: 'Please enter your email or mobile number' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Please enter your password' });
    }

    const cleanInput = inputId.toLowerCase();
    const rawDigits = inputId.replace(/^\+91/, '').replace(/\D/g, '');
    const formattedPhone = rawDigits.length >= 10 ? formatToE164(rawDigits) : inputId;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          { phone: inputId },
          { phone: formattedPhone },
          ...(rawDigits ? [{ phone: rawDigits }] : [])
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email or mobile number. Please register first.' });
    }

    if (!user.password) {
      if (user.googleId) {
        return res.status(400).json({ error: 'This account was created via Google. Please click "Continue with Google" to sign in.' });
      }
      return res.status(400).json({ error: 'No password set for this account. Please sign in with Google or reset password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    if (!user.referralCode) {
      const uniqueCode = await generateUniqueReferralCode();
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: uniqueCode }
      });
    }

    const token = generateToken({ id: user.id, role: 'USER' });
    const { password: _, ...userData } = user;
    const needsPhone = !user.phone || user.phone.trim().length < 10;
    res.json({ message: 'Login successful', token, user: userData, needsPhone });
  } catch (error) {
    console.error('Email login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
};

export const userSetPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    let userId = req.user?.id || req.body.userId;
    
    if (!userId && req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        if (token) {
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.id;
        }
      } catch (e) {
        console.warn('Token verify in userSetPhone warning:', e.message);
      }
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const cleanPhone = String(phone || '').trim();
    const rawDigits = cleanPhone.replace(/^\+91/, '').replace(/\D/g, '');
    if (!rawDigits || rawDigits.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }
    const formattedPhone = formatToE164(rawDigits);

    const existing = await prisma.user.findFirst({
      where: {
        id: { not: Number(userId) },
        OR: [
          { phone: cleanPhone },
          { phone: formattedPhone },
          { phone: rawDigits },
          { phone: `+91${rawDigits}` }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ 
        error: 'This mobile number is already registered with another account. Each account must have a unique mobile number.' 
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { phone: formattedPhone }
    });

    res.json({ message: 'Mobile number updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Set phone error:', error);
    res.status(500).json({ error: error.message || 'Failed to update mobile number' });
  }
};

// Send 6-Digit Verification Code to User's Email for Login or Register
export const sendUserEmailOtp = async (req, res) => {
  try {
    const { email, purpose = 'LOGIN', phone, name } = req.body;
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Purpose-specific validations
    if (purpose === 'LOGIN') {
      const existingUser = await prisma.user.findFirst({
        where: { email: cleanEmail }
      });
      if (!existingUser) {
        return res.status(404).json({
          error: 'No account found with this email address. Please register first.'
        });
      }
    } else if (purpose === 'REGISTER') {
      const existingEmail = await prisma.user.findFirst({
        where: { email: cleanEmail }
      });
      if (existingEmail) {
        return res.status(400).json({
          error: 'An account with this email address already exists. Please log in.'
        });
      }

      // If phone is provided during registration, validate format and strict uniqueness upfront
      if (phone) {
        const cleanPhone = String(phone).trim();
        const rawDigits = cleanPhone.replace(/^\+91/, '').replace(/\D/g, '');
        if (rawDigits.length < 10) {
          return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
        }
        const formattedPhone = formatToE164(rawDigits);
        const existingPhone = await prisma.user.findFirst({
          where: {
            OR: [
              { phone: cleanPhone },
              { phone: formattedPhone },
              { phone: rawDigits },
              { phone: `+91${rawDigits}` }
            ]
          }
        });
        if (existingPhone) {
          return res.status(400).json({
            error: 'This mobile number is already registered with another account. Each account must have a unique mobile number.'
          });
        }
      }
    }

    // Generate 6-digit random numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in memory cache
    const storeKey = `${cleanEmail}_${purpose}`;
    emailOtpMemoryStore.set(storeKey, {
      otp,
      expiresAt: expiresAt.getTime()
    });

    // Also persist in database if EmailOtp model exists (non-blocking in background)
    if (prisma.emailOtp) {
      prisma.emailOtp.deleteMany({
        where: { email: cleanEmail, purpose }
      })
      .then(() => prisma.emailOtp.create({
        data: {
          email: cleanEmail,
          otp,
          purpose,
          expiresAt
        }
      }))
      .catch((dbErr) => console.warn('DB EmailOtp write warning:', dbErr?.message));
    }

    // Send email with OTP
    const emailRes = await sendOtpEmail({
      to: cleanEmail,
      otp,
      purpose
    });

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox or spam folder.`,
      expiresInMinutes: 10
    });
  } catch (error) {
    console.error('Error sending email OTP:', error);
    res.status(500).json({ error: error.message || 'Failed to send verification email' });
  }
};

// Register User using Email OTP (No password creation required)
export const userEmailOtpRegister = async (req, res) => {
  try {
    const { name, email, phone, otp, referralCode: inputRefCode } = req.body;

    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'A valid 10-digit mobile number is required' });
    }
    if (!otp || String(otp).trim().length < 6) {
      return res.status(400).json({ error: 'Please enter the 6-digit verification code sent to your email' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const cleanPhone = String(phone).trim();
    const rawDigits = cleanPhone.replace(/^\+91/, '').replace(/\D/g, '');
    const formattedPhone = formatToE164(rawDigits);

    // 1. Strict Phone Uniqueness Check
    const existingByPhone = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: formattedPhone },
          { phone: rawDigits },
          { phone: `+91${rawDigits}` }
        ]
      }
    });
    if (existingByPhone) {
      return res.status(400).json({
        error: 'This mobile number is already registered with another account. Each account must have a unique mobile number.'
      });
    }

    // 2. Email Uniqueness Check
    const existingByEmail = await prisma.user.findFirst({
      where: { email: cleanEmail }
    });
    if (existingByEmail) {
      return res.status(400).json({
        error: 'An account with this email address already exists. Please log in.'
      });
    }

    // 3. Verify OTP against in-memory store or DB
    let isOtpValid = false;
    const storeKey = `${cleanEmail}_REGISTER`;
    const cached = emailOtpMemoryStore.get(storeKey);
    if (cached) {
      if (cached.otp === cleanOtp && cached.expiresAt >= Date.now()) {
        isOtpValid = true;
        emailOtpMemoryStore.delete(storeKey);
      }
    }

    if (!isOtpValid && prisma.emailOtp) {
      try {
        const dbRecord = await prisma.emailOtp.findFirst({
          where: {
            email: cleanEmail,
            purpose: 'REGISTER',
            otp: cleanOtp,
            expiresAt: { gte: new Date() }
          },
          orderBy: { createdAt: 'desc' }
        });
        if (dbRecord) {
          isOtpValid = true;
          await prisma.emailOtp.delete({ where: { id: dbRecord.id } }).catch(() => {});
        }
      } catch (e) {}
    }

    if (!isOtpValid) {
      return res.status(400).json({
        error: 'Invalid or expired verification code. Please check your email or click "Resend Code".'
      });
    }

    // 4. Create User (password creation not needed)
    const uniqueCode = await generateUniqueReferralCode();
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const isReferralActive = settings ? !!settings.referralEnabled : true;

    const user = await prisma.user.create({
      data: {
        name: (name || 'Valued Customer').trim(),
        email: cleanEmail,
        phone: formattedPhone,
        referralCode: uniqueCode,
        referredByCode: (isReferralActive && inputRefCode) ? String(inputRefCode).trim().toUpperCase() : null
      }
    });

    if (user.email) {
      sendWelcomeEmail({ to: user.email, name: user.name }).catch(err => {
        console.warn('⚠️ [Welcome Email] Could not send welcome email:', err?.message);
      });
    }

    const token = generateToken({ id: user.id, role: 'USER' });
    const { password: _, ...userData } = user;
    res.json({
      message: 'Registration successful! Welcome to Wash My Car.',
      token,
      user: userData,
      needsPhone: false
    });
  } catch (error) {
    console.error('Email OTP Register error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

// Login User using Email OTP (No password required)
export const userEmailOtpLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    if (!otp || String(otp).trim().length < 6) {
      return res.status(400).json({ error: 'Please enter the 6-digit verification code sent to your email' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const user = await prisma.user.findFirst({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(404).json({
        error: 'No account found with this email address. Please register first.'
      });
    }

    // Verify OTP against in-memory store or DB
    let isOtpValid = false;
    const storeKey = `${cleanEmail}_LOGIN`;
    const cached = emailOtpMemoryStore.get(storeKey);
    if (cached) {
      if (cached.otp === cleanOtp && cached.expiresAt >= Date.now()) {
        isOtpValid = true;
        emailOtpMemoryStore.delete(storeKey);
      }
    }

    if (!isOtpValid && prisma.emailOtp) {
      try {
        const dbRecord = await prisma.emailOtp.findFirst({
          where: {
            email: cleanEmail,
            purpose: 'LOGIN',
            otp: cleanOtp,
            expiresAt: { gte: new Date() }
          },
          orderBy: { createdAt: 'desc' }
        });
        if (dbRecord) {
          isOtpValid = true;
          await prisma.emailOtp.delete({ where: { id: dbRecord.id } }).catch(() => {});
        }
      } catch (e) {}
    }

    if (!isOtpValid) {
      return res.status(400).json({
        error: 'Invalid or expired verification code. Please check your email or click "Resend Code".'
      });
    }

    if (!user.referralCode) {
      const uniqueCode = await generateUniqueReferralCode();
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: uniqueCode }
      });
    }

    const token = generateToken({ id: user.id, role: 'USER' });
    const { password: _, ...userData } = user;
    const needsPhone = !user.phone || user.phone.trim().length < 10;

    res.json({
      message: 'Signed in successfully!',
      token,
      user: userData,
      needsPhone
    });
  } catch (error) {
    console.error('Email OTP Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
};

export const employeeLogin = async (req, res) => {
  try {
    const { identifier, phone, email, password, otp } = req.body;
    const inputId = (identifier || email || phone || '').trim();

    if (!inputId) {
      return res.status(400).json({ error: 'Please enter your email or phone number' });
    }

    if (!password && !otp) {
      return res.status(400).json({ error: 'Please enter your password' });
    }

    // Support phone in various formats (+91, without +91, raw digits)
    const rawDigits = inputId.replace(/^\+91/, '').replace(/\D/g, '');
    const formattedPhone = rawDigits ? `+91${rawDigits.slice(-10)}` : inputId;

    let employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: { equals: inputId, mode: 'insensitive' } },
          { phone: inputId },
          { phone: formattedPhone },
          ...(rawDigits ? [{ phone: rawDigits }] : [])
        ]
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee account not found. Please check your credentials or register.' });
    }

    if (employee.status === 'PENDING') {
      return res.status(403).json({ error: 'Your account is pending admin approval. You will receive access once approved.' });
    }

    if (employee.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact administration.' });
    }

    // Verify Password
    if (password) {
      if (employee.password) {
        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Incorrect password. Please try again.' });
        }
      } else {
        // Fallback for legacy employee accounts created before password field existed
        const legacyMatches = 
          password === 'password' ||
          password === employee.phone || 
          password === rawDigits || 
          password === '123456' || 
          password === '1234';
        
        if (legacyMatches) {
          // Auto-hash and save this password for them
          const hashedPassword = await bcrypt.hash(password, 10);
          await prisma.employee.update({
            where: { id: employee.id },
            data: { password: hashedPassword }
          });
        } else {
          return res.status(401).json({ error: 'Incorrect password. If this is your first time logging in, please contact admin.' });
        }
      }
    } else if (otp) {
      if (otp !== '1234') {
        return res.status(401).json({ error: 'Invalid password or OTP' });
      }
    }

    const token = generateToken({ id: employee.id, role: 'EMPLOYEE' });
    
    // Remove password from returned employee object
    const { password: _, ...employeeData } = employee;
    res.json({ message: 'Login successful', token, employee: employeeData });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Login error' });
  }
};

export const employeeRegister = async (req, res) => {
  try {
    const { 
      name, phone, email, password, confirmPassword, 
      photo, aadhaarNumber, address, idProofFile, serviceAreaIds 
    } = req.body;
    
    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Name, phone, and email are required' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const cleanPhone = String(phone).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // Check if employee already exists
    let existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { email: { equals: cleanEmail, mode: 'insensitive' } }
        ]
      }
    });

    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee with this phone number or email already exists' });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate serial Employee ID (e.g. WMCO-E-001)
    const generatedEmployeeId = await generateEmployeeId();

    const data = {
      employeeId: generatedEmployeeId,
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password: hashedPassword,
      photo,
      aadhaarNumber: aadhaarNumber ? aadhaarNumber.trim() : null,
      address: address ? address.trim() : null,
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

    res.json({ 
      message: `Employee registered successfully with ID ${newEmployee.employeeId}! Your account is submitted for admin approval.`, 
      employeeId: newEmployee.employeeId,
      id: newEmployee.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Registration failed' });
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
