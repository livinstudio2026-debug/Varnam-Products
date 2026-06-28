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
 * Rules for POST /api/categories (Admin — create category)
 */
export const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2 }).withMessage('Category name must be at least 2 characters'),

  body('image')
    .trim()
    .notEmpty().withMessage('Category image URL is required')
    .isURL().withMessage('Image must be a valid URL'),

  validate,
];

/**
 * Rules for PUT /api/categories/:id (Admin — update category)
 * All fields optional — only validate what's present
 */
export const updateCategoryValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Category name must be at least 2 characters'),

  body('image')
    .optional()
    .trim()
    .isURL().withMessage('Image must be a valid URL'),

  body('active')
    .optional()
    .isBoolean().withMessage('Active must be a boolean value'),

  validate,
];
