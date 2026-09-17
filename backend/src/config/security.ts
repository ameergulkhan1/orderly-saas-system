import { env } from './env'; // Fixed import path

// Security configuration
export const securityConfig = {
  cors: {
    origin: env.NODE_ENV === 'production' 
      ? env.CORS_ORIGIN?.split(',') || ['https://yourdomain.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400,
  },

  rateLimit: {
    general: { windowMs: 60 * 1000, max: 200, message: 'Too many requests' },
    login: { windowMs: 60 * 1000, max: 20, message: 'Too many login attempts' },
    register: { windowMs: 60 * 1000, max: 10, message: 'Too many registration attempts' },
    forgotPassword: { windowMs: 60 * 1000, max: 5, message: 'Too many password reset attempts' },
    api: { windowMs: 60 * 1000, max: 300, message: 'API rate limit exceeded' },
  },

  requestSize: { json: '1mb', urlencoded: '1mb', file: '10mb' },

  jwt: {
    accessTokenSecret: env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
  },

  password: {
    minLength: 8,
    maxLength: 255,
    hashRounds: 12,
  },

  session: {
    cookieName: 'session',
    secret: env.SESSION_SECRET || 'default-secret',
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },

  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny' as const,
    },
    noSniff: true,
    referrerPolicy: {
      policy: 'same-origin' as const,
    },
    xssFilter: true,
  },
};