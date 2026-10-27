const FoodListing = require('../models/FoodListing');
const Delivery = require('../models/Delivery');
const AuditLog = require('../models/AuditLog');
const notificationService = require('./notificationService');

class ExpiryService {
  constructor() {
    this.intervalId = null;
    this.checkIntervalMs = 60 * 1000; // Run every 60 seconds
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.runExpiryCheck().catch(err => {
        console.error('[ExpiryService Error] Scheduled check failed:', err.message);
      });
    }, this.checkIntervalMs);
    console.log('[ExpiryService] Automated background food safety monitor active (60s tick).');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Scans database and enforces strict food safety thresholds
   */
  async runExpiryCheck() {
    const now = new Date();
    const imminentCutoff = new Date(now.getTime() + 60 * 60 * 1000); // 60 mins ahead

    let expiredCount = 0;
    let imminentCount = 0;
    let overdueDeliveriesCount = 0;

    // 1. Process Expired Food Listings
    const expiredListings = await FoodListing.find({
      status: { $in: ['available', 'reserved', 'partially_matched'] },
      safeUseDeadline: { $lte: now }
    });

    for (const listing of expiredListings) {
      listing.status = 'expired';
      listing.availableQuantity = 0;
      await listing.save();
      expiredCount++;

      await AuditLog.create({
        action: 'FOOD_LISTING_EXPIRED',
        performedBy: { name: 'FoodResQ Automated Expiry Daemon', role: 'system' },
        targetEntity: 'FoodListing',
        targetId: listing._id.toString(),
        details: { title: listing.title, expiredAt: now.toISOString() }
      });

      await notificationService.notify({
        recipient: listing.createdBy,
        targetRole: 'admin',
        type: 'donation_expired',
        title: `Donation Expired: ${listing.title}`,
        message: `Batch of ${listing.quantity} portions has reached its safe-use deadline. Automatically de-listed.`,
        referenceId: listing._id.toString(),
        referenceModel: 'FoodListing'
      });
    }

    // 2. Identify Imminent Expirations (<60 mins)
    const imminentListings = await FoodListing.find({
      status: { $in: ['available', 'partially_matched'] },
      safeUseDeadline: { $gt: now, $lte: imminentCutoff },
      urgency: { $ne: 'Urgent' }
    });

    for (const listing of imminentListings) {
      listing.urgency = 'Urgent';
      await listing.save();
      imminentCount++;

      const minsLeft = Math.max(1, Math.round((listing.safeUseDeadline.getTime() - now.getTime()) / 60000));
      await notificationService.notify({
        recipient: listing.createdBy,
        targetRole: 'admin',
        type: 'imminent_expiry',
        title: `Urgent Expiry: ${listing.title}`,
        message: `Surplus batch of ${listing.availableQuantity} portions expires in ${minsLeft} minutes. Immediate pairing required.`,
        referenceId: listing._id.toString(),
        referenceModel: 'FoodListing'
      });
    }

    // 3. Scan Overdue Deliveries
    const overdueDeliveries = await Delivery.find({
      status: { $in: ['assigned', 'picked_up', 'in_transit'] },
      safeUseDeadline: { $lte: now }
    });

    for (const delivery of overdueDeliveries) {
      overdueDeliveriesCount++;
      delivery.incidentNotes = `Safety Alert: Consignment exceeded safe delivery deadline at ${now.toLocaleTimeString()}.`;
      await delivery.save();

      await notificationService.notify({
        targetRole: 'admin',
        type: 'admin_alert',
        title: `Overdue Delivery: #${delivery.trackingId}`,
        message: `Consignment of ${delivery.quantity} portions (${delivery.foodTitle}) has exceeded safe-use deadline. Review immediately.`,
        referenceId: delivery.trackingId,
        referenceModel: 'Delivery'
      });
    }

    return {
      timestamp: now.toISOString(),
      expiredCount,
      imminentCount,
      overdueDeliveriesCount
    };
  }
}

module.exports = new ExpiryService();
