import express from 'express';
import rateLimit from 'express-rate-limit';
import { generatePromptPayQR, sendServerOtp, verifyServerOtp } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
});

router.post('/promptpay-qr', requireAuth('customer'), generatePromptPayQR);
router.post('/send-otp', otpLimiter, sendServerOtp);
router.post('/verify-otp', otpLimiter, verifyServerOtp);

export default router;