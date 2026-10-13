import twilio from 'twilio';

// Format phone number to E.164 standard (defaulting to +91 for Indian mobile numbers)
export const formatToE164 = (phone) => {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // Strip leading 0 if 11 digits
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  // If 10 digits (standard Indian mobile), prepend +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  // If 12 digits starting with 91, prepend +
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

// Lazy initialization of Twilio client
let twilioClient = null;
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (accountSid && authToken) {
    if (!twilioClient) {
      twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
  }
  return null;
};

/**
 * Send an SMS message using Twilio
 * @param {string} to - Destination phone number
 * @param {string} body - Text message body
 */
export const sendSms = async (to, body) => {
  const formattedTo = formatToE164(to);
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!client || (!fromNumber && !messagingServiceSid)) {
    console.warn(`[SMS MOCK] Twilio not configured in .env. To: ${formattedTo}`);
    console.warn(`[SMS CONTENT]\n${body}\n`);
    return { success: false, mock: true, message: 'Twilio credentials not configured in backend/.env' };
  }

  try {
    const payload = {
      to: formattedTo,
      body: body
    };

    if (messagingServiceSid) {
      payload.messagingServiceSid = messagingServiceSid;
    } else if (fromNumber) {
      payload.from = fromNumber;
    }

    const message = await client.messages.create(payload);
    console.log(`[SMS SENT] SID: ${message.sid} to ${formattedTo}`);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error(`[SMS ERROR] Failed to send SMS to ${formattedTo}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP for Login or Register
 */
export const sendOtpSms = async (phone, otp, purpose = 'LOGIN') => {
  const formattedPhone = formatToE164(phone);
  let message = '';
  if (purpose === 'REGISTER') {
    message = `Wash My Car: Your verification OTP is ${otp}. Valid for 10 minutes. Please do not share this code with anyone.`;
  } else {
    message = `Wash My Car: Your login OTP is ${otp}. Valid for 10 minutes. Please do not share this code with anyone.`;
  }
  return await sendSms(formattedPhone, message);
};

/**
 * Send Booking Confirmation SMS with Booking Details & Payment ID
 */
export const sendBookingConfirmationSms = async (phone, booking) => {
  if (!phone) return { success: false, error: 'Phone number missing' };

  const dateFormatted = booking.date 
    ? new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Scheduled Date';
  
  const vehicle = booking.carNumber 
    ? `${booking.carType?.name || 'Vehicle'} (${booking.carNumber})`
    : (booking.carMake ? `${booking.carMake} ${booking.carModel || ''}` : (booking.carType?.name || 'Vehicle'));

  const wash = booking.washType?.name || 'Doorstep Wash';
  const paymentId = booking.razorpayPaymentId || 'N/A';
  const price = booking.price !== undefined ? booking.price : 'Paid';

  const body = `Wash My Car: Your booking #${booking.id} is confirmed!
Date: ${dateFormatted} (${booking.timeSlot || 'Scheduled Slot'})
Vehicle: ${vehicle}
Package: ${wash}
Total Paid: ₹${price}
Payment ID: ${paymentId}
Our technician will arrive at your location on time. Thank you for choosing Wash My Car!`;

  return await sendSms(phone, body);
};

/**
 * Send Cancellation & Refund Initiation SMS
 */
export const sendCancellationRefundSms = async (phone, booking, refundDetails = {}) => {
  if (!phone) return { success: false, error: 'Phone number missing' };

  const dateFormatted = booking.date 
    ? new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const refundAmt = refundDetails.refundAmount !== undefined ? refundDetails.refundAmount : (booking.refundAmount || booking.price || 0);
  const refundId = refundDetails.refundId || booking.refundId || 'N/A';

  let body = '';
  if (refundAmt > 0) {
    body = `Wash My Car: Booking #${booking.id}${dateFormatted ? ` for ${dateFormatted}` : ''} has been cancelled.
An automatic refund of ₹${refundAmt} has been initiated (Refund ID: ${refundId}).
Amount will be credited to your bank account within 7 working days.
For queries, contact washmycarorg@gmail.com or visit washmycar.org.in.`;
  } else {
    body = `Wash My Car: Booking #${booking.id}${dateFormatted ? ` for ${dateFormatted}` : ''} has been cancelled successfully.
For queries, contact washmycarorg@gmail.com or visit washmycar.org.in.`;
  }

  return await sendSms(phone, body);
};
