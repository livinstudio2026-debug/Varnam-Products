import express from 'express';
import { getPublicSettings, getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Public — storefront reads freeShippingThreshold, flatShippingFee,
// codLimit, codEnabled to render checkout UI correctly.
// No sensitive fields are exposed here.
router.get('/', getPublicSettings);

// Admin only — full document including store info, timestamps
router.get('/admin', protect, admin, getSettings);

// Admin only — update any settings field
router.put('/', protect, admin, updateSettings);

export default router;
