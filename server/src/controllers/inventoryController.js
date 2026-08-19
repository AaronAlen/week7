import { recordSale, adjustStock } from '../services/inventoryService.js';
import { InventoryTransaction, Product } from '../models/index.js';
import { z } from 'zod';

const sellSchema = z.object({
  productId: z.number().int().positive('Product ID must be positive'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  referenceId: z.string().optional().default('SALE-DIRECT')
});

const adjustSchema = z.object({
  productId: z.number().int().positive('Product ID must be positive'),
  newStockValue: z.number().int().min(0, 'New stock value must be non-negative'),
  reason: z.string().optional().default('Manual Adjustment')
});

export const sellInventory = async (req, res, next) => {
  try {
    const validated = sellSchema.parse(req.body);
    const result = await recordSale({
      ...validated,
      userId: req.user?.id
    });

    res.json({
      message: `Sale recorded successfully for ${result.product.name}. ${
        result.isLowStock 
          ? result.restockResult?.status === 'approval_required'
            ? '⚠️ Stock fell below safety threshold! Purchase order requires Human Approval (> $1000).'
            : '⚠️ Stock fell below safety threshold! Purchase order automatically created & dispatched (<= $1000).'
          : ''
      }`,
      result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    next(error);
  }
};

export const adjustInventory = async (req, res, next) => {
  try {
    const validated = adjustSchema.parse(req.body);
    const result = await adjustStock(validated);

    res.json({
      message: `Stock adjusted successfully for ${result.product.name}`,
      result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { productId, type, limit = 50 } = req.query;
    const where = {};

    if (productId) where.productId = productId;
    if (type) where.type = type;

    const transactions = await InventoryTransaction.findAll({
      where,
      include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};
