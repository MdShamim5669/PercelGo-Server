import { z } from 'zod';

export const userRegisterSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'rider', 'admin']).optional()
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password cannot be empty')
});
