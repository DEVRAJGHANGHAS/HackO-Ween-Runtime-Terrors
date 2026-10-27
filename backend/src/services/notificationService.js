const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Dispatches a new notification to a specific user, a role, or broadcast to all
   */
  async notify({ recipient = null, targetRole = 'all', type = 'system_info', title, message, referenceId = null, referenceModel = null, actionUrl = '' }) {
    try {
      const notification = await Notification.create({
        recipient,
        targetRole,
        type,
        title,
        message,
        referenceId,
        referenceModel,
        actionUrl: actionUrl || this._getDefaultActionUrl(referenceModel)
      });

      // Socket.IO real-time emission if available
      try {
        const socketService = require('./socketService');
        socketService.emit('notification:new', notification);
      } catch (e) {
        // Socket service optional
      }

      return notification;
    } catch (err) {
      console.error('[NotificationService Error] Failed to create notification:', err.message);
      return null;
    }
  }

  /**
   * Fetches notifications relevant to a user and their role
   */
  async getUserNotifications(userId, role, limit = 40) {
    const query = {
      $or: [
        { recipient: userId },
        { targetRole: 'all' },
        { targetRole: role }
      ]
    };

    return Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Counts unread notifications for a user/role
   */
  async getUnreadCount(userId, role) {
    const query = {
      isRead: false,
      $or: [
        { recipient: userId },
        { targetRole: 'all' },
        { targetRole: role }
      ]
    };

    return Notification.countDocuments(query);
  }

  /**
   * Marks a single notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findById(notificationId);
    if (!notification) return null;

    notification.isRead = true;
    if (userId && !notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
    }
    await notification.save();
    return notification;
  }

  /**
   * Marks all notifications as read for a given user/role
   */
  async markAllAsRead(userId, role) {
    const query = {
      isRead: false,
      $or: [
        { recipient: userId },
        { targetRole: 'all' },
        { targetRole: role }
      ]
    };

    const result = await Notification.updateMany(query, {
      $set: { isRead: true },
      $addToSet: userId ? { readBy: userId } : {}
    });

    return result;
  }

  _getDefaultActionUrl(model) {
    switch (model) {
      case 'FoodListing': return 'food-listings.html';
      case 'DemandRequest': return 'demand.html';
      case 'Delivery': return 'deliveries.html';
      case 'Incident': return 'ai-coordinator.html';
      case 'Organisation': return 'organisations.html';
      default: return 'dashboard.html';
    }
  }
}

module.exports = new NotificationService();
