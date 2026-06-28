import express from 'express';
const router = express.Router();
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
import { createCategoryValidator, updateCategoryValidator } from '../validators/categoryValidator.js';

// Public Routes
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// Admin Routes
router.post('/', protect, admin, createCategoryValidator, createCategory);
router.put('/:id', protect, admin, updateCategoryValidator, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

export default router;
