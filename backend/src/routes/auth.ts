import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Generate JWT token
const generateToken = (user: any): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '24h' }
  );
};

// Create session
const createSession = async (
  userId: string,
  token: string,
  req: Request
): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      deviceInfo: {
        type: 'web',
        os: 'unknown',
        browser: 'unknown',
      },
    },
  });
};

// Register new user
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array(),
          },
        });
        return;
      }

      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({
          error: {
            message: 'User with this email already exists',
            code: 'USER_EXISTS',
          },
        });
        return;
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          preferences: {
            theme: 'system',
            timezone: 'UTC',
            dateFormat: 'MM/dd/yyyy',
            currency: 'USD',
            autoSync: true,
            emailNotifications: true,
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
        },
      });

      // Generate token and create session
      const token = generateToken(user);
      await createSession(user.id, token, req);

      res.status(201).json({
        user,
        token,
        message: 'User registered successfully',
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: {
          message: 'Registration failed',
          code: 'REGISTRATION_ERROR',
        },
      });
    }
  }
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array(),
          },
        });
        return;
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.passwordHash) {
        res.status(401).json({
          error: {
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS',
          },
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json({
          error: {
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS',
          },
        });
        return;
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate token and create session
      const token = generateToken(user);
      await createSession(user.id, token, req);

      // Return user data (excluding sensitive info)
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        preferences: user.preferences,
      };

      res.json({
        user: userData,
        token,
        message: 'Login successful',
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: {
          message: 'Login failed',
          code: 'LOGIN_ERROR',
        },
      });
    }
  }
);

// Logout user
router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Deactivate session
      await prisma.session.updateMany({
        where: { token },
        data: { isActive: false },
      });
    }

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: {
        message: 'Logout failed',
        code: 'LOGOUT_ERROR',
      },
    });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        },
      });
      return;
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        preferences: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
      return;
    }

    // Generate new token
    const token = generateToken(user);
    await createSession(user.id, token, req);

    res.json({
      user,
      token,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: {
        message: 'Token refresh failed',
        code: 'REFRESH_ERROR',
      },
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        lastLoginAt: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
      return;
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get user profile',
        code: 'PROFILE_ERROR',
      },
    });
  }
});

export default router;
