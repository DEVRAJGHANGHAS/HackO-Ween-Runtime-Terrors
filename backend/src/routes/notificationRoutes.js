const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, notificationController.getNotifications);
router.get('/unread-count', optionalAuth, notificationController.getUnreadCount);
router.patch('/mark-all-read', optionalAuth, notificationController.markAllRead);
router.patch('/:id/read', optionalAuth, notificationController.markRead);

module.exports = router;
