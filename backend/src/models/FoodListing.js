const mongoose = require('mongoose');

const foodListingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Food title is required'],
    trim: true,
    maxlength: 150
  },
  category: {
    type: String,
    enum: ['prepared_meals', 'raw_produce', 'bakery', 'dairy', 'packaged'],
    default: 'prepared_meals'
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organisation',
    required: true
  },
  providerName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: [0, 'Available quantity cannot be negative']
  },
  unit: {
    type: String,
    default: 'portions'
  },
  preparationTime: {
    type: Date,
    default: Date.now
  },
  safeUseDeadline: {
    type: Date,
    required: [true, 'Safe-use deadline is required']
  },
  pickupLocation: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number], // [latitude, longitude]
      default: [28.4595, 77.0266]
    }
  },
  storageRequirements: {
    type: String,
    default: 'Room Temperature / Sanitary Container'
  },
  allergenInfo: {
    type: [String],
    default: []
  },
  dietaryType: {
    type: String,
    enum: ['vegetarian', 'non_vegetarian', 'vegan'],
    default: 'vegetarian'
  },
  urgency: {
    type: String,
    enum: ['Urgent', 'Expiring Soon', 'Available'],
    default: 'Available'
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'assigned', 'matched', 'partially_matched', 'picked_up', 'delivered', 'expired', 'cancelled'],
    default: 'available'
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

foodListingSchema.index({ status: 1, safeUseDeadline: 1, category: 1 });
foodListingSchema.index({ title: 'text', providerName: 'text', notes: 'text' });

module.exports = mongoose.model('FoodListing', foodListingSchema);
