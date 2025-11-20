import { Router } from 'express';
import { createJobController } from '../controllers/create-job-controller';
import { getJobController } from '../controllers/get-job-controller';
import { listJobsController } from '../controllers/list-jobs-controller';

export const createJobRoutes = (): Router => {
  const router = Router();

  router.post('/jobs', createJobController);
  router.get('/jobs/:id', getJobController);
  router.get('/jobs', listJobsController);

  return router;
};
