import { body, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }
  next();
};

/**
 * Rules for POST /api/products (Admin — create product)
 */
export const createProductValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Product description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),

  body('shortDescription')
    .trim()
    .notEmpty().withMessage('Short description is required')
    .isLength({ max: 160 }).withMessage('Short description cannot exceed 160 characters'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('discountPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Discount price must be a positive number')
    .custom((value, { req }) => {
      // Only validate if discountPrice is non-zero
      if (Number(value) === 0) return true;
      if (Number(value) >= Number(req.body.price)) {
        throw new Error('Discount price must be lower than the base price');
      }
      return true;
    }),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),

  body('stock')
    .notEmpty().withMessage('Stock quantity is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  body('images')
    .isArray({ min: 1 }).withMessage('At least one product image is required'),

  validate,
];

/**
 * Rules for PUT /api/products/:id (Admin — update product)
 * All fields optional — only validate what's present
 */
export const updateProductValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('discountPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Discount price must be a positive number')
    .custom((value, { req }) => {
      if (Number(value) === 0) return true;
      // Only compare if price is also being updated in the same request
      if (req.body.price !== undefined && Number(value) >= Number(req.body.price)) {
        throw new Error('Discount price must be lower than the base price');
      }
      return true;
    }),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  body('category')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),

  validate,
];
