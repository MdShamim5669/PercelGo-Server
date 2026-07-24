import { Request, Response } from 'express';
import catchAsync from '../shared/catchAsync';
import sendResponse from '../shared/sendResponse';
import AppError from '../utils/AppError';
import { getTrackingService, getTrackingLogsService } from './tracking.services';

export const getTracking = catchAsync(async (req: Request, res: Response) => {
  const result: any = await getTrackingService(req.query.email as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tracking data retrieved successfully',
    data: result
  });
});

export const getTrackingLogs = catchAsync(async (req: Request, res: Response) => {
  const trackingId = req.params.trackingId as string;
  const email = req.user?.email; // From verifyToken middleware
  
  if (!email) {
    throw new AppError(401, 'Unauthorized');
  }

  const result: any = await getTrackingLogsService(trackingId, email);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tracking logs retrieved successfully',
    data: result
  });
});
