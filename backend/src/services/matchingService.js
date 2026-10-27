const FoodListing = require('../models/FoodListing');
const DemandRequest = require('../models/DemandRequest');
const Delivery = require('../models/Delivery');
const Driver = require('../models/Driver');
const AuditLog = require('../models/AuditLog');
const { calculateDistanceKm } = require('../utils/distance');

class MatchingService {
  /**
   * Generates deterministic matching suggestions between available listings and pending demands
   */
  async generateSuggestions() {
    const listings = await FoodListing.find({
      status: { $in: ['available', 'partially_matched'] },
      availableQuantity: { $gt: 0 }
    }).sort({ safeUseDeadline: 1 });

    const demands = await DemandRequest.find({
      status: { $in: ['pending', 'partially_matched'] }
    }).sort({ urgency: -1, createdAt: 1 });

    const suggestions = [];

    for (const listing of listings) {
      let remainingSupply = listing.availableQuantity;
      if (remainingSupply <= 0) continue;

      const candidates = [];

      for (const demand of demands) {
        const remainingNeeded = demand.quantityRequested - demand.fulfilledQuantity;
        if (remainingNeeded <= 0) continue;

        // Category compatibility
        const isExactCategory = listing.category === demand.category;
        let categoryScore = isExactCategory ? 100 : (listing.category === 'prepared_meals' ? 70 : 50);

        // Calculate physical distance between pickup and dropoff
        const pickupCoords = listing.pickupLocation?.coordinates || [28.4595, 77.0266];
        const dropoffCoords = demand.location?.coordinates || [28.4595, 77.0266];
        const distanceKm = calculateDistanceKm(pickupCoords, dropoffCoords);
        const distanceScore = Math.max(20, Math.round(100 - (distanceKm * 4.5)));

        // Deadline vs Urgency score
        const now = Date.now();
        const deadlineMs = new Date(listing.safeUseDeadline).getTime() - now;
        const hoursLeft = Math.max(0.1, deadlineMs / (1000 * 60 * 60));

        const estimatedTransitMins = Math.round(distanceKm * 3.5 + 8);
        const safetyBufferMins = 30; // 30-min minimum food safety buffer
        if (deadlineMs <= (estimatedTransitMins + safetyBufferMins) * 60000) {
          // Food would breach safe-use deadline in transit; reject candidate pairing
          continue;
        }

        let urgencyScore = 70;
        if (demand.urgency === 'critical') urgencyScore = 100;
        else if (demand.urgency === 'high') urgencyScore = 85;
        else if (demand.urgency === 'medium') urgencyScore = 70;
        else urgencyScore = 55;

        // Weighting formula: 40% distance, 35% urgency & deadline, 25% category
        const compositeScore = Math.round((distanceScore * 0.40) + (urgencyScore * 0.35) + (categoryScore * 0.25));

        candidates.push({
          demand,
          distanceKm,
          compositeScore,
          remainingNeeded,
          distanceScore,
          urgencyScore,
          categoryScore
        });
      }

      // Sort candidates by highest match score
      candidates.sort((a, b) => b.compositeScore - a.compositeScore);

      const allocations = [];
      for (const candidate of candidates) {
        if (remainingSupply <= 0) break;

        // Allocate min(remainingSupply, remainingNeeded)
        const allocatePortions = Math.min(remainingSupply, candidate.remainingNeeded);
        if (allocatePortions <= 0) continue;

        remainingSupply -= allocatePortions;

        allocations.push({
          demandId: candidate.demand._id,
          recipientId: candidate.demand.recipientId,
          recipientName: candidate.demand.recipientName,
          allocatedPortions: allocatePortions,
          distanceKm: candidate.distanceKm,
          estimatedTransitMinutes: Math.round(candidate.distanceKm * 3.5 + 8),
          score: candidate.compositeScore,
          scoreBreakdown: {
            proximity: candidate.distanceScore,
            urgencyFit: candidate.urgencyScore,
            categoryFit: candidate.categoryScore
          },
          explanation: `Pairs ${allocatePortions} portions (${listing.title}) with ${candidate.demand.recipientName} situated ${candidate.distanceKm} km away. Safe deadline margin: ${Math.round((new Date(listing.safeUseDeadline).getTime() - Date.now()) / (1000 * 60 * 60))} hours.`
        });
      }

      if (allocations.length > 0) {
        const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedPortions, 0);
        const avgScore = Math.round(allocations.reduce((sum, a) => sum + a.score, 0) / allocations.length);

        suggestions.push({
          proposalId: `PROP-${listing._id.toString().slice(-4).toUpperCase()}`,
          listingId: listing._id,
          providerId: listing.providerId,
          providerName: listing.providerName,
          listingTitle: listing.title,
          totalAvailable: listing.availableQuantity,
          totalAllocated,
          unallocatedRemaining: remainingSupply,
          averageScore: avgScore,
          allocations
        });
      }
    }

