const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema({
  facilityName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['College Hostel', 'Event Venue', 'Corporate Food Court', 'Bakery & Confectionery', 'Other'],
    default: 'College Hostel'
  },
  dailyAverage: {
    type: Number,
    required: true
  },
  projected7DayVolume: {
    type: Number,
    required: true
  },
  peakWindow: {
    type: String,
    default: 'Evening Dinner'
  },
  perishabilityRisk: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  recommendedMitigation: {
    type: String,
    default: 'Pre-schedule pickup'
  },
  historicalActuals: {
    type: [Number],
    default: [240, 290, 210, 280]
  },
  projectedSeries: {
    type: [Number],
    default: [280, 420, 580, 310, 260, 290, 310, 280]
  },
  confidenceUpper: {
    type: [Number],
    default: [280, 460, 640, 350, 295, 330, 350, 320]
  },
  confidenceLower: {
    type: [Number],
    default: [280, 380, 520, 270, 225, 250, 270, 240]
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

module.exports = mongoose.model('Forecast', forecastSchema);
