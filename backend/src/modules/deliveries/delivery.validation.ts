import { z } from 'zod';

export const createDeliverySchema = z.object({
  orderId: z.string().uuid(),
  courier: z.string().max(100).optional(),
  trackingNumber: z.string().max(150).optional(),
  deliveryFee: z.number().min(0).default(0),
  notes: z.string().max(1000).optional()
});

export const updateDeliverySchema = z.object({
  courier: z.string().max(100).optional(),
  trackingNumber: z.string().max(150).optional(),
  notes: z.string().max(1000).optional()
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['PENDING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'FAILED', 'RETURNED'])
});

export const deliveryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['PENDING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'FAILED', 'RETURNED']).optional(),
  orderId: z.string().uuid().optional()
});