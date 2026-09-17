import { z } from 'zod';

export const updateStockSchema = z.object({
  body: z.object({
    quantity: z.number().int().min(0),
    reason: z.string().max(500).optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    adjustment: z.number().int(),
    reason: z.string().min(2).max(500),
    type: z.enum(['RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE']),
  }),
});

export const inventoryQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  }),
});