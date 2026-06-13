import express from 'express';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/stats', adminController.getDashboardStats);

router.get('/employees', adminController.getEmployees);
router.put('/employees/:id', adminController.updateEmployee);
router.put('/employees/:id/status', adminController.toggleEmployeeStatus);

router.get('/leaves', adminController.getLeaves);
router.put('/leaves/:id/status', adminController.updateLeaveStatus);

router.get('/offers', adminController.getOffers);
router.post('/offers', adminController.createOffer);
router.put('/offers/:id', adminController.updateOffer);
router.delete('/offers/:id', adminController.deleteOffer);

router.get('/services', adminController.getServices);
router.post('/services', adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

router.get('/bookings', adminController.getBookings);
router.put('/bookings/:id/assign', adminController.assignSlot);

export default router;
