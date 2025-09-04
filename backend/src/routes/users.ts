import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';
import { authorizeRoles } from '../middleware/auth.js';

const router = Router();

// Get user profile
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
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
        _count: {
          select: {
            matters: true,
            billableEntries: true,
            emailProviders: true,
          },
        },
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

// Update user profile
router.put(
  '/profile',
  [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('preferences').optional().isObject(),
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

      if (!req.user) {
        res.status(401).json({
          error: {
            message: 'Authentication required',
            code: 'AUTH_REQUIRED',
          },
        });
        return;
      }

      const { firstName, lastName, preferences } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(preferences && { preferences }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isEmailVerified: true,
          preferences: true,
          updatedAt: true,
        },
      });

      res.json({
        user,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update profile',
          code: 'UPDATE_PROFILE_ERROR',
        },
      });
    }
  }
);

// Get all users (admin only)
router.get('/', authorizeRoles('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: offset,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              matters: true,
              billableEntries: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get users',
        code: 'GET_USERS_ERROR',
      },
    });
  }
});

// Get user by ID (admin only)
router.get('/:id', authorizeRoles('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
        _count: {
          select: {
            matters: true,
            billableEntries: true,
            emailProviders: true,
          },
        },
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
    console.error('Get user error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get user',
        code: 'GET_USER_ERROR',
      },
    });
  }
});

// Update user (admin only)
router.put(
  '/:id',
  authorizeRoles('admin'),
  [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('role').optional().isIn(['admin', 'user', 'premium']),
    body('isEmailVerified').optional().isBoolean(),
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

      const { id } = req.params;
      const { firstName, lastName, role, isEmailVerified } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(role && { role }),
          ...(typeof isEmailVerified === 'boolean' && { isEmailVerified }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isEmailVerified: true,
          updatedAt: true,
        },
      });

      res.json({
        user,
        message: 'User updated successfully',
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update user',
          code: 'UPDATE_USER_ERROR',
        },
      });
    }
  }
);

// Delete user (admin only)
router.delete('/:id', authorizeRoles('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Soft delete by setting deletedAt
    await prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user?.id,
      },
    });

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to delete user',
        code: 'DELETE_USER_ERROR',
      },
    });
  }
});

export default router;
