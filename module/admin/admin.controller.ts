import { Request, Response } from 'express';
import catchAsync from '../shared/catchAsync';
import sendResponse from '../shared/sendResponse';
import {
  getStatsService,
  updateRiderStatusService,
  updateUserRoleService,
  assignPickupRiderService,
  confirmReceiveService,
  shipParcelService,
  assignDeliveryRiderService,
  deleteUserService
} from './admin.services';

export const getStats = catchAsync(async (req: Request, res: Response) => {
  const result: any = await getStatsService();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Stats retrieved successfully',
    data: result
  });
});

export const updateRiderStatus = catchAsync(async (req: Request, res: Response) => {
  const result: any = await updateRiderStatusService(req.params.id as string, req.body.status);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Rider status updated successfully',
    data: result
  });
});

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const result: any = await updateUserRoleService(req.params.id as string, req.body.role);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User role updated successfully',
    data: result
  });
});

export const assignPickupRider = catchAsync(async (req: Request, res: Response) => {
  const result: any = await assignPickupRiderService(req.params.id as string, req.body.riderEmail);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Pickup rider assigned successfully',
    data: result
  });
});

export const confirmReceive = catchAsync(async (req: Request, res: Response) => {
  const result: any = await confirmReceiveService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Parcel received successfully',
    data: result
  });
});

export const shipParcel = catchAsync(async (req: Request, res: Response) => {
  const result: any = await shipParcelService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Parcel shipped successfully',
    data: result
  });
});

export const assignDeliveryRider = catchAsync(async (req: Request, res: Response) => {
  const result: any = await assignDeliveryRiderService(req.params.id as string, req.body.riderEmail);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Delivery rider assigned successfully',
    data: result
  });
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result: any = await deleteUserService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
    data: result
  });
});
