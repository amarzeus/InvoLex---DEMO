import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';

const router = Router();

// Get all emails for the authenticated user
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
    const providerId = req.query.providerId as string;
    const search = req.query.search as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = {
      providerId,
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { from: { contains: search, mode: 'insensitive' } },
        { to: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.receivedAt = {};
      if (startDate) {
        where.receivedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.receivedAt.lte = new Date(endDate);
      }
    }

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { receivedAt: 'desc' },
        include: {
          provider: {
            select: {
              id: true,
              provider: true,
              email: true,
            },
          },
          billableEntry: {
            select: {
              id: true,
              description: true,
              hours: true,
              status: true,
            },
          },
        },
      }),
      prisma.email.count({ where }),
    ]);

    res.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get emails',
        code: 'GET_EMAILS_ERROR',
      },
    });
  }
});

// Get email by ID
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

    const email = await prisma.email.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        provider: {
          select: {
            id: true,
            provider: true,
            email: true,
            displayName: true,
          },
        },
        billableEntry: {
          select: {
            id: true,
            description: true,
            hours: true,
            rate: true,
            currency: true,
            status: true,
            matter: {
              select: {
                id: true,
                name: true,
                clientName: true,
              },
            },
          },
        },
      },
    });

    if (!email) {
      res.status(404).json({
        error: {
          message: 'Email not found',
          code: 'EMAIL_NOT_FOUND',
        },
      });
      return;
    }

    res.json({
      email,
    });
  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get email',
        code: 'GET_EMAIL_ERROR',
      },
    });
  }
});

// Create new email (typically from email sync)
router.post(
  '/',
  [
    body('providerId').isUUID(),
    body('messageId').trim().isLength({ min: 1 }),
    body('subject').trim().isLength({ max: 500 }),
    body('from').isJSON(),
    body('to').isJSON(),
    body('receivedAt').isISO8601(),
    body('body').optional().isJSON(),
    body('attachments').optional().isJSON(),
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
        providerId,
        messageId,
        subject,
        from,
        to,
        receivedAt,
        body,
        attachments = '[]',
      } = req.body;

      // Verify provider belongs to user
      const provider = await prisma.emailProvider.findFirst({
        where: {
          id: providerId,
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

      // Check if email already exists
      const existingEmail = await prisma.email.findFirst({
        where: {
          providerId,
          messageId,
        },
      });

      if (existingEmail) {
        res.status(409).json({
          error: {
            message: 'Email already exists',
            code: 'EMAIL_EXISTS',
          },
        });
        return;
      }

      const email = await prisma.email.create({
        data: {
          providerId,
          messageId,
          subject,
          from: JSON.parse(from),
          to: JSON.parse(to),
          receivedAt: new Date(receivedAt),
          body: body ? JSON.parse(body) : {},
          attachments: attachments ? JSON.parse(attachments) : [],
          createdBy: req.user.id,
          updatedBy: req.user.id,
        } as any,
        include: {
          provider: {
            select: {
              id: true,
              provider: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        email,
        message: 'Email created successfully',
      });
    } catch (error) {
      console.error('Create email error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to create email',
          code: 'CREATE_EMAIL_ERROR',
        },
      });
    }
  }
);

// Update email
router.put(
  '/:id',
  [
    body('billableEntryId').optional().isUUID(),
    body('tags').optional().isArray(),
    body('customFields').optional().isObject(),
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
      const { billableEntryId, tags, customFields } = req.body;

      // Check if email exists and belongs to user
      const existingEmail = await prisma.email.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!existingEmail) {
        res.status(404).json({
          error: {
            message: 'Email not found',
            code: 'EMAIL_NOT_FOUND',
          },
        });
        return;
      }

      // If billableEntryId is provided, verify it belongs to user
      if (billableEntryId) {
        const billableEntry = await prisma.billableEntry.findFirst({
          where: {
            id: billableEntryId,
            isDeleted: false,
          },
        });

        if (!billableEntry) {
          res.status(404).json({
            error: {
              message: 'Billable entry not found',
              code: 'ENTRY_NOT_FOUND',
            },
          });
          return;
        }
      }

      const email = await prisma.email.update({
        where: { id },
        data: {
          ...(billableEntryId !== undefined && { billableEntryId }),
          ...(tags && { tags }),
          ...(customFields && { customFields }),
          updatedBy: req.user.id,
        },
        include: {
          provider: {
            select: {
              id: true,
              provider: true,
              email: true,
            },
          },
          billableEntry: {
            select: {
              id: true,
              description: true,
              hours: true,
              status: true,
            },
          },
        },
      });

      res.json({
        email,
        message: 'Email updated successfully',
      });
    } catch (error) {
      console.error('Update email error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update email',
          code: 'UPDATE_EMAIL_ERROR',
        },
      });
    }
  }
);

// Delete email (soft delete)
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

    // Check if email exists and belongs to user
    const existingEmail = await prisma.email.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingEmail) {
      res.status(404).json({
        error: {
          message: 'Email not found',
          code: 'EMAIL_NOT_FOUND',
        },
      });
      return;
    }

    // Soft delete
    await prisma.email.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.id,
      },
    });

    res.json({
      message: 'Email deleted successfully',
    });
  } catch (error) {
    console.error('Delete email error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to delete email',
        code: 'DELETE_EMAIL_ERROR',
      },
    });
  }
});

export default router;
