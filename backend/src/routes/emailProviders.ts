import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';

const router = Router();

// Get all email providers for the authenticated user
router.get('/', async (req: Request, res: Response): Promise<void> => {
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

    const providers = await prisma.emailProvider.findMany({
      where: {
        userId: req.user.id,
        isDeleted: false,
      },
      select: {
        id: true,
        provider: true,
        email: true,
        displayName: true,
        isPrimary: true,
        isActive: true,
        lastSyncAt: true,
        syncStatus: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            emails: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      providers,
    });
  } catch (error) {
    console.error('Get email providers error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get email providers',
        code: 'GET_PROVIDERS_ERROR',
      },
    });
  }
});

// Get email provider by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
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

    const { id } = req.params;

    const provider = await prisma.emailProvider.findFirst({
      where: {
        id,
        userId: req.user.id,
        isDeleted: false,
      },
      select: {
        id: true,
        provider: true,
        email: true,
        displayName: true,
        isPrimary: true,
        isActive: true,
        settings: true,
        lastSyncAt: true,
        syncStatus: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            emails: true,
          },
        },
      },
    });

    if (!provider) {
      res.status(404).json({
        error: {
          message: 'Email provider not found',
          code: 'PROVIDER_NOT_FOUND',
        },
      });
      return;
    }

    res.json({
      provider,
    });
  } catch (error) {
    console.error('Get email provider error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get email provider',
        code: 'GET_PROVIDER_ERROR',
      },
    });
  }
});

// Create new email provider
router.post(
  '/',
  [
    body('provider').isIn(['gmail', 'outlook', 'imap', 'exchange']),
    body('email').isEmail().normalizeEmail(),
    body('displayName').optional().trim().isLength({ max: 255 }),
    body('settings').optional().isObject(),
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

      const { provider, email, displayName, settings = {} } = req.body;

      // Check if provider already exists for this email
      const existingProvider = await prisma.emailProvider.findFirst({
        where: {
          userId: req.user.id,
          email,
          isDeleted: false,
        },
      });

      if (existingProvider) {
        res.status(409).json({
          error: {
            message: 'Email provider already exists for this email',
            code: 'PROVIDER_EXISTS',
          },
        });
        return;
      }

      // If this is the first provider or marked as primary, handle primary status
      const isFirstProvider = await prisma.emailProvider.count({
        where: {
          userId: req.user.id,
          isDeleted: false,
        },
      }) === 0;

      const providerData: any = {
        userId: req.user.id,
        provider,
        email,
        displayName,
        settings,
        isPrimary: isFirstProvider,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      };

      const newProvider = await prisma.emailProvider.create({
        data: providerData,
        select: {
          id: true,
          provider: true,
          email: true,
          displayName: true,
          isPrimary: true,
          isActive: true,
          settings: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        provider: newProvider,
        message: 'Email provider created successfully',
      });
    } catch (error) {
      console.error('Create email provider error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to create email provider',
          code: 'CREATE_PROVIDER_ERROR',
        },
      });
    }
  }
);

// Update email provider
router.put(
  '/:id',
  [
    body('displayName').optional().trim().isLength({ max: 255 }),
    body('isPrimary').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
    body('settings').optional().isObject(),
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

      const { id } = req.params;
      const { displayName, isPrimary, isActive, settings } = req.body;

      // Check if provider exists and belongs to user
      const existingProvider = await prisma.emailProvider.findFirst({
        where: {
          id,
          userId: req.user.id,
          isDeleted: false,
        },
      });

      if (!existingProvider) {
        res.status(404).json({
          error: {
            message: 'Email provider not found',
            code: 'PROVIDER_NOT_FOUND',
          },
        });
        return;
      }

      // Handle primary status change
      if (isPrimary === true) {
        // Remove primary status from other providers
        await prisma.emailProvider.updateMany({
          where: {
            userId: req.user.id,
            isDeleted: false,
            id: { not: id },
          },
          data: { isPrimary: false },
        });
      }

      const provider = await prisma.emailProvider.update({
        where: { id },
        data: {
          ...(displayName !== undefined && { displayName }),
          ...(isPrimary !== undefined && { isPrimary }),
          ...(isActive !== undefined && { isActive }),
          ...(settings && { settings }),
          updatedBy: req.user.id,
        },
        select: {
          id: true,
          provider: true,
          email: true,
          displayName: true,
          isPrimary: true,
          isActive: true,
          settings: true,
          updatedAt: true,
        },
      });

      res.json({
        provider,
        message: 'Email provider updated successfully',
      });
    } catch (error) {
      console.error('Update email provider error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update email provider',
          code: 'UPDATE_PROVIDER_ERROR',
        },
      });
    }
  }
);

// Delete email provider (soft delete)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
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

    const { id } = req.params;

    // Check if provider exists and belongs to user
    const existingProvider = await prisma.emailProvider.findFirst({
      where: {
        id,
        userId: req.user.id,
        isDeleted: false,
      },
    });

    if (!existingProvider) {
      res.status(404).json({
        error: {
          message: 'Email provider not found',
          code: 'PROVIDER_NOT_FOUND',
        },
      });
      return;
    }

    // Soft delete
    await prisma.emailProvider.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.id,
      },
    });

    res.json({
      message: 'Email provider deleted successfully',
    });
  } catch (error) {
    console.error('Delete email provider error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to delete email provider',
        code: 'DELETE_PROVIDER_ERROR',
      },
    });
  }
});

// Sync email provider
router.post('/:id/sync', async (req: Request, res: Response): Promise<void> => {
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

    const { id } = req.params;

    // Check if provider exists and belongs to user
    const provider = await prisma.emailProvider.findFirst({
      where: {
        id,
        userId: req.user.id,
        isDeleted: false,
      },
    });

    if (!provider) {
      res.status(404).json({
        error: {
          message: 'Email provider not found',
          code: 'PROVIDER_NOT_FOUND',
        },
      });
      return;
    }

    // Update sync status
    await prisma.emailProvider.update({
      where: { id },
      data: {
        syncStatus: 'syncing',
        lastSyncAt: new Date(),
        errorMessage: null,
      },
    });

    // TODO: Implement actual email sync logic here
    // This would integrate with Gmail API, Outlook API, etc.

    // For now, just mark as successful
    await prisma.emailProvider.update({
      where: { id },
      data: {
        syncStatus: 'success',
      },
    });

    res.json({
      message: 'Email sync initiated successfully',
    });
  } catch (error) {
    console.error('Sync email provider error:', error);

    // Update sync status to error
    try {
      await prisma.emailProvider.update({
        where: { id: req.params.id },
        data: {
          syncStatus: 'error',
          errorMessage: 'Sync failed',
        },
      });
    } catch (updateError) {
      console.error('Failed to update sync status:', updateError);
    }

    res.status(500).json({
      error: {
        message: 'Failed to sync email provider',
        code: 'SYNC_PROVIDER_ERROR',
      },
    });
  }
});

export default router;
