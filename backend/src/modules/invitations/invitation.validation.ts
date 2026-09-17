import { z } from 'zod';

export const createInvitationSchema = z.object({
  body: z.object({
    email: z.string().email().max(255),
    name: z.string().min(2).max(120),
    role: z.enum(['ADMIN', 'STAFF']) // ✅ Only ADMIN and STAFF
  })
});

export const acceptInvitationSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    name: z.string().min(2).max(120),
    password: z.string().min(8).max(255)
  })
});

export const validateInvitationSchema = z.object({
  params: z.object({
    token: z.string().min(1)
  })
});

export const invitationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED']).optional()
  })
});