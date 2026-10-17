import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { 
  getProfile, 
  updateProfile, 
  getBookings, 
  createBooking, 
  getCars, 
  addCar, 
  deleteCar,
  getServices,
  getCarTypes,
  getWashTypes,
  getServiceAreas,
  getWashPrice,
  getSavedAddresses,
  addSavedAddress,
  deleteSavedAddress,
  getEligibleCoupons,
  getPublicSettings,
  getPublicHomeContent,
  getAllWashPrices,
  getAddons,
  getPublicActiveCoupons,
  verifyBookingPayment,
  cancelPendingPayment,
  cancelBooking,
  getUserSubscriptionPlans,
  getMySubscriptions,
  subscribeToPlan,
  verifySubscriptionPayment,
  resolveMapsUrl
} from '../controllers/userController.js';

import { submitInquiry } from '../controllers/inquiryController.js';
import { getAvailableBookingSlots } from '../controllers/slotController.js';

const router = express.Router();

// Public endpoints
router.get('/home-content', getPublicHomeContent);
router.get('/service-areas', getServiceAreas);
router.get('/wash-types', getWashTypes);
router.get('/wash-prices', getAllWashPrices);
router.get('/car-types', getCarTypes);
router.get('/addons', getAddons);
router.get('/active-coupons', getPublicActiveCoupons);
router.get('/settings', getPublicSettings);
router.post('/inquiries', submitInquiry);
router.get('/available-slots', getAvailableBookingSlots);
router.get('/subscriptions/plans', getUserSubscriptionPlans);
router.post('/resolve-maps-url', resolveMapsUrl);

router.use(verifyToken);

// User subscriptions
router.get('/subscriptions/my', getMySubscriptions);
router.post('/subscriptions/subscribe', subscribeToPlan);
router.post('/subscriptions/verify-payment', verifySubscriptionPayment);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/bookings', getBookings);
router.post('/bookings', createBooking);
router.post('/bookings/verify-payment', verifyBookingPayment);
router.post('/bookings/:id/cancel-payment', cancelPendingPayment);
router.post('/bookings/:id/cancel', cancelBooking);

router.get('/cars', getCars);
router.post('/cars', addCar);
router.delete('/cars/:id', deleteCar);

router.get('/services', getServices);

// New endpoints for new booking workflow
router.get('/car-types', getCarTypes);
router.get('/price', getWashPrice);

// Saved addresses CRUD
router.get('/addresses', getSavedAddresses);
router.post('/addresses', addSavedAddress);
router.delete('/addresses/:id', deleteSavedAddress);

// Coupon and Royalty settings
router.get('/eligible-coupons', getEligibleCoupons);

export default router;
