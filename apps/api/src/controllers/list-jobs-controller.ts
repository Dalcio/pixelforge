import { Request, Response, NextFunction } from 'express';
import { getAllJobs } from '../services/job-list-service';

export const listJobsController = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getAllJobs();
    res.json(result);
  } catch (error) {
    next(error);
  }
};
