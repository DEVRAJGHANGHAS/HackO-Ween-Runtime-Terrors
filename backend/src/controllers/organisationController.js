const Organisation = require('../models/Organisation');
const AuditLog = require('../models/AuditLog');

exports.getOrganisations = async (req, res, next) => {
  try {
    const { category, type, status, search } = req.query;
    const query = {};

    if (category && category !== 'all') query.category = category;
    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.verificationStatus = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { licenseId: { $regex: search, $options: 'i' } }
      ];
    }

    const organisations = await Organisation.find(query).sort({ verificationStatus: 1, name: 1 });

    res.json({
      success: true,
      count: organisations.length,
      organisations
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrganisationById = async (req, res, next) => {
  try {
    const organisation = await Organisation.findById(req.params.id);
    if (!organisation) {
      return res.status(404).json({ success: false, error: 'Organisation not found.' });
    }
    res.json({ success: true, organisation });
  } catch (err) {
    next(err);
  }
};

exports.createOrganisation = async (req, res, next) => {
  try {
    const {
      name,
      type = 'hostel',
      category = 'provider',
      contactPerson,
      phone,
      email,
      address,
      city = 'Gurugram',
      coordinates = [28.4595, 77.0266],
      licenseId = 'FSSAI-1002106400',
      description,
      capacityNotes
    } = req.body;

    const existing = await Organisation.findOne({ name });
    if (existing) {
      return res.status(409).json({ success: false, error: 'An organisation with this name is already registered.' });
    }

    const org = new Organisation({
      name,
      type,
      category,
      contactPerson,
      phone,
      email,
      address,
      city,
      coordinates,
      licenseId,
      verificationStatus: req.user?.role === 'admin' ? 'verified' : 'pending',
      description: description || '',
      capacityNotes: capacityNotes || ''
    });

    await org.save();

    await AuditLog.create({
      action: 'ORGANISATION_ONBOARDED',
      performedBy: {
        userId: req.user?._id,
        name: req.user?.name,
        role: req.user?.role
      },
      targetEntity: 'Organisation',
      targetId: org._id.toString(),
      details: { name, type, category }
    });

    res.status(201).json({
      success: true,
      message: 'Organisation node registered successfully.',
      organisation: org
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyOrganisation = async (req, res, next) => {
  try {
    const org = await Organisation.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, error: 'Organisation not found.' });
    }

    org.verificationStatus = 'verified';
    await org.save();

    res.json({
      success: true,
      message: `Organisation '${org.name}' verified and active.`,
      organisation: org
    });
  } catch (err) {
    next(err);
  }
};

exports.suspendOrganisation = async (req, res, next) => {
  try {
    const org = await Organisation.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, error: 'Organisation not found.' });
    }

    org.verificationStatus = 'suspended';
    await org.save();

    res.json({
      success: true,
      message: `Organisation '${org.name}' suspended.`,
      organisation: org
    });
  } catch (err) {
    next(err);
  }
};
