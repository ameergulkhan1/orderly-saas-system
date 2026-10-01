import { CorsOptions } from 'cors';
import { env } from './env';

const allowedOrigins =
  env.NODE_ENV === 'production'
    ? [
        ...(env.CORS_ORIGIN
          ? env.CORS_ORIGIN
              .split(',')
              .map((origin) => origin.trim())
              .filter(Boolean)
          : []),

        'https://orderly-saas-system.vercel.app',
      ]
    : ['http://localhost:3000', 'http://localhost:3001'];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header
    if (!origin) {
      callback(null, true);
      return;
    }

    // Allow explicitly configured origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // Allow Orderly Vercel preview deployments
    if (
      origin.startsWith('https://orderly-saas-system-') &&
      origin.endsWith('-ameergulkhan1s-projects.vercel.app')
    ) {
      callback(null, true);
      return;
    }

    callback(
      new Error(`Origin [${origin}] not allowed by CORS`)
    );
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ],

  optionsSuccessStatus: 204,
};