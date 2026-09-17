import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { securityConfig } from '../config/security';
import { HttpError } from '../lib/httpError';

// General rate limiter
export const generalRateLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.general.windowMs,
  max: securityConfig.rateLimit.general.max,
  message: securityConfig.rateLimit.general.message,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    throw new HttpError(429, securityConfig.rateLimit.general.message, 'RATE_LIMIT_EXCEEDED');
  },
});

// Login rate limiter
export const loginRateLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.login.windowMs,
  max: securityConfig.rateLimit.login.max,
  message: securityConfig.rateLimit.login.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    throw new HttpError(429, securityConfig.rateLimit.login.message, 'RATE_LIMIT_EXCEEDED');
  },
});

// Register rate limiter
export const registerRateLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.register.windowMs,
  max: securityConfig.rateLimit.register.max,
  message: securityConfig.rateLimit.register.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    throw new HttpError(429, securityConfig.rateLimit.register.message, 'RATE_LIMIT_EXCEEDED');
  },
});

// Forgot password rate limiter
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.forgotPassword.windowMs,
  max: securityConfig.rateLimit.forgotPassword.max,
  message: securityConfig.rateLimit.forgotPassword.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    throw new HttpError(429, securityConfig.rateLimit.forgotPassword.message, 'RATE_LIMIT_EXCEEDED');
  },
});

// API rate limiter for authenticated endpoints
export const apiRateLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.api.windowMs,
  max: securityConfig.rateLimit.api.max,
  message: securityConfig.rateLimit.api.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    throw new HttpError(429, securityConfig.rateLimit.api.message, 'RATE_LIMIT_EXCEEDED');
  },
  keyGenerator: (req: Request) => {
    // Use userId if authenticated, otherwise IP
    return req.user?.id || req.ip || 'anonymous';
  },
});