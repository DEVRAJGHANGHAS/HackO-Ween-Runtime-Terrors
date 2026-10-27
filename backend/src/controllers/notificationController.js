const notificationService = require('../services/notificationService');

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const role = req.user?.role || req.query.role || 'admin';
    const limit = parseInt(req.query.limit || '40', 10);

    const notifications = await notificationService.getUserNotifications(userId, role, limit);
    const unreadCount = await notificationService.getUnreadCount(userId, role);

    res.json({
      success: true,
      unreadCount,
      count: notifications.length,
      notifications
    });
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const role = req.user?.role || req.query.role || 'admin';
    const unreadCount = await notificationService.getUnreadCount(userId, role);

    res.json({
      success: true,
      unreadCount
    });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const notification = await notificationService.markAsRead(id, userId);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const role = req.user?.role || req.query.role || 'admin';
    await notificationService.markAllAsRead(userId, role);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    next(err);
  }
};
