const {
  getStatsService,
  updateRiderStatusService,
  updateUserRoleService,
  assignPickupRiderService,
  confirmReceiveService,
  shipParcelService,
  assignDeliveryRiderService
} = require('../sevices/adminService');

const getStats = async (req, res, next) => {
  try {
    const result = await getStatsService();
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const updateRiderStatus = async (req, res, next) => {
  try {
    const result = await updateRiderStatusService(req.params.id, req.body.status);
    if (result && result.status) {
      return res.status(result.status).json({ message: result.message });
    }
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const result = await updateUserRoleService(req.params.id, req.body.role);
    if (result && result.status) {
      return res.status(result.status).json({ message: result.message });
    }
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const assignPickupRider = async (req, res, next) => {
  try {
    const result = await assignPickupRiderService(req.params.id, req.body.riderEmail);
    if (result && result.status) {
      return res.status(result.status).json({ message: result.message });
    }
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const confirmReceive = async (req, res, next) => {
  try {
    const result = await confirmReceiveService(req.params.id);
    if (result && result.status) {
      return res.status(result.status).json({ message: result.message });
    }
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const shipParcel = async (req, res, next) => {
  try {
    const result = await shipParcelService(req.params.id);
    if (result && result.status) {
      return res.status(result.status).json({ message: result.message });
    }
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const assignDeliveryRider = async (req, res, next) => {
  try {
    const result = await assignDeliveryRiderService(req.params.id, req.body.riderEmail);
    if (result && result.status) {
      return res.status(result.status).json({ message: result.message });
    }
    res.send(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  updateRiderStatus,
  updateUserRole,
  assignPickupRider,
  confirmReceive,
  shipParcel,
  assignDeliveryRider
};
