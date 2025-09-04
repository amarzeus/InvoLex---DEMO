import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';

const router = Router();

// Get all billable entries for the authenticated user
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
    const status = req.query.status as string;
    const matterId = req.query.matterId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = {
      userId: req.user.id,
      isDeleted: false,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (matterId) {
      where.matterId = matterId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const [entries, total] = await Promise.all([
      prisma.billableEntry.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          matter: {
            select: {
              id: true,
              name: true,
              clientName: true,
            },
          },
        },
      }),
      prisma.billableEntry.count({ where }),
    ]);

    res.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get billable entries error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get billable entries',
        code: 'GET_ENTRIES_ERROR',
      },
    });
  }
});

// Get billable entry by ID
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

    const entry = await prisma.billableEntry.findFirst({
      where: {
        id,
        userId: req.user.id,
        isDeleted: false,
      },
      include: {
        matter: {
          select: {
            id: true,
            name: true,
            clientName: true,
            rate: true,
            currency: true,
          },
        },
        emails: {
          select: {
            id: true,
            subject: true,
            from: true,
            receivedAt: true,
          },
        },
      },
    });

    if (!entry) {
      res.status(404).json({
        error: {
          message: 'Billable entry not found',
          code: 'ENTRY_NOT_FOUND',
        },
      });
      return;
    }

    res.json({
      entry,
    });
  } catch (error) {
    console.error('Get billable entry error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get billable entry',
        code: 'GET_ENTRY_ERROR',
      },
    });
  }
});

// Create new billable entry
router.post(
  '/',
  [
    body('matterId').isUUID(),
    body('description').trim().isLength({ min: 1, max: 1000 }),
    body('hours').isFloat({ min: 0.01, max: 24 }),
    body('date').isISO8601(),
    body('emailIds').optional().isArray(),
    body('customFields').optional().isObject(),
    body('tags').optional().isArray(),
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
        matterId,
        description,
        hours,
        date,
        emailIds = [],
        customFields = {},
        tags = [],
      } = req.body;

      // Verify matter belongs to user
      const matter = await prisma.matter.findFirst({
        where: {
          id: matterId,
          userId: req.user.id,
          isDeleted: false,
        },
      });

      if (!matter) {
        res.status(404).json({
          error: {
            message: 'Matter not found',
            code: 'MATTER_NOT_FOUND',
          },
        });
        return;
      }

      const entry = await prisma.billableEntry.create({
        data: {
          userId: req.user.id,
          matterId,
          description,
          hours: parseFloat(hours),
          rate: matter.rate,
          currency: matter.currency,
          date: new Date(date),
          emailIds,
          customFields,
          tags,
          createdBy: req.user.id,
          updatedBy: req.user.id,
        },
        include: {
          matter: {
            select: {
              id: true,
              name: true,
              clientName: true,
            },
          },
        },
      });

      res.status(201).json({
        entry,
        message: 'Billable entry created successfully',
      });
    } catch (error) {
      console.error('Create billable entry error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to create billable entry',
          code: 'CREATE_ENTRY_ERROR',
        },
      });
    }
  }
);

// Update billable entry
router.put(
  '/:id',
  [
    body('description').optional().trim().isLength({ min: 1, max: 1000 }),
    body('hours').optional().isFloat({ min: 0.01, max: 24 }),
    body('date').optional().isISO8601(),
    body('status').optional().isIn(['draft', 'pending', 'approved', 'rejected', 'synced']),
    body('emailIds').optional().isArray(),
    body('customFields').optional().isObject(),
    body('tags').optional().isArray(),
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
        description,
        hours,
        date,
        status,
        emailIds,
        customFields,
        tags,
      } = req.body;

      // Check if entry exists and belongs to user
      const existingEntry = await prisma.billableEntry.findFirst({
        where: {
          id,
          userId: req.user.id,
          isDeleted: false,
        },
      });

      if (!existingEntry) {
        res.status(404).json({
          error: {
            message: 'Billable entry not found',
            code: 'ENTRY_NOT_FOUND',
          },
        });
        return;
      }

      const entry = await prisma.billableEntry.update({
        where: { id },
        data: {
          ...(description && { description }),
          ...(hours !== undefined && { hours: parseFloat(hours) }),
          ...(date && { date: new Date(date) }),
          ...(status && { status }),
          ...(emailIds && { emailIds }),
          ...(customFields && { customFields }),
          ...(tags && { tags }),
          updatedBy: req.user.id,
        },
        include: {
          matter: {
            select: {
              id: true,
              name: true,
              clientName: true,
            },
          },
        },
      });

      res.json({
        entry,
        message: 'Billable entry updated successfully',
      });
    } catch (error) {
      console.error('Update billable entry error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update billable entry',
          code: 'UPDATE_ENTRY_ERROR',
        },
      });
    }
  }
);

// Delete billable entry (soft delete)
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

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.billableEntry.findFirst({
      where: {
        id,
        userId: req.user.id,
        isDeleted: false,
      },
    });

    if (!existingEntry) {
      res.status(404).json({
        error: {
          message: 'Billable entry not found',
          code: 'ENTRY_NOT_FOUND',
        },
      });
      return;
    }

    // Soft delete
    await prisma.billableEntry.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.id,
      },
    });

    res.json({
      message: 'Billable entry deleted successfully',
    });
  } catch (error) {
    console.error('Delete billable entry error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to delete billable entry',
        code: 'DELETE_ENTRY_ERROR',
      },
    });
  }
});

export default router;
