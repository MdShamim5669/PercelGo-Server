import { Response } from 'express';
import { generateToken } from './jwt';
import { setCookie } from './cookies';

export const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  // Create token
  const token = generateToken({ email: user.email, role: user.role });

  // Set cookie
  setCookie(res, 'token', token);

  // Send JSON response
  res.status(statusCode).json({
    success: true,
    message: 'Authentication successful',
    token,
    user
  });
};
