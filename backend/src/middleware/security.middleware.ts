import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { securityConfig } from '../../src/config/security';

// Helmet middleware
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' },
  xssFilter: true,
});

export const requestSizeLimit = (limit: string = '1mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const limitBytes = parseSize(limit);

    if (contentLength > limitBytes) {
      res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request payload too large. Maximum allowed: ${limit}`,
        },
      });
      return;
    }

    next();
  };
};

function parseSize(size: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.match(/^(\d+)(b|kb|mb|gb)$/i);
  if (!match) {
    return parseInt(size, 10) || 1048576;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  return value * (units[unit] || 1);
}

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  next();
};

function sanitizeObject(obj: any) {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        obj[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/onerror=/gi, '')
          .replace(/onload=/gi, '')
          .replace(/onclick=/gi, '')
          .replace(/onmouseover=/gi, '')
          .trim();
      } else if (typeof value === 'object' && value !== null) {
        sanitizeObject(value);
      }
    }
  }
}
