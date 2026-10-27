const recoveryService = require('../services/recoveryService');
const expiryService = require('../services/expiryService');
const Incident = require('../models/Incident');
const FoodListing = require('../models/FoodListing');
const DemandRequest = require('../models/DemandRequest');
const Delivery = require('../models/Delivery');
const Driver = require('../models/Driver');
const { calculateDistanceKm } = require('../utils/distance');

exports.getStatus = (req, res) => {
  res.json({
    success: true,
    agent: 'FoodResQ Autonomous Dispatch Coordinator v2.4',
    mode: 'Closed-Loop Autonomous Routing',
    status: 'Optimal',
    modelConfidence: '99.4%',
    pipelineStages: [
      { step: 1, name: 'Observe', status: 'active', desc: 'Ingests surplus & demand registrations' },
      { step: 2, name: 'Analyse', status: 'active', desc: 'Perishability decay & compliance check' },
      { step: 3, name: 'Plan', status: 'active', desc: 'Multi-objective linear matching' },
      { step: 4, name: 'Validate', status: 'active', desc: 'Cold-chain & temperature verification' },
      { step: 5, name: 'Execute', status: 'active', desc: 'Waypoints & driver dispatch' },
      { step: 6, name: 'Monitor', status: 'active', desc: 'Live GPS & temperature telemetry' },
      { step: 7, name: 'Replan', status: 'active', desc: 'Failover recovery upon disruption' }
    ]
  });
};

exports.getSummaryAnalysis = async (req, res, next) => {
  try {
    const [listings, demands, deliveries, drivers] = await Promise.all([
      FoodListing.find({ status: { $in: ['available', 'partially_matched'] } }),
      DemandRequest.find({ status: { $in: ['pending', 'partially_matched'] } }),
      Delivery.find({ status: { $in: ['assigned', 'picked_up', 'in_transit', 'recovery_required'] } }),
      Driver.find({ status: { $in: ['available', 'assigned'] } })
    ]);

    const totalAvailable = listings.reduce((sum, l) => sum + (l.availableQuantity || l.quantity || 0), 0);
    const totalNeeded = demands.reduce((sum, d) => sum + Math.max(0, (d.quantityRequested || 0) - (d.fulfilledQuantity || 0)), 0);

    const now = Date.now();
    const urgentListings = listings.filter(l => {
      const hoursLeft = (new Date(l.safeUseDeadline).getTime() - now) / 3600000;
      return hoursLeft > 0 && hoursLeft <= 3.5;
    });

    const atRiskDeliveries = deliveries.filter(d => {
      const hoursLeft = (new Date(d.safeUseDeadline).getTime() - now) / 3600000;
      return d.status === 'recovery_required' || (hoursLeft > 0 && hoursLeft <= 0.75);
    });

    const availableCouriers = drivers.filter(drv => drv.status === 'available');

    // Build operational recommendations
    const recommendations = [];

    if (urgentListings.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        type: 'perishability_alert',
        title: `${urgentListings.length} Surplus Batches Approaching Expiry Window`,
        details: `Batches totaling ${urgentListings.reduce((s, l) => s + l.availableQuantity, 0)} portions require dispatch within <3.5 hours. Recommended auto-match trigger.`
      });
    }

    if (totalNeeded > totalAvailable) {
      recommendations.push({
        priority: 'HIGH',
        type: 'supply_deficit',
        title: `Net Demand Deficit of ${totalNeeded - totalAvailable} Portions`,
        details: `Shelters in Gurugram NCR require ${totalNeeded} portions; current active surplus is ${totalAvailable}. Alert donor hotels in DLF CyberCity.`
      });
    } else {
      recommendations.push({
        priority: 'OPTIMAL',
        type: 'surplus_equilibrium',
        title: `Sufficient Surplus: ${totalAvailable} Available vs ${totalNeeded} Needed`,
        details: `100% of pending shelter requests can be satisfied using current active donation batches.`
      });
    }

    if (availableCouriers.length === 0 && deliveries.length > 0) {
      recommendations.push({
        priority: 'WARNING',
        type: 'fleet_capacity',
        title: 'Zero Standby EV Couriers in Active Pool',
        details: 'All couriers currently deployed. Activate Tier-2 backup logistics partner.'
      });
    } else {
      recommendations.push({
        priority: 'NORMAL',
        type: 'fleet_ready',
        title: `${availableCouriers.length} Standby EV Couriers Ready`,
        details: `Fleet buffer capacity: ${availableCouriers.reduce((s, d) => s + (d.capacityUnits || 100), 0)} units available for immediate cross-dock dispatch.`
      });
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        totalAvailablePortions: totalAvailable,
        totalNeededPortions: totalNeeded,
        activeListingCount: listings.length,
        urgentListingCount: urgentListings.length,
        activeDeliveryCount: deliveries.length,
        atRiskDeliveryCount: atRiskDeliveries.length,
        standbyCourierCount: availableCouriers.length
      },
      recommendations,
      bottlenecks: atRiskDeliveries.map(d => ({
        trackingId: d.trackingId,
        foodTitle: d.foodTitle,
        recipient: d.recipientName,
        status: d.status,
        incidentNotes: d.incidentNotes
      }))
    });
  } catch (err) {
    next(err);
  }
};

