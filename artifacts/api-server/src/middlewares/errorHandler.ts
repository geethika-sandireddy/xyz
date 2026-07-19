import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger.js";

export interface ApiError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Global error handler middleware.
 * Catches any error thrown or passed via next(err) in route handlers.
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? err.statusCode ?? 500;
  const message = status < 500 ? err.message : "Internal server error";

  if (status >= 500) {
    logger.error({ err, req: { method: req.method, url: req.url } }, "Unhandled server error");
  }

  res.status(status).json({ error: message });
}

/**
 * 404 handler — catches requests that didn't match any route.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}
