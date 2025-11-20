import express, { Express } from 'express';
import cors from 'cors';
import { createJobRoutes } from './routes/job-routes';
import { errorHandler } from './middlewares/error-handler';

export const createApp = (): Express => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', createJobRoutes());

  app.use(errorHandler);

  return app;
};
