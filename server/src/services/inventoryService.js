import { sequelize, Product, InventoryTransaction, PurchaseOrder, RestockRequest, AgentLog } from '../models/index.js';
import { triggerRestockWorkflow } from './agentService.js';
import { logger } from '../utils/logger.js';

export const recordSale = async ({ productId, quantity, referenceId = 'SALE-DIRECT', userId }) => {
  const transaction = await sequelize.transaction();
  let isLowStock = false;
  let product;
  let invTx;

  try {
    product = await Product.findByPk(productId, { transaction, lock: true });
    if (!product) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    if (product.currentStock < quantity) {
      throw new Error(`Insufficient stock for product '${product.name}'. Current stock: ${product.currentStock}, requested: ${quantity}.`);
    }

    const previousStock = product.currentStock;
    const newStock = previousStock - quantity;

    product.currentStock = newStock;
    await product.save({ transaction });

    invTx = await InventoryTransaction.create({
      productId,
      type: 'SALE',
      quantity,
      previousStock,
      newStock,
      referenceId
    }, { transaction });

    await transaction.commit();
    logger.info(`🛒 Sale recorded for product #${productId} (${product.name}): ${previousStock} -> ${newStock}`);

    isLowStock = newStock < product.safetyThreshold;
  } catch (error) {
    await transaction.rollback();
    logger.error(`❌ Failed to record sale for product #${productId}: ${error.message}`);
    throw error;
  }

  // Auto-trigger LangGraph Restock Agent in background if stock fell below safety threshold
  let restockResult = null;
  if (isLowStock) {
    try {
      restockResult = await triggerRestockWorkflow({ productId, userId });
      logger.info(`🤖 Auto-triggered restock workflow on sale for product #${productId}. Status: ${restockResult.status}`);
    } catch (agentErr) {
      logger.warn(`Auto-restock trigger warning for product #${productId}: ${agentErr.message}`);
    }
  }

  return {
    success: true,
    product,
    transaction: invTx,
    isLowStock,
    restockResult
  };
};

export const adjustStock = async ({ productId, newStockValue, reason = 'Manual Adjustment' }) => {
  const transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, { transaction, lock: true });
    if (!product) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    const previousStock = product.currentStock;
    const quantity = Math.abs(newStockValue - previousStock);
    product.currentStock = newStockValue;
    await product.save({ transaction });

    const invTx = await InventoryTransaction.create({
      productId,
      type: 'ADJUSTMENT',
      quantity,
      previousStock,
      newStock: newStockValue,
      referenceId: reason
    }, { transaction });

    await transaction.commit();
    logger.info(`🔧 Stock adjusted for product #${productId} (${product.name}): ${previousStock} -> ${newStockValue}`);
    return { success: true, product, transaction: invTx };
  } catch (error) {
    await transaction.rollback();
    logger.error(`❌ Failed to adjust stock for product #${productId}: ${error.message}`);
    throw error;
  }
};

export const receiveStock = async ({ restockRequestId, userId }) => {
  const transaction = await sequelize.transaction();
  try {
    const restockReq = await RestockRequest.findByPk(restockRequestId, {
      include: [
        { model: Product, as: 'product' },
        { model: PurchaseOrder, as: 'purchaseOrder' }
      ],
      transaction,
      lock: true
    });

    if (!restockReq) {
      throw new Error(`Restock request #${restockRequestId} not found.`);
    }

    let po = restockReq.purchaseOrder;
    if (!po) {
      po = await PurchaseOrder.create({
        restockRequestId: restockReq.id,
        productId: restockReq.productId,
        quantity: restockReq.quantity,
        unitCost: Number(restockReq.product?.unitCost || 0),
        totalCost: Number(restockReq.totalCost),
        supplierName: restockReq.product?.supplierName || 'Supplier',
        supplierEmail: restockReq.product?.supplierEmail || 'supplier@email.com',
        supplierPhone: restockReq.product?.supplierPhone,
        status: 'SENT'
      }, { transaction });
    }

    const product = restockReq.product;
    const previousStock = product.currentStock;
    const quantityReceived = po.quantity;
    const newStock = previousStock + quantityReceived;

    // 1. Update product stock
    product.currentStock = newStock;
    await product.save({ transaction });

    // 2. Create inventory transaction
    const invTx = await InventoryTransaction.create({
      productId: product.id,
      type: 'RESTOCK',
      quantity: quantityReceived,
      previousStock,
      newStock,
      referenceId: `PO-${po.id}`
    }, { transaction });

    // 3. Update Purchase Order status
    po.status = 'RECEIVED';
    await po.save({ transaction });

    // 4. Update Restock Request status
    restockReq.status = 'COMPLETED';
    await restockReq.save({ transaction });

    // 5. Create Agent Log
    await AgentLog.create({
      productId: product.id,
      restockRequestId: restockReq.id,
      action: 'RECEIVE_STOCK',
      status: 'SUCCESS',
      message: `Received ${quantityReceived} units for product '${product.name}'. Stock increased from ${previousStock} to ${newStock}.`,
      metadata: { previousStock, newStock, quantityReceived, poId: po.id, receivedBy: userId }
    }, { transaction });

    await transaction.commit();
    logger.info(`📦 Stock received for product #${product.id} (${product.name}): +${quantityReceived} units (Stock: ${previousStock} -> ${newStock})`);

    return {
      success: true,
      product,
      restockRequest: restockReq,
      purchaseOrder: po,
      transaction: invTx
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(`❌ Failed to receive stock for restock request #${restockRequestId}: ${error.message}`);
    throw error;
  }
};
