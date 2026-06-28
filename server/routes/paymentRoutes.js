import express from 'express';
const router = express.Router();

import { createRazorpayOrder, handleRazorpayWebhook } from '../controllers/paymentController.js';
import { optionalProtect } from '../middleware/optionalAuthMiddleware.js';

// optionalProtect: attaches req.user if logged in, passes through silently for guests.
// The paymentLimiter (10 req / 15 min per IP) is applied in server.js before this router.
router.post('/create-order', optionalProtect, createRazorpayOrder);

// Webhook: no auth — verified via Razorpay HMAC signature inside the controller.
// Raw body is preserved by express.raw() registered in server.js before express.json().
router.post('/webhook', handleRazorpayWebhook);

export default router;
