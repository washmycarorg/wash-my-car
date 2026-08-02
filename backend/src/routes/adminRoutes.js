import express from 'express';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/stats', adminController.getDashboardStats);

router.get('/employees', adminController.getEmployees);
router.get('/employees/workload', adminController.getEmployeesWorkload);
router.put('/employees/:id', adminController.updateEmployee);
router.put('/employees/:id/status', adminController.toggleEmployeeStatus);

router.get('/leaves', adminController.getLeaves);
router.put('/leaves/:id/status', adminController.updateLeaveStatus);

router.get('/offers', adminController.getOffers);
router.post('/offers', adminController.createOffer);
router.put('/offers/:id', adminController.updateOffer);
router.delete('/offers/:id', adminController.deleteOffer);

// Keep Services for fallback
router.get('/services', adminController.getServices);
router.post('/services', adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

// Service Areas
router.get('/service-areas', adminController.getServiceAreas);
router.post('/service-areas', adminController.createServiceArea);
router.delete('/service-areas/:id', adminController.deleteServiceArea);

// Car Types
router.get('/car-types', adminController.getCarTypes);
router.post('/car-types', adminController.createCarType);
router.put('/car-types/:id', adminController.updateCarType);
router.delete('/car-types/:id', adminController.deleteCarType);

// Wash Types
router.get('/wash-types', adminController.getWashTypes);
router.post('/wash-types', adminController.createWashType);
router.put('/wash-types/:id', adminController.updateWashType);
router.delete('/wash-types/:id', adminController.deleteWashType);

// Wash Prices Matrix
router.get('/wash-prices', adminController.getWashPrices);
router.post('/wash-prices', adminController.saveWashPrice);

// Bookings
router.get('/bookings', adminController.getBookings);
router.put('/bookings/:id/assign', adminController.assignSlot);
router.put('/bookings/:id/auto-assign', adminController.autoAssignSlot);

export default router;
