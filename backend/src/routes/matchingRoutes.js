const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/suggestions', matchingController.getSuggestions);
router.post('/confirm', authenticateToken, authorizeRoles('admin', 'provider'), matchingController.confirmPlan);

module.exports = router;
