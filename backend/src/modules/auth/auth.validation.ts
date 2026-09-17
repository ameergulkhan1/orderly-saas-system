import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(255),
    password: z.string().min(8).max(255),
    businessName: z.string().min(2).max(150),
    phone: z.string().min(10).max(30),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(255),
  }),
});

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Firebase ID token is required'),
  }),
});

export const googleRegisterSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Firebase ID token is required'),
    businessName: z.string().min(2).max(150).optional(),
    phone: z.string().min(10).max(30).optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8).max(255),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email().max(255),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(255),
  }),
});