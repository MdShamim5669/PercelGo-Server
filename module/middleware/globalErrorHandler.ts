import { Request, Response, NextFunction } from 'express';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
