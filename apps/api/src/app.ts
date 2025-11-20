import express, { Express } from "express";
import cors from "cors";
import { createJobRoutes } from "./routes/job-routes";
import { errorHandler } from "./middlewares/error-handler";

export const createApp = (): Express => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", createJobRoutes());

  app.use(errorHandler);

  return app;
};
