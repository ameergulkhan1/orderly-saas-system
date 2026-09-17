import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { HttpError } from '../lib/httpError';

// Validation Middleware - Is the data valid?
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body/query/params
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Replace request data with validated data
      req.body = validatedData.body || req.body;
      req.query = validatedData.query || req.query;
      req.params = validatedData.params || req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          type: err.code
        }));

        // ✅ FIX: Use HttpError and pass to next()
        next(new HttpError(400, 'Validation failed', 'VALIDATION_ERROR', details));
      } else {
        next(error);
      }
    }
  };
};

// Validate only body
export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          type: err.code
        }));
        next(new HttpError(400, 'Validation failed', 'VALIDATION_ERROR', details));
      } else {
        next(error);
      }
    }
  };
};

// Validate only query
export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          type: err.code
        }));
        next(new HttpError(400, 'Validation failed', 'VALIDATION_ERROR', details));
      } else {
        next(error);
      }
    }
  };
};