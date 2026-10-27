const { body } = require('express-validator');

const createListingValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Listing title is required.')
    .isLength({ min: 3, max: 150 }).withMessage('Title must be between 3 and 150 characters.'),
  body('category')
    .optional()
    .isIn(['prepared_meals', 'raw_produce', 'bakery', 'dairy', 'packaged']).withMessage('Category must be one of: prepared_meals, raw_produce, bakery, dairy, packaged.'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required.')
    .isInt({ min: 1 }).withMessage('Quantity must be an integer greater than 0.'),
  body('safeUseDeadline')
    .notEmpty().withMessage('Safe-use deadline timestamp is required.')
    .isISO8601().withMessage('Safe-use deadline must be a valid ISO 8601 date string.'),
  body('pickupLocation')
    .optional()
];

const updateListingValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage('Title must be between 3 and 150 characters.'),
  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantity must be greater than 0.'),
  body('availableQuantity')
    .optional()
    .isInt({ min: 0 }).withMessage('Available quantity cannot be negative.'),
  body('status')
    .optional()
    .isIn(['available', 'matched', 'partially_matched', 'delivered', 'cancelled']).withMessage('Status must be valid.')
];

module.exports = { createListingValidator, updateListingValidator };
