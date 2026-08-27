import { Op } from 'sequelize';
import {
  Product,
  InventoryTransaction,
  RestockRequest,
  PurchaseOrder,
  ApprovalsQueue,
  AgentLog
} from '../../models/index.js';
import { sendPurchaseOrderEmail } from '../emailService.js';
import { sendPurchaseOrderSMS } from '../smsService.js';
import { callGroqWithFallback } from './groqClient.js';
import { logger } from '../../utils/logger.js';

/**
 * =========================================================================
 * AGENT 3: Autonomous Restock & Procurement Agent
 * =========================================================================
 * Multi-factor demand forecasting, burn rate calculation, and PO dispatch.
 */
export const runRestockProcurementAgent = async ({ productId, userId }) => {
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found.`);
  }

  const existingActive = await RestockRequest.findOne({
    where: {
      productId,
      status: { [Op.in]: ['PENDING', 'AWAITING_APPROVAL'] }
    }
  });

  if (existingActive) {
    const approval = await ApprovalsQueue.findOne({ where: { restockRequestId: existingActive.id } });
    return {
      status: 'already_active',
      message: `An active restock request (#${existingActive.id}) is already in progress for '${product.name}'.`,
      restockRequestId: existingActive.id,
      threadId: approval ? approval.threadId : null,
      productName: product.name
    };
  }

  const recentSales = await InventoryTransaction.findAll({
    where: { productId, type: 'SALE' },
    limit: 20,
    order: [['createdAt', 'DESC']]
  });

  const totalSalesUnits = recentSales.reduce((sum, tx) => sum + (tx.quantity || 0), 0);
  const baselineReorderQty = product.currentStock < product.targetStock 
    ? Math.max(1, product.targetStock - product.currentStock)
    : Math.max(5, Math.ceil(product.targetStock * 0.25));
  const baselineCost = baselineReorderQty * Number(product.unitCost);

  const systemPrompt = `You are StockPilot's Senior Autonomous Supply Chain & Procurement AI Agent.
Analyze the product inventory state and sales velocity to determine the optimal restock decision.
You must respond with ONLY a valid JSON object matching this exact structure:
{
  "recommendedQuantity": number,
  "totalCost": number,
  "burnRatePerDay": number,
  "daysUntilStockout": number,
  "urgency": "CRITICAL" | "MODERATE" | "LOW",
  "financialRiskAssessment": "string",
  "executiveSummary": "string",
  "requiresHumanApproval": boolean
}`;

  const userPrompt = `Evaluate restocking for:
Product: ${product.name} (SKU: ${product.sku})
Current Stock: ${product.currentStock} units
Safety Threshold: ${product.safetyThreshold} units
Target Capacity: ${product.targetStock} units
Unit Cost: $${Number(product.unitCost).toFixed(2)}
Recent Sales History: ${recentSales.length} sale transactions (${totalSalesUnits} total units sold)
Supplier: ${product.supplierName} (${product.supplierEmail})

Guidelines:
1. Reorder quantity should bring stock to target capacity (${product.targetStock}) or add strategic inventory buffer.
2. If current stock is below safety threshold, urgency = "CRITICAL".
3. If current stock is between safety threshold and target stock, urgency = "MODERATE" (target replenishment).
4. If current stock is at/above target stock, urgency = "LOW" (buffer top-up).
5. Calculate totalCost = recommendedQuantity * unitCost.
6. If totalCost > 1000, set requiresHumanApproval = true. Otherwise false.
7. Calculate burnRatePerDay based on recent sales and daysUntilStockout = currentStock / burnRate.
8. Provide a sharp, professional executiveSummary explaining your calculation for management review.`;

  let decision;
  try {
    const completion = await callGroqWithFallback({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1500
    });

    decision = JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch (err) {
    logger.warn(`[Groq AI Agent Warning] ${err.message}. Using deterministic fallback.`);
    const burnRate = recentSales.length > 0 ? (totalSalesUnits / Math.max(1, recentSales.length * 1.5)) : 1.0;
    const stockoutDays = product.currentStock > 0 ? (product.currentStock / Math.max(0.1, burnRate)) : 0;
    
    decision = {
      recommendedQuantity: baselineReorderQty,
      totalCost: baselineCost,
      burnRatePerDay: Number(burnRate.toFixed(1)),
      daysUntilStockout: Number(stockoutDays.toFixed(1)),
      urgency: product.currentStock <= product.safetyThreshold ? 'CRITICAL' : product.currentStock < product.targetStock ? 'MODERATE' : 'LOW',
      financialRiskAssessment: baselineCost > 1000 
        ? `Substantial capital commitment ($${baselineCost.toFixed(2)}). Human authorization required.`
        : `Standard procurement ($${baselineCost.toFixed(2)}). Within automated budget limits.`,
      executiveSummary: product.currentStock <= product.safetyThreshold
        ? `Stock level (${product.currentStock}) is below safety threshold (${product.safetyThreshold}). Procuring ${baselineReorderQty} units restores target capacity (${product.targetStock}) at a cost of $${baselineCost.toFixed(2)}.`
        : `Procurement triggered for ${product.name}. Procuring ${baselineReorderQty} units restores target inventory capacity (${product.targetStock}) at a total cost of $${baselineCost.toFixed(2)}.`,
      requiresHumanApproval: baselineCost > 1000
    };
  }

  const threadId = `groq-procure-${productId}-${Date.now()}`;
  const requiresApproval = Boolean(decision.requiresHumanApproval || decision.totalCost > 1000);

  const restockReq = await RestockRequest.create({
    productId: product.id,
    quantity: decision.recommendedQuantity,
    totalCost: decision.totalCost,
    status: requiresApproval ? 'AWAITING_APPROVAL' : 'APPROVED',
    requiresHumanReview: requiresApproval,
    createdBy: userId
  });

  if (requiresApproval) {
    await ApprovalsQueue.create({
      restockRequestId: restockReq.id,
      threadId,
      status: 'PENDING'
    });

    await AgentLog.create({
      productId: product.id,
      restockRequestId: restockReq.id,
      action: 'PROCUREMENT_EVALUATION',
      status: 'PAUSED_FOR_APPROVAL',
      message: `System evaluated replenishment for '${product.name}': Recommended ${decision.recommendedQuantity} units ($${Number(decision.totalCost).toFixed(2)}). Urgency: ${decision.urgency}. Awaiting Human Approval.`
    });

    return {
      status: 'approval_required',
      message: `Purchase order cost ($${Number(decision.totalCost).toFixed(2)}) exceeds $1,000 threshold. Administrator approval required.`,
      threadId,
      restockRequestId: restockReq.id,
      decision,
      details: {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.currentStock,
        safetyThreshold: product.safetyThreshold,
        targetStock: product.targetStock,
        reorderQuantity: decision.recommendedQuantity,
        unitCost: Number(product.unitCost),
        totalCost: Number(decision.totalCost),
        supplierName: product.supplierName,
        supplierEmail: product.supplierEmail,
        urgency: decision.urgency,
        burnRatePerDay: decision.burnRatePerDay,
        daysUntilStockout: decision.daysUntilStockout,
        financialRiskAssessment: decision.financialRiskAssessment,
        executiveSummary: decision.executiveSummary
      }
    };
  } else {
    const po = await PurchaseOrder.create({
      restockRequestId: restockReq.id,
      productId: product.id,
      quantity: decision.recommendedQuantity,
      unitCost: Number(product.unitCost),
      totalCost: Number(decision.totalCost),
      supplierName: product.supplierName,
      supplierEmail: product.supplierEmail,
      supplierPhone: product.supplierPhone,
      status: 'SENT'
    });

    sendPurchaseOrderEmail({
      supplierEmail: product.supplierEmail,
      supplierName: product.supplierName,
      poId: po.id,
      productName: product.name,
      sku: product.sku,
      quantity: decision.recommendedQuantity,
      unitCost: Number(product.unitCost),
      totalCost: Number(decision.totalCost)
    }).catch(e => logger.warn(`PO Email dispatch notice: ${e.message}`));

    sendPurchaseOrderSMS({
      supplierPhone: product.supplierPhone,
      supplierName: product.supplierName,
      poId: po.id,
      productName: product.name,
      sku: product.sku,
      quantity: decision.recommendedQuantity,
      unitCost: Number(product.unitCost),
      totalCost: Number(decision.totalCost)
    }).catch(e => logger.warn(`PO SMS dispatch notice: ${e.message}`));

    await AgentLog.create({
      productId: product.id,
      restockRequestId: restockReq.id,
      action: 'AUTO_REPLENISHMENT_DISPATCH',
      status: 'PO_SENT',
      message: `Automated replenishment approved for ${decision.recommendedQuantity} units of '${product.name}' ($${Number(decision.totalCost).toFixed(2)}). Purchase Order #${po.id} dispatched.`
    });

    return {
      status: 'completed',
      message: `Purchase order #${po.id} generated & sent to ${product.supplierEmail} for '${product.name}'.`,
      threadId,
      restockRequestId: restockReq.id,
      decision,
      purchaseOrder: po
    };
  }
};
