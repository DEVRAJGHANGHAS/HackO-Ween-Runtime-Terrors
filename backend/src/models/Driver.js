const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  vehicleType: {
    type: String,
    enum: ['Electric Van', 'Refrigerated Van', 'Cargo Auto'],
    default: 'Electric Van'
  },
  registrationNumber: {
    type: String,
    default: 'HR-26-EV-0000'
  },
  capacityUnits: {
    type: Number,
    required: true,
    default: 80
  },
  currentCoordinates: {
    type: [Number], // [latitude, longitude]
    default: [28.4621, 77.0851]
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 85
  },
  status: {
    type: String,
    enum: ['available', 'assigned', 'in_transit', 'off_duty', 'unavailable'],
    default: 'available'
  },
  rating: {
    type: Number,
    default: 4.9
  },
  activeDeliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
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

module.exports = mongoose.model('Driver', driverSchema);
