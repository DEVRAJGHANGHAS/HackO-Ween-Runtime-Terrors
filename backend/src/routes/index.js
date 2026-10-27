const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const listingRoutes = require('./listingRoutes');
const demandRoutes = require('./demandRoutes');
const matchingRoutes = require('./matchingRoutes');
const deliveryRoutes = require('./deliveryRoutes');
const driverRoutes = require('./driverRoutes');
const organisationRoutes = require('./organisationRoutes');
const coordinatorRoutes = require('./coordinatorRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const forecastRoutes = require('./forecastRoutes');
const notificationRoutes = require('./notificationRoutes');

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'FoodResQ AI Backend REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

router.use('/auth', authRoutes);
router.use('/food-listings', listingRoutes);
router.use('/demand', demandRoutes);
router.use('/matching', matchingRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/drivers', driverRoutes);
router.use('/organisations', organisationRoutes);
router.use('/ai-coordinator', coordinatorRoutes);
router.use('/incidents', coordinatorRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/dashboard', analyticsRoutes);
router.use('/forecasts', forecastRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
