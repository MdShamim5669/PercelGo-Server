const express = require('express');
const {
  createParcel,
  getParcels,
  getParcelById,
  payParcel,
  getPayments,
  updateParcelStatus
} = require('../controllers/parcelController');

const router = express.Router();

router.post('/parcels', createParcel);
router.get('/parcels', getParcels);
router.get('/parcels/:id', getParcelById);
router.post('/parcels/:id/pay', payParcel);
router.patch('/parcels/:id/status', updateParcelStatus);

router.get('/payments', getPayments);

module.exports = router;