const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', driverController.getDrivers);
router.get('/:id', driverController.getDriverById);
router.patch('/:id/status', authenticateToken, authorizeRoles('admin', 'driver'), driverController.updateStatus);

module.exports = router;
