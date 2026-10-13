import Razorpay from 'razorpay';
import crypto from 'crypto';

export const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.warn('⚠️ Razorpay live credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) not fully configured in .env');
  }

  return new Razorpay({
    key_id: key_id || 'rzp_test_placeholder',
    key_secret: key_secret || 'secret_placeholder',
  });
};

export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured in backend .env');
  }
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
};
