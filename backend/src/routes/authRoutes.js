import express from 'express';
import { userRegister, userLogin, employeeLogin, adminLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/user/register', userRegister);
router.post('/user/login', userLogin);
router.post('/employee/login', employeeLogin);
router.post('/admin/login', adminLogin);

export default router;
