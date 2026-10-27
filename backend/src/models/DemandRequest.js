const mongoose = require('mongoose');

const demandRequestSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organisation',
    required: true
  },
  recipientName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['prepared_meals', 'raw_produce', 'bakery', 'dairy', 'packaged'],
    default: 'prepared_meals'
  },
  quantityRequested: {
    type: Number,
    required: [true, 'Requested quantity is required'],
    min: [1, 'Requested quantity must be at least 1']
  },
  fulfilledQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    default: 'portions'
  },
  urgency: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'high'
  },
  preferredDeliveryWindow: {
    start: {
      type: Date,
      default: Date.now
    },
    end: {
      type: Date,
      required: true
    }
  },
  receivingCapacity: {
    type: Number,
    default: 100
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number], // [latitude, longitude]
      default: [28.4595, 77.0266]
    }
  },
  specialRequirements: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'partially_matched', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

demandRequestSchema.index({ status: 1, urgency: 1, 'preferredDeliveryWindow.end': 1 });

module.exports = mongoose.model('DemandRequest', demandRequestSchema);
