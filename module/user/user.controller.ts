import { Request, Response } from 'express';
import catchAsync from '../shared/catchAsync';
import sendResponse from '../shared/sendResponse';
import { 
  getAllUsersService,
  getUserProfileService,
  getUserRoleService,
  updateUserProfileService, 
  registerUserService, 
  loginUserService 
} from './user.services';
import jwt from 'jsonwebtoken';

export const createToken = catchAsync(async (req: Request, res: Response) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  res.send({ token });
});

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const role = req.query.role as string;
  const result: any = await getAllUsersService(role);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully',
    data: result
  });
});

export const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const result: any = await getUserProfileService(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile retrieved successfully',
    data: result
  });
});

export const updateUserProfile = catchAsync(async (req: Request, res: Response) => {
  const result: any = await updateUserProfileService(req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile updated successfully',
    data: result
  });
});

export const getUserRole = catchAsync(async (req: Request, res: Response) => {
  const email = req.params.email;
  
  // Security check: Only allow users to check their own role, or admins
  if (req.user?.email !== email && req.user?.role !== 'admin') {
    return sendResponse(res, {
      statusCode: 403,
      success: false,
      message: 'Forbidden access',
      data: null
    });
  }

  const result: any = await getUserRoleService(email as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User role retrieved successfully',
    data: result
  });
});

export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result: any = await registerUserService(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully',
    data: result
  });
});

export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result: any = await loginUserService(email, password);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully',
    data: result
  });
});
