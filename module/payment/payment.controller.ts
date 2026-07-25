import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import sendResponse from '../utils/sendResponse';
import {
  initPaymentService,
  paymentSuccessService,
  paymentFailService,
  paymentCancelService
} from './payment.services';

export const initPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await initPaymentService(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment initialized successfully',
    data: result
  });
});

export const paymentSuccess = catchAsync(async (req: Request, res: Response) => {
  const { tranId } = req.params;
  await paymentSuccessService(tranId);
  // Redirect to frontend success page
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/payment/success?transactionId=${tranId}`);
});

export const paymentFail = catchAsync(async (req: Request, res: Response) => {
  const { tranId } = req.params;
  await paymentFailService(tranId);
  // Redirect to frontend fail page
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/payment/fail`);
});

export const paymentCancel = catchAsync(async (req: Request, res: Response) => {
  const { tranId } = req.params;
  await paymentCancelService(tranId);
  // Redirect to frontend fail page
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/payment/fail`);
});
