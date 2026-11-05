import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', requireAuth('admin'), updateSettings);

export default router;