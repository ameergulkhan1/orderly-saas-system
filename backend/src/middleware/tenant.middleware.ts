import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/httpError';

export const tenantMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const businessId = req.user.businessId;

  if (!businessId) {
    throw new HttpError(403, 'No business context found', 'NO_BUSINESS_CONTEXT');
  }

  req.businessId = businessId;

  next();
};