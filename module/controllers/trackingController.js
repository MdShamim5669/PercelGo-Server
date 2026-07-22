const { getTrackingService } = require('../sevices/trackingService');

const getTracking = async (req, res, next) => {
  try {
    const result = await getTrackingService(req.query.email);
    res.send(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTracking
};
