const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please provide a valid email format.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body('role')
    .optional()
    .isIn(['admin', 'provider', 'recipient', 'driver']).withMessage('Role must be one of: admin, provider, recipient, driver.'),
  body('organisationName')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Organisation name must be under 150 characters.')
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please provide a valid email format.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
];

module.exports = { registerValidator, loginValidator };
