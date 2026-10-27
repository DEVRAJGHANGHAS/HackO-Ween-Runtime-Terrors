const Forecast = require('../models/Forecast');

const DEFAULT_FORECASTS = [
  {
    facilityName: 'Aryabhatta University Hostel — Mess 2',
    category: 'College Hostel',
    dailyAverage: 110,
    projected7DayVolume: 770,
    peakWindow: 'Friday Dinner (20:30 - 22:00)',
    perishabilityRisk: 'Medium',
    recommendedMitigation: 'Auto-dispatch EV-409 with insulated hot boxes',
    historicalActuals: [240, 290, 210, 280],
    projectedSeries: [280, 420, 580, 310, 260, 290, 310, 280],
    confidenceUpper: [280, 460, 640, 350, 295, 330, 350, 320],
    confidenceLower: [280, 380, 520, 270, 225, 250, 270, 240]
  },
  {
    facilityName: 'Grand Imperial Banquet Hall',
    category: 'Event Venue',
    dailyAverage: 260,
    projected7DayVolume: 1200,
    peakWindow: 'Saturday Night (22:30 - 01:00)',
    perishabilityRisk: 'High',
    recommendedMitigation: 'Pre-assign refrigerated van to Sanjivani Food Bank',
    historicalActuals: [180, 220, 310, 450],
    projectedSeries: [450, 600, 850, 420, 310, 400, 490, 380],
    confidenceUpper: [450, 660, 920, 480, 370, 460, 560, 440],
    confidenceLower: [450, 540, 780, 360, 250, 340, 420, 320]
  },
  {
    facilityName: 'CyberHub Corporate Cafeteria',
    category: 'Corporate Food Court',
    dailyAverage: 65,
    projected7DayVolume: 320,
    peakWindow: 'Thursday Lunch (13:30 - 15:00)',
    perishabilityRisk: 'Low',
    recommendedMitigation: 'Direct batch transfer to Navjyoti Child Care',
    historicalActuals: [60, 70, 55, 68],
    projectedSeries: [68, 75, 80, 95, 50, 45, 65, 70],
    confidenceUpper: [68, 85, 90, 110, 60, 55, 75, 80],
    confidenceLower: [68, 65, 70, 80, 40, 35, 55, 60]
  },
  {
    facilityName: 'The Artisan Crust & Oven',
    category: 'Bakery & Confectionery',
    dailyAverage: 35,
    projected7DayVolume: 160,
    peakWindow: 'Sunday Evening (20:00 - 21:30)',
    perishabilityRisk: 'Low',
    recommendedMitigation: 'Scheduled ambient courier pickup for Asha Shelter',
    historicalActuals: [30, 35, 40, 38],
    projectedSeries: [38, 42, 45, 50, 35, 30, 40, 45],
    confidenceUpper: [38, 48, 52, 58, 40, 36, 46, 52],
    confidenceLower: [38, 36, 38, 42, 30, 24, 34, 38]
  }
];

exports.getForecasts = async (req, res, next) => {
  try {
    let forecasts = await Forecast.find();
    if (forecasts.length === 0) {
      forecasts = await Forecast.insertMany(DEFAULT_FORECASTS);
    }

    const { horizon = 7 } = req.query;

    res.json({
      success: true,
      horizon: Number(horizon),
      modelConfidenceScore: '92.4%',
      forecasts
    });
  } catch (err) {
    next(err);
  }
};
