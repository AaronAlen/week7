import { AgentLog, Product, RestockRequest } from '../models/index.js';

export const getAgentLogs = async (req, res, next) => {
  try {
    const { productId, restockRequestId, limit = 100 } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    if (restockRequestId) where.restockRequestId = restockRequestId;

    const logs = await AgentLog.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
        { model: RestockRequest, as: 'restockRequest', attributes: ['id', 'status', 'totalCost'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
};
