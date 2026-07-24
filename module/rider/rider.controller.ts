import { Request, Response } from 'express';
import catchAsync from '../shared/catchAsync';
import sendResponse from '../shared/sendResponse';
import {
  getPickupParcelsService,
  getDeliveryParcelsService,
  confirmPickupService,
  deliverParcelService,
  getRiderEarningsService
} from './rider.services';

export const getPickupParcels = catchAsync(async (req: Request, res: Response) => {
  const result: any = await getPickupParcelsService(req.user?.email);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Pickup parcels retrieved successfully',
    data: result
  });
});

export const getDeliveryParcels = catchAsync(async (req: Request, res: Response) => {
  const result: any = await getDeliveryParcelsService(req.user?.email);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Delivery parcels retrieved successfully',
    data: result
  });
});

export const confirmPickup = catchAsync(async (req: Request, res: Response) => {
  const result: any = await confirmPickupService(req.params.id as string, req.body.tracking_no, req.user?.email);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message || 'Pickup confirmed successfully',
    data: result
  });
});

export const deliverParcel = catchAsync(async (req: Request, res: Response) => {
  const result: any = await deliverParcelService(req.params.id as string, req.body.tracking_no, req.user?.email);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message || 'Parcel delivered successfully',
    data: result
  });
});

export const getEarnings = catchAsync(async (req: Request, res: Response) => {
  const result: any = await getRiderEarningsService(req.user?.email);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Earnings retrieved successfully',
    data: result
  });
});
