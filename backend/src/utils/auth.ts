import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import env from '@/config/env';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
    displayName: string;
  };
}

export const generateAccessToken = (payload: { _id: string; email: string; role: string }): string => {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as any,
  });
};

export const generateRefreshToken = (payload: { _id: string; email: string; role: string }): string => {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as any,
  });
};

export const verifyAccessToken = (token: string): any => {
  return jwt.verify(token, env.jwt.accessSecret);
};

export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, env.jwt.refreshSecret);
};

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.accessToken;
    if (!token) {
      res.status(401).json({ success: false, message: 'Access token required' });
      return;
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded._id).select('-password').populate('role');
    if (!user) {
      res.status(401).json({ success: false, message: 'Token invalid' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: `Account is ${user.status}` });
      return;
    }

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      role: (user.role as any).slug,
      displayName: user.displayName,
    };
    next();
  } catch (error: any) {
    logger.error('Auth middleware error', { error: error.message });
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.accessToken;
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded._id).select('-password').populate('role');
      if (user && user.status === 'active') {
        req.user = {
          _id: user._id.toString(),
          email: user.email,
          role: (user.role as any).slug,
          displayName: user.displayName,
        };
      }
    }
  } catch {
    // ignore
  }
  next();
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

export const requirePermission = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    try {
      const user = await User.findById(req.user._id).populate('role');
      const role = user?.role as any;
      const userPermissions: string[] = role?.permissions || [];
      const hasPermission = permissions.some((p) => userPermissions.includes(p));
      if (!hasPermission) {
        res.status(403).json({ success: false, message: 'Insufficient permissions' });
        return;
      }
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Permission check failed' });
    }
  };
};

export default authMiddleware;