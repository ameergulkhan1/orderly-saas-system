import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/httpError';

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Ensure user has a businessId
  const businessId = req.user?.businessId;
  
  if (!businessId) {
    throw new HttpError(403, 'No business context found');
  }

  // Attach businessId to request for use in controllers
  req.businessId = businessId;
  
  next();
};

// Extended Request type
declare global {
  namespace Express {
    interface Request {
      businessId: string;
      user: {
        id: string;
        businessId: string;
        role: string;
        email: string;
      };
    }
  }
}