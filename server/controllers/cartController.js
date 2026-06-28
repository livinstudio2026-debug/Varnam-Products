import Cart from '../models/Cart.js';
import logger from '../utils/logger.js';

/**
 * GET /api/cart
 * Returns the current user's cart from DB.
 * Frontend calls this on mount (after login) to hydrate localStorage.
 */
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).lean();

    return res.status(200).json({
      success: true,
      items: cart?.items ?? [],
    });
  } catch (error) {
    logger.error('[CartController] getCart failed', { error: error.message, userId: req.user._id });
    return res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
};

/**
 * PUT /api/cart
 * Syncs the entire cart from the frontend to MongoDB.
 *
 * Body: { items: [ { product, name, price, image, quantity } ] }
 *
 * Called after:
 *   - addToCart
 *   - updateQuantity
 *   - removeItem
 *   - clearCart (items: [])
 *
 * Resets abandoned-cart reminder tracking on every save (the clock restarts).
 */
export const syncCart = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items must be an array' });
    }

    // Basic per-item validation
    for (const item of items) {
      if (!item.product || !item.name || item.price == null || item.quantity == null) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have product, name, price, and quantity',
        });
      }
      if (item.quantity < 1) {
        return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
      }
    }

    const cart = await Cart.syncCart(req.user._id, items);

    return res.status(200).json({
      success: true,
      message: 'Cart synced',
      items: cart.items,
    });
  } catch (error) {
    logger.error('[CartController] syncCart failed', { error: error.message, userId: req.user._id });
    return res.status(500).json({ success: false, message: 'Failed to sync cart' });
  }
};

/**
 * DELETE /api/cart
 * Clears the cart (used after successful order placement or manual clear).
 */
export const clearCart = async (req, res) => {
  try {
    await Cart.clearCart(req.user._id);

    return res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    logger.error('[CartController] clearCart failed', { error: error.message, userId: req.user._id });
    return res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
};
