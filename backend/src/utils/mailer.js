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

// Format date helper with Indian Standard Time
const formatDateFull = (dateInput) => {
  if (!dateInput) return 'Scheduled Date';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getVehicleLabel = (booking) => {
  if (booking?.car?.make && booking?.car?.model) {
    return `${booking.car.make} ${booking.car.model}`;
  }
  if (booking?.carMake || booking?.carModel) {
    return `${booking.carMake || ''} ${booking.carModel || ''}`.trim();
  }
  return booking?.carType?.name || 'Vehicle';
};

const getVehicleNumber = (booking) => {
  return booking?.carNumber || booking?.car?.carNumber || '';
};

const getBookingReference = (booking) => {
  return booking?.bookingId || (booking?.id ? `#${booking.id}` : 'Booking');
};

const renderVehiclePlateBadge = (carNumber) => {
  if (!carNumber) return '';
  return `
    <span style="display: inline-block; vertical-align: middle; background: #FEF08A; border: 1.5px solid #CA8A04; border-radius: 4px; padding: 2px 8px; font-size: 0.76rem; font-weight: 800; color: #713F12; letter-spacing: 0.05em; margin-left: 6px;">
      <span style="background: #1E3A8A; color: #FFFFFF; font-size: 0.6rem; font-weight: 900; padding: 1px 4px; border-radius: 2px; margin-right: 5px; display: inline-block;">IND</span>
      ${carNumber}
    </span>
  `;
};

const renderAddonsHtml = (addons) => {
  if (!Array.isArray(addons) || addons.length === 0) return '';
  return `
    <div style="background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 12px; padding: 1rem 1.15rem; margin-bottom: 1.25rem;">
      <div style="font-size: 0.76rem; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.6rem;">
        ✨ Included Detailing Add-ons (${addons.length})
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 0.85rem;">
        ${addons.map((ba) => `
          <tr>
            <td style="padding: 0.35rem 0; color: #15803D; font-weight: 600;">
              • ${ba.addon?.name || ba.name || 'Detailing Add-on'}
            </td>
            <td style="padding: 0.35rem 0; color: #14532D; font-weight: 800; text-align: right;">
              +₹${ba.price}
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
};

/**
 * 3. Send Super CSS Booking Confirmation Email
 */
export const sendBookingConfirmationEmail = async ({ to, name, booking }) => {
  const userName = name || 'Customer';
  const bookingRef = getBookingReference(booking);
  const subject = `Booking Confirmed ${bookingRef} - Wash My Car Org ✅`;

  const dateFormatted = formatDateFull(booking?.date);
  const vehicleLabel = getVehicleLabel(booking);
  const carNumber = getVehicleNumber(booking);
  const washType = booking?.washType?.name || 'Doorstep Car Wash';
  const carTypeName = booking?.carType?.name || '';
  const serviceArea = booking?.serviceArea?.name || '';
  const technicianName = booking?.employee?.name ? `${booking.employee.name}${booking.employee.phone ? ` (+91 ${booking.employee.phone})` : ''}` : 'Specialist assigned prior to arrival';
  const pricePaid = booking?.price !== undefined ? (Number(booking.price) === 0 ? 0 : Number(booking.price).toFixed(2)) : '0.00';
  const paymentId = booking?.razorpayPaymentId || (booking?.paymentMethod ? booking.paymentMethod : 'Verified');
  const paymentMethod = booking?.paymentMethod || (booking?.razorpayPaymentId ? 'Online (Razorpay)' : (Number(booking?.price) === 0 ? 'Free / Subscription' : 'Online'));
  const totalSavings = booking?.totalSavings || 0;
  const addons = booking?.addons || [];

  const bodyContent = `
    <div>
      <!-- Status Badge & Ref Header -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 1rem;">
        <tr>
          <td>
            <span style="display: inline-block; background: #DCFCE7; color: #166534; font-size: 0.75rem; font-weight: 800; padding: 4px 14px; border-radius: 20px; border: 1.5px solid #86EFAC; text-transform: uppercase; letter-spacing: 0.05em;">
              BOOKING CONFIRMED ✅
            </span>
          </td>
          <td align="right">
            <span style="background: #F1F5F9; color: #0F172A; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 800; font-family: 'SF Mono', Consolas, Monaco, monospace; border: 1px solid #CBD5E1;">
              ${bookingRef}
            </span>
          </td>
        </tr>
      </table>

      <h2 style="color: #0F172A; font-size: 1.4rem; font-weight: 800; margin: 0 0 0.5rem 0; line-height: 1.35;">
        We're Ready for Your Ride, ${userName}! 🚗✨
      </h2>

      <p style="color: #475569; font-size: 0.92rem; line-height: 1.6; margin: 0 0 1.35rem 0;">
        Your doorstep car wash appointment is confirmed. Our certified mobile detailing technician equipped with spot-free water, high-pressure foam cannons, and interior detailing machines will arrive during your scheduled time window.
      </p>

      <!-- Key Booking Specs Box -->
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 1.25rem 1.35rem; margin-bottom: 1.25rem;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 0.88rem;">
          <tr>
            <td style="padding: 0.4rem 0; color: #64748B; font-weight: 600;">Service Plan:</td>
            <td style="padding: 0.4rem 0; font-weight: 800; color: #0F172A; text-align: right;">
              <span style="color: #0284C7;">${washType}</span>
              ${carTypeName ? `<span style="font-size: 0.75rem; color: #64748B; font-weight: 600; margin-left: 4px;">(${carTypeName})</span>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 0.4rem 0; color: #64748B; font-weight: 600;">Scheduled Date:</td>
            <td style="padding: 0.4rem 0; font-weight: 800; color: #0F172A; text-align: right;">${dateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 0.4rem 0; color: #64748B; font-weight: 600;">Arrival Window:</td>
            <td style="padding: 0.4rem 0; font-weight: 900; color: #0284C7; text-align: right; font-size: 0.95rem;">${booking?.timeSlot || ''}</td>
          </tr>
          <tr>
            <td style="padding: 0.4rem 0; color: #64748B; font-weight: 600;">Vehicle:</td>
            <td style="padding: 0.4rem 0; font-weight: 700; color: #0F172A; text-align: right;">
              ${vehicleLabel} ${renderVehiclePlateBadge(carNumber)}
            </td>
          </tr>
          <tr>
            <td style="padding: 0.4rem 0; color: #64748B; font-weight: 600;">Doorstep Spot:</td>
            <td style="padding: 0.4rem 0; font-weight: 500; color: #334155; text-align: right; max-width: 280px; line-height: 1.4;">
              ${booking?.address || 'Customer Doorstep Location'}
              ${serviceArea ? `<div style="font-size: 0.75rem; color: #0369A1; font-weight: 700; margin-top: 2px;">📍 ${serviceArea}</div>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 0.4rem 0; color: #64748B; font-weight: 600;">Technician:</td>
            <td style="padding: 0.4rem 0; font-weight: 700; color: #059669; text-align: right;">${technicianName}</td>
          </tr>
        </table>
      </div>

      <!-- Add-on Services (if any) -->
      ${renderAddonsHtml(addons)}

      <!-- Payment Breakdown Box -->
      <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 1.25rem 1.35rem; margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid #F1F5F9; padding-bottom: 0.5rem;">
          <span style="font-size: 0.78rem; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.05em;">
            Payment Summary
          </span>
          ${totalSavings > 0 ? `
            <span style="background: #DCFCE7; color: #166534; font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: 10px;">
              🎉 You Saved ₹${totalSavings}
            </span>
          ` : ''}
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 0.86rem;">
          ${booking?.actualPrice && booking.actualPrice > booking.price ? `
          <tr>
            <td style="padding: 0.25rem 0; color: #94A3B8;">Standard Standard MRP:</td>
            <td style="padding: 0.25rem 0; color: #94A3B8; text-decoration: line-through; text-align: right;">₹${booking.actualPrice}</td>
          </tr>
          ` : ''}
          ${booking?.planDiscount > 0 ? `
          <tr>
            <td style="padding: 0.25rem 0; color: #047857;">• Plan Special Offer Discount:</td>
            <td style="padding: 0.25rem 0; color: #047857; text-align: right; font-weight: 700;">-₹${booking.planDiscount}</td>
          </tr>
          ` : ''}
          ${booking?.addonsTotal > 0 ? `
          <tr>
            <td style="padding: 0.25rem 0; color: #0369A1;">• Add-ons Detailing Total:</td>
            <td style="padding: 0.25rem 0; color: #0369A1; text-align: right; font-weight: 700;">+₹${booking.addonsTotal}</td>
          </tr>
          ` : ''}
          ${booking?.appliedOfferCode ? `
          <tr>
            <td style="padding: 0.25rem 0; color: #0284C7;">• Coupon Applied (${booking.appliedOfferCode}):</td>
            <td style="padding: 0.25rem 0; color: #0284C7; text-align: right; font-weight: 700;">-${booking.couponDiscount ? `₹${booking.couponDiscount}` : 'Applied'}</td>
          </tr>
          ` : ''}
          ${booking?.pointsRedeemed > 0 ? `
          <tr>
            <td style="padding: 0.25rem 0; color: #B45309;">• Loyalty Coins Redeemed (${booking.pointsRedeemed} pts):</td>
            <td style="padding: 0.25rem 0; color: #B45309; text-align: right; font-weight: 700;">-₹${booking.pointsDiscount || (booking.pointsRedeemed / 4)}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 1.5px solid #E2E8F0;">
            <td style="padding: 0.65rem 0 0.15rem 0; font-weight: 800; color: #0F172A; font-size: 0.95rem;">Total Paid:</td>
            <td style="padding: 0.65rem 0 0.15rem 0; font-weight: 900; color: #16A34A; text-align: right; font-size: 1.25rem;">₹${pricePaid}</td>
          </tr>
          <tr>
            <td style="padding: 0.2rem 0; color: #64748B; font-size: 0.78rem;">Payment Method:</td>
            <td style="padding: 0.2rem 0; color: #475569; font-size: 0.78rem; text-align: right; font-weight: 600;">${paymentMethod}</td>
          </tr>
          ${booking?.razorpayPaymentId ? `
          <tr>
            <td style="padding: 0.2rem 0; color: #94A3B8; font-size: 0.74rem;">Transaction ID:</td>
            <td style="padding: 0.2rem 0; color: #64748B; font-size: 0.74rem; text-align: right; font-family: monospace;">${booking.razorpayPaymentId}</td>
          </tr>
          ` : ''}
          ${booking?.pointsEarned > 0 ? `
          <tr>
            <td colspan="2" style="padding-top: 0.5rem;">
              <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 0.4rem 0.65rem; color: #065F46; font-size: 0.78rem; font-weight: 700; text-align: center;">
                🎁 +${booking.pointsEarned} loyalty reward coins credited to your account!
              </div>
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Doorstep Prep Checklist -->
      <div style="background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 12px; padding: 0.9rem 1.15rem; margin-bottom: 1.25rem; font-size: 0.84rem; color: #92400E; line-height: 1.55;">
        <strong style="color: #B45309; display: block; margin-bottom: 0.35rem;">📋 Quick Doorstep Preparation:</strong>
        <div>1. A standard domestic water tap within reachable distance for our intake hose.</div>
        <div>2. Standard 3-pin electricity plug point for our high-pressure foam machines.</div>
        <div>3. Safe vehicle parking clearance on all sides so our technicians can detail seamlessly.</div>
      </div>

      <!-- Policy Reminder -->
      <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 0.8rem 1.1rem; font-size: 0.8rem; color: #166534; line-height: 1.5; margin-bottom: 1.5rem;">
        <strong>⏱️ Rescheduling & Cancellation Policy:</strong> Free slot rescheduling and 100% full refund are permitted up to <strong>9 hours before slot arrival time</strong> directly from your dashboard. Within 9 hours, technician and detailing equipment are dispatched and changes are closed.
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 1.5rem;">
        <a href="https://washmycar.org.in/bookings" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color: #FFFFFF; text-decoration: none; padding: 0.85rem 2.25rem; border-radius: 12px; font-weight: 800; font-size: 0.95rem; display: inline-block; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);">
          View in My Bookings →
        </a>
      </div>
    </div>
  `;

  const html = renderEmailShell({
    headerTitle: `Booking Confirmed ${bookingRef}`,
    headerSubtitle: 'Certified Doorstep Vehicle Care & Detailing',
    bodyContent
  });

  const text = `Wash My Car: Booking ${bookingRef} confirmed! Date: ${dateFormatted} (${booking?.timeSlot}). Vehicle: ${vehicleLabel} (${carNumber}). Total: ₹${pricePaid}. Location: ${booking?.address}. Visit https://washmycar.org.in/bookings to view details.`;

  return sendEmail({ to, subject, html, text });
};

/**
 * 4. Send Super CSS Booking Rescheduled Email
 */
export const sendBookingRescheduledEmail = async ({ to, name, booking, oldDate, oldTimeSlot, rescheduledBy = 'ADMIN', reason }) => {
  const userName = name || 'Customer';
  const bookingRef = getBookingReference(booking);
  const isByAdmin = rescheduledBy === 'ADMIN';
  const subject = `Booking Rescheduled ${bookingRef} - Wash My Car Org 📅`;

  const oldDateStr = formatDateFull(oldDate);
  const newDateStr = formatDateFull(booking?.date);
  const newTimeSlot = booking?.timeSlot || 'Confirmed Slot';

  const vehicleLabel = getVehicleLabel(booking);
  const carNumber = getVehicleNumber(booking);
  const washType = booking?.washType?.name || 'Doorstep Car Wash';
  const serviceArea = booking?.serviceArea?.name || '';
  const technicianName = booking?.employee?.name ? `${booking.employee.name}${booking.employee.phone ? ` (+91 ${booking.employee.phone})` : ''}` : 'Specialist assigned prior to arrival';
  const cleanReason = String(reason || booking?.rescheduledReason || (isByAdmin ? 'Unforeseen operational scenario / weather condition' : 'Customer schedule update')).trim();

  const bodyContent = `
    <div>
      <!-- Status Badge & Ref Header -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 1rem;">
        <tr>
          <td>
            <span style="display: inline-block; background: #EFF6FF; color: #1D4ED8; font-size: 0.75rem; font-weight: 800; padding: 4px 14px; border-radius: 20px; border: 1.5px solid #93C5FD; text-transform: uppercase; letter-spacing: 0.05em;">
              SLOT RESCHEDULED 📅
            </span>
          </td>
          <td align="right">
            <span style="background: #F1F5F9; color: #0F172A; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 800; font-family: 'SF Mono', Consolas, Monaco, monospace; border: 1px solid #CBD5E1;">
              ${bookingRef}
            </span>
          </td>
        </tr>
      </table>

      <h2 style="color: #0F172A; font-size: 1.4rem; font-weight: 800; margin: 0 0 0.5rem 0; line-height: 1.35;">
        Your Wash has Been Rescheduled, ${userName}
      </h2>

      <p style="color: #475569; font-size: 0.92rem; line-height: 1.6; margin: 0 0 1.25rem 0;">
        ${isByAdmin 
          ? `Your doorstep appointment for <strong>${bookingRef}</strong> has been updated by the <strong>Wash My Car Administration Team</strong>.` 
          : `Your request to reschedule your car wash booking <strong>${bookingRef}</strong> has been updated successfully.`}
      </p>

      <!-- Prominent Reason Box -->
      <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 2px solid #93C5FD; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);">
        <div style="font-size: 0.76rem; font-weight: 800; color: #1E40AF; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem;">
          📋 Reason for Rescheduling (${isByAdmin ? 'Administration Note' : 'Customer Request'}):
        </div>
        <div style="font-size: 0.96rem; font-weight: 800; color: #1E3A8A; line-height: 1.5; font-style: italic;">
          "${cleanReason}"
        </div>
        <div style="margin-top: 0.5rem; font-size: 0.78rem; color: #2563EB; border-top: 1px dashed #BFDBFE; padding-top: 0.45rem; line-height: 1.45;">
          ${isByAdmin 
            ? '⚠️ We apologize for this schedule change. Our team rescheduled your slot to ensure high detailing quality, worker safety, or due to severe local weather.' 
            : 'Your new slot is locked in our automated scheduling system.'}
        </div>
      </div>

      <!-- Before / After Slot Comparison Box -->
      <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem;">
        <!-- Old Slot -->
        <div style="padding-bottom: 0.75rem; border-bottom: 1px dashed #CBD5E1;">
          <span style="font-size: 0.74rem; font-weight: 800; color: #EF4444; text-transform: uppercase; letter-spacing: 0.04em;">
            🔴 Previous Scheduled Arrival
          </span>
          <div style="font-size: 0.95rem; color: #64748B; font-weight: 600; text-decoration: line-through; margin-top: 3px;">
            ${oldDateStr} &bull; ${oldTimeSlot || 'Previous Slot'}
          </div>
        </div>

        <!-- New Slot -->
        <div style="padding-top: 0.85rem;">
          <span style="font-size: 0.74rem; font-weight: 800; color: #0284C7; text-transform: uppercase; letter-spacing: 0.04em;">
            🟢 New Confirmed Arrival Slot
          </span>
          <div style="font-size: 1.2rem; color: #0369A1; font-weight: 900; margin-top: 3px;">
            ${newDateStr} &bull; ${newTimeSlot}
          </div>
        </div>
      </div>

      <!-- Booking Vehicle & Doorstep Spot -->
      <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; font-size: 0.88rem; color: #334155;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 0.3rem 0; color: #64748B; font-weight: 600;">Vehicle:</td>
            <td style="padding: 0.3rem 0; font-weight: 700; color: #0F172A; text-align: right;">
              ${vehicleLabel} ${renderVehiclePlateBadge(carNumber)}
            </td>
          </tr>
          <tr>
            <td style="padding: 0.3rem 0; color: #64748B; font-weight: 600;">Service Plan:</td>
            <td style="padding: 0.3rem 0; font-weight: 700; color: #0284C7; text-align: right;">${washType}</td>
          </tr>
          <tr>
            <td style="padding: 0.3rem 0; color: #64748B; font-weight: 600;">Technician:</td>
            <td style="padding: 0.3rem 0; font-weight: 700; color: #059669; text-align: right;">${technicianName}</td>
          </tr>
          <tr>
            <td style="padding: 0.3rem 0; color: #64748B; font-weight: 600;">Location:</td>
            <td style="padding: 0.3rem 0; font-weight: 500; color: #334155; text-align: right; max-width: 280px;">
              ${booking?.address || 'Doorstep Address'}
              ${serviceArea ? ` (${serviceArea})` : ''}
            </td>
          </tr>
        </table>
      </div>

      <p style="color: #64748B; font-size: 0.84rem; line-height: 1.55; margin: 0 0 1.35rem 0;">
        Our mobile detailing technician will arrive during your new slot window. If this time window is inconvenient, you can easily select another preferred date/time with zero penalty directly from your dashboard.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="https://washmycar.org.in/bookings" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color: #FFFFFF; text-decoration: none; padding: 0.85rem 2.25rem; border-radius: 12px; font-weight: 800; font-size: 0.95rem; display: inline-block; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);">
          Manage Booking in Dashboard →
        </a>
      </div>
    </div>
  `;

  const html = renderEmailShell({
    headerTitle: `Booking Rescheduled ${bookingRef}`,
    headerSubtitle: 'Doorstep Car Care Schedule Update',
    bodyContent
  });

  const text = `Wash My Car: Booking ${bookingRef} has been rescheduled to ${newDateStr} (${newTimeSlot}). Reason: ${cleanReason}. Visit https://washmycar.org.in/bookings to manage details.`;

  return sendEmail({ to, subject, html, text });
};

/**
 * 5. Send Super CSS Booking Cancellation & Refund Email
 */
export const sendBookingCancelledEmail = async ({ to, name, booking, refundDetails = {}, reason, cancelledBy = 'CUSTOMER' }) => {
  const userName = name || 'Customer';
  const bookingRef = getBookingReference(booking);
  const isByAdmin = cancelledBy === 'ADMIN';
  const subject = `Booking Cancelled ${bookingRef} - Wash My Car Org ❌`;

  const cancelReason = String(reason || booking?.cancellationReason || (isByAdmin ? 'Cancelled by administration' : 'Cancelled upon customer request')).trim();
  const refundAmt = refundDetails.refundAmount !== undefined ? refundDetails.refundAmount : (booking?.refundAmount || booking?.price || 0);
  const refundId = refundDetails.refundId || booking?.refundId || null;
  const isProcessed = refundDetails.refundStatus === 'PROCESSED' || booking?.refundStatus === 'PROCESSED';
  const dateFormatted = formatDateFull(booking?.date);

  const vehicleLabel = getVehicleLabel(booking);
  const carNumber = getVehicleNumber(booking);
  const washType = booking?.washType?.name || 'Doorstep Car Wash';
  const doorstepFeeDeducted = booking?.doorstepFeeDeducted || 0;

  const bodyContent = `
    <div>
      <!-- Status Badge & Ref Header -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 1rem;">
        <tr>
          <td>
            <span style="display: inline-block; background: #FEF2F2; color: #DC2626; font-size: 0.75rem; font-weight: 800; padding: 4px 14px; border-radius: 20px; border: 1.5px solid #FCA5A5; text-transform: uppercase; letter-spacing: 0.05em;">
              BOOKING CANCELLED ❌
            </span>
          </td>
          <td align="right">
            <span style="background: #F1F5F9; color: #0F172A; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 800; font-family: 'SF Mono', Consolas, Monaco, monospace; border: 1px solid #CBD5E1;">
              ${bookingRef}
            </span>
          </td>
        </tr>
      </table>

      <h2 style="color: #0F172A; font-size: 1.4rem; font-weight: 800; margin: 0 0 0.5rem 0; line-height: 1.35;">
        Booking ${bookingRef} Cancelled
      </h2>

      <p style="color: #475569; font-size: 0.92rem; line-height: 1.6; margin: 0 0 1.25rem 0;">
        Hi ${userName}, your scheduled doorstep car wash on <strong>${dateFormatted} (${booking?.timeSlot || ''})</strong> has been cancelled ${isByAdmin ? 'by the <strong>Wash My Car Administration Team</strong>' : 'per your request'}.
      </p>

      <!-- Prominent Reason Box -->
      <div style="background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%); border: 2px solid #FCA5A5; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.08);">
        <div style="font-size: 0.76rem; font-weight: 800; color: #DC2626; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem;">
          📋 Reason for Cancellation (${isByAdmin ? 'Administration Note' : 'Customer Reason'}):
        </div>
        <div style="font-size: 0.96rem; font-weight: 800; color: #991B1B; line-height: 1.5; font-style: italic;">
          "${cancelReason}"
        </div>
      </div>

      <!-- Cancelled Booking Details Box -->
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; font-size: 0.88rem; color: #334155;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 0.3rem 0; color: #64748B; font-weight: 600;">Vehicle:</td>
            <td style="padding: 0.3rem 0; font-weight: 700; color: #0F172A; text-align: right;">
              ${vehicleLabel} ${renderVehiclePlateBadge(carNumber)}
            </td>
          </tr>
          <tr>
            <td style="padding: 0.3rem 0; color: #64748B; font-weight: 600;">Service Plan:</td>
            <td style="padding: 0.3rem 0; font-weight: 700; color: #0284C7; text-align: right;">${washType}</td>
          </tr>
          <tr>
            <td style="padding: 0.3rem 0; color: #64748B; font-weight: 600;">Original Slot:</td>
            <td style="padding: 0.3rem 0; font-weight: 600; color: #475569; text-align: right;">${dateFormatted} (${booking?.timeSlot || ''})</td>
          </tr>
          <tr>
            <td style="padding: 0.3rem 0; color: #64748B; font-weight: 600;">Doorstep Spot:</td>
            <td style="padding: 0.3rem 0; font-weight: 500; color: #334155; text-align: right; max-width: 280px;">${booking?.address || 'Doorstep Location'}</td>
          </tr>
        </table>
      </div>

      <!-- Doorstep Fee Deduction Alert (if applied) -->
      ${doorstepFeeDeducted > 0 ? `
      <div style="background: #FFF7ED; border: 1.5px solid #FDBA74; border-radius: 12px; padding: 0.9rem 1.15rem; margin-bottom: 1.25rem; font-size: 0.82rem; color: #9A3412; line-height: 1.5;">
        <div style="font-weight: 800; color: #C2410C; margin-bottom: 0.25rem;">
          ⚠️ Doorstep Dispatch Fee (₹99) Deducted:
        </div>
        As per company policy, cancellation within 9 hours or upon arrival incurred a ₹99 technician dispatch fee. The remaining balance has been refunded.
      </div>
      ` : ''}

      <!-- Automatic Gateway Refund Card -->
      ${refundAmt > 0 ? `
      <div style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 1.5px solid #86EFAC; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.1);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
          <span style="color: #166534; font-size: 0.9rem; font-weight: 800;">
            ${isProcessed ? '✅ 100% Refund Initiated' : '⏳ Refund Processing'}
          </span>
          <span style="background: #16A34A; color: white; padding: 3px 12px; border-radius: 12px; font-weight: 900; font-size: 1.05rem;">
            ₹${refundAmt}
          </span>
        </div>
        <p style="color: #14532D; font-size: 0.84rem; margin: 0 0 0.5rem 0; line-height: 1.5;">
          An automatic refund of <strong>₹${refundAmt}</strong> has been initiated via Razorpay back to your original payment method.
        </p>
        ${refundId ? `
        <div style="font-size: 0.76rem; font-family: monospace; color: #047857; margin-bottom: 0.4rem;">
          Refund ID: ${refundId}
        </div>
        ` : ''}
        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #166534; border-top: 1px dashed #A7F3D0; padding-top: 0.45rem; line-height: 1.45;">
          ⏱️ <strong>Refund Timeline Note:</strong> Funds typically credit directly to your bank account / card within <strong>5 to 7 business days</strong>. If not credited within 7 days, please email us at <a href="mailto:washmycarorg@gmail.com" style="color: #047857; font-weight: 700; text-decoration: underline;">washmycarorg@gmail.com</a>.
        </div>
      </div>
      ` : `
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.84rem; color: #475569; line-height: 1.45;">
        No online payment charges were deducted for this booking. ${booking?.pointsRedeemed > 0 ? `Your <strong>${booking.pointsRedeemed} loyalty coins</strong> have been restored to your balance.` : ''}
      </div>
      `}

      <!-- Loyalty Points Reversal (if points earned on payment were reversed) -->
      ${booking?.pointsEarned > 0 && booking?.paymentStatus === 'PAID' ? `
      <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 0.7rem 0.9rem; margin-bottom: 1.25rem; font-size: 0.8rem; color: #991B1B;">
        🔄 <strong>Reward Points Reversal:</strong> ${booking.pointsEarned} reward points credited on payment have been reversed due to booking cancellation.
      </div>
      ` : ''}

      <p style="color: #64748B; font-size: 0.84rem; line-height: 1.5; margin: 0 0 1.35rem 0;">
        If you have any questions or did not authorize this cancellation, please contact our support desk immediately at <a href="mailto:washmycarorg@gmail.com" style="color: #0284C7; font-weight: 600;">washmycarorg@gmail.com</a>.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="https://washmycar.org.in/book" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color: #FFFFFF; text-decoration: none; padding: 0.85rem 2.25rem; border-radius: 12px; font-weight: 800; font-size: 0.95rem; display: inline-block; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);">
          Book a New Wash →
        </a>
      </div>
    </div>
  `;

  const html = renderEmailShell({
    headerTitle: `Booking Cancelled ${bookingRef}`,
    headerSubtitle: 'Doorstep Car Care Cancellation & Refund',
    bodyContent
  });

  const text = `Wash My Car: Booking ${bookingRef} has been cancelled. Reason: ${cancelReason}. ${refundAmt > 0 ? `Automatic refund of ₹${refundAmt} initiated (ID: ${refundId || 'Processing'}). Credited within 5-7 business days.` : ''} Visit https://washmycar.org.in to rebook.`;

  return sendEmail({ to, subject, html, text });
};

/**
 * 6. Send Super CSS Doorstep Rejection / Unavailability Notice Email (₹99 Fee Cut Policy)
 */
export const sendDoorstepRejectionEmail = async ({ to, name, booking, refundDetails = {}, note }) => {
  const userName = name || 'Customer';
  const bookingRef = getBookingReference(booking);
  const subject = `Doorstep Visit Notice (₹99 Fee Applied) ${bookingRef} - Wash My Car Org`;

  const refundAmt = refundDetails.refundAmount !== undefined ? refundDetails.refundAmount : 0;
  const refundId = refundDetails.refundId || null;
  const dateFormatted = formatDateFull(booking?.date);

  const vehicleLabel = getVehicleLabel(booking);
  const carNumber = getVehicleNumber(booking);

  const bodyContent = `
    <div>
      <!-- Status Badge & Ref Header -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 1rem;">
        <tr>
          <td>
            <span style="display: inline-block; background: #FFF7ED; color: #C2410C; font-size: 0.75rem; font-weight: 800; padding: 4px 14px; border-radius: 20px; border: 1.5px solid #FDBA74; margin-bottom: 0.75rem;">
              DOORSTEP ATTEMPT CLOSED 🚪
            </span>
          </td>
          <td align="right">
            <span style="background: #F1F5F9; color: #0F172A; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 800; font-family: 'SF Mono', Consolas, Monaco, monospace; border: 1px solid #CBD5E1;">
              ${bookingRef}
            </span>
          </td>
        </tr>
      </table>

      <h2 style="color: #0F172A; font-size: 1.35rem; font-weight: 800; margin: 0 0 0.5rem 0;">
        Doorstep Service Closed for Booking ${bookingRef}
      </h2>

      <p style="color: #475569; font-size: 0.92rem; line-height: 1.55; margin: 0 0 1.25rem 0;">
        Hi ${userName}, our mobile detailing technician arrived at your scheduled location on <strong>${dateFormatted} (${booking?.timeSlot || ''})</strong> for your vehicle <strong>${vehicleLabel} ${renderVehiclePlateBadge(carNumber)}</strong>, but was unable to proceed with service.
      </p>

      <!-- Technician Observation Note -->
      <div style="background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 12px; padding: 0.9rem 1.15rem; margin-bottom: 1.25rem;">
        <div style="font-size: 0.85rem; color: #92400E; font-weight: 700; margin-bottom: 0.2rem;">
          Technician Report / Attempt Details:
        </div>
        <div style="font-size: 0.88rem; color: #78350F; font-style: italic;">
          "${note || 'Customer unavailable at address or service refused upon arrival'}"
        </div>
      </div>

      <!-- Fee Deduction & Refund Policy Breakdown -->
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem;">
        <h4 style="margin: 0 0 0.6rem 0; font-size: 0.88rem; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.04em;">
          Policy Enforcement & Account Adjustment:
        </h4>
        <div style="font-size: 0.84rem; color: #334155; line-height: 1.6;">
          <div>• <strong>Technician Travel & Slot Charge:</strong> As cancellation or rescheduling was not initiated at least 9 hours prior, a <strong>₹99 technician dispatch fee</strong> was applied.</div>
          ${refundAmt > 0 ? `
          <div style="margin-top: 0.35rem; color: #166534; font-weight: 600;">
            • <strong>Bank Account Partial Refund:</strong> A partial refund of <strong>₹${refundAmt}</strong> (paid cash minus the ₹99 dispatch fee) has been initiated via Razorpay ${refundId ? `(Refund ID: ${refundId})` : ''} and will credit to your bank account within 5-7 business days.
          </div>
          ` : ''}
          ${booking?.pointsRedeemed > 0 ? `
          <div style="margin-top: 0.35rem; color: #B45309;">
            • <strong>Loyalty Coins (App Wallet):</strong> Used reward coins have been restored to your app wallet balance (loyalty coins are returned to your account balance, not sent as cash to your bank).
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
    headerTitle: `Doorstep Visit Notice ${bookingRef}`,
    headerSubtitle: 'Doorstep Car Care & Detailing In Vizag',
    bodyContent
  });

  const text = `Wash My Car: Doorstep service for Booking ${bookingRef} was closed. As cancellation was not done 9 hours prior, a ₹99 visit fee was deducted. ${refundAmt > 0 ? `Remaining balance of ₹${refundAmt} refunded.` : ''}`;

  return sendEmail({ to, subject, html, text });
};
