import { Router } from 'express';
import { getTracking, getTrackingLogs } from './tracking.controller';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getTracking);
router.get('/:trackingId', verifyToken, getTrackingLogs);

export const TrackingRoutes = router;