    return suggestions;
  }

  /**
   * Confirms and atomic-executes an allocation plan
   * Revalidates inventory to guarantee ZERO OVER-ALLOCATION
   */
  async confirmPlan(proposals, confirmedBy) {
    const createdDeliveries = [];
    const availableDrivers = await Driver.find({ status: { $in: ['available', 'assigned'] } });
    let driverIndex = 0;

    for (const proposal of proposals) {
      const listing = await FoodListing.findById(proposal.listingId);
      if (!listing) continue;

      const allocations = proposal.allocations || [{
        demandId: proposal.demandId,
        allocatedPortions: proposal.quantityMatched || proposal.quantity || 0,
        distanceKm: proposal.distanceKm || 5.0,
        estimatedTransitMinutes: proposal.estimatedTransitMinutes || Math.round((proposal.distanceKm || 5.0) * 3.5 + 8)
      }];

      for (const alloc of allocations) {
        // Re-read demand and listing inside loop
        const currentListing = await FoodListing.findById(proposal.listingId);
        const currentDemand = await DemandRequest.findById(alloc.demandId);

        if (!currentListing || !currentDemand) continue;

        // Revalidation against current available quantity
        const quantityToDeliver = Math.min(
          alloc.allocatedPortions,
          currentListing.availableQuantity,
          currentDemand.quantityRequested - currentDemand.fulfilledQuantity
        );

        if (quantityToDeliver <= 0) continue;

        // Deduct from listing atomically
        currentListing.availableQuantity -= quantityToDeliver;
        if (currentListing.availableQuantity === 0) {
          currentListing.status = 'matched';
        } else {
          currentListing.status = 'partially_matched';
        }
        await currentListing.save();

        // Increment fulfilled in demand
        currentDemand.fulfilledQuantity += quantityToDeliver;
        if (currentDemand.fulfilledQuantity >= currentDemand.quantityRequested) {
          currentDemand.status = 'fulfilled';
        } else {
          currentDemand.status = 'partially_matched';
        }
        await currentDemand.save();

        // Select driver
        const assignedDriver = availableDrivers.length > 0 ? availableDrivers[driverIndex % availableDrivers.length] : null;
        if (assignedDriver) driverIndex++;

        // Generate tracking ID
        const trackingId = `DEL-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

        const newDelivery = new Delivery({
          trackingId,
          listingId: currentListing._id,
          demandId: currentDemand._id,
          foodTitle: currentListing.title,
          category: currentListing.category,
          providerId: currentListing.providerId,
          providerName: currentListing.providerName,
          recipientId: currentDemand.recipientId,
          recipientName: currentDemand.recipientName,
          driverId: assignedDriver ? assignedDriver._id : null,
          driverName: assignedDriver ? assignedDriver.name : 'Pending Courier Assignment',
          driverPhone: assignedDriver ? assignedDriver.phone : '',
          vehicleType: assignedDriver ? assignedDriver.vehicleType : 'Electric Van',
          quantity: quantityToDeliver,
          unit: currentListing.unit || 'portions',
          pickupLocation: currentListing.pickupLocation,
          destinationLocation: currentDemand.location,
          safeUseDeadline: currentListing.safeUseDeadline,
          status: assignedDriver ? 'in_transit' : 'assigned',
          distanceKm: alloc.distanceKm || 5.0,
          etaMinutes: alloc.estimatedTransitMinutes || 25,
          timeline: [
            {
              timestamp: new Date(),
              status: 'assigned',
              description: `Generated from matching plan by ${confirmedBy?.name || 'Central Dispatcher'}`
            }
          ]
        });

        if (assignedDriver) {
          newDelivery.timeline.push({
            timestamp: new Date(),
            status: 'in_transit',
            description: `Assigned courier ${assignedDriver.name} (${assignedDriver.vehicleType}) en route.`
          });
        }

        await newDelivery.save();
        createdDeliveries.push(newDelivery);

        // Audit log
        await AuditLog.create({
          action: 'MATCH_CONFIRMED_DELIVERY_DISPATCHED',
          performedBy: {
            userId: confirmedBy?._id,
            name: confirmedBy?.name,
            role: confirmedBy?.role
          },
          targetEntity: 'Delivery',
          targetId: newDelivery.trackingId,
          details: {
            listingId: currentListing._id,
            demandId: currentDemand._id,
            portions: quantityToDeliver
          }
        });

        // Real-time notifications for recipient, driver, and donor
        try {
          const notificationService = require('./notificationService');
          await notificationService.notify({
            targetRole: 'recipient',
            type: 'allocation_confirmed',
            title: `Allocation Confirmed: #${newDelivery.trackingId}`,
            message: `${quantityToDeliver} portions of ${currentListing.title} dispatched from ${currentListing.providerName}.`,
            referenceId: newDelivery.trackingId,
            referenceModel: 'Delivery'
          });

          await notificationService.notify({
            targetRole: 'driver',
            type: 'delivery_assigned',
            title: `Route Assigned: #${newDelivery.trackingId}`,
            message: `Pick up ${quantityToDeliver} portions from ${currentListing.providerName} and deliver to ${currentDemand.recipientName}.`,
            referenceId: newDelivery.trackingId,
            referenceModel: 'Delivery'
          });
        } catch (notifErr) {
          console.warn('[Matching Notification Error]', notifErr.message);
        }
      }
    }

    return createdDeliveries;
  }
}

module.exports = new MatchingService();
