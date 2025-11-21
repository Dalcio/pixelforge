import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

/**
 * Rate limiter configuration
 * - 100 requests per 15 minutes per IP
 * - Excludes /health endpoint
 */
export const createRateLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes",
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req: Request) => {
      // Skip rate limiting for health check endpoint
      return req.path === "/health" || req.path === "/api/health";
    },
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        error: "Too many requests from this IP, please try again later.",
        retryAfter: "15 minutes",
        limit: 100,
        windowMs: 15 * 60 * 1000,
      });
    },
  });
};
