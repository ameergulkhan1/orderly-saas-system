import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

import routes from './routes';

import {
  errorMiddleware,
  notFoundMiddleware,
} from './middleware/error.middleware';

import { requestIdMiddleware } from './middleware/requestId.middleware';
import { corsOptions } from './config/cors';
import { securityConfig } from './config/security';
import { logger } from './config/logger';

const app = express();

// --------------------------------------------------
// Request ID
// --------------------------------------------------
app.use(requestIdMiddleware);

// --------------------------------------------------
// Security
// --------------------------------------------------
app.use(helmet(securityConfig.helmet));

app.use(cors(corsOptions));

// --------------------------------------------------
// Compression
// --------------------------------------------------
app.use(compression());

// --------------------------------------------------
// Body parsing
// --------------------------------------------------
app.use(
  json({
    limit: securityConfig.requestSize.json,
  })
);

app.use(
  urlencoded({
    extended: true,
    limit: securityConfig.requestSize.urlencoded,
  })
);

// --------------------------------------------------
// Request logging
// --------------------------------------------------
app.use((req: any, res: any, next: any) => {
  const startTime = Date.now();

  logger.info({
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info({
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      businessId: req.user?.businessId,
    });
  });

  next();
});

// --------------------------------------------------
// API root
// --------------------------------------------------
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'orderly-backend',
    message: 'Orderly API is running',
  });
});

// --------------------------------------------------
// Health check
// --------------------------------------------------
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'orderly-backend',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------------------
// API routes
// --------------------------------------------------
app.use('/', routes);

// --------------------------------------------------
// 404 handler
// --------------------------------------------------
app.use(notFoundMiddleware);

// --------------------------------------------------
// Global error handler
// --------------------------------------------------
app.use(errorMiddleware);

export default app;