import { PurchaseOrder, Product, RestockRequest } from '../models/index.js';

export const getPurchaseOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const orders = await PurchaseOrder.findAll({
      where,
      include: [
        { model: Product, as: 'product' },
        { model: RestockRequest, as: 'restockRequest' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'product' },
        { model: RestockRequest, as: 'restockRequest' }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};
