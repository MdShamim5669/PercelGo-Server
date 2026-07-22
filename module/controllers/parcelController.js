const {
  createParcelService,
  getParcelsService,
  getParcelByIdService,
  payParcelService,
  updateParcelStatusService,
  getPaymentsService
} = require('../sevices/parcelServicecs');

// Create Parcel
const createParcel = async (req, res, next) => {
  try {
    const result = await createParcelService(req.body);
    res.send(result);
  } catch (error) {
    next(error);
  }
};

// Get Parcels (with optional email filter)
const getParcels = async (req, res, next) => {
  try {
    const result = await getParcelsService(req.query.email);
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const getParcelById = async (req, res, next) => {
  try {
    const result = await getParcelByIdService(req.params.id);
    if (!result) {
      const error = new Error('Parcel not found');
      error.status = 404;
      return next(error);
    }
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const payParcel = async (req, res, next) => {
  try {
    const result = await payParcelService(req.params.id, req.body);
    if (result && result.status === 404) {
      const error = new Error(result.message);
      error.status = 404;
      return next(error);
    }
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const result = await getPaymentsService(req.query.email);
    res.send(result);
  } catch (error) {
    next(error);
  }
};

// Update Parcel Status & Track Log
const updateParcelStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status, message, riderEmail } = req.body;
    const result = await updateParcelStatusService(id, status, message, riderEmail);

    if (result && result.status === 404) {
      const error = new Error(result.message);
      error.status = 404;
      return next(error);
    }

    res.send(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createParcel,
  getParcels,
  getParcelById,
  payParcel,
  getPayments,
  updateParcelStatus
};