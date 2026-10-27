const mongoose = require('mongoose');

const organisationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organisation name is required'],
    trim: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['hostel', 'restaurant', 'hotel', 'shelter', 'ngo', 'community_kitchen', 'food_bank', 'logistics', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['provider', 'recipient', 'logistics'],
    required: true
  },
  contactPerson: {
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
    required: true,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    default: 'Gurugram'
  },
  coordinates: {
    type: [Number], // [latitude, longitude]
    default: [28.4595, 77.0266]
  },
  verificationStatus: {
    type: String,
    enum: ['verified', 'pending', 'suspended'],
    default: 'verified'
  },
  description: {
    type: String,
    default: ''
  },
  capacityNotes: {
    type: String,
    default: ''
  },
  licenseId: {
    type: String,
    default: 'FSSAI-PENDING'
  },
  joinedDate: {
    type: Date,
    default: Date.now
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

organisationSchema.index({ name: 'text', address: 'text', contactPerson: 'text' });

module.exports = mongoose.model('Organisation', organisationSchema);
