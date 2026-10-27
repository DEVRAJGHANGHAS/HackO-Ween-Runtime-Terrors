const analyticsService = require('../services/analyticsService');
const Delivery = require('../models/Delivery');

exports.getSummary = async (req, res, next) => {
  try {
    const summary = await analyticsService.getDashboardSummary();
    res.json({
      success: true,
      summary
    });
  } catch (err) {
    next(err);
  }
};

exports.getRoleSummary = async (req, res, next) => {
  try {
    const role = req.query.role || req.user?.role || 'admin';
    const summary = await analyticsService.getRoleSummary(role, req.user);
    res.json({
      success: true,
      role,
      summary
    });
  } catch (err) {
    next(err);
  }
};

exports.getCategoryBreakdown = async (req, res, next) => {
  try {
    const breakdown = await analyticsService.getCategoryBreakdown();
    res.json({
      success: true,
      breakdown
    });
  } catch (err) {
    next(err);
  }
};

exports.exportAuditCsv = async (req, res, next) => {
  try {
    const deliveries = await Delivery.find().sort({ createdAt: -1 });

    const rows = [
      ['Tracking ID', 'Date', 'Provider', 'Recipient', 'Food Consignment', 'Portions', 'Weight (kg)', 'CO2e Saved (kg)', 'Status']
    ];

    deliveries.forEach(del => {
      const weightKg = (del.quantity * 0.42).toFixed(1);
      const co2eKg = (weightKg * 2.5).toFixed(1);
      rows.push([
        del.trackingId,
        new Date(del.createdAt).toISOString().slice(0, 16),
        `"${del.providerName}"`,
        `"${del.recipientName}"`,
        `"${del.foodTitle}"`,
        del.quantity,
        weightKg,
        co2eKg,
        del.status
      ]);
    });

    const csvContent = rows.map(r => r.join(',')).join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment(`foodresq_audit_export_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
};
