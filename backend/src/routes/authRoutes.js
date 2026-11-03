import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, register, forgotPassword, getProfile, updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
});

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.post('/forgot-password', authLimiter, forgotPassword);
router.get('/profile/:phone', requireAuth('customer'), getProfile);
router.put('/profile/:phone', requireAuth('customer'), updateProfile);

export default router;