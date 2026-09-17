import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive().optional()
});

export const createOrderSchema = z.object({
  body: z.object({
    customer: z.object({
      name: z.string().min(2).max(120),
      phone: z.string().min(10).max(30),
      email: z.string().email().max(255).optional(),
      address: z.string().max(500).optional(),
      city: z.string().max(100).optional()
    }),
    items: z.array(orderItemSchema).min(1),
    paymentMethod: z.enum(['COD', 'CASH', 'BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'CARD', 'OTHER']),
    deliveryFee: z.number().min(0).default(0),
    notes: z.string().max(2000).optional(),
    advancePayment: z.number().min(0).default(0),
    discount: z.number().min(0).default(0)
  })
});

export const updateOrderSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['COD', 'CASH', 'BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'CARD', 'OTHER']).optional(),
    deliveryAddress: z.string().max(500).optional(),
    deliveryCity: z.string().max(100).optional(),
    notes: z.string().max(2000).optional(),
    discount: z.number().min(0).optional(),
    deliveryFee: z.number().min(0).optional()
  })
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'NEW', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP',
      'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED_DELIVERY', 'RETURNED'
    ]),
    notes: z.string().max(2000).optional()
  })
});

export const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string().min(2).max(500)
  })
});

export const orderQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum([
      'NEW', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP',
      'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED_DELIVERY', 'RETURNED'
    ]).optional(),
    paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'FAILED', 'REFUNDED']).optional(),
    customerId: z.string().uuid().optional(),
    search: z.string().optional()
  })
});