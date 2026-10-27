const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organisation = require('../models/Organisation');

const JWT_SECRET = process.env.JWT_SECRET || 'foodresq_jwt_super_secure_development_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'provider', organisationName, phone, city } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    // Try linking or finding organization
    let organisation = null;
    if (organisationName) {
      organisation = await Organisation.findOne({ name: new RegExp(`^${organisationName}$`, 'i') });
    }

    const user = new User({
      name,
      email,
      passwordHash: password, // Pre-save hook will hash this with bcrypt
      role,
      organisationId: organisation ? organisation._id : null,
      organisationName: organisation ? organisation.name : (organisationName || 'Registered Partner Organisation'),
      phone: phone || '',
      city: city || 'Gurugram'
    });

    await user.save();
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email address or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email address or password.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended by administration. Please contact support.'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('organisationId');
    res.json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'Signed out successfully.'
  });
};

/**
 * 1-Click Persona Simulator Endpoint
 * Generates an instant authenticated session for demo evaluation
 */
exports.simulatePersona = async (req, res, next) => {
  try {
    const { role = 'admin' } = req.params;

    const personaEmails = {
      admin: 'ananya@foodresq.ai',
      provider: 'mess2@aryabhatta.edu.in',
      recipient: 'shelter@ashacommunity.org',
      driver: 'rajesh.kumar@greenev.in'
    };

    const targetEmail = personaEmails[role] || 'ananya@foodresq.ai';
    let user = await User.findOne({ email: targetEmail });

    if (!user) {
      // Find matching organisation or create
      const orgNames = {
        admin: 'FoodResQ AI Central Operations',
        provider: 'Aryabhatta University Hostel — Mess 2',
        recipient: 'Asha Community Shelter & Night Haven',
        driver: 'Gurugram Green EV Logistics'
      };

      const names = {
        admin: 'Ananya Deshmukh',
        provider: 'Dr. Rameshwar Meena',
        recipient: 'Sister Teresa David',
        driver: 'Rajesh Kumar'
      };

      let org = await Organisation.findOne({ name: orgNames[role] });

      user = await User.create({
        name: names[role],
        email: targetEmail,
        passwordHash: 'DemoPassword123!',
        role: role === 'driver' ? 'driver' : role,
        organisationId: org ? org._id : null,
        organisationName: orgNames[role],
        phone: '+91 98765 43210',
        city: 'Gurugram',
        status: 'active'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: `Simulated role authenticated as ${user.name} (${user.role}).`,
      token,
      user
    });
  } catch (err) {
    next(err);
  }
};
