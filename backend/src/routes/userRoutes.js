import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getProfile, updateProfile, getBookings, createBooking, getCars, addCar, getServices } from '../controllers/userController.js';

const router = express.Router();

router.use(verifyToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/bookings', getBookings);
router.post('/bookings', createBooking);
router.get('/cars', getCars);
router.post('/cars', addCar);
router.get('/services', getServices);

export default router;
