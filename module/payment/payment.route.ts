import { Router } from 'express';
import {
  initPayment,
  paymentSuccess,
  paymentFail,
  paymentCancel
} from './payment.controller';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/init', verifyToken, initPayment);
router.post('/success/:tranId', paymentSuccess);
router.post('/fail/:tranId', paymentFail);
router.post('/cancel/:tranId', paymentCancel);

export const PaymentRoutes = router;
