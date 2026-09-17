export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any[];

  constructor(
    statusCode: number,
    message: string,
    code: string = 'HTTP_ERROR',
    details?: any[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'HttpError';
    Error.captureStackTrace(this, HttpError);
  }

  static badRequest(message: string, code: string = 'BAD_REQUEST') {
    return new HttpError(400, message, code);
  }

  static unauthorized(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    return new HttpError(401, message, code);
  }

  static forbidden(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    return new HttpError(403, message, code);
  }

  static notFound(message: string = 'Not found', code: string = 'NOT_FOUND') {
    return new HttpError(404, message, code);
  }

  static conflict(message: string = 'Conflict', code: string = 'CONFLICT') {
    return new HttpError(409, message, code);
  }

  static validation(message: string, details?: any[]) {
    return new HttpError(400, message, 'VALIDATION_ERROR', details);
  }

  static internal(message: string = 'Internal server error', code: string = 'INTERNAL_SERVER_ERROR') {
    return new HttpError(500, message, code);
  }
}