import { z } from "zod";

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().max(255).optional(),
  }),
});

export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]),
  }),
});

export const userQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    role: z.enum(["OWNER", "ADMIN", "STAFF"]).optional(),
    status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).optional(),
  }),
});