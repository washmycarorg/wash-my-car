import express from 'express';
import { 
  userRegister, 
  userLogin, 
  sendUserOtp, 
  googleAuth, 
  userEmailRegister, 
  userEmailLogin, 
  userSetPhone,
  sendUserEmailOtp,
  userEmailOtpRegister,
  userEmailOtpLogin,
  employeeLogin, 
  employeeRegister, 
  adminLogin 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/user/google', googleAuth);
router.post('/user/send-email-otp', sendUserEmailOtp);
router.post('/user/email-otp-register', userEmailOtpRegister);
router.post('/user/email-otp-login', userEmailOtpLogin);
router.post('/user/email-register', userEmailRegister);
router.post('/user/email-login', userEmailLogin);
router.post('/user/set-phone', userSetPhone);

router.post('/user/send-otp', sendUserOtp);
router.post('/user/register', userRegister);
router.post('/user/login', userLogin);
router.post('/employee/login', employeeLogin);
router.post('/employee/register', employeeRegister);
router.post('/admin/login', adminLogin);

export default router;
