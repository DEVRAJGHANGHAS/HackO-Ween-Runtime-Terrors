const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/summary', analyticsController.getSummary);
router.get('/role-summary', analyticsController.getRoleSummary);
router.get('/categories', analyticsController.getCategoryBreakdown);
router.get('/export-csv', analyticsController.exportAuditCsv);

module.exports = router;
