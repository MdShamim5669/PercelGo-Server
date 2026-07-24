import { Router } from 'express';
import {
  getStats,
  updateRiderStatus,
  updateUserRole,
  assignPickupRider,
  confirmReceive,
  shipParcel,
  assignDeliveryRider
} from './admin.controller';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = Router();

router.use(verifyToken, verifyAdmin);

router.get('/stats', getStats);
router.patch('/riders/:id/status', updateRiderStatus);
router.patch('/users/:id/role', updateUserRole);
router.patch('/parcels/:id/assign-pickup', assignPickupRider);
router.patch('/parcels/:id/confirm-receive', confirmReceive);
router.patch('/parcels/:id/ship', shipParcel);
router.patch('/parcels/:id/assign-delivery', assignDeliveryRider);

export const AdminRoutes = router;
