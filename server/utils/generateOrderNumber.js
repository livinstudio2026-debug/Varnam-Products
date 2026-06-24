import crypto from 'crypto';

/**
 * Generates a unique order number in the format: ORD-YYYYMMDD-XXXXXXXX
 *
 * - Date prefix makes orders sortable and human-readable at a glance
 * - 4-byte crypto hex suffix (8 chars) gives 4 billion possible values per day —
 *   collision risk is negligible for a small ecommerce store
 *
 * Used by: orderController (COD path) and paymentController (Razorpay path)
 */
export const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${date}-${randomSuffix}`;
};
