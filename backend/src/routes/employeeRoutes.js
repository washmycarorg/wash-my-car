import express from 'express';
import { verifyToken, requireEmployee } from '../middlewares/authMiddleware.js';
import { getProfile, updateProfile, toggleDuty, getAssignedBookings, startBooking, completeBooking, getEmployeeInventory, reportBookingIssue } from '../controllers/employeeController.js';

const router = express.Router();

router.use(verifyToken, requireEmployee);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/duty', toggleDuty);
router.get('/bookings', getAssignedBookings);
router.put('/bookings/:id/start', startBooking);
router.put('/bookings/:id/complete', completeBooking);
router.put('/bookings/:id/report-issue', reportBookingIssue);
router.get('/inventory', getEmployeeInventory);

export default router;
