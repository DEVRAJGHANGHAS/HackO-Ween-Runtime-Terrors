const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', deliveryController.getDeliveries);
router.get('/:id', deliveryController.getDeliveryById);
router.patch('/:id/status', authenticateToken, deliveryController.updateStatus);
router.post('/:id/assign-driver', authenticateToken, authorizeRoles('admin', 'provider'), deliveryController.assignDriver);
router.post('/:id/report-incident', authenticateToken, deliveryController.reportIncident);
router.post('/:id/reassign', authenticateToken, deliveryController.reassignDelivery);
router.post('/:id/proof-of-delivery', authenticateToken, deliveryController.submitProofOfDelivery);

module.exports = router;
