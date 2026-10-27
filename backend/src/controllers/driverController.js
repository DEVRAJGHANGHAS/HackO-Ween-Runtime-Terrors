const Driver = require('../models/Driver');

exports.getDrivers = async (req, res, next) => {
  try {
    const { status, vehicleType } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (vehicleType) query.vehicleType = vehicleType;

    const drivers = await Driver.find(query).sort({ rating: -1 });

    res.json({
      success: true,
      count: drivers.length,
      drivers
    });
  } catch (err) {
    next(err);
  }
};

exports.getDriverById = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found.' });
    }
    res.json({ success: true, driver });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, coordinates, batteryLevel } = req.body;
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found.' });
    }

    if (status) driver.status = status;
    if (coordinates) driver.currentCoordinates = coordinates;
    if (batteryLevel !== undefined) driver.batteryLevel = batteryLevel;

    await driver.save();
    res.json({ success: true, driver });
  } catch (err) {
    next(err);
  }
};
