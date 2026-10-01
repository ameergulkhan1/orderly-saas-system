import winston from 'winston';
import { env } from './env';

const transports: winston.transport[] = [];

// Console logging
transports.push(
  new winston.transports.Console({
    format:
      env.NODE_ENV === 'production'
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.timestamp(),
            winston.format.printf(
              ({ level, message, timestamp, ...meta }) => {
                const metaStr = Object.keys(meta).length
                  ? JSON.stringify(meta, null, 2)
                  : '';

                return `${timestamp} [${level}]: ${message} ${metaStr}`;
              }
            )
          ),
  })
);

// File logging only outside production/Vercel
if (env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),

  transports,
});