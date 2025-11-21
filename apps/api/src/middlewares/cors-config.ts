import cors, { CorsOptions } from "cors";
import { Request, Response } from "express";

/**
 * Parse ALLOWED_ORIGINS environment variable into an array of allowed origins
 * Format: comma-separated list (e.g., "http://localhost:5173,https://example.com")
 */
const getAllowedOrigins = (): string[] => {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || "";
  
  if (!allowedOriginsEnv) {
    // Default to localhost:5173 for development
    return ["http://localhost:5173"];
  }

  return allowedOriginsEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

/**
 * Creates CORS middleware with environment-based origin whitelist
 * - ALLOWED_ORIGINS env variable (comma-separated)
 * - Defaults to localhost:5173 if not set
 * - Rejects requests from non-whitelisted origins with 403
 */
export const createCorsMiddleware = () => {
  const allowedOrigins = getAllowedOrigins();

  const corsOptions: CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  return cors(corsOptions);
};

/**
 * Express error handler for CORS errors
 * Converts CORS errors to 403 Forbidden responses
 */
export const handleCorsError = (
  err: Error,
  _req: Request,
  res: Response,
  next: (err?: Error) => void
) => {
  if (err.message.includes("not allowed by CORS")) {
    res.status(403).json({
      error: "Forbidden",
      message: err.message,
    });
  } else {
    next(err);
  }
};
