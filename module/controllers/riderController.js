const {
  getPickupParcelsService,
  getDeliveryParcelsService,
  confirmPickupService,
  deliverParcelService,
  getRiderEarningsService
} = require('../sevices/riderService');

const getPickupParcels = async (req, res, next) => {
  try {
    const result = await getPickupParcelsService(req.user.email);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getDeliveryParcels = async (req, res, next) => {
  try {
    const result = await getDeliveryParcelsService(req.user.email);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const confirmPickup = async (req, res, next) => {
  try {
    const result = await confirmPickupService(req.params.id, req.body.tracking_no, req.user.email);
    if (result && result.status) {
      return res.status(result.status).json({ message: result.message });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const deliverParcel = async (req, res, next) => {
  try {
    const result = await deliverParcelService(req.params.id, req.body.tracking_no, req.user.email);
    if (result && result.status) {
      return res.status(result.status).json({ message: result.message });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getEarnings = async (req, res, next) => {
  try {
    const result = await getRiderEarningsService(req.user.email);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPickupParcels,
  getDeliveryParcels,
  confirmPickup,
  deliverParcel,
  getEarnings
};
