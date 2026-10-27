const DemandRequest = require('../models/DemandRequest');
const Organisation = require('../models/Organisation');
const AuditLog = require('../models/AuditLog');

exports.getDemands = async (req, res, next) => {
  try {
    const { status, urgency, category, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (urgency && urgency !== 'all') {
      query.urgency = urgency;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { recipientName: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const demands = await DemandRequest.find(query).sort({ urgency: -1, createdAt: -1 });

    res.json({
      success: true,
      count: demands.length,
      demands
    });
  } catch (err) {
    next(err);
  }
};

exports.getDemandById = async (req, res, next) => {
  try {
    const demand = await DemandRequest.findById(req.params.id);
    if (!demand) {
      return res.status(404).json({
        success: false,
        error: 'Recipient demand request not found.'
      });
    }

    res.json({
      success: true,
      demand
    });
  } catch (err) {
    next(err);
  }
};

exports.createDemand = async (req, res, next) => {
  try {
    const {
      quantityRequested,
      category = 'prepared_meals',
      urgency = 'high',
      preferredDeliveryWindow,
      receivingCapacity,
      location,
      specialRequirements,
      notes
    } = req.body;

    let recipientOrg = null;
    if (req.user && req.user.organisationId) {
      recipientOrg = await Organisation.findById(req.user.organisationId);
    }
    if (!recipientOrg) {
      recipientOrg = await Organisation.findOne({ category: 'recipient' });
    }

    const recipientName = recipientOrg ? recipientOrg.name : (req.user?.organisationName || 'Community Shelter');
    const recipientId = recipientOrg ? recipientOrg._id : req.user?._id;

    const newDemand = new DemandRequest({
      recipientId,
      recipientName,
      category,
      quantityRequested: Number(quantityRequested),
      fulfilledQuantity: 0,
      urgency,
      preferredDeliveryWindow: preferredDeliveryWindow || {
        start: new Date(),
        end: new Date(Date.now() + 3 * 60 * 60 * 1000)
      },
      receivingCapacity: Number(receivingCapacity) || Number(quantityRequested),
      location: location || {
        address: recipientOrg?.address || 'Community Shelter Sector 14, Gurugram',
        coordinates: recipientOrg?.coordinates || [28.4721, 77.0428]
      },
      specialRequirements: Array.isArray(specialRequirements) ? specialRequirements : [],
      status: 'pending',
      notes: notes || '',
      createdBy: req.user?._id
    });

    await newDemand.save();

    await AuditLog.create({
      action: 'DEMAND_REQUEST_CREATED',
      performedBy: {
        userId: req.user?._id,
        name: req.user?.name,
        role: req.user?.role
      },
      targetEntity: 'DemandRequest',
      targetId: newDemand._id.toString(),
      details: { recipientName, quantityRequested: newDemand.quantityRequested }
    });

    try {
      const notificationService = require('../services/notificationService');
      await notificationService.notify({
        targetRole: 'provider',
        type: 'new_demand',
        title: `New Meal Demand: ${quantityRequested} portions`,
        message: `${recipientName} requested ${quantityRequested} portions (${category.replace('_', ' ')}). Urgency: ${urgency.toUpperCase()}.`,
        referenceId: newDemand._id.toString(),
        referenceModel: 'DemandRequest'
      });
    } catch (notifErr) {
      console.warn('[Notification Error]', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Recipient demand request registered successfully.',
      demand: newDemand
    });
  } catch (err) {
    next(err);
  }
};

exports.updateDemand = async (req, res, next) => {
  try {
    const demand = await DemandRequest.findById(req.params.id);
    if (!demand) {
      return res.status(404).json({
        success: false,
        error: 'Demand request not found.'
      });
    }

    const updatableFields = ['quantityRequested', 'category', 'urgency', 'receivingCapacity', 'notes', 'status'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        demand[field] = req.body[field];
      }
    });

    await demand.save();

    res.json({
      success: true,
      message: 'Demand request updated.',
      demand
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteDemand = async (req, res, next) => {
  try {
    const demand = await DemandRequest.findById(req.params.id);
    if (!demand) {
      return res.status(404).json({
        success: false,
        error: 'Demand request not found.'
      });
    }

    demand.status = 'cancelled';
    await demand.save();

    res.json({
      success: true,
      message: 'Demand request cancelled.'
    });
  } catch (err) {
    next(err);
  }
};
