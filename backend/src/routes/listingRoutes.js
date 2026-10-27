const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { createListingValidator, updateListingValidator } = require('../validators/listingValidator');
const validate = require('../middleware/validate');
const { authenticateToken, optionalAuth, authorizeRoles } = require('../middleware/auth');

router.get('/', listingController.getListings);
router.get('/:id', listingController.getListingById);
router.post('/', authenticateToken, authorizeRoles('admin', 'provider'), createListingValidator, validate, listingController.createListing);
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'provider'), updateListingValidator, validate, listingController.updateListing);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'provider'), listingController.deleteListing);

module.exports = router;
