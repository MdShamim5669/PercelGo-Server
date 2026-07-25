import { Request, Response } from 'express';
import catchAsync from '../shared/catchAsync';
import sendResponse from '../shared/sendResponse';
import {
  createParcelService,
  getParcelsService,
  getRiderParcelsService,
  getParcelByIdService,
  createPaymentIntentService,
  payParcelService,
  updateParcelStatusService,
  getPaymentsService
} from './parcel.services';

// Create Parcel
export const createParcel = catchAsync(async (req: Request, res: Response) => {
  const result: any = await createParcelService(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Parcel created successfully',
    data: result
  });
});

// Get Parcels (with optional email filter)
export const getParcels = catchAsync(async (req: Request, res: Response) => {
  const result: any = await getParcelsService(req.query.email as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Parcels retrieved successfully',
    data: result
  });
});

// Get Rider Parcels
export const getRiderParcels = catchAsync(async (req: Request, res: Response) => {
  const result: any = await getRiderParcelsService(req.params.email as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Rider parcels retrieved successfully',
    data: result
  });
});

export const getParcelById = catchAsync(async (req: Request, res: Response) => {
  const result: any = await getParcelByIdService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Parcel retrieved successfully',
    data: result
  });
});

export const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const result: any = await createPaymentIntentService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment intent created successfully',
    data: result
  });
});

export const payParcel = catchAsync(async (req: Request, res: Response) => {
  const result: any = await payParcelService(req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Parcel paid successfully',
    data: result
  });
});

export const getPayments = catchAsync(async (req: Request, res: Response) => {
  const result: any = await getPaymentsService(req.query.email as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payments retrieved successfully',
    data: result
  });
});

// Update Parcel Status & Track Log
export const updateParcelStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, message, riderEmail } = req.body;
  const result: any = await updateParcelStatusService(id, status, message, riderEmail);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Parcel status updated successfully',
    data: result
  });
});