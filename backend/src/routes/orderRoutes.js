import express from 'express';
import { getOrders, createOrder, updateOrderStatus } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth('customer', 'rider', 'admin'), getOrders);
router.post('/', requireAuth('customer'), createOrder);
router.put('/:id', requireAuth('customer', 'rider', 'admin'), updateOrderStatus);
router.patch('/:id/status', requireAuth('customer', 'rider', 'admin'), updateOrderStatus);
router.patch('/:id', requireAuth('customer', 'rider', 'admin'), updateOrderStatus);

export default router;