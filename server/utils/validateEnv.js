/**
 * Validates that all required environment variables are present before the server starts.
 * Call this at the very top of server.js, before any other initialization.
 *
 * Why: If RAZORPAY_KEY_SECRET or MONGO_URI is missing on Render, the server
 * starts cleanly but silently fails on the first real request. This makes
 * debugging miserable. Failing fast at startup is always better.
 */

const REQUIRED_ENV_VARS = [
  // Core
  'PORT',
  'MONGO_URI',
  'NODE_ENV',
  'CLIENT_URL',

  // Auth
  'JWT_SECRET',

  // Razorpay
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',

  // Cloudinary
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',

  // Email
  'MAIL_HOST',
  'MAIL_PORT',
  'MAIL_USER',
  'MAIL_PASS',
  'MAIL_FROM',
  'ADMIN_EMAIL',
];

export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   → ${key}`));
    console.error('\nServer startup aborted. Set the missing variables and restart.');
    process.exit(1);
  }

  console.log('✅ Environment variables validated.');
};
