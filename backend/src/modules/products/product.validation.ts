import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    sku: z.string().max(100).optional(),
    description: z.string().max(2000).optional(),
    category: z.string().max(100).optional(),
    price: z.number().positive(),
    costPrice: z.number().positive().optional(),
    currentStock: z.number().int().min(0).default(0),
    lowStockThreshold: z.number().int().min(0).default(5)
  })
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    sku: z.string().max(100).optional(),
    description: z.string().max(2000).optional(),
    category: z.string().max(100).optional(),
    price: z.number().positive().optional(),
    costPrice: z.number().positive().optional(),
    currentStock: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).optional()
  })
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).optional()
  })
});