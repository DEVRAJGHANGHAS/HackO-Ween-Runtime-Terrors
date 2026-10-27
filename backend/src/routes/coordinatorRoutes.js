const express = require('express');
const router = express.Router();
const coordinatorController = require('../controllers/coordinatorController');
const { authenticateToken } = require('../middleware/auth');

router.get('/status', coordinatorController.getStatus);
router.get('/summary-analysis', coordinatorController.getSummaryAnalysis);
router.post('/explain-match', coordinatorController.explainMatch);
router.post('/run-expiry-check', coordinatorController.runExpiryCheck);
router.post('/simulate-recovery', coordinatorController.simulateRecovery);
router.post('/reset-simulation', coordinatorController.resetSimulation);
router.get('/incidents', coordinatorController.getIncidents);
router.get('/incidents/:id', coordinatorController.getIncidentById);

module.exports = router;
