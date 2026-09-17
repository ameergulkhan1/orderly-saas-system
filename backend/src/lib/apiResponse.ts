import { Response } from 'express';

export const apiResponse = {
  success: <T>(
    res: Response,
    statusCode: number = 200,
    message: string = 'Success',
    data?: T,
    meta?: { page?: number; limit?: number; total?: number; totalPages?: number }
  ): Response => {
    const response: any = { success: true, message };
    if (data !== undefined) response.data = data;
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  },

  paginated: <T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Success'
  ): Response => {
    return res.status(200).json({
      success: true,
      message,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  },

  created: <T>(res: Response, data: T, message: string = 'Resource created successfully'): Response => {
    return apiResponse.success(res, 201, message, data);
  },

  noContent: (res: Response): Response => {
    return res.status(204).json();
  },

  error: (res: Response, statusCode: number, code: string, message: string, details?: any[]): Response => {
    return res.status(statusCode).json({
      success: false,
      error: { code, message, details }
    });
  },

  validationError: (res: Response, details: any[]): Response => {
    return apiResponse.error(res, 400, 'VALIDATION_ERROR', 'Validation failed', details);
  }
};