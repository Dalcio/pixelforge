import { Request, Response, NextFunction } from 'express';
import { getJobById } from '../services/job-query-service';

export const getJobController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await getJobById(id);

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
};
