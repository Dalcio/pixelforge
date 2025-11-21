import { Router } from "express";
import { createJobController } from "../controllers/create-job-controller";
import { getJobController } from "../controllers/get-job-controller";
import { listJobsController } from "../controllers/list-jobs-controller";
import { retryJobController } from "../controllers/retry-job-controller";
import { deleteJobController } from "../controllers/delete-job-controller";

export const createJobRoutes = (): Router => {
  const router = Router();

  /**
   * @openapi
   * /api/jobs:
   *   post:
   *     tags:
   *       - Jobs
   *     summary: Create a new image processing job
   *     description: Submit an image URL with optional transformations to create a new processing job
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateJobRequest'
   *           examples:
   *             basic:
   *               summary: Basic resize
   *               value:
   *                 inputUrl: "https://example.com/image.jpg"
   *                 transformations:
   *                   width: 800
   *                   height: 600
   *             advanced:
   *               summary: Multiple transformations
   *               value:
   *                 inputUrl: "https://example.com/photo.png"
   *                 transformations:
   *                   width: 1200
   *                   grayscale: true
   *                   sharpen: true
   *                   quality: 90
   *     responses:
   *       201:
   *         description: Job created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CreateJobResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       413:
   *         $ref: '#/components/responses/TooLarge'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  router.post("/jobs", createJobController);

  /**
   * @openapi
   * /api/jobs/{id}/retry:
   *   put:
   *     tags:
   *       - Jobs
   *     summary: Retry a failed job
   *     description: Reset and requeue a failed job for processing
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Job ID
   *         example: "abc123def456"
   *     responses:
   *       200:
   *         description: Job successfully retried
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Job'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  router.put("/jobs/:id/retry", retryJobController);

  /**
   * @openapi
   * /api/jobs/{id}:
   *   delete:
   *     tags:
   *       - Jobs
   *     summary: Delete a job
   *     description: Delete a job and its associated processed image from storage
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Job ID
   *         example: "abc123def456"
   *     responses:
   *       200:
   *         description: Job deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Job deleted successfully"
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   *   get:
   *     tags:
   *       - Jobs
   *     summary: Get job status
   *     description: Retrieve detailed information about a specific job
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Job ID
   *         example: "abc123def456"
   *     responses:
   *       200:
   *         description: Job details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Job'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  router.delete("/jobs/:id", deleteJobController);
  router.get("/jobs/:id", getJobController);

  /**
   * @openapi
   * /api/jobs:
   *   get:
   *     tags:
   *       - Jobs
   *     summary: List all jobs
   *     description: Retrieve a list of all image processing jobs
   *     responses:
   *       200:
   *         description: Jobs retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/JobList'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  router.get("/jobs", listJobsController);

  return router;
};
