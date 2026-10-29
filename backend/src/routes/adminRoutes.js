import express from 'express';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';
import { getAdminInquiries, updateInquiryStatus, deleteInquiry } from '../controllers/inquiryController.js';
import { 
  getAdminSlotsConfig, 
  updateAdminSlotsConfig, 
  adminReleaseWeek, 
  adminReleaseMonth 
} from '../controllers/slotController.js';

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/stats', adminController.getDashboardStats);

router.get('/employees', adminController.getEmployees);
router.get('/employees/workload', adminController.getEmployeesWorkload);
router.put('/employees/:id', adminController.updateEmployee);
router.put('/employees/:id/status', adminController.toggleEmployeeStatus);
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.post('/users/:id/points', adminController.addUserPoints);
router.post('/users/:id/grant-subscription', adminController.grantFreeSubscription);

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
router.put('/service-areas/:id', adminController.updateServiceArea);
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
router.put('/bookings/:id', adminController.updateBooking);
router.delete('/bookings/:id', adminController.deleteBooking);
router.put('/bookings/:id/assign', adminController.assignSlot);
router.put('/bookings/:id/auto-assign', adminController.autoAssignSlot);
router.put('/bookings/:id/reschedule', adminController.rescheduleBookingByAdmin);
router.put('/bookings/:id/cancel', adminController.cancelBookingByAdmin);
router.post('/bookings/:id/doorstep-rejection', adminController.markDoorstepRejectionByAdmin);


// Inventory
router.get('/inventory', adminController.getInventoryItems);
router.post('/inventory', adminController.createInventoryItem);
router.put('/inventory/:id', adminController.updateInventoryItem);
router.delete('/inventory/:id', adminController.deleteInventoryItem);
router.post('/inventory/allocate', adminController.allocateInventory);
router.put('/inventory/allocate/:id', adminController.updateAllocation);
router.delete('/inventory/allocate/:id', adminController.deleteAllocation);

// Addons
router.get('/addons', adminController.getAddons);
router.post('/addons', adminController.createAddon);
router.put('/addons/:id', adminController.updateAddon);
router.delete('/addons/:id', adminController.deleteAddon);

// System Settings
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

// Homepage CMS settings
router.get('/cms', adminController.getCmsContent);
router.put('/cms', adminController.updateCmsContent);

// Inquiries & Complaints
router.get('/inquiries', getAdminInquiries);
router.put('/inquiries/:id', updateInquiryStatus);
router.delete('/inquiries/:id', deleteInquiry);

// Subscriptions
router.get('/subscriptions/plans', adminController.getAdminSubscriptionPlans);
router.post('/subscriptions/plans', adminController.createSubscriptionPlan);
router.put('/subscriptions/plans/:id', adminController.updateSubscriptionPlan);
router.delete('/subscriptions/plans/:id', adminController.deleteSubscriptionPlan);
router.get('/subscriptions/subscribers', adminController.getAdminSubscribers);

// Slot Configuration & Zone Dispatch
router.get('/slots-config', getAdminSlotsConfig);
router.put('/slots-config', updateAdminSlotsConfig);
router.post('/slots/release-week', adminReleaseWeek);
router.post('/slots/release-month', adminReleaseMonth);

export default router;
