import express from 'express';
import { loginAdmin, logout, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
import { loginValidator } from '../validators/authValidator.js';

import {
  getDashboard,
  getSalesAnalytics,
  getLowStockProducts,
  getCustomers,
  getCustomerById,
  toggleBlockCustomer,
  getCancelRequests,
  approveCancelRequest,
  rejectCancelRequest,
} from '../controllers/adminController.js';

import { generateOrderReport } from '../controllers/reportController.js';

const router = express.Router();

// ─── Auth ────────────────────────────────────
router.post('/login', loginValidator, loginAdmin);
router.post('/logout', protect, admin, logout);
router.get('/me', protect, admin, getMe);

// ─── Dashboard & Analytics ───────────────────
router.get('/dashboard', protect, admin, getDashboard);
router.get('/sales', protect, admin, getSalesAnalytics);
router.get('/low-stock', protect, admin, getLowStockProducts);

// ─── Reports ─────────────────────────────────
// GET /api/admin/reports/orders
// Generates a full Excel workbook (5 sheets) and emails it to ADMIN_EMAIL.
// No body required — admin just hits the endpoint.
router.get('/reports/orders', protect, admin, generateOrderReport);

// ─── Customer Management ─────────────────────
// NOTE: /customers/block/:id must be registered before /customers/:id
// to prevent Express matching 'block' as the :id param.
router.get('/customers', protect, admin, getCustomers);
router.patch('/customers/block/:id', protect, admin, toggleBlockCustomer);
router.get('/customers/:id', protect, admin, getCustomerById);

// ─── Cancellation Request Management ─────────
// GET  /cancel-requests             → list all (default: Pending only, ?status=all|Approved|Rejected)
// PUT  /cancel-requests/:id/approve → approve, triggers cancel+stock restore+customer email
// PUT  /cancel-requests/:id/reject  → reject, sends rejection email to customer
//
// NOTE: /cancel-requests/:id/approve and /cancel-requests/:id/reject must be registered
// before any /:id catch-all if one were ever added to this router.
router.get('/cancel-requests', protect, admin, getCancelRequests);
router.put('/cancel-requests/:id/approve', protect, admin, approveCancelRequest);
router.put('/cancel-requests/:id/reject', protect, admin, rejectCancelRequest);

export default router;
