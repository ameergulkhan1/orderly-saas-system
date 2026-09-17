import { z } from 'zod';

// Use string literal types instead of importing from @prisma/client
export const createBusinessSchema = z.object({
  name: z.string().min(2).max(150),
  phone: z.string().min(10).max(30),
  email: z.string().email().max(255).optional(),
  address: z.string().max(500).optional(),
  currency: z.string().default('PKR'),
  timezone: z.string().default('Asia/Karachi')
});

export const updateBusinessSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  phone: z.string().min(10).max(30).optional(),
  email: z.string().email().max(255).optional(),
  address: z.string().max(500).optional(),
  logoUrl: z.string().max(1000).optional(),
  currency: z.string().optional(),
  timezone: z.string().optional()
});

export const inviteUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(2).max(120),
  role: z.enum(['OWNER', 'ADMIN', 'STAFF'])
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'STAFF'])
});