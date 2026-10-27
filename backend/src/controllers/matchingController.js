const matchingService = require('../services/matchingService');

exports.getSuggestions = async (req, res, next) => {
  try {
    const suggestions = await matchingService.generateSuggestions();
    res.json({
      success: true,
      count: suggestions.length,
      suggestions
    });
  } catch (err) {
    next(err);
  }
};

exports.confirmPlan = async (req, res, next) => {
  try {
    const { proposals } = req.body;

    if (!Array.isArray(proposals) || proposals.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Proposals array is required to confirm an allocation plan.'
      });
    }

    const createdDeliveries = await matchingService.confirmPlan(proposals, req.user);

    res.status(201).json({
      success: true,
      message: `Confirmed allocation plan. Dispatched ${createdDeliveries.length} active delivery runs.`,
      deliveriesCount: createdDeliveries.length,
      deliveries: createdDeliveries
    });
  } catch (err) {
    next(err);
  }
};
