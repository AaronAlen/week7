import { resumeRestockWorkflow } from '../services/agentService.js';
import { ApprovalsQueue, RestockRequest, Product, User } from '../models/index.js';
import { z } from 'zod';

const approveSchema = z.object({
  threadId: z.string().min(1, 'Thread ID is required'),
  approved: z.boolean()
});

export const approveRestock = async (req, res, next) => {
  try {
    const validated = approveSchema.parse(req.body);
    const result = await resumeRestockWorkflow({
      threadId: validated.threadId,
      approved: validated.approved,
      userId: req.user.id
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    next(error);
  }
};

export const getApprovals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const approvals = await ApprovalsQueue.findAll({
      where,
      include: [
        {
          model: RestockRequest,
          as: 'restockRequest',
          include: [{ model: Product, as: 'product' }]
        },
        { model: User, as: 'approver', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(approvals);
  } catch (error) {
    next(error);
  }
};
