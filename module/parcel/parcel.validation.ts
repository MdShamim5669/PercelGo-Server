import { z } from 'zod';

export const createParcelSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  type: z.enum(['document', 'non-document']),
  senderName: z.string().min(1, 'Sender Name is required'),
  senderContact: z.string().optional(),
  senderRegion: z.string().min(1, 'Sender Region is required'),
  senderAddress: z.string().min(1, 'Sender Address is required'),
  receiverName: z.string().min(1, 'Receiver Name is required'),
  receiverContact: z.string().optional(),
  receiverRegion: z.string().min(1, 'Receiver Region is required'),
  receiverAddress: z.string().min(1, 'Receiver Address is required'),
  weight: z.number().optional().or(z.string().optional()),
  pickupServiceCenter: z.string().optional(),
  deliveryServiceCenter: z.string().optional()
});

export const updateParcelStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  message: z.string().optional(),
  riderEmail: z.string().email().optional()
});
