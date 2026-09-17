import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(10).max(30),
    email: z.string().email().max(255).optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    notes: z.string().max(2000).optional()
  })
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    phone: z.string().min(10).max(30).optional(),
    email: z.string().email().max(255).optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    notes: z.string().max(2000).optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).optional()
  })
});

export const customerQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).optional()
  })
});