import { z } from 'zod';

const CATEGORIES = [
  'clothing',
  'cosmetics',
  'food',
  'electronics',
  'jewelry',
  'other',
] as const;

export const completeOnboardingSchema = z.object({
  body: z.object({
    business: z.object({
      businessName: z.string().min(2).max(150).optional(),
      category: z.enum(CATEGORIES),
    }),

    // Optional — seller may skip
    product: z
      .object({
        name: z.string().min(2).max(150),
        price: z.number().positive(),
        stock: z.number().int().min(0),
        sku: z.string().max(100).optional(),
      })
      .optional(),

    // Optional — seller may skip
    customer: z
      .object({
        name: z.string().min(2).max(120),
        phone: z.string().min(10).max(30),
        address: z.string().max(500).optional(),
        city: z.string().max(100).optional(),
      })
      .optional(),
  }),
});

export type CompleteOnboardingInput = z.infer<
  typeof completeOnboardingSchema
>['body'];