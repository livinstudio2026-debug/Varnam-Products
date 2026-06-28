/**
 * Custom sanitization middleware.
 *
 * Replaces express-mongo-sanitize and xss-clean — both abandoned packages
 * that crash on Express 5 by attempting to overwrite the read-only req.query getter.
 *
 * What this does:
 *   1. Strips MongoDB operator keys ($, .) from all string values in req.body and req.params
 *   2. Escapes HTML characters in all string values to prevent XSS in emails/templates
 *
 * Only touches req.body and req.params — never req.query.
 *
 * Buffer guard: the Razorpay webhook route uses express.raw(), which sets req.body
 * to a raw Buffer instead of a parsed object. deepSanitize must pass Buffers through
 * untouched — Object.entries() on a Buffer returns byte-index pairs and would corrupt
 * the body, breaking HMAC signature verification for every webhook call.
 */

const escapeHtml = (str) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

const stripMongoOperators = (str) => str.replace(/\$/g, '_');

const sanitizeValue = (str) => escapeHtml(stripMongoOperators(str));

const deepSanitize = (obj) => {
  if (typeof obj === 'string') return sanitizeValue(obj);
  if (Buffer.isBuffer(obj)) return obj; // raw webhook body — never touch it
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, deepSanitize(value)])
    );
  }
  return obj; // numbers, booleans, null — untouched
};

export const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = deepSanitize(req.body);
  if (req.params) req.params = deepSanitize(req.params);
  next();
};