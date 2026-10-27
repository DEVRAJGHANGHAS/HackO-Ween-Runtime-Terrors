const { body } = require('express-validator');

const createDemandValidator = [
  body('quantityRequested')
    .notEmpty().withMessage('Requested quantity is required.')
    .isInt({ min: 1 }).withMessage('Requested quantity must be at least 1 portion/unit.'),
  body('category')
    .optional()
    .isIn(['prepared_meals', 'raw_produce', 'bakery', 'dairy', 'packaged']).withMessage('Category must be valid.'),
  body('urgency')
    .optional()
    .isIn(['critical', 'high', 'medium', 'low']).withMessage('Urgency must be critical, high, medium, or low.'),
  body('preferredDeliveryWindow.end')
    .notEmpty().withMessage('Delivery window deadline is required.')
    .isISO8601().withMessage('Delivery window deadline must be a valid ISO 8601 date string.')
];

module.exports = { createDemandValidator };
