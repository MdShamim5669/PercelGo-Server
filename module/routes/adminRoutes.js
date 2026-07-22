const express = require('express');
const {
  getStats,
  updateRiderStatus,
  updateUserRole,
  assignPickupRider,
  confirmReceive,
  shipParcel,
  assignDeliveryRider
} = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get('/stats', getStats);
router.patch('/riders/:id/status', updateRiderStatus);
router.patch('/users/:id/role', updateUserRole);
router.patch('/parcels/:id/assign-pickup', assignPickupRider);
router.patch('/parcels/:id/confirm-receive', confirmReceive);
router.patch('/parcels/:id/ship', shipParcel);
router.patch('/parcels/:id/assign-delivery', assignDeliveryRider);

module.exports = router;
