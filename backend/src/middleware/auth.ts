import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: {
          message: 'Access token required',
          code: 'MISSING_TOKEN',
        },
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as JwtPayload;

    // Check if session is still active
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || !session.isActive) {
      res.status(401).json({
        error: {
          message: 'Session expired or invalid',
          code: 'INVALID_SESSION',
        },
      });
      return;
    }

    // Check if token is expired
    if (new Date() > session.expiresAt) {
      res.status(401).json({
        error: {
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        },
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        },
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: {
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        },
      });
      return;
    }

    next(error);
  }
};

// Role-based authorization middleware
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        },
      });
      return;
    }

    next();
  };
};

// Optional authentication (for endpoints that work with or without auth)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as JwtPayload;

      const session = await prisma.session.findUnique({
        where: { token },
      });

      if (session && session.isActive && new Date() <= session.expiresAt) {
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};
