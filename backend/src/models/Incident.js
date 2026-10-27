const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  incidentId: {
    type: String,
    required: true,
    unique: true
  },
  deliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    required: true
  },
  trackingId: {
    type: String,
    required: true
  },
  issueType: {
    type: String,
    enum: ['breakdown', 'accident', 'delay', 'temperature_alert', 'recipient_unavailable', 'other'],
    default: 'breakdown'
  },
  description: {
    type: String,
    required: true
  },
  originalPlan: {
    driverName: String,
    vehicleType: String,
    assignedPortions: Number,
    pickupLocation: String,
    dropoffLocation: String,
    originalEta: String
  },
  revisedPlan: {
    reassignedDriverName: String,
    reassignedVehicle: String,
    interceptLocation: String,
    revisedEta: String,
    salvagedPortions: Number,
    lostPortions: Number
  },
  salvageRatePercent: {
    type: Number,
    default: 100
  },
  replanLatencyMs: {
    type: Number,
    default: 780
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'investigating'],
    default: 'resolved'
  },
  reportedBy: {
    type: String,
    default: 'Autonomous Fleet IoT Telemetry'
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

module.exports = mongoose.model('Incident', incidentSchema);
