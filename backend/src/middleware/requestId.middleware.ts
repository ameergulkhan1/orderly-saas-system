import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Request ID middleware for tracking requests across the system
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Set response header
  res.setHeader('X-Request-Id', requestId);
  
  // Add request ID to response locals for logging
  res.locals.requestId = requestId;
  
  next();
};

// Extended Request type
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}