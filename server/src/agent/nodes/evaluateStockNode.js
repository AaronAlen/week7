import { Product, RestockRequest, AgentLog } from '../../models/index.js';
import { logger } from '../../utils/logger.js';

export const evaluateStockNode = async (state) => {
  logger.agent(`[Node 1: evaluateStockNode] Processing product #${state.productId}`);

  const product = await Product.findByPk(state.productId);
  if (!product) {
    throw new Error(`Product #${state.productId} not found.`);
  }

  if (product.currentStock >= product.targetStock) {
    logger.agent(`[evaluateStockNode] Product #${product.id} stock (${product.currentStock}) >= target capacity (${product.targetStock}). No restock required.`);
    
    await AgentLog.create({
      productId: product.id,
      action: 'EVALUATE_STOCK',
      status: 'NO_ACTION_NEEDED',
      message: `Evaluated stock for '${product.name}'. Current stock (${product.currentStock}) is at full target capacity (${product.targetStock}). No restock order required.`
    });

    return {
      ...state,
      status: 'NO_ACTION_NEEDED',
      logs: [`Stock level (${product.currentStock}) is at full target capacity (${product.targetStock}). No restock needed.`]
    };
  }

  const calculatedReorderQty = product.targetStock - product.currentStock;
  const unitCost = Number(product.unitCost);
  const totalCost = calculatedReorderQty * unitCost;
  const requiresHumanReview = totalCost > 1000;

  // Create or update RestockRequest record in DB
  let restockReq;
  if (state.restockRequestId) {
    restockReq = await RestockRequest.findByPk(state.restockRequestId);
  }

  if (!restockReq) {
    restockReq = await RestockRequest.create({
      productId: product.id,
      quantity: calculatedReorderQty,
      totalCost,
      status: requiresHumanReview ? 'AWAITING_APPROVAL' : 'PENDING',
      requiresHumanReview
    });
  } else {
    restockReq.quantity = calculatedReorderQty;
    restockReq.totalCost = totalCost;
    restockReq.requiresHumanReview = requiresHumanReview;
    restockReq.status = requiresHumanReview ? 'AWAITING_APPROVAL' : 'PENDING';
    await restockReq.save();
  }

  await AgentLog.create({
    productId: product.id,
    restockRequestId: restockReq.id,
    action: 'EVALUATE_STOCK',
    status: 'SUCCESS',
    message: `Evaluated stock for '${product.name}'. Stock: ${product.currentStock}/${product.safetyThreshold}. Calculated reorder qty: ${calculatedReorderQty}, Total cost: $${totalCost.toFixed(2)}. ${requiresHumanReview ? 'Requires Human Review (> $1000).' : 'Auto-approval qualified (<= $1000).'}`
  });

  return {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    currentStock: product.currentStock,
    safetyThreshold: product.safetyThreshold,
    targetStock: product.targetStock,
    unitCost,
    supplierName: product.supplierName,
    supplierEmail: product.supplierEmail,
    supplierPhone: product.supplierPhone,
    calculatedReorderQty,
    totalCost,
    requiresHumanReview,
    restockRequestId: restockReq.id,
    status: requiresHumanReview ? 'AWAITING_APPROVAL' : 'AUTO_APPROVED',
    logs: [`Stock evaluated. Reorder qty: ${calculatedReorderQty}, Total cost: $${totalCost.toFixed(2)}.`]
  };
};
