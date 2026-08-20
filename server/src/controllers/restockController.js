import { triggerRestockWorkflow } from '../services/agentService.js';
import { receiveStock } from '../services/inventoryService.js';
import { RestockRequest, Product, PurchaseOrder, ApprovalsQueue, User } from '../models/index.js';
import { z } from 'zod';

const triggerSchema = z.object({
  productId: z.number().int().positive('Product ID is required')
});

export const triggerRestock = async (req, res, next) => {
  try {
    const validated = triggerSchema.parse(req.body);
    const result = await triggerRestockWorkflow({
      productId: validated.productId,
      userId: req.user.id
    });

    req.app.get('io')?.emit('data_updated');
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    next(error);
  }
};

export const getRestockRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const restocks = await RestockRequest.findAll({
      where,
      include: [
        { model: Product, as: 'product' },
        { model: PurchaseOrder, as: 'purchaseOrder' },
        { model: ApprovalsQueue, as: 'approval' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const uniqueRestocks = [];
    const seenIds = new Set();
    for (const r of restocks) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        uniqueRestocks.push(r);
      }
    }

    res.json(uniqueRestocks);
  } catch (error) {
    next(error);
  }
};

export const getRestockById = async (req, res, next) => {
  try {
    const restock = await RestockRequest.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'product' },
        { model: PurchaseOrder, as: 'purchaseOrder' },
        { model: ApprovalsQueue, as: 'approval' }
      ]
    });

    if (!restock) {
      return res.status(404).json({ error: 'Restock request not found' });
    }

    res.json(restock);
  } catch (error) {
    next(error);
  }
};

export const retryRestock = async (req, res, next) => {
  try {
    const restock = await RestockRequest.findByPk(req.params.id);
    if (!restock) {
      return res.status(404).json({ error: 'Restock request not found' });
    }

    if (restock.status !== 'REJECTED' && restock.status !== 'CANCELLED') {
      return res.status(400).json({ error: `Cannot retry restock request with status '${restock.status}'. Only REJECTED or CANCELLED requests can be retried.` });
    }

    // Trigger fresh workflow for the product
    const result = await triggerRestockWorkflow({
      productId: restock.productId,
      userId: req.user.id
    });

    req.app.get('io')?.emit('data_updated');

    res.json({
      message: 'Restock workflow re-triggered successfully',
      result
    });
  } catch (error) {
    next(error);
  }
};

export const receiveStockAction = async (req, res, next) => {
  try {
    const restockRequestId = parseInt(req.params.id);
    const result = await receiveStock({
      restockRequestId,
      userId: req.user.id
    });

    req.app.get('io')?.emit('data_updated');

    res.json({
      message: `Successfully received ${result.transaction.quantity} units for product '${result.product.name}'. Stock is now ${result.product.currentStock}.`,
      result
    });
  } catch (error) {
    next(error);
  }
};
