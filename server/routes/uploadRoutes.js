import express from 'express';
const router = express.Router();

import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
import { 
  uploadProductImage, 
  uploadCategoryImage, 
  uploadBannerImage, 
  uploadMultipleProductImages,
  deleteAsset 
} from '../controllers/uploadController.js';
import { 
  uploadProductStorage, 
  uploadCategoryStorage, 
  uploadBannerStorage 
} from '../middleware/uploadMiddleware.js';

// All uploads are protected to Admin roles only
router.post('/product', protect, admin, uploadProductStorage.single('image'), uploadProductImage);
router.post('/category', protect, admin, uploadCategoryStorage.single('image'), uploadCategoryImage);
router.post('/banner', protect, admin, uploadBannerStorage.single('image'), uploadBannerImage);

// Multiple image upload endpoint (max 5 images at once)
router.post('/products/multiple', protect, admin, uploadProductStorage.array('images', 5), uploadMultipleProductImages);

// Delete asset endpoint
router.delete('/', protect, admin, deleteAsset);

export default router;