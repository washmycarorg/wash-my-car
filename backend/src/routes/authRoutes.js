import express from 'express';
import { userRegister, userLogin, employeeLogin, employeeRegister, adminLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/user/register', userRegister);
router.post('/user/login', userLogin);
router.post('/employee/login', employeeLogin);
router.post('/employee/register', employeeRegister);
router.post('/admin/login', adminLogin);

export default router;
