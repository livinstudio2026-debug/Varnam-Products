import express from 'express';
import { getCart, syncCart, clearCart } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

/**
 * GET  /api/cart        → fetch cart from DB (call on login / page load)
 * PUT  /api/cart        → sync full cart to DB (call on every cart mutation)
 * DELETE /api/cart      → clear cart (call after order placed or manual clear)
 */
router.get('/',    getCart);
router.put('/',    syncCart);
router.delete('/', clearCart);

export default router;
