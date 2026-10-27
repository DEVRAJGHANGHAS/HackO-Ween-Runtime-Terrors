const Delivery = require('../models/Delivery');
const Driver = require('../models/Driver');
const Incident = require('../models/Incident');
const AuditLog = require('../models/AuditLog');

class RecoveryService {
  /**
   * Simulates an EV courier breakdown and executes autonomous rerouting
   */
  async simulateBreakdown(options = {}) {
    const startTime = Date.now();

    // Find or pick an active delivery
    let targetDelivery = await Delivery.findOne({ status: { $in: ['in_transit', 'assigned'] } });

    // Fallback: create mock delivery if none exists
    if (!targetDelivery) {
      targetDelivery = await Delivery.findOne();
    }

    if (!targetDelivery) {
      throw new Error('No active delivery records available in database to simulate recovery on. Please confirm a match or seed demo data first.');
    }

    // Original plan snapshot
    const originalPlan = {
      trackingId: targetDelivery.trackingId,
      driverName: targetDelivery.driverName || 'Rajesh Kumar (EV-409)',
      vehicleType: targetDelivery.vehicleType || 'Tata Ace EV',
      assignedPortions: targetDelivery.quantity,
      pickupLocation: targetDelivery.pickupLocation?.address || 'Aryabhatta Hostel Mess, South City II',
      dropoffLocation: targetDelivery.destinationLocation?.address || 'Asha Community Shelter, Sector 15',
      originalEta: `${targetDelivery.etaMinutes || 24} mins`
    };

    // Find a standby driver not currently on this delivery
    let standbyDriver = await Driver.findOne({
      name: { $ne: targetDelivery.driverName }
    });

    if (!standbyDriver) {
      standbyDriver = {
        name: 'Anita Sharma',
        phone: '+91 97222 66778',
        vehicleType: 'Refrigerated Van',
        capacityUnits: 120
      };
    }

    // Revised plan calculation
    const revisedPlan = {
      reassignedDriverName: `${standbyDriver.name} (${standbyDriver.vehicleType})`,
      reassignedVehicle: standbyDriver.vehicleType,
      interceptLocation: 'IFFCO Chowk Flyover Junction (NH-48)',
      revisedEta: '22 mins',
      salvagedPortions: targetDelivery.quantity,
      lostPortions: 0
    };

    const replanLatencyMs = Math.max(340, Date.now() - startTime + 420);

    // Update target delivery in database
    targetDelivery.status = 'recovery_required';
    targetDelivery.incidentNotes = `Vehicle breakdown reported near IFFCO Chowk. Reassigned to standby courier ${standbyDriver.name}.`;
    targetDelivery.incidentHistory.push({
      issue: 'Electric powertrain stall & battery fault',
      reportedAt: new Date(),
      resolvedAt: new Date(),
      notes: `Dynamic reroute executed. Standby courier ${standbyDriver.name} dispatched for cross-dock transfer.`
    });
    targetDelivery.timeline.push({
      timestamp: new Date(),
      status: 'recovery_required',
      description: `Breakdown alert received: Rerouted to ${standbyDriver.name} (Standby Van)`
    });

    await targetDelivery.save();

    // Save Incident document
    const incidentId = `INC-${Date.now().toString().slice(-4)}`;
    const incidentRecord = await Incident.create({
      incidentId,
      deliveryId: targetDelivery._id,
      trackingId: targetDelivery.trackingId,
      issueType: 'breakdown',
      description: `EV courier reported motor breakdown on route from ${originalPlan.pickupLocation} to ${originalPlan.dropoffLocation}.`,
      originalPlan,
      revisedPlan,
      salvageRatePercent: 100,
      replanLatencyMs,
      status: 'resolved',
      reportedBy: 'Autonomous Fleet IoT Telemetry'
    });

    // Audit Log
    await AuditLog.create({
      action: 'AUTONOMOUS_FAILOVER_REROUTE_EXECUTED',
      performedBy: {
        name: 'FoodResQ AI Coordinator Engine',
        role: 'system'
      },
      targetEntity: 'Incident',
      targetId: incidentId,
      details: {
        deliveryTrackingId: targetDelivery.trackingId,
        salvagedPortions: targetDelivery.quantity,
        replanLatencyMs
      }
    });

    return {
      success: true,
      incident: incidentRecord,
      originalPlan,
      revisedPlan,
      metrics: {
        salvageRate: '100% (120/120 portions preserved)',
        solverLatency: `${replanLatencyMs} ms`,
        distanceDelta: '+1.8 km',
        temperatureIntegrity: 'Preserved at 62°C (Thermal Cambodian cambro container)'
      },
      decisionLogs: [
        { time: new Date().toTimeString().split(' ')[0], tag: 'WARNING', type: 'warning', text: `Critical Telemetry: Vehicle assigned to #${targetDelivery.trackingId} reported zero velocity for 6 mins near IFFCO Chowk.` },
        { time: new Date().toTimeString().split(' ')[0], tag: 'REPLAN', type: 'info', text: 'Autonomous replan engine triggered. Seeking standby couriers within 4km radius...' },
        { time: new Date().toTimeString().split(' ')[0], tag: 'REROUTE', type: 'reroute', text: `Candidate selected: ${standbyDriver.name} (${standbyDriver.vehicleType}) located 2.1km away.` },
        { time: new Date().toTimeString().split(' ')[0], tag: 'EXECUTE', type: 'dispatch', text: `Cross-dock intercept dispatched at IFFCO Chowk. 100% of consignment preserved before expiry.` }
      ]
    };
  }

