import express from 'express';
const router = express.Router();
import {
  getProducts,
  getProductBySlug,
  getBestSellers,
  getFeaturedProducts,
  searchProducts,
  getProductsByCategorySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  toggleBestSeller,
  toggleFeatured,
  toggleStatus
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
import { createProductValidator, updateProductValidator } from '../validators/productValidator.js';

// Public Routes
router.get('/', getProducts);
router.get('/best-sellers', getBestSellers);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/category/:slug', getProductsByCategorySlug);
router.get('/:slug', getProductBySlug); // Placed at bottom so literal routes resolve first

// Admin Routes
router.post('/', protect, admin, createProductValidator, createProduct);
router.put('/:id', protect, admin, updateProductValidator, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

router.patch('/stock/:id', protect, admin, updateStock);
router.patch('/best-seller/:id', protect, admin, toggleBestSeller);
router.patch('/featured/:id', protect, admin, toggleFeatured);
router.patch('/status/:id', protect, admin, toggleStatus);

export default router;