exports.explainMatch = async (req, res, next) => {
  try {
    const { listingId, demandId } = req.body;

    let listing = null;
    let demand = null;

    if (listingId) listing = await FoodListing.findById(listingId);
    else listing = (await FoodListing.findOne({ status: 'available' })) || (await FoodListing.findOne());

    if (demandId) demand = await DemandRequest.findById(demandId);
    else demand = (await DemandRequest.findOne({ status: 'pending' })) || (await DemandRequest.findOne());

    if (!listing || !demand) {
      return res.status(404).json({
        success: false,
        error: 'Eligible listing and demand records required to compute match explanation.'
      });
    }

    const pickupCoords = listing.pickupLocation?.coordinates || [28.4595, 77.0266];
    const dropoffCoords = demand.location?.coordinates || [28.4595, 77.0266];
    const distanceKm = calculateDistanceKm(pickupCoords, dropoffCoords);
    const distanceScore = Math.max(20, Math.round(100 - (distanceKm * 4.5)));

    const isExactCategory = listing.category === demand.category;
    const categoryScore = isExactCategory ? 100 : (listing.category === 'prepared_meals' ? 70 : 50);

    let urgencyScore = 70;
    if (demand.urgency === 'critical') urgencyScore = 100;
    else if (demand.urgency === 'high') urgencyScore = 85;
    else if (demand.urgency === 'medium') urgencyScore = 70;
    else urgencyScore = 55;

    const compositeScore = Math.round((distanceScore * 0.40) + (urgencyScore * 0.35) + (categoryScore * 0.25));
    const now = Date.now();
    const deadlineHours = Math.max(0, (new Date(listing.safeUseDeadline).getTime() - now) / 3600000);
    const estimatedTransitMins = Math.round(distanceKm * 3.5 + 8);

    const safeMarginMins = Math.round(deadlineHours * 60 - estimatedTransitMins);
    const isSafe = safeMarginMins > 30;

    res.json({
      success: true,
      pairing: {
        listingTitle: listing.title,
        provider: listing.providerName,
        recipient: demand.recipientName,
        quantity: Math.min(listing.availableQuantity, demand.quantityRequested - demand.fulfilledQuantity),
        distanceKm,
        estimatedTransitMins
      },
      scoring: {
        compositeScore,
        proximityWeight: '40%',
        proximityScore: distanceScore,
        urgencyWeight: '35%',
        urgencyScore,
        categoryWeight: '25%',
        categoryScore
      },
      foodSafety: {
        isSafeFeasible: isSafe,
        safeMarginMinutes: safeMarginMins,
        safeUseDeadline: listing.safeUseDeadline
      },
      explanation: `Deterministic Pair Score: ${compositeScore}/100. Pairs ${listing.providerName} with ${demand.recipientName} situated ${distanceKm}km away. ETA is ${estimatedTransitMins} mins, leaving a safety buffer of ${safeMarginMins} mins before expiry.`
    });
  } catch (err) {
    next(err);
  }
};

exports.runExpiryCheck = async (req, res, next) => {
  try {
    const summary = await expiryService.runExpiryCheck();
    res.json({
      success: true,
      message: 'Automated expiry and food safety scan completed.',
      summary
    });
  } catch (err) {
    next(err);
  }
};

exports.simulateRecovery = async (req, res, next) => {
  try {
    const result = await recoveryService.simulateBreakdown(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.resetSimulation = async (req, res, next) => {
  try {
    const result = await recoveryService.resetSimulation();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getIncidents = async (req, res, next) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: incidents.length,
      incidents
    });
  } catch (err) {
    next(err);
  }
};

exports.getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found.' });
    }
    res.json({ success: true, incident });
  } catch (err) {
    next(err);
  }
};
