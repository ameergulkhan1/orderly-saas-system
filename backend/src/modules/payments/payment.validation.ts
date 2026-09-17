import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    amount: z.number().positive('Amount must be greater than 0'),
    method: z.enum(['COD', 'CASH', 'BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'CARD', 'OTHER']),
    reference: z.string().max(150).optional(),
    notes: z.string().max(1000).optional()
  })
});

export const recordPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    amount: z.number().positive('Amount must be greater than 0'),
    method: z.enum(['COD', 'CASH', 'BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'CARD', 'OTHER']),
    status: z.enum(['PENDING', 'PAID', 'PARTIAL', 'REFUNDED', 'FAILED']),
    reference: z.string().max(150).optional(),
    notes: z.string().max(1000).optional(),
    paidAt: z.string().datetime().optional()
  })
});

export const updatePaymentSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'PAID', 'PARTIAL', 'REFUNDED', 'FAILED']).optional(),
    reference: z.string().max(150).optional(),
    notes: z.string().max(1000).optional()
  })
});

export const paymentQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    orderId: z.string().uuid().optional(),
    status: z.enum(['PENDING', 'PAID', 'PARTIAL', 'REFUNDED', 'FAILED']).optional(),
    method: z.enum(['COD', 'CASH', 'BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'CARD', 'OTHER']).optional()
  })
});