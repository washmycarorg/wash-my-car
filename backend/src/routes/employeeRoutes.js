import express from 'express';
import { verifyToken, requireEmployee } from '../middlewares/authMiddleware.js';
import { getProfile, toggleDuty, getAssignedBookings, updateBookingStatus } from '../controllers/employeeController.js';

const router = express.Router();

router.use(verifyToken, requireEmployee);

router.get('/profile', getProfile);
router.put('/duty', toggleDuty);
router.get('/bookings', getAssignedBookings);
router.put('/bookings/:id/status', updateBookingStatus);

export default router;
