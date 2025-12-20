import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth. js';

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next:  NextFunction
) => {
  if (! req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};