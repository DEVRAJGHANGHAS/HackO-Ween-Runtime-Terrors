const express = require('express');
const router = express.Router();
const demandController = require('../controllers/demandController');
const { createDemandValidator } = require('../validators/demandValidator');
const validate = require('../middleware/validate');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', demandController.getDemands);
router.get('/:id', demandController.getDemandById);
router.post('/', authenticateToken, authorizeRoles('admin', 'recipient'), createDemandValidator, validate, demandController.createDemand);
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'recipient'), demandController.updateDemand);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'recipient'), demandController.deleteDemand);

module.exports = router;
