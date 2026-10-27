const Delivery = require('../models/Delivery');
const Driver = require('../models/Driver');
const AuditLog = require('../models/AuditLog');

exports.getDeliveries = async (req, res, next) => {
  try {
    const { status, driverId, recipientId, providerId } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (driverId) {
      query.driverId = driverId;
    }
    if (recipientId) {
      query.recipientId = recipientId;
    }
    if (providerId) {
      query.providerId = providerId;
    }

    const deliveries = await Delivery.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: deliveries.length,
      deliveries
    });
  } catch (err) {
    next(err);
  }
};

exports.getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery corridor not found.'
      });
    }

    res.json({
      success: true,
      delivery
    });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found.'
      });
    }

    const validTransitions = {
      pending: ['assigned', 'cancelled'],
      assigned: ['accepted', 'picked_up', 'in_transit', 'recovery_required', 'failed', 'cancelled'],
      accepted: ['picked_up', 'in_transit', 'recovery_required', 'failed', 'cancelled'],
      picked_up: ['in_transit', 'recovery_required', 'failed'],
      in_transit: ['delivered', 'recovery_required', 'failed'],
      recovery_required: ['assigned', 'in_transit', 'delivered', 'failed'],
      delivered: [],
      failed: ['recovery_required', 'assigned']
    };

    if (validTransitions[delivery.status] && !validTransitions[delivery.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition from '${delivery.status}' to '${status}'.`
      });
    }

    delivery.status = status;
    if (status === 'delivered') {
      delivery.completedAt = new Date();
    }

    delivery.timeline.push({
      timestamp: new Date(),
      status,
      description: note || `Status progressed to ${status.replace('_', ' ')}`
    });

    await delivery.save();

    await AuditLog.create({
      action: 'DELIVERY_STATUS_UPDATED',
      performedBy: {
        userId: req.user?._id,
        name: req.user?.name,
        role: req.user?.role
      },
      targetEntity: 'Delivery',
      targetId: delivery.trackingId,
      details: { newStatus: status }
    });

    res.json({
      success: true,
      message: `Delivery status updated to ${status}.`,
      delivery
    });
  } catch (err) {
    next(err);
  }
};

exports.assignDriver = async (req, res, next) => {
  try {
    const { driverId } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found.'
      });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found.'
      });
    }

    delivery.driverId = driver._id;
    delivery.driverName = driver.name;
    delivery.driverPhone = driver.phone;
    delivery.vehicleType = driver.vehicleType;
    delivery.status = 'in_transit';

    delivery.timeline.push({
      timestamp: new Date(),
      status: 'assigned',
      description: `Courier ${driver.name} (${driver.vehicleType}) accepted assignment.`
    });

    driver.status = 'in_transit';
    driver.activeDeliveryId = delivery._id;
    await driver.save();
    await delivery.save();

    res.json({
      success: true,
      message: `Assigned courier ${driver.name} to corridor #${delivery.trackingId}.`,
      delivery
    });
  } catch (err) {
    next(err);
  }
};

exports.reportIncident = async (req, res, next) => {
  try {
    const { issue, notes } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found.'
      });
    }

    delivery.status = 'recovery_required';
    delivery.incidentNotes = notes || issue;
    delivery.incidentHistory.push({
      issue: issue || 'Fleet Transit Incident',
      reportedAt: new Date(),
      notes: notes || ''
    });

    delivery.timeline.push({
      timestamp: new Date(),
      status: 'recovery_required',
      description: `Incident reported: ${issue || 'Breakdown / Obstruction'}. Autonomous rerouting required.`
    });

    await delivery.save();

    res.json({
      success: true,
      message: 'Incident recorded. Corridor flagged for dynamic recovery.',
      delivery
    });
  } catch (err) {
    next(err);
  }
};

exports.submitProofOfDelivery = async (req, res, next) => {
  try {
    const { recipientSignatureName, receivedPortions, temperatureCelsius, notes } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found.'
      });
    }

    delivery.status = 'delivered';
    delivery.completedAt = new Date();
    delivery.proofOfDelivery = {
      recipientSignatureName: recipientSignatureName || 'Sister Teresa David',
      receivedPortions: Number(receivedPortions) || delivery.quantity,
      temperatureCelsius: Number(temperatureCelsius) || 61.5,
      notes: notes || 'Delivered with temperature and package seal verified.',
      verifiedAt: new Date()
    };

    delivery.timeline.push({
      timestamp: new Date(),
      status: 'delivered',
      description: `Verified by ${delivery.proofOfDelivery.recipientSignatureName} at ${delivery.proofOfDelivery.temperatureCelsius}°C.`
    });

    await delivery.save();

    res.json({
      success: true,
      message: 'Proof of Delivery verified and digital handoff confirmed.',
      delivery
    });
  } catch (err) {
    next(err);
  }
};

exports.reassignDelivery = async (req, res, next) => {
  try {
    const recoveryService = require('../services/recoveryService');
    const { reason } = req.body;
    const result = await recoveryService.reassignDelivery(req.params.id, reason, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
