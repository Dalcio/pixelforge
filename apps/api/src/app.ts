import express, { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { createJobRoutes } from "./routes/job-routes";
import { errorHandler } from "./middlewares/error-handler";
import { createRateLimiter } from "./middlewares/rate-limiter";
import {
  createCorsMiddleware,
  handleCorsError,
} from "./middlewares/cors-config";
import { swaggerSpec } from "./lib/swagger-config";

export const createApp = (): Express => {
  const app = express();

  app.use(createCorsMiddleware());
  app.use(express.json({ limit: "1mb" }));

  // Apply rate limiting to all routes except /health and /docs
  app.use(createRateLimiter());

  // Swagger API documentation (excluded from rate limiting)
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "PixelForge API Documentation",
  }));

  /**
   * @openapi
   * /health:
   *   get:
   *     tags:
   *       - Health
   *     summary: Health check endpoint
   *     description: Check if the API service is running and responsive
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthCheck'
   */
  // Health check endpoint (excluded from rate limiting)
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", createJobRoutes());

  // CORS error handler (must be before general error handler)
  app.use(handleCorsError);
  app.use(errorHandler);

  return app;
};
