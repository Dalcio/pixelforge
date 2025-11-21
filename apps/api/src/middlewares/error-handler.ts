import { Request, Response, NextFunction } from "express";

interface ExpressError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

export const errorHandler = (
  err: ExpressError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  process.stderr.write(`Error: ${err.message || "Internal server error"}\n`);

  // Handle body-parser/express.json payload too large error
  if (
    err.type === "entity.too.large" ||
    err.status === 413 ||
    err.statusCode === 413
  ) {
    res.status(413).json({
      error: "Request body too large",
    });
    return;
  }

  res.status(500).json({
    error: err.message || "Internal server error",
  });
};
