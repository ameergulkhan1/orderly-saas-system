import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import routes from './routes';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { corsOptions } from './config/cors';
import { securityConfig } from './config/security';
import { logger } from './config/logger';
// Remove this: import { env } from './config/env';

const app = express();

app.use(requestIdMiddleware);
app.use(helmet(securityConfig.helmet));
app.use(cors(corsOptions));
app.use(compression());
app.use(json({ limit: securityConfig.requestSize.json }));
app.use(urlencoded({ 
  extended: true, 
  limit: securityConfig.requestSize.urlencoded 
}));

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

app.use('/', routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;