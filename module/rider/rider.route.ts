import { Router } from 'express';
import {
  getPickupParcels,
  getDeliveryParcels,
  confirmPickup,
  deliverParcel,
  getEarnings
} from './rider.controller';
import { verifyToken, verifyRider } from '../middleware/authMiddleware';

const router = Router();

router.use(verifyToken, verifyRider);

router.get('/parcels/pickup', getPickupParcels);
router.get('/parcels/delivery', getDeliveryParcels);
router.post('/parcels/:id/pickup', confirmPickup);
router.post('/parcels/:id/deliver', deliverParcel);
router.get('/earnings', getEarnings);

export const RiderRoutes = router;
