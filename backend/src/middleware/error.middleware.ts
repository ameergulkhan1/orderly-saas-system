import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { HttpError } from '../lib/httpError';
import { env } from '../config/env';
import { logger } from '../config/logger';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any[];
    stack?: string;
  };
}

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // ---------- Resolve error shape ----------
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'Something went wrong. Please try again later.';
  let details: any[] | undefined;

  // HttpError (our custom errors — includes Zod details when thrown by validate middleware)
  if (err instanceof HttpError) {
    statusCode = err.statusCode;
    errorCode = err.code || 'HTTP_ERROR';
    message = err.message;
    details = err.details;
  }
  // Zod Validation Error (if thrown directly, not wrapped)
  else if (err instanceof ZodError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      type: e.code,
    }));
  }
  // JWT errors
  else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Token expired. Please login again.';
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid token. Please login again.';
  }
  // Prisma known request errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    errorCode = `PRISMA_${err.code}`;
    message = 'Database operation failed';

    switch (err.code) {
      case 'P2002':
        message = 'A record with these values already exists';
        details = [
          {
            field: (err.meta?.target as string[] | undefined)?.join(', ') ?? 'unknown',
            message: 'Unique constraint violation',
            type: 'P2002',
          },
        ];
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        message = 'Related record not found (foreign key violation)';
        break;
      case 'P2000':
        message = 'Value too long for column';
        break;
      case 'P2010':
        message = 'Raw query failed';
        break;
      default:
        message = `Database error: ${err.code}`;
    }
  }
  // Prisma validation error (malformed input at the ORM level)
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errorCode = 'PRISMA_VALIDATION_ERROR';
    message = 'Invalid data provided';
  }
  // Rate limit errors
  else if (err?.message === 'Too many requests' || err?.code === 'RATE_LIMIT_EXCEEDED') {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
    message = 'Too many requests. Please try again later.';
  }
  // Generic error carrying a status code
  else if (typeof err?.statusCode === 'number') {
    statusCode = err.statusCode;
    errorCode = err.code || 'HTTP_ERROR';
    message = err.message || 'An error occurred';
  }

  // ---------- Log (with details + code) ----------
  // This is what makes debugging possible. Without `details`, Zod field
  // errors are lost and you only see "Validation failed".
  const logPayload: Record<string, unknown> = {
    code: errorCode,
    message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
    businessId: (req as any).user?.businessId,
    stack: err.stack,
  };

  if (details && details.length > 0) {
    logPayload.details = details;
  }

  // Log level by status: 5xx → error, 4xx → warn, else → info
  if (statusCode >= 500) {
    logger.error(logPayload);
  } else if (statusCode >= 400) {
    logger.warn(logPayload);
  } else {
    logger.info(logPayload);
  }

  // ---------- Build response ----------
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
  };

  // Add stack trace in development only (skip for expected HttpErrors)
  if (env.NODE_ENV === 'development' && !(err instanceof HttpError)) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export const notFoundMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const error = new HttpError(
    404,
    `Route ${req.method} ${req.url} not found`,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};