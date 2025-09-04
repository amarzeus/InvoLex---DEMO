import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';

const router = Router();

// Get all corrections for the authenticated user
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const feedback = req.query.feedback as string;

    const where: any = {
      userId: req.user.id,
    };

    if (feedback && feedback !== 'all') {
      where.feedback = feedback;
    }

    const [corrections, total] = await Promise.all([
      prisma.correction.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.correction.count({ where }),
    ]);

    res.json({
      corrections,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get corrections error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get corrections',
        code: 'GET_CORRECTIONS_ERROR',
      },
    });
  }
});

// Get correction by ID
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

    const correction = await prisma.correction.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!correction) {
      res.status(404).json({
        error: {
          message: 'Correction not found',
          code: 'CORRECTION_NOT_FOUND',
        },
      });
      return;
    }

    res.json({
      correction,
    });
  } catch (error) {
    console.error('Get correction error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get correction',
        code: 'GET_CORRECTION_ERROR',
      },
    });
  }
});

// Create new correction
router.post(
  '/',
  [
    body('emailId').trim().isLength({ min: 1 }),
    body('originalDescription').trim().isLength({ min: 1 }),
    body('correctedDescription').trim().isLength({ min: 1 }),
    body('originalHours').optional().isFloat({ min: 0 }),
    body('correctedHours').optional().isFloat({ min: 0 }),
    body('reason').trim().isLength({ min: 1 }),
    body('feedback').isIn(['positive', 'negative', 'neutral']),
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

      const {
        emailId,
        originalDescription,
        correctedDescription,
        originalHours,
        correctedHours,
        reason,
        feedback,
      } = req.body;

      const correction = await prisma.correction.create({
        data: {
          userId: req.user.id,
          emailId,
          originalDescription,
          correctedDescription,
          originalHours: originalHours ? parseFloat(originalHours) : null,
          correctedHours: correctedHours ? parseFloat(correctedHours) : null,
          reason,
          feedback,
          createdBy: req.user.id,
          updatedBy: req.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        correction,
        message: 'Correction created successfully',
      });
    } catch (error) {
      console.error('Create correction error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to create correction',
          code: 'CREATE_CORRECTION_ERROR',
        },
      });
    }
  }
);

// Update correction
router.put(
  '/:id',
  [
    body('originalDescription').optional().trim().isLength({ min: 1 }),
    body('correctedDescription').optional().trim().isLength({ min: 1 }),
    body('originalHours').optional().isFloat({ min: 0 }),
    body('correctedHours').optional().isFloat({ min: 0 }),
    body('reason').optional().trim().isLength({ min: 1 }),
    body('appliedToModel').optional().isBoolean(),
    body('feedback').optional().isIn(['positive', 'negative', 'neutral']),
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
      const {
        originalDescription,
        correctedDescription,
        originalHours,
        correctedHours,
        reason,
        appliedToModel,
        feedback,
      } = req.body;

      // Check if correction exists and belongs to user
      const existingCorrection = await prisma.correction.findFirst({
        where: {
          id,
          userId: req.user.id,
        },
      });

      if (!existingCorrection) {
        res.status(404).json({
          error: {
            message: 'Correction not found',
            code: 'CORRECTION_NOT_FOUND',
          },
        });
        return;
      }

      const correction = await prisma.correction.update({
        where: { id },
        data: {
          ...(originalDescription && { originalDescription }),
          ...(correctedDescription && { correctedDescription }),
          ...(originalHours !== undefined && { originalHours: parseFloat(originalHours) }),
          ...(correctedHours !== undefined && { correctedHours: parseFloat(correctedHours) }),
          ...(reason && { reason }),
          ...(appliedToModel !== undefined && { appliedToModel }),
          ...(feedback && { feedback }),
          updatedBy: req.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      res.json({
        correction,
        message: 'Correction updated successfully',
      });
    } catch (error) {
      console.error('Update correction error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update correction',
          code: 'UPDATE_CORRECTION_ERROR',
        },
      });
    }
  }
);

// Delete correction
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

    // Check if correction exists and belongs to user
    const existingCorrection = await prisma.correction.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingCorrection) {
      res.status(404).json({
        error: {
          message: 'Correction not found',
          code: 'CORRECTION_NOT_FOUND',
        },
      });
      return;
    }

    await prisma.correction.delete({
      where: { id },
    });

    res.json({
      message: 'Correction deleted successfully',
    });
  } catch (error) {
    console.error('Delete correction error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to delete correction',
        code: 'DELETE_CORRECTION_ERROR',
      },
    });
  }
});

export default router;
