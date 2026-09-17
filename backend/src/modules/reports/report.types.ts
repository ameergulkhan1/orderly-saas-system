import { z } from 'zod';

export const reportQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;