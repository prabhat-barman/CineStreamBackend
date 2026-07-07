import type {NextFunction, Request, Response} from 'express';
import {verifyToken, type JwtPayload} from '../lib/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({error: 'Missing bearer token'});
  }
  try {
    req.user = verifyToken(header.slice(7));
    return next();
  } catch {
    return res.status(401).json({error: 'Invalid or expired token'});
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({error: 'Admin access required'});
  }
  return next();
}
