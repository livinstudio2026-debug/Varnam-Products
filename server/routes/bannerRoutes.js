import express from 'express';
const router = express.Router();

import {
  getBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} from '../controllers/bannerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

// Public — storefront fetches only active banners
router.get('/', getBanners);

// Admin — full management
router.get('/all', protect, admin, getAllBanners);
router.post('/', protect, admin, createBanner);
router.put('/:id', protect, admin, updateBanner);
router.delete('/:id', protect, admin, deleteBanner);
router.patch('/status/:id', protect, admin, toggleBannerStatus);

export default router;
