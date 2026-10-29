import express from 'express';
import { 
  generatePromptPayQR, 
  sendServerOtp, 
  verifyServerOtp 
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/promptpay-qr', generatePromptPayQR);
router.post('/send-otp', sendServerOtp);
router.post('/verify-otp', verifyServerOtp);

export default router;