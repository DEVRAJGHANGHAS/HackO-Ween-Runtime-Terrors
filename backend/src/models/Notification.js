const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  targetRole: {
    type: String,
    enum: ['all', 'admin', 'provider', 'recipient', 'driver'],
    default: 'all'
  },
  type: {
    type: String,
    enum: [
      'donation_match',
      'new_demand',
      'new_listing',
      'allocation_confirmed',
      'delivery_assigned',
      'status_change',
      'imminent_expiry',
      'donation_expired',
      'delivery_failure',
      'delivery_reassigned',
      'admin_alert',
      'system_info'
    ],
    default: 'system_info'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  referenceId: {
    type: String,
    default: null
  },
  referenceModel: {
    type: String,
    enum: ['FoodListing', 'DemandRequest', 'Delivery', 'Incident', 'Organisation', null],
    default: null
  },
  actionUrl: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

notificationSchema.index({ targetRole: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
