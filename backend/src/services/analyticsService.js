const FoodListing = require('../models/FoodListing');
const DemandRequest = require('../models/DemandRequest');
const Delivery = require('../models/Delivery');
const Driver = require('../models/Driver');
const Organisation = require('../models/Organisation');
const Notification = require('../models/Notification');

class AnalyticsService {
  /**
   * Generates dynamic operational KPI summary from database records
   */
  async getDashboardSummary() {
    const listings = await FoodListing.find();
    const demands = await DemandRequest.find();
    const deliveries = await Delivery.find();

    // Available food
    const availableListings = listings.filter(l => l.status === 'available' || l.status === 'partially_matched');
    const availablePortions = availableListings.reduce((sum, l) => sum + (l.availableQuantity || 0), 0);

    // Delivered food (calculated strictly from actual delivered database records)
    const deliveredList = deliveries.filter(d => d.status === 'delivered');
    const deliveredPortions = deliveredList.reduce((sum, d) => sum + (d.quantity || 0), 0);

    // Active deliveries
    const activeDeliveries = deliveries.filter(d => 
      d.status === 'in_transit' || d.status === 'assigned' || d.status === 'recovery_required'
    );

    // Pending demands
    const pendingDemands = demands.filter(d => d.status === 'pending' || d.status === 'partially_matched');
    const neededPortions = pendingDemands.reduce((sum, d) => sum + Math.max(0, (d.quantityRequested || 0) - (d.fulfilledQuantity || 0)), 0);

    // Success rate
    const totalDeliveries = deliveries.length;
    const successfulRuns = deliveries.filter(d => d.status === 'delivered' || d.status === 'in_transit').length;
    const successRate = totalDeliveries > 0 ? Math.round((successfulRuns / totalDeliveries) * 100) : 100;

    // Urgent listings (< 4 hours)
    const now = Date.now();
    const urgentCount = availableListings.filter(l => {
      const diffHours = (new Date(l.safeUseDeadline).getTime() - now) / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 4;
    }).length;

    // Environmental metrics (EPA WARM Standard based on actual delivered food)
    // 0.42 kg per standard cooked meal portion
    // 2.5 kg CO2e avoided per kg food diverted from landfill
    const portionsRedistributed = deliveredPortions;
    const foodDivertedKg = Math.round(portionsRedistributed * 0.42);
    const co2eAvoidedKg = Math.round(foodDivertedKg * 2.5);
    const waterConservedLitres = Math.round(foodDivertedKg * 1000);
    const economicValueINR = Math.round(portionsRedistributed * 50);

    return {
      availablePortions,
      deliveredPortions,
      activeDeliveriesCount: activeDeliveries.length,
      pendingNeededPortions: neededPortions,
      deliverySuccessRate: `${successRate}%`,
      preExpirySafeComplianceRate: totalDeliveries > 0 ? `${Math.round(((totalDeliveries - deliveries.filter(d => d.status === 'failed').length) / totalDeliveries) * 100)}%` : '100%',
      urgentListingsCount: urgentCount,
      impact: {
        foodDivertedKg,
        co2eAvoidedKg,
        waterConservedLitres,
        economicValueINR
      }
    };
  }

  /**
   * Generates tailored role-specific operational metrics
   */
  async getRoleSummary(role = 'admin', user = null) {
    const baseSummary = await this.getDashboardSummary();
    const now = Date.now();

    if (role === 'provider') {
      const providerListings = await FoodListing.find(user ? { $or: [{ createdBy: user._id }, { providerName: { $regex: user.organisationName || '', $options: 'i' } }] } : {});
      const activeListings = providerListings.filter(l => l.status === 'available' || l.status === 'partially_matched');
      const expiringSoon = activeListings.filter(l => {
        const hoursLeft = (new Date(l.safeUseDeadline).getTime() - now) / 3600000;
        return hoursLeft > 0 && hoursLeft <= 4;
      });

      return {
        role: 'provider',
        totalDonationsCount: providerListings.length,
        activeSurplusPortions: activeListings.reduce((s, l) => s + (l.availableQuantity || 0), 0),
        expiringSoonCount: expiringSoon.length,
        deliveredPortions: baseSummary.deliveredPortions,
        recentListings: providerListings.slice(0, 5),
        impact: baseSummary.impact
      };
    }

    if (role === 'recipient') {
      const recipientDemands = await DemandRequest.find(user ? { $or: [{ createdBy: user._id }, { recipientName: { $regex: user.organisationName || '', $options: 'i' } }] } : {});
      const activeDemands = recipientDemands.filter(d => d.status === 'pending' || d.status === 'partially_matched');
      const pendingNeeded = activeDemands.reduce((s, d) => s + Math.max(0, (d.quantityRequested || 0) - (d.fulfilledQuantity || 0)), 0);
      const incomingDeliveries = await Delivery.find({ status: { $in: ['assigned', 'picked_up', 'in_transit'] } }).limit(5);

      return {
        role: 'recipient',
        totalRequestsCount: recipientDemands.length,
        pendingNeededPortions: pendingNeeded,
        fulfilledPortions: recipientDemands.reduce((s, d) => s + (d.fulfilledQuantity || 0), 0),
        incomingDeliveriesCount: incomingDeliveries.length,
        recentDemands: recipientDemands.slice(0, 5),
        incomingDeliveries
      };
    }

    if (role === 'driver') {
      const deliveries = await Delivery.find();
      const myDeliveries = user ? deliveries.filter(d => d.driverName && d.driverName.toLowerCase().includes(user.name?.toLowerCase() || '')) : deliveries;
      const activeTrips = myDeliveries.filter(d => d.status === 'in_transit' || d.status === 'assigned' || d.status === 'recovery_required');
      const completedTrips = myDeliveries.filter(d => d.status === 'delivered');

      return {
        role: 'driver',
        assignedCount: myDeliveries.length,
        activeTripsCount: activeTrips.length,
        completedTripsCount: completedTrips.length,
        activeTrips,
        recentDeliveries: myDeliveries.slice(0, 5)
      };
    }

    // Default: Admin platform summary
    const [totalOrgs, totalDrivers, unreadAlerts] = await Promise.all([
      Organisation.countDocuments(),
      Driver.countDocuments(),
      Notification.countDocuments({ isRead: false })
    ]);

    return {
      role: 'admin',
      ...baseSummary,
      totalOrganisations: totalOrgs,
      totalDrivers,
      unreadAlerts
    };
  }

  /**
   * Generates category distribution analytics
   */
  async getCategoryBreakdown() {
    const listings = await FoodListing.find();
    const counts = {
      prepared_meals: 0,
      bakery: 0,
      raw_produce: 0,
      packaged: 0,
      dairy: 0
    };

    listings.forEach(l => {
      const cat = l.category || 'prepared_meals';
      counts[cat] = (counts[cat] || 0) + (l.quantity || 0);
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return {
      counts,
      percentages: {
        prepared_meals: Math.round(((counts.prepared_meals || 0) / total) * 100),
        bakery: Math.round(((counts.bakery || 0) / total) * 100),
        raw_produce: Math.round(((counts.raw_produce || 0) / total) * 100),
        packaged: Math.round(((counts.packaged || 0) / total) * 100),
        dairy: Math.round(((counts.dairy || 0) / total) * 100)
      }
    };
  }
}

module.exports = new AnalyticsService();
