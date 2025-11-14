import express from 'express';
import { login, register, getMe, updateMe } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateLogin, validateRegister, validateUpdateProfile } from '../middleware/validation.js';

const router = express.Router();

router.post('/login', validateLogin, login);
router.post('/register', protect, authorize('admin'), validateRegister, register);
router.get('/me', protect, getMe);
router.put('/me', protect, validateUpdateProfile, updateMe);

export default router;

