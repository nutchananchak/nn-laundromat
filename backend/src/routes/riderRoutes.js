import express from 'express';
import { listRiders, createRider, updateRider, deleteRider } from '../controllers/riderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth('admin'));
router.get('/', listRiders);
router.post('/', createRider);
router.patch('/:id', updateRider);
router.delete('/:id', deleteRider);

export default router;