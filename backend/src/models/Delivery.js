const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodListing',
    required: true
  },
  demandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DemandRequest',
    required: true
  },
  foodTitle: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'prepared_meals'
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organisation',
    required: true
  },
  providerName: {
    type: String,
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organisation',
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  driverName: {
    type: String,
    default: 'Pending Assignment'
  },
  driverPhone: {
    type: String,
    default: ''
  },
  vehicleType: {
    type: String,
    default: 'Electric Van'
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Delivery quantity must be at least 1']
  },
  unit: {
    type: String,
    default: 'portions'
  },
  pickupLocation: {
    address: String,
    coordinates: [Number]
  },
  destinationLocation: {
    address: String,
    coordinates: [Number]
  },
  safeUseDeadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled', 'recovery_required'],
    default: 'assigned'
  },
  distanceKm: {
    type: Number,
    default: 5.0
  },
  etaMinutes: {
    type: Number,
    default: 25
  },
  completedAt: {
    type: Date,
    default: null
  },
  proofOfDelivery: {
    recipientSignatureName: { type: String, default: '' },
    receivedPortions: { type: Number, default: 0 },
    temperatureCelsius: { type: Number, default: null },
    notes: { type: String, default: '' },
    verifiedAt: { type: Date, default: null }
  },
  incidentNotes: {
    type: String,
    default: ''
  },
  incidentHistory: [{
    issue: String,
    reportedAt: { type: Date, default: Date.now },
    resolvedAt: Date,
    notes: String
  }],
  timeline: [{
    timestamp: { type: Date, default: Date.now },
    status: String,
    description: String
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

deliverySchema.index({ status: 1, providerId: 1, recipientId: 1, driverId: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);
