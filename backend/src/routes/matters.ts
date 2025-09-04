import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';

const router = Router();

// Get all matters for the authenticated user
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
    const search = req.query.search as string;

    const where: any = {
      userId: req.user.id,
      isDeleted: false,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [matters, total] = await Promise.all([
      prisma.matter.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              billableEntries: true,
            },
          },
        },
      }),
      prisma.matter.count({ where }),
    ]);

    res.json({
      matters,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get matters error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get matters',
        code: 'GET_MATTERS_ERROR',
      },
    });
  }
});

// Get matter by ID
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

    const matter = await prisma.matter.findFirst({
      where: {
        id,
        userId: req.user.id,
        isDeleted: false,
      },
      include: {
        _count: {
          select: {
            billableEntries: true,
          },
        },
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

    res.json({
      matter,
    });
  } catch (error) {
    console.error('Get matter error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get matter',
        code: 'GET_MATTER_ERROR',
      },
    });
  }
});

// Create new matter
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('clientName').optional().trim().isLength({ max: 255 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('rate').isFloat({ min: 0 }),
    body('currency').optional().isLength({ min: 3, max: 3 }),
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

      const { name, clientName, description, rate, currency = 'USD', customFields, tags } = req.body;

      const matter = await prisma.matter.create({
        data: {
          userId: req.user.id,
          name,
          clientName,
          description,
          rate: parseFloat(rate),
          currency,
          customFields: customFields || {},
          tags: tags || [],
          createdBy: req.user.id,
          updatedBy: req.user.id,
        },
        include: {
          _count: {
            select: {
              billableEntries: true,
            },
          },
        },
      });

      res.status(201).json({
        matter,
        message: 'Matter created successfully',
      });
    } catch (error) {
      console.error('Create matter error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to create matter',
          code: 'CREATE_MATTER_ERROR',
        },
      });
    }
  }
);

// Update matter
router.put(
  '/:id',
  [
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('clientName').optional().trim().isLength({ max: 255 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('rate').optional().isFloat({ min: 0 }),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('status').optional().isIn(['active', 'inactive', 'archived', 'completed']),
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
      const { name, clientName, description, rate, currency, status, customFields, tags } = req.body;

      // Check if matter exists and belongs to user
      const existingMatter = await prisma.matter.findFirst({
        where: {
          id,
          userId: req.user.id,
          isDeleted: false,
        },
      });

      if (!existingMatter) {
        res.status(404).json({
          error: {
            message: 'Matter not found',
            code: 'MATTER_NOT_FOUND',
          },
        });
        return;
      }

      const matter = await prisma.matter.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(clientName !== undefined && { clientName }),
          ...(description !== undefined && { description }),
          ...(rate !== undefined && { rate: parseFloat(rate) }),
          ...(currency && { currency }),
          ...(status && { status }),
          ...(customFields && { customFields }),
          ...(tags && { tags }),
          updatedBy: req.user.id,
        },
        include: {
          _count: {
            select: {
              billableEntries: true,
            },
          },
        },
      });

      res.json({
        matter,
        message: 'Matter updated successfully',
      });
    } catch (error) {
      console.error('Update matter error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update matter',
          code: 'UPDATE_MATTER_ERROR',
        },
      });
    }
  }
);

// Delete matter (soft delete)
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

    // Check if matter exists and belongs to user
    const existingMatter = await prisma.matter.findFirst({
      where: {
        id,
        userId: req.user.id,
        isDeleted: false,
      },
    });

    if (!existingMatter) {
      res.status(404).json({
        error: {
          message: 'Matter not found',
          code: 'MATTER_NOT_FOUND',
        },
      });
      return;
    }

    // Soft delete
    await prisma.matter.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.id,
      },
    });

    res.json({
      message: 'Matter deleted successfully',
    });
  } catch (error) {
    console.error('Delete matter error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to delete matter',
        code: 'DELETE_MATTER_ERROR',
      },
    });
  }
});

export default router;
