import { Router } from 'express';
import {
  createParcel,
  getParcels,
  getParcelById,
  payParcel,
  createPaymentIntent,
  getPayments,
  updateParcelStatus
} from './parcel.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createParcelSchema, updateParcelStatusSchema } from './parcel.validation';

const router = Router();

router.post('/', validateRequest(createParcelSchema), createParcel);
router.get('/', getParcels);

// Specific routes must come before parameter routes like /:id
router.get('/payments', getPayments);

router.get('/:id', getParcelById);
router.post('/:id/pay', payParcel);
router.post('/:id/create-payment-intent', createPaymentIntent);
router.patch('/:id/status', validateRequest(updateParcelStatusSchema), updateParcelStatus);

export const ParcelRoutes = router;