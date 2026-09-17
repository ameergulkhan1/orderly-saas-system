import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from '../lib/httpError';
import { asyncHandler } from '../lib/asyncHandler';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        businessId: string;
        role: string;
        name?: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  email?: string;
  businessId: string;
  role?: string;
  iat: number;
  exp: number;
}

export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'No token provided. Please login first.', 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new HttpError(401, 'Invalid token format. Expected: Bearer <token>', 'INVALID_TOKEN_FORMAT');
    }

    let decoded: JwtPayload;
    try {
      decoded = verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new HttpError(401, 'Token expired. Please login again.', 'TOKEN_EXPIRED');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new HttpError(401, 'Invalid token. Please login again.', 'INVALID_TOKEN');
      }
      throw new HttpError(401, 'Authentication failed. Please login again.', 'AUTH_FAILED');
    }

    // ✅ Only check for userId and businessId
    if (!decoded.userId) {
      throw new HttpError(401, 'Invalid token payload: Missing userId.', 'INVALID_TOKEN_PAYLOAD');
    }

    if (!decoded.businessId) {
      throw new HttpError(401, 'Invalid token payload: Missing businessId.', 'INVALID_TOKEN_PAYLOAD');
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email || '',
      businessId: decoded.businessId,
      role: decoded.role || 'STAFF'
    };

    next();
  }
);