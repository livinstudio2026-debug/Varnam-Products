import 'dotenv/config';

// Validate all required env vars before anything else initializes.
// Server will exit with a clear error list if any are missing.
import { validateEnv } from './utils/validateEnv.js';
validateEnv();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import mongoose from 'mongoose';

import logger from './utils/logger.js';
import { sanitizeMiddleware } from './middleware/sanitizeMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

const app = express();

// Required for Render (and any reverse-proxy host).
// Without this, express-rate-limit reads the proxy's internal IP instead of the
// real client IP, making the rate limiter treat every user as the same address.
app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000'].filter(Boolean);
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

// --- Rate Limiters ---

// Global limiter — general API protection (100 req / 5 min)
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict auth limiter — prevents credential stuffing on login/register (10 req / 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many authentication attempts. Please wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only counts failed/errored requests toward the limit
});

// Strict OTP limiter — protects forgot-password routes from massive automation/DoS.
// DOES NOT skip successful requests since the controller always responds with a 200 OK generic success status.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Strict limit: 5 OTP requests per 15 mins is generous for standard users
  message: { success: false, message: 'Too many OTP requests. Please wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment limiter — prevents anonymous Razorpay draft order flooding (10 req / 15 min per IP).
// Generous for legitimate customers (one call per checkout attempt) while stopping bots
// from hammering the endpoint and exhausting Razorpay API quota + DB storage.
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many payment requests. Please wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Order tracking limiter — prevents enumeration of valid order numbers (20 req / min per IP).
// 20 req / min is generous for legitimate users (refresh, share link) while making
// brute-force of the 8-char hex suffix (~4 billion combinations) economically infeasible.
const trackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many tracking requests. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', globalLimiter);

// CRITICAL ORDERING: The webhook route must receive the raw Buffer body for HMAC signature
// verification to work. This middleware MUST be registered before express.json() below,
// otherwise the body will already be parsed and the signature check will always fail.
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Sanitization — runs after body parsing, before route handlers.
// Prevents NoSQL injection and XSS payloads from reaching controllers or being stored in MongoDB.
app.use(sanitizeMiddleware);

// --- Request Logging ---
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

app.use(
  morgan(morganFormat, {
    skip: (req) => req.path === '/api/payment/webhook',
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// Apply strict rate limiter to login/register endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin/login', authLimiter);

// Apply dedicated OTP limiter to forgot-password paths to counter email enumeration automation
app.use('/api/auth/forgot-password', otpLimiter);

// Apply payment limiter to the Razorpay order creation endpoint only.
app.use('/api/payment/create-order', paymentLimiter);

// Tight limiter on the unauthenticated order tracking endpoint
app.use('/api/orders/track', trackingLimiter);

// --- Core Route Middleware Hooks ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Varnam Organic API Operational' });
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource path not found' });
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Log every unhandled error through Winston so it appears in Render logs
  logger.error(`${req.method} ${req.originalUrl} → ${statusCode} ${err.message}`, {
    stack: err.stack,
    ip: req.ip,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('MongoDB Atlas connected successfully');
    const PORT = process.env.PORT || 3000;

    if (process.env.NODE_ENV !== "production") {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  })
  .catch((error) => {
    logger.error('Database connection failure', { error: error.message });
    process.exit(1);
  });

export default app;
