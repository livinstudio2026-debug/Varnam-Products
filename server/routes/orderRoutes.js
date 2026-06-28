import express from 'express';
const router = express.Router();

import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
import { optionalProtect } from '../middleware/optionalAuthMiddleware.js';

import {
  createOrder,
  getMyOrders,
  getOrderById,
  trackOrderPublicly,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrdersByUser,
  getOrdersByStatus,
  submitCancelRequest,
  getCancelRequestStatus,
  resolveCancelRequest,
} from '../controllers/orderController.js';

// --- Customer / Public Endpoints ---
router.post('/', optionalProtect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/track/:orderNumber', trackOrderPublicly);

// --- Cancellation Request — Customer Endpoints ---
// POST: submit a new cancellation request with a reason
// GET:  check current status of the request (for frontend polling)
// Must be above /:id to prevent Express matching 'cancel-request' as the :id param.
router.post('/:id/cancel-request', protect, submitCancelRequest);
router.get('/:id/cancel-request', protect, getCancelRequestStatus);

// --- Cancellation Request — Admin Endpoint ---
// PUT: approve or reject a pending cancellation request
router.put('/:id/cancel-request', protect, admin, resolveCancelRequest);

// --- Admin System Management Endpoints ---
// IMPORTANT: All literal-path GET routes must be registered BEFORE /:id.
// Express matches routes in order — /user/:userId and /status/:status would
// both be caught by /:id first if placed after it, making them unreachable.
router.get('/', protect, admin, getAllOrders);
router.get('/user/:userId', protect, admin, getOrdersByUser);
router.get('/status/:status', protect, admin, getOrdersByStatus);
router.put('/status/:id', protect, admin, updateOrderStatus);
router.put('/cancel/:id', protect, admin, cancelOrder);

// /:id must always be last among GET routes — it is a catch-all param route
router.get('/:id', optionalProtect, getOrderById);

export default router;
