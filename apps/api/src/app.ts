import express, { Express } from "express";
import { createJobRoutes } from "./routes/job-routes";
import { errorHandler } from "./middlewares/error-handler";
import { createRateLimiter } from "./middlewares/rate-limiter";
import { createCorsMiddleware, handleCorsError } from "./middlewares/cors-config";

export const createApp = (): Express => {
  const app = express();

  app.use(createCorsMiddleware());
  app.use(express.json({ limit: "1mb" }));
  
  // Apply rate limiting to all routes except /health
  app.use(createRateLimiter());

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
