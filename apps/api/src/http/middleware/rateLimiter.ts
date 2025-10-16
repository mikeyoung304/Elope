import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) =>
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
});

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // 120 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) =>
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Admin route rate limit exceeded.',
    }),
});

export const skipIfHealth = (req: Request, _res: Response, next: NextFunction) => {
  if (req.path === '/health' || req.path === '/ready') {
    return next();
  }
  return publicLimiter(req, _res, next);
};
