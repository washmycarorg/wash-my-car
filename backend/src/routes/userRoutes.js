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
  getAddons
} from '../controllers/userController.js';

const router = express.Router();

// Public endpoints
router.get('/home-content', getPublicHomeContent);
router.get('/service-areas', getServiceAreas);
router.get('/wash-types', getWashTypes);
router.get('/wash-prices', getAllWashPrices);
router.get('/car-types', getCarTypes);
router.get('/addons', getAddons);

router.use(verifyToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/bookings', getBookings);
router.post('/bookings', createBooking);

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
router.get('/settings', getPublicSettings);

export default router;
