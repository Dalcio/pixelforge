import { Request, Response, NextFunction } from "express";
import { validateCreateJob } from "../validators/job-validator";
import { checkUrlReachability } from "../validators/url-reachability-checker";
import { createJob } from "../services/job-service";
import { JobStatus } from "@fluximage/types";

export const createJobController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { inputUrl } = validateCreateJob(req.body);
    const { transformations } = req.body;

    const isReachable = await checkUrlReachability(inputUrl);
    if (!isReachable) {
      res.status(400).json({ error: "URL is not reachable" });
      return;
    }

    const jobId = await createJob(inputUrl, transformations);

    res.status(201).json({
      id: jobId,
      status: JobStatus.PENDING,
    });
  } catch (error) {
    next(error);
  }
};
