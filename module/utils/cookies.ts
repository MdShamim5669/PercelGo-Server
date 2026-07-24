import { Response } from 'express';

export const setCookie = (res: Response, name: string, value: string, options: any = {}) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    ...options,
  });
};

export const clearCookie = (res: Response, name: string) => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};
