const express = require('express');
const router = express.Router();
const organisationController = require('../controllers/organisationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', organisationController.getOrganisations);
router.get('/:id', organisationController.getOrganisationById);
router.post('/', authenticateToken, organisationController.createOrganisation);
router.patch('/:id/verify', authenticateToken, authorizeRoles('admin'), organisationController.verifyOrganisation);
router.patch('/:id/suspend', authenticateToken, authorizeRoles('admin'), organisationController.suspendOrganisation);

module.exports = router;
