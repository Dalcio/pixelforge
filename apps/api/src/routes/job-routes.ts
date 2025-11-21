import { Router } from "express";
import { createJobController } from "../controllers/create-job-controller";
import { getJobController } from "../controllers/get-job-controller";
import { listJobsController } from "../controllers/list-jobs-controller";
import { retryJobController } from "../controllers/retry-job-controller";
import { deleteJobController } from "../controllers/delete-job-controller";

export const createJobRoutes = (): Router => {
  const router = Router();

  router.post("/jobs", createJobController);
  router.put("/jobs/:id/retry", retryJobController);
  router.delete("/jobs/:id", deleteJobController);
  router.get("/jobs/:id", getJobController);
  router.get("/jobs", listJobsController);

  return router;
};
