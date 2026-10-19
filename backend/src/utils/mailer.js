import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, '../assets/logo.png');

let cachedTransporter = null;

// Create reusable pooled transporter using Gmail SMTP or custom SMTP
export const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 465);
  const secure = port === 465;

  cachedTransporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    host,
    port,
    secure,
    auth: {
      user,
      pass: pass.replace(/\s+/g, '') // remove spaces from 16-character Google App Passwords
    }
  });

  return cachedTransporter;
};

/**
 * Generic email sending helper with web-hosted logo (lightweight & instant dispatch)
 */
export const sendEmail = async ({ to, subject, html, text, customAttachments = [] }) => {
  try {
    if (!to || !String(to).trim()) {
      return { skipped: true, reason: 'NO_RECIPIENT_EMAIL' };
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.warn(`⚠️ [Mailer] EMAIL_USER / EMAIL_PASS not configured in backend/.env. Email to ${to} skipped.`);
      console.log(`[EMAIL DISPATCH MOCK]\nTo: ${to}\nSubject: ${subject}\n`);
      return { skipped: true, reason: 'CREDENTIALS_NOT_CONFIGURED' };
    }

    const fromAddress = process.env.EMAIL_FROM || `"Wash My Car Org" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: text || '',
      html: html || text,
      attachments: customAttachments
    });

    console.log(`✅ [Mailer] Email sent successfully to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [Mailer] Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Reusable HTML Email Shell with Glassmorphism Header, Logo, and Polished Footer
 */
const renderEmailShell = ({ headerTitle, headerSubtitle, bodyContent }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle || 'Wash My Car'}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .content { padding: 1.25rem 1rem !important; }
      .otp-code { font-size: 2rem !important; letter-spacing: 0.2em !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #F1F5F9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9;">
    <tr>
      <td align="center" style="padding: 0 12px;">
        <!-- Email Container Card -->
        <table role="presentation" class="container" width="580" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; background-color: #FFFFFF; border-radius: 18px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A0F1D 0%, #0369A1 100%); padding: 2rem 1.5rem; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="background: #FFFFFF; width: 68px; height: 68px; border-radius: 16px; margin: 0 auto 0.85rem auto; padding: 4px; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28); border: 2px solid rgba(255, 255, 255, 0.35);">
                      <img src="https://washmycar.org.in/logo.png" alt="Wash My Car Logo" width="60" height="60" style="width: 60px; height: 60px; object-fit: contain; display: block; border-radius: 12px;" />
                    </div>
                    <h1 style="margin: 0; font-size: 1.6rem; color: #FFFFFF; font-weight: 900; letter-spacing: -0.02em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      WASH MY CAR <span style="color: #38BDF8;">ORG</span>
                    </h1>
                    <p style="margin: 0.35rem 0 0; color: #BAE6FD; font-size: 0.86rem; font-weight: 500; letter-spacing: 0.03em;">
                      ${headerSubtitle || 'Doorstep Car Care & Detailing In Vizag'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td class="content" style="padding: 2rem 1.75rem; background-color: #FFFFFF;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Branded Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 1.25rem 1.5rem; text-align: center;">
              <p style="margin: 0 0 0.35rem 0; font-size: 0.82rem; font-weight: 700; color: #475569;">
                Wash My Car Org &bull; Certified Doorstep Vehicle Care
              </p>
              <p style="margin: 0 0 0.6rem 0; font-size: 0.76rem; color: #94A3B8; line-height: 1.45;">
                Need help or have questions? Email us at <a href="mailto:washmycarorg@gmail.com" style="color: #0284C7; text-decoration: none; font-weight: 600;">washmycarorg@gmail.com</a><br/>
                Or visit our website at <a href="https://washmycar.org.in" target="_blank" style="color: #0284C7; text-decoration: none; font-weight: 600;">washmycar.org.in</a>
              </p>
              <p style="margin: 0; font-size: 0.72rem; color: #CBD5E1;">
                &copy; 2026 Wash My Car Org. Visakhapatnam, Andhra Pradesh. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

/**
 * 1. Send Super CSS 6-Digit Email OTP for Login or Registration
 */
export const sendOtpEmail = async ({ to, otp, purpose = 'LOGIN' }) => {
  const isRegister = purpose === 'REGISTER';
  const actionLabel = isRegister ? 'Registration' : 'Login';
  const subject = `${otp} is your Wash My Car verification code`;

  const bodyContent = `
    <div style="text-align: center;">
      <span style="display: inline-block; background: #E0F2FE; color: #0284C7; font-size: 0.75rem; font-weight: 800; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.75rem; border: 1px solid #BAE6FD;">
        ${actionLabel} Security Verification
      </span>

      <h2 style="color: #0F172A; font-size: 1.35rem; font-weight: 800; margin: 0 0 0.5rem 0;">
        Your One-Time Passcode (OTP)
      </h2>

      <p style="color: #64748B; font-size: 0.92rem; margin: 0 auto 1.5rem auto; max-width: 440px; line-height: 1.55;">
        Enter the 6-digit verification code below to complete your ${isRegister ? 'account registration' : 'sign in'}. This code is valid for <strong>10 minutes</strong>.
      </p>

      <!-- OTP Display Box -->
      <div style="background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); border: 2px dashed #0284C7; border-radius: 16px; padding: 1.5rem 1rem; margin: 1.5rem auto; max-width: 320px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.12);">
        <span class="otp-code" style="font-size: 2.5rem; font-weight: 900; letter-spacing: 0.28em; color: #0284C7; font-family: 'SF Mono', Consolas, Monaco, monospace; display: block; margin-left: 0.28em;">
          ${otp}
        </span>
      </div>

      <!-- Security Advisory Box -->
      <div style="background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 12px; padding: 0.85rem 1rem; margin: 1.5rem 0 0 0; text-align: left; font-size: 0.82rem; color: #92400E; line-height: 1.45;">
        <strong style="color: #B45309;">🔒 Security Advisory:</strong> Never share this verification code with anyone. Wash My Car representatives will never call or ask for your OTP.
      </div>
    </div>
  `;

  const html = renderEmailShell({
    headerTitle: `${actionLabel} Verification Code`,
    headerSubtitle: 'Doorstep Car Care & Detailing In Vizag',
    bodyContent
  });

  const text = `Your Wash My Car ${actionLabel} OTP is: ${otp}. Valid for 10 minutes. Please do not share this code with anyone.`;

  return sendEmail({ to, subject, html, text });
};

/**
 * 2. Send Super CSS Welcome Email upon user registration
 */
export const sendWelcomeEmail = async ({ to, name }) => {
  const userName = name || 'Valued Customer';
  const subject = 'Welcome to Wash My Car Org! 🎉 Claim your Free ₹199 Bike Wash';

  const bodyContent = `
    <div>
      <h2 style="color: #0F172A; font-size: 1.4rem; font-weight: 800; margin: 0 0 0.6rem 0;">
        Welcome to the Family, ${userName}! 👋🚗
      </h2>

      <p style="color: #475569; font-size: 0.94rem; line-height: 1.6; margin: 0 0 1.25rem 0;">
        Thank you for joining <strong>Wash My Car Org</strong>. We bring certified mobile car wash professionals equipped with pure spot-free water, high-pressure foam cannons, and interior detailing straight to your parking doorstep.
      </p>

      <!-- Welcome Offer Card -->
      <div style="background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border: 2px solid #22C55E; border-radius: 16px; padding: 1.5rem; margin: 1.5rem 0; text-align: center; box-shadow: 0 8px 20px rgba(34, 197, 94, 0.15);">
        <span style="background: #16A34A; color: white; font-size: 0.72rem; font-weight: 800; padding: 4px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.06em;">
          EXCLUSIVE WELCOME PERK
        </span>
        <h3 style="color: #14532D; margin: 0.6rem 0 0.35rem 0; font-size: 1.3rem; font-weight: 900;">
          Flat ₹199 Worth Bike Wash FREE
        </h3>
        <p style="color: #166534; font-size: 0.88rem; margin: 0 0 1rem 0; line-height: 1.4;">
          Book any doorstep car wash package and get a <strong>two-wheeler / scooter snow foam wash</strong> completely free of charge!
        </p>
        <div style="background: white; border: 2px dashed #15803D; padding: 0.6rem 1.25rem; border-radius: 10px; display: inline-block; font-size: 1.15rem; font-weight: 900; letter-spacing: 0.12em; color: #15803D;">
          COUPON: WELCOME
        </div>
      </div>

      <!-- Feature Highlights -->
      <div style="margin: 1.5rem 0; border-top: 1px solid #F1F5F9; padding-top: 1.25rem;">
        <h4 style="margin: 0 0 0.85rem 0; font-size: 0.88rem; font-weight: 800; color: #1E293B; text-transform: uppercase; letter-spacing: 0.05em;">
          Why Wash My Car Stands Apart:
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.88rem; color: #334155; line-height: 1.45;">
          <div>🚿 <strong>Zero Hassle:</strong> Technicians arrive at your parking space on bike with complete wash equipment.</div>
          <div>✨ <strong>Paint-Safe Care:</strong> pH-neutral snow foam & clean microfiber mitts to eliminate swirl marks.</div>
          <div>🎁 <strong>Loyalty Coins:</strong> Earn reward points automatically on every wash to redeem for free services.</div>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 1.75rem;">
        <a href="https://washmycar.org.in/login" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color: white; text-decoration: none; padding: 0.85rem 2rem; border-radius: 12px; font-weight: 800; font-size: 0.95rem; display: inline-block; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);">
          Book Your First Wash Now →
        </a>
      </div>
    </div>
  `;

  const html = renderEmailShell({
    headerTitle: 'Welcome to Wash My Car Org',
    headerSubtitle: 'Premium Doorstep Vehicle Care in Vizag',
    bodyContent
  });

  const text = `Welcome to Wash My Car Org, ${userName}! Use coupon WELCOME on your first car wash booking to get a flat ₹199 worth bike wash FREE. Visit https://washmycar.org.in to book your slot!`;

  return sendEmail({ to, subject, html, text });
};

/**
 * 3. Send Super CSS Booking Confirmation Email (Replaces Twilio SMS)
 */
export const sendBookingConfirmationEmail = async ({ to, name, booking }) => {
  const userName = name || 'Customer';
  const bookingId = booking?.id || '';
  const subject = `Booking Confirmed #${bookingId} - Wash My Car Org ✅`;

  const dateFormatted = booking?.date 
    ? new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : 'Scheduled Date';

  const vehicleLabel = booking?.car 
    ? `${booking.car.make} ${booking.car.model}`
    : (booking?.carType?.name || 'Vehicle');

  const carNumber = booking?.car?.carNumber || booking?.carNumber || '';
  const washType = booking?.washType?.name || 'Doorstep Car Wash';
  const technicianName = booking?.employee?.name || 'Assigned prior to arrival';
  const pricePaid = booking?.price !== undefined ? booking.price : 0;
  const paymentId = booking?.razorpayPaymentId || 'Verified';

  const bodyContent = `
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
        <span style="background: #DCFCE7; color: #166534; font-size: 0.75rem; font-weight: 800; padding: 4px 12px; border-radius: 20px; border: 1px solid #86EFAC;">
          BOOKING CONFIRMED ✅
        </span>
        <span style="color: #64748B; font-size: 0.82rem; font-weight: 600;">
          Booking #${bookingId}
        </span>
      </div>

      <h2 style="color: #0F172A; font-size: 1.35rem; font-weight: 800; margin: 0 0 0.5rem 0;">
        We're Ready for Your Ride, ${userName}! 🚗✨
      </h2>

      <p style="color: #475569; font-size: 0.92rem; line-height: 1.55; margin: 0 0 1.25rem 0;">
        Your doorstep car wash appointment is confirmed. Our certified mobile technician will arrive with specialized detailing equipment during your selected time window.
      </p>

      <!-- Key Booking Specs Box -->
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 0.88rem;">
          <tr>
            <td style="padding: 0.35rem 0; color: #64748B; font-weight: 500;">Service Plan:</td>
            <td style="padding: 0.35rem 0; font-weight: 800; color: #0F172A; text-align: right;">${washType}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem 0; color: #64748B; font-weight: 500;">Scheduled Date:</td>
            <td style="padding: 0.35rem 0; font-weight: 800; color: #0F172A; text-align: right;">${dateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem 0; color: #64748B; font-weight: 500;">Arrival Window:</td>
            <td style="padding: 0.35rem 0; font-weight: 900; color: #0284C7; text-align: right;">${booking?.timeSlot || ''}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem 0; color: #64748B; font-weight: 500;">Vehicle:</td>
            <td style="padding: 0.35rem 0; font-weight: 700; color: #0F172A; text-align: right;">
              ${vehicleLabel} ${carNumber ? `<span style="background: #E0F2FE; color: #0369A1; padding: 2px 6px; border-radius: 4px; font-size: 0.76rem; letter-spacing: 0.05em; font-weight: 800;">${carNumber}</span>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 0.35rem 0; color: #64748B; font-weight: 500;">Doorstep Spot:</td>
            <td style="padding: 0.35rem 0; font-weight: 500; color: #334155; text-align: right; max-width: 260px;">${booking?.address || 'Doorstep Location'}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem 0; color: #64748B; font-weight: 500;">Technician:</td>
            <td style="padding: 0.35rem 0; font-weight: 700; color: #059669; text-align: right;">${technicianName}</td>
          </tr>
          <tr style="border-top: 1.5px solid #CBD5E1;">
            <td style="padding: 0.65rem 0 0.15rem 0; font-weight: 800; color: #0F172A; font-size: 0.95rem;">Total Paid:</td>
            <td style="padding: 0.65rem 0 0.15rem 0; font-weight: 900; color: #16A34A; text-align: right; font-size: 1.15rem;">₹${pricePaid}</td>
          </tr>
          ${paymentId && paymentId !== 'Verified' ? `
          <tr>
            <td style="padding: 0.2rem 0; color: #94A3B8; font-size: 0.75rem;">Payment Reference:</td>
            <td style="padding: 0.2rem 0; color: #94A3B8; font-size: 0.75rem; text-align: right; font-family: monospace;">${paymentId}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Doorstep Prep Checklist -->
      <div style="background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 12px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.82rem; color: #92400E; line-height: 1.5;">
        <strong style="color: #B45309; display: block; margin-bottom: 0.25rem;">📋 Quick Doorstep Checklist:</strong>
        <div>1. A standard water tap access point within reasonable reach.</div>
        <div>2. Standard domestic 3-pin electricity plug point for our pressure wash equipment.</div>
        <div>3. Safe parking clearance around all sides of your vehicle.</div>
      </div>

      <!-- Policy Reminder -->
      <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.78rem; color: #166534; line-height: 1.45;">
        <strong>Rescheduling & Cancellation Policy:</strong> Free rescheduling and 100% full refund are permitted up to <strong>9 hours before slot arrival time</strong>. Within 9 hours changes are closed. Doorstep rejection incurs a ₹99 visit fee.
      </div>

      <div style="text-align: center; margin-top: 1.5rem;">
        <a href="https://washmycar.org.in/bookings" style="background: #0284C7; color: white; text-decoration: none; padding: 0.75rem 1.75rem; border-radius: 10px; font-weight: 700; font-size: 0.9rem; display: inline-block;">
          View in My Bookings →
        </a>
      </div>
    </div>
  `;

  const html = renderEmailShell({
    headerTitle: `Booking Confirmed #${bookingId}`,
    headerSubtitle: 'Doorstep Car Care & Detailing In Vizag',
    bodyContent
  });

  const text = `Wash My Car: Booking #${bookingId} confirmed! Date: ${dateFormatted} (${booking?.timeSlot}). Vehicle: ${vehicleLabel} (${carNumber}). Total: ₹${pricePaid}. Location: ${booking?.address}.`;

  return sendEmail({ to, subject, html, text });
};

/**
 * 4. Send Super CSS Booking Rescheduled Email (Replaces Twilio SMS)
 */
export const sendBookingRescheduledEmail = async ({ to, name, booking, oldDate, oldTimeSlot, rescheduledBy = 'ADMIN', reason }) => {
  const userName = name || 'Customer';
  const bookingId = booking?.id || '';
  const isByAdmin = rescheduledBy === 'ADMIN';
  const subject = `Booking Rescheduled #${bookingId} - Wash My Car Org 📅`;

  const oldDateStr = oldDate 
    ? new Date(oldDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'Previous Date';
  
  const newDateStr = booking?.date 
    ? new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : 'New Date';

  const vehicleLabel = booking?.car 
    ? `${booking.car.make} ${booking.car.model}`
    : (booking?.carType?.name || 'Vehicle');

  const bodyContent = `
    <div>
      <span style="display: inline-block; background: #EFF6FF; color: #1D4ED8; font-size: 0.75rem; font-weight: 800; padding: 4px 14px; border-radius: 20px; border: 1px solid #BFDBFE; margin-bottom: 0.75rem;">
        SLOT RESCHEDULED 📅
      </span>

      <h2 style="color: #0F172A; font-size: 1.35rem; font-weight: 800; margin: 0 0 0.5rem 0;">
        Your Wash has Been Rescheduled, ${userName}
      </h2>

      <p style="color: #475569; font-size: 0.92rem; line-height: 1.55; margin: 0 0 1.25rem 0;">
        ${isByAdmin 
          ? `Due to an unforeseen scenario (such as heavy weather dispatch, technician allocation, or machinery maintenance), your appointment has been rescheduled by our support team.`
          : `Your request to reschedule your car wash booking has been processed successfully.`}
      </p>

      <!-- Before / After Slot Comparison Box -->
      <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem;">
        
        <!-- Old Slot -->
        <div style="padding-bottom: 0.75rem; border-bottom: 1px dashed #CBD5E1; opacity: 0.75;">
          <span style="font-size: 0.75rem; font-weight: 800; color: #EF4444; text-transform: uppercase;">Previous Scheduled Slot</span>
          <div style="font-size: 0.95rem; color: #64748B; font-weight: 600; text-decoration: line-through; margin-top: 2px;">
            ${oldDateStr} &bull; ${oldTimeSlot || 'Old Slot'}
          </div>
        </div>

        <!-- New Slot -->
        <div style="padding-top: 0.85rem;">
          <span style="font-size: 0.75rem; font-weight: 800; color: #0284C7; text-transform: uppercase;">➡️ New Confirmed Arrival Slot</span>
          <div style="font-size: 1.15rem; color: #0369A1; font-weight: 900; margin-top: 2px;">
            ${newDateStr} &bull; ${booking?.timeSlot || 'New Slot'}
          </div>
        </div>
      </div>

      <!-- Reason Box -->
      ${reason || booking?.rescheduledReason ? `
      <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; font-size: 0.84rem; color: #1E40AF;">
        <strong>Rescheduling Note:</strong> ${reason || booking?.rescheduledReason}
      </div>
      ` : ''}

      <!-- Booking Vehicle & Spot -->
      <div style="background: white; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.85rem; color: #334155;">
        <div><strong>Vehicle:</strong> ${vehicleLabel} ${booking?.car?.carNumber ? `(${booking.car.carNumber})` : ''}</div>
        <div style="margin-top: 0.25rem;"><strong>Doorstep Location:</strong> ${booking?.address || 'Doorstep Address'}</div>
      </div>

      <p style="color: #64748B; font-size: 0.84rem; line-height: 1.5; margin: 0 0 1.25rem 0;">
        Our mobile detailing technician will arrive during your new slot window. If this new time window is not suitable, you can select another preferred date/time from your dashboard.
      </p>

      <div style="text-align: center;">
        <a href="https://washmycar.org.in/bookings" style="background: #0284C7; color: white; text-decoration: none; padding: 0.75rem 1.75rem; border-radius: 10px; font-weight: 700; font-size: 0.9rem; display: inline-block;">
          Manage Your Booking →
        </a>
      </div>
    </div>
  `;

  const html = renderEmailShell({
    headerTitle: `Booking Rescheduled #${bookingId}`,
    headerSubtitle: 'Doorstep Car Care & Detailing In Vizag',
    bodyContent
  });

  const text = `Wash My Car: Booking #${bookingId} has been rescheduled to ${newDateStr} (${booking?.timeSlot}). Reason: ${reason || 'Schedule update'}. Visit https://washmycar.org.in/bookings to view details.`;

  return sendEmail({ to, subject, html, text });
};

/**
 * 5. Send Super CSS Booking Cancellation & Refund Email (Replaces Twilio SMS)
 */
export const sendBookingCancelledEmail = async ({ to, name, booking, refundDetails = {}, reason }) => {
  const userName = name || 'Customer';
  const bookingId = booking?.id || '';
  const subject = `Booking Cancelled #${bookingId} - Wash My Car Org ❌`;

  const cancelReason = reason || booking?.cancellationReason || 'Cancelled upon request';
  const refundAmt = refundDetails.refundAmount !== undefined ? refundDetails.refundAmount : (booking?.refundAmount || booking?.price || 0);
  const refundId = refundDetails.refundId || booking?.refundId || null;
  const isProcessed = refundDetails.refundStatus === 'PROCESSED' || booking?.refundStatus === 'PROCESSED';

  const dateFormatted = booking?.date 
    ? new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const bodyContent = `
    <div>
      <span style="display: inline-block; background: #FEE2E2; color: #DC2626; font-size: 0.75rem; font-weight: 800; padding: 4px 14px; border-radius: 20px; border: 1px solid #FCA5A5; margin-bottom: 0.75rem;">
        BOOKING CANCELLED ❌
      </span>

      <h2 style="color: #0F172A; font-size: 1.35rem; font-weight: 800; margin: 0 0 0.5rem 0;">
        Booking #${bookingId} Has Been Cancelled
      </h2>

      <p style="color: #475569; font-size: 0.92rem; line-height: 1.55; margin: 0 0 1.25rem 0;">
        Hi ${userName}, your scheduled doorstep car wash on <strong>${dateFormatted} (${booking?.timeSlot || ''})</strong> has been cancelled.
      </p>

      <!-- Cancellation Details Card -->
      <div style="background: #FEF2F2; border: 1.5px solid #FECACA; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
        <div style="font-size: 0.85rem; color: #991B1B;">
          <strong>Reason for Cancellation:</strong> ${cancelReason}
        </div>
      </div>

      <!-- Automatic Refund Box -->
      ${refundAmt > 0 ? `
      <div style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 1.5px solid #86EFAC; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
          <span style="color: #166534; font-size: 0.88rem; font-weight: 800;">
            ${isProcessed ? '✅ 100% Refund Initiated' : '⏳ Refund Processing'}
          </span>
          <span style="background: #16A34A; color: white; padding: 3px 10px; border-radius: 12px; font-weight: 900; font-size: 0.95rem;">
            ₹${refundAmt}
          </span>
        </div>
        <p style="color: #14532D; font-size: 0.82rem; margin: 0 0 0.5rem 0; line-height: 1.45;">
          An automatic refund of <strong>₹${refundAmt}</strong> has been initiated via Razorpay back to your original payment method.
        </p>
        ${refundId ? `
        <div style="font-size: 0.75rem; font-family: monospace; color: #047857;">
          Refund ID: ${refundId}
        </div>
        ` : ''}
        <div style="margin-top: 0.5rem; font-size: 0.78rem; color: #166534; border-top: 1px dashed #A7F3D0; paddingTop: 0.4rem;">
          ⏱️ <strong>Refund Timeline Note:</strong> Funds typically credit to your bank account / card within <strong>5 to 7 business days</strong> depending on your bank.
        </div>
      </div>
      ` : `
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; font-size: 0.82rem; color: #64748B;">
        No online payment charges were deducted for this booking. Any redeemed reward points have been restored to your coin balance.
      </div>
      `}

      <p style="color: #64748B; font-size: 0.82rem; line-height: 1.45;">
        If you have any questions or did not authorize this cancellation, please contact our support team at <a href="mailto:washmycarorg@gmail.com" style="color: #0284C7; font-weight: 600;">washmycarorg@gmail.com</a>.
      </p>
    </div>
  `;

  const html = renderEmailShell({
    headerTitle: `Booking Cancelled #${bookingId}`,
    headerSubtitle: 'Doorstep Car Care & Detailing In Vizag',
    bodyContent
  });

  const text = `Wash My Car: Booking #${bookingId} has been cancelled. ${refundAmt > 0 ? `Automatic refund of ₹${refundAmt} initiated (ID: ${refundId || 'Processing'}). Credited within 5-7 business days.` : ''}`;

  return sendEmail({ to, subject, html, text });
};

/**
 * 6. Send Super CSS Doorstep Rejection / Unavailability Notice Email (₹99 Fee Cut Policy)
 */
export const sendDoorstepRejectionEmail = async ({ to, name, booking, refundDetails = {}, note }) => {
  const userName = name || 'Customer';
  const bookingId = booking?.id || '';
  const subject = `Doorstep Visit Closed (₹99 Fee Applied) #${bookingId} - Wash My Car Org`;

  const refundAmt = refundDetails.refundAmount !== undefined ? refundDetails.refundAmount : 0;
  const refundId = refundDetails.refundId || null;

  const dateFormatted = booking?.date 
    ? new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const bodyContent = `
    <div>
      <span style="display: inline-block; background: #FFF7ED; color: #C2410C; font-size: 0.75rem; font-weight: 800; padding: 4px 14px; border-radius: 20px; border: 1px solid #FDBA74; margin-bottom: 0.75rem;">
        DOORSTEP ATTEMPT CLOSED 🚪
      </span>

      <h2 style="color: #0F172A; font-size: 1.3rem; font-weight: 800; margin: 0 0 0.5rem 0;">
        Doorstep Service Closed for Booking #${bookingId}
      </h2>

      <p style="color: #475569; font-size: 0.92rem; line-height: 1.55; margin: 0 0 1.25rem 0;">
        Hi ${userName}, our mobile detailing technician arrived at your scheduled location on <strong>${dateFormatted} (${booking?.timeSlot || ''})</strong> or attempted to contact you to begin service, but was unable to proceed.
      </p>

      <!-- Technician Observation Note -->
      <div style="background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 12px; padding: 0.9rem 1.1rem; margin-bottom: 1.25rem;">
        <div style="font-size: 0.85rem; color: #92400E; font-weight: 700; margin-bottom: 0.2rem;">
          Technician Report / Attempt Details:
        </div>
        <div style="font-size: 0.82rem; color: #78350F; font-style: italic;">
          "${note || 'Customer unavailable at address or service refused upon arrival'}"
        </div>
      </div>

      <!-- Fee Deduction & Refund Policy Breakdown -->
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem;">
        <h4 style="margin: 0 0 0.6rem 0; font-size: 0.88rem; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.04em;">
          Policy Enforcement & Account Adjustment:
        </h4>
        <div style="font-size: 0.84rem; color: #334155; line-height: 1.55;">
          <div>• <strong>Technician Travel & Slot Charge:</strong> As cancellation or rescheduling was not initiated at least 9 hours prior, a <strong>₹99 technician dispatch fee</strong> was applied.</div>
          ${refundAmt > 0 ? `
          <div style="margin-top: 0.35rem; color: #166534;">
            • <strong>Remaining Balance Refund:</strong> A refund of <strong>₹${refundAmt}</strong> has been initiated via Razorpay ${refundId ? `(Refund ID: ${refundId})` : ''} and will credit within 5-7 business days.
          </div>
          ` : ''}
          ${booking?.pointsRedeemed > 0 ? `
          <div style="margin-top: 0.35rem; color: #B45309;">
            • <strong>Loyalty Coins:</strong> 99 reward points were deducted from redeemed coins; remaining coins restored to your account.
          </div>
          ` : ''}
          ${booking?.userSubscriptionId ? `
          <div style="margin-top: 0.35rem; color: #991B1B;">
            • <strong>VIP Subscription:</strong> 1 wash quota has been deducted from your subscription pass limit.
          </div>
          ` : ''}
        </div>
      </div>

      <p style="color: #64748B; font-size: 0.82rem; line-height: 1.45;">
        If there was an emergency or special circumstance, please reply to this email or reach us on <a href="mailto:washmycarorg@gmail.com" style="color: #0284C7; font-weight: 600;">washmycarorg@gmail.com</a>.
      </p>
    </div>
  `;

  const html = renderEmailShell({
    headerTitle: `Doorstep Visit Notice #${bookingId}`,
    headerSubtitle: 'Doorstep Car Care & Detailing In Vizag',
    bodyContent
  });

  const text = `Wash My Car: Doorstep service for Booking #${bookingId} was closed. As cancellation was not done 9 hours prior, a ₹99 visit fee was deducted. ${refundAmt > 0 ? `Remaining balance of ₹${refundAmt} refunded.` : ''}`;

  return sendEmail({ to, subject, html, text });
};
