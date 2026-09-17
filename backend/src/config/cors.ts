import cors from 'cors';
import { securityConfig } from './security';
import { env } from './env';

// CORS middleware configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    const allowedOrigins = env.NODE_ENV === 'production'
      ? env.CORS_ORIGIN?.split(',') || ['https://yourdomain.com']
      : ['http://localhost:3000', 'http://localhost:3001'];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    }
  },
  credentials: securityConfig.cors.credentials,
  optionsSuccessStatus: securityConfig.cors.optionsSuccessStatus,
  methods: securityConfig.cors.methods,
  allowedHeaders: securityConfig.cors.allowedHeaders,
  exposedHeaders: securityConfig.cors.exposedHeaders,
  maxAge: securityConfig.cors.maxAge,
};

// Pre-flight request handler
export const corsMiddleware = cors(corsOptions);