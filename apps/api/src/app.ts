import express, { Express } from 'express';
import cors from 'cors';
import { createJobRoutes } from './routes/job-routes';
import { errorHandler } from './middlewares/error-handler';
import { isRedisHealthy } from './lib/redis-client';

export const createApp = (): Express => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Health check endpoint
  app.get('/health', async (_req, res) => {
    const redisHealthy = await isRedisHealthy();
    
    const health = {
      status: redisHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: redisHealthy ? 'connected' : 'disconnected',
    };

    const statusCode = redisHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  });

  app.use('/api', createJobRoutes());

  app.use(errorHandler);

  return app;
};
