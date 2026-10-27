const FoodListing = require('../models/FoodListing');
const Organisation = require('../models/Organisation');
const AuditLog = require('../models/AuditLog');

exports.getListings = async (req, res, next) => {
  try {
    const { status, category, urgency, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (urgency && urgency !== 'all') {
      query.urgency = urgency;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { providerName: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const listings = await FoodListing.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (err) {
    next(err);
  }
};

exports.getListingById = async (req, res, next) => {
  try {
    const listing = await FoodListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Food surplus listing not found.'
      });
    }

    res.json({
      success: true,
      listing
    });
  } catch (err) {
    next(err);
  }
};

exports.createListing = async (req, res, next) => {
  try {
    const {
      title,
      category = 'prepared_meals',
      quantity,
      unit = 'portions',
      safeUseDeadline,
      pickupLocation,
      storageRequirements,
      allergenInfo,
      dietaryType = 'vegetarian',
      notes
    } = req.body;

    // Determine provider organisation
    let providerOrg = null;
    if (req.user && req.user.organisationId) {
      providerOrg = await Organisation.findById(req.user.organisationId);
    }
    if (!providerOrg) {
      providerOrg = await Organisation.findOne({ category: 'provider' });
    }

    const providerName = providerOrg ? providerOrg.name : (req.user?.organisationName || 'Partner Kitchen');
    const providerId = providerOrg ? providerOrg._id : req.user?._id;

    // Calculate urgency
    const now = Date.now();
    const deadlineMs = new Date(safeUseDeadline).getTime() - now;
    const hoursLeft = deadlineMs / (1000 * 60 * 60);
    let calculatedUrgency = 'Available';
    if (hoursLeft <= 3.5) calculatedUrgency = 'Urgent';
    else if (hoursLeft <= 6) calculatedUrgency = 'Expiring Soon';

    const newListing = new FoodListing({
      title,
      category,
      providerId,
      providerName,
      quantity: Number(quantity),
      availableQuantity: Number(quantity),
      unit,
      safeUseDeadline: new Date(safeUseDeadline),
      pickupLocation: pickupLocation || {
        address: providerOrg?.address || 'Gurugram Facility Hub',
        coordinates: providerOrg?.coordinates || [28.4595, 77.0266]
      },
      storageRequirements: storageRequirements || 'Room Temperature / Sanitary Container',
      allergenInfo: Array.isArray(allergenInfo) ? allergenInfo : (allergenInfo ? [allergenInfo] : []),
      dietaryType,
      urgency: calculatedUrgency,
      status: 'available',
      notes: notes || '',
      createdBy: req.user?._id
    });

    await newListing.save();

    await AuditLog.create({
      action: 'FOOD_LISTING_CREATED',
      performedBy: {
        userId: req.user?._id,
        name: req.user?.name,
        role: req.user?.role
      },
      targetEntity: 'FoodListing',
      targetId: newListing._id.toString(),
      details: { title, quantity: newListing.quantity }
    });

    try {
      const notificationService = require('../services/notificationService');
      await notificationService.notify({
        targetRole: 'recipient',
        type: 'new_listing',
        title: `New Food Surplus: ${title}`,
        message: `${providerName} posted ${quantity} ${unit} (${category.replace('_', ' ')}). Available for redistribution.`,
        referenceId: newListing._id.toString(),
        referenceModel: 'FoodListing'
      });
    } catch (notifErr) {
      console.warn('[Notification Error]', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Surplus food batch listed successfully.',
      listing: newListing
    });
  } catch (err) {
    next(err);
  }
};

exports.updateListing = async (req, res, next) => {
  try {
    const listing = await FoodListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Food listing not found.'
      });
    }

    // Role or ownership check
    if (req.user.role !== 'admin' && listing.createdBy && listing.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to modify this listing.'
      });
    }

    const updatableFields = ['title', 'category', 'quantity', 'availableQuantity', 'safeUseDeadline', 'storageRequirements', 'notes', 'status'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    });

    await listing.save();

    res.json({
      success: true,
      message: 'Food listing updated successfully.',
      listing
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteListing = async (req, res, next) => {
  try {
    const listing = await FoodListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Food listing not found.'
      });
    }

    if (req.user.role !== 'admin' && listing.createdBy && listing.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to delete this listing.'
      });
    }

    listing.status = 'cancelled';
    listing.availableQuantity = 0;
    await listing.save();

    res.json({
      success: true,
      message: 'Food listing cancelled.'
    });
  } catch (err) {
    next(err);
  }
};