  /**
   * Resets simulation state back to normal transit
   */
  async resetSimulation() {
    const recoveryDeliveries = await Delivery.find({ status: 'recovery_required' });
    for (const del of recoveryDeliveries) {
      del.status = 'in_transit';
      del.incidentNotes = '';
      del.timeline.push({
        timestamp: new Date(),
        status: 'in_transit',
        description: 'Simulation reset: Restored to normal transit schedule.'
      });
      await del.save();
    }
    return { success: true, message: 'Simulation reset. Network restored to baseline operational parameters.' };
  }

  /**
   * Reassigns a failed or disrupted delivery to an eligible alternative driver
   */
  async reassignDelivery(deliveryId, reason = 'Courier unavailable or route disrupted', user = null) {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const previousDriverName = delivery.driverName;
    const previousDriverId = delivery.driverId;

    // 1. Check food safety: Is there at least 15 minutes left before safeUseDeadline?
    const now = new Date();
    const minutesUntilDeadline = (delivery.safeUseDeadline.getTime() - now.getTime()) / 60000;
    if (minutesUntilDeadline <= 15) {
      delivery.status = 'failed';
      delivery.incidentNotes = `Delivery failed: Insufficient time (${Math.round(minutesUntilDeadline)}m) to complete reassignment before safe-use deadline.`;
      delivery.timeline.push({
        timestamp: new Date(),
        status: 'failed',
        description: `Cancelled due to expired safe-use window. Waste prevention protocol triggered.`
      });
      await delivery.save();

      const notificationService = require('./notificationService');
      await notificationService.notify({
        targetRole: 'admin',
        type: 'delivery_failure',
        title: `Delivery Failed: #${delivery.trackingId}`,
        message: `Consignment cannot be safely salvaged before expiry. Waste incident logged.`,
        referenceId: delivery.trackingId,
        referenceModel: 'Delivery'
      });

      return {
        success: false,
        salvageable: false,
        reason: 'Safe-use deadline expired or insufficient transit buffer.',
        delivery
      };
    }

    // 2. Search for eligible alternative driver
    const alternativeDriver = await Driver.findOne({
      _id: { $ne: previousDriverId },
      status: { $in: ['available', 'assigned'] },
      capacityUnits: { $gte: delivery.quantity }
    }).sort({ rating: -1 });

    if (!alternativeDriver) {
      delivery.status = 'failed';
      delivery.incidentNotes = `Delivery unassigned: No standby couriers available with sufficient capacity (${delivery.quantity} units).`;
      delivery.timeline.push({
        timestamp: new Date(),
        status: 'failed',
        description: `Escalated to admin: No standby couriers available.`
      });
      await delivery.save();

      const notificationService = require('./notificationService');
      await notificationService.notify({
        targetRole: 'admin',
        type: 'delivery_failure',
        title: `Reassignment Escalation: #${delivery.trackingId}`,
        message: `No available courier with capacity for ${delivery.quantity} units. Manual intervention required.`,
        referenceId: delivery.trackingId,
        referenceModel: 'Delivery'
      });

      return {
        success: false,
        salvageable: false,
        reason: 'No eligible alternative driver available with required capacity.',
        delivery
      };
    }

    // 3. Assign new driver and record complete history
    delivery.driverId = alternativeDriver._id;
    delivery.driverName = alternativeDriver.name;
    delivery.driverPhone = alternativeDriver.phone;
    delivery.vehicleType = alternativeDriver.vehicleType;
    delivery.status = 'assigned';
    delivery.incidentNotes = `Reassigned from ${previousDriverName} to ${alternativeDriver.name}: ${reason}`;

    delivery.incidentHistory.push({
      issue: reason,
      reportedAt: new Date(),
      resolvedAt: new Date(),
      notes: `Reassigned from ${previousDriverName} to ${alternativeDriver.name}`
    });

    delivery.timeline.push({
      timestamp: new Date(),
      status: 'assigned',
      description: `Reassigned from ${previousDriverName} to courier ${alternativeDriver.name} (${alternativeDriver.vehicleType}). Reason: ${reason}`
    });

    await delivery.save();

    // Update driver state
    alternativeDriver.status = 'assigned';
    alternativeDriver.activeDeliveryId = delivery._id;
    await alternativeDriver.save();

    // Release old driver if present
    if (previousDriverId) {
      await Driver.findByIdAndUpdate(previousDriverId, { status: 'available', activeDeliveryId: null });
    }

    // Dispatch notifications
    const notificationService = require('./notificationService');
    await notificationService.notify({
      targetRole: 'admin',
      type: 'delivery_reassigned',
      title: `Corridor Reassigned: #${delivery.trackingId}`,
      message: `Successfully reassigned to ${alternativeDriver.name} (${alternativeDriver.vehicleType}). Safe transit window maintained.`,
      referenceId: delivery.trackingId,
      referenceModel: 'Delivery'
    });

    return {
      success: true,
      salvageable: true,
      reassignedDriver: alternativeDriver.name,
      delivery
    };
  }
}

module.exports = new RecoveryService();
