import dotenv from 'dotenv';

// Load .env locally.
// In Vercel, environment variables are provided automatically.
dotenv.config();

const requiredEnvVars = [
  'DATABASE_URL',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `Missing required environment variable: ${envVar}`
    );
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  PORT: parseInt(process.env.PORT || '4000', 10),

  DATABASE_URL: process.env.DATABASE_URL!,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,

  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,

  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',

  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',

  CORS_ORIGIN:
    process.env.CORS_ORIGIN || 'http://localhost:3000',

  SESSION_SECRET:
    process.env.SESSION_SECRET ||
    'default-session-secret-change-me',

  RATE_LIMIT_WINDOW: parseInt(
    process.env.RATE_LIMIT_WINDOW || '60',
    10
  ),

  RATE_LIMIT_MAX: parseInt(
    process.env.RATE_LIMIT_MAX || '100',
    10
  ),

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

console.log('✅ Environment variables loaded successfully');
console.log(`📦 NODE_ENV: ${env.NODE_ENV}`);