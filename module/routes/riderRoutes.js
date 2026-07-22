const express = require('express');
const {
  getPickupParcels,
  getDeliveryParcels,
  confirmPickup,
  deliverParcel,
  getEarnings
} = require('../controllers/riderController');
const { verifyToken, verifyRider } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken, verifyRider);

router.get('/parcels/pickup', getPickupParcels);
router.get('/parcels/delivery', getDeliveryParcels);
router.post('/parcels/:id/pickup', confirmPickup);
router.post('/parcels/:id/deliver', deliverParcel);
router.get('/earnings', getEarnings);

module.exports = router;
