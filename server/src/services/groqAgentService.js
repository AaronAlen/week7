import Groq from 'groq-sdk';
import { Op } from 'sequelize';
import { env } from '../config/env.js';
import { Product, InventoryTransaction, RestockRequest, PurchaseOrder, ApprovalsQueue, AgentLog, User } from '../models/index.js';
import { sendPurchaseOrderEmail } from './emailService.js';
import { sendPurchaseOrderSMS } from './smsService.js';
import { logger } from '../utils/logger.js';

const groq = new Groq({
  apiKey: env.GROQ_API_KEY || process.env.GROQ_API_KEY || 'gsk_fallback_key'
});

/**
 * AGENT 1: Autonomous Restock Procurement Agent
 * Performs multi-factor demand analysis using Groq LLaMA 3.3 70B.
 */
export const runRestockProcurementAgent = async ({ productId, userId }) => {
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found.`);
  }

  // Normal healthy stock check
  if (product.currentStock >= product.safetyThreshold) {
    return {
      status: 'no_action_needed',
      message: `Stock level (${product.currentStock}) is healthy and above safety threshold (${product.safetyThreshold}). No restock required.`,
      productId: product.id,
      productName: product.name,
      currentStock: product.currentStock,
      safetyThreshold: product.safetyThreshold
    };
  }

  // Duplicate active restock check
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

  // Pull last 30 days of sales transactions
  const recentSales = await InventoryTransaction.findAll({
    where: { productId, type: 'SALE' },
    limit: 20,
    order: [['createdAt', 'DESC']]
  });

  const totalSalesUnits = recentSales.reduce((sum, tx) => sum + (tx.quantity || 0), 0);
  const baselineReorderQty = Math.max(1, product.targetStock - product.currentStock);
  const baselineCost = baselineReorderQty * Number(product.unitCost);

  // Prompt Groq LLaMA 3.3 with JSON schema instructions
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
1. Reorder quantity should bring stock close to target capacity (${product.targetStock}) without excessive overstocking.
2. Calculate totalCost = recommendedQuantity * unitCost.
3. If totalCost > 1000, set requiresHumanApproval = true. Otherwise false.
4. Calculate burnRatePerDay based on recent sales and daysUntilStockout = currentStock / burnRate.
5. Provide a sharp, professional executiveSummary explaining your calculation for management review.`;

  let decision;
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 800
    });

    decision = JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch (err) {
    logger.warn(`[Groq AI Agent Warning] ${err.message}. Using intelligent deterministic fallback.`);
    const burnRate = recentSales.length > 0 ? (totalSalesUnits / Math.max(1, recentSales.length * 1.5)) : 1.0;
    const stockoutDays = product.currentStock > 0 ? (product.currentStock / Math.max(0.1, burnRate)) : 0;
    
    decision = {
      recommendedQuantity: baselineReorderQty,
      totalCost: baselineCost,
      burnRatePerDay: Number(burnRate.toFixed(1)),
      daysUntilStockout: Number(stockoutDays.toFixed(1)),
      urgency: product.currentStock <= product.safetyThreshold ? 'CRITICAL' : 'MODERATE',
      financialRiskAssessment: baselineCost > 1000 
        ? `Substantial capital commitment ($${baselineCost.toFixed(2)}). Human authorization required.`
        : `Standard procurement ($${baselineCost.toFixed(2)}). Within automated budget limits.`,
      executiveSummary: `Stock level (${product.currentStock}) is below safety buffer (${product.safetyThreshold}). Procuring ${baselineReorderQty} units restores target capacity (${product.targetStock}) at a cost of $${baselineCost.toFixed(2)}.`,
      requiresHumanApproval: baselineCost > 1000
    };
  }

  const threadId = `groq-procure-${productId}-${Date.now()}`;
  const requiresApproval = Boolean(decision.requiresHumanApproval || decision.totalCost > 1000);

  // 1. Create Restock Request record
  const restockReq = await RestockRequest.create({
    productId: product.id,
    quantity: decision.recommendedQuantity,
    totalCost: decision.totalCost,
    status: requiresApproval ? 'AWAITING_APPROVAL' : 'APPROVED',
    requiresHumanReview: requiresApproval,
    createdBy: userId
  });

  // 2. Branch: Human Review vs Immediate Auto-Dispatch
  if (requiresApproval) {
    await ApprovalsQueue.create({
      restockRequestId: restockReq.id,
      threadId,
      status: 'PENDING'
    });

    await AgentLog.create({
      productId: product.id,
      restockRequestId: restockReq.id,
      action: 'GROQ_AI_PROCUREMENT_EVAL',
      status: 'PAUSED_FOR_APPROVAL',
      message: `Groq AI evaluated restock: Recommended ${decision.recommendedQuantity} units ($${Number(decision.totalCost).toFixed(2)}). Urgency: ${decision.urgency}. Awaiting Human Approval.`
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
    // Auto-Approve & Dispatch PO
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

    // Send notifications
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
      action: 'GROQ_AI_AUTO_RESTOCK',
      status: 'PO_SENT',
      message: `Groq AI auto-approved restock of ${decision.recommendedQuantity} units for '${product.name}' ($${Number(decision.totalCost).toFixed(2)}). Purchase Order #${po.id} dispatched.`
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

/**
 * AGENT 2: Interactive Dashboard & Chat Analytics AI Agent
 * Analyzes live database tables and answers questions in natural language.
 */
export const runInventoryAnalyticsAgent = async ({ query, userId }) => {
  // Aggregate real-time inventory metrics from SQL database
  const products = await Product.findAll({ order: [['currentStock', 'ASC']] });
  const lowStockProducts = products.filter(p => p.currentStock <= p.safetyThreshold);
  
  const recentSales = await InventoryTransaction.findAll({
    where: { type: 'SALE' },
    limit: 50,
    order: [['createdAt', 'DESC']],
    include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }]
  });

  // Calculate top selling product velocity
  const salesByProduct = {};
  for (const s of recentSales) {
    const pName = s.product?.name || `Product #${s.productId}`;
    salesByProduct[pName] = (salesByProduct[pName] || 0) + (s.quantity || 0);
  }

  const topSellingList = Object.entries(salesByProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => `${name} (${qty} units sold)`);

  const totalInventoryValuation = products.reduce(
    (sum, p) => sum + (p.currentStock * Number(p.unitCost)), 
    0
  );

  const pendingApprovalsCount = await ApprovalsQueue.count({ where: { status: 'PENDING' } });

  const contextData = {
    totalProductsCount: products.length,
    lowStockCount: lowStockProducts.length,
    lowStockItems: lowStockProducts.map(p => `${p.name} (Current: ${p.currentStock}, Safety: ${p.safetyThreshold})`),
    topFastestMovingProducts: topSellingList.length > 0 ? topSellingList : ['No recent sales recorded yet'],
    totalInventoryValuation: `$${totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    pendingHumanApprovals: pendingApprovalsCount,
    allProductList: products.map(p => ({
      name: p.name,
      sku: p.sku,
      stock: p.currentStock,
      threshold: p.safetyThreshold,
      cost: `$${Number(p.unitCost).toFixed(2)}`,
      supplier: p.supplierName
    }))
  };

  const systemPrompt = `You are StockPilot's Executive Inventory Analytics AI Assistant.
You have live, direct access to the company's real-time inventory and sales database.
Answer the user's question accurately, concisely, and with actionable data-driven supply chain advice.
Use clean markdown bullet points, bold highlights, and clear figures.

LIVE DATABASE SNAPSHOT:
- Total Products in Catalog: ${contextData.totalProductsCount}
- Low Stock Alert Count: ${contextData.lowStockCount} (${contextData.lowStockItems.join(', ') || 'All stock healthy'})
- Top Fastest Moving Products: ${contextData.topFastestMovingProducts.join(', ')}
- Total Inventory Capital Valuation: ${contextData.totalInventoryValuation}
- Pending Human Approvals (> $1000): ${contextData.pendingHumanApprovals}
- Product Catalog Details: ${JSON.stringify(contextData.allProductList)}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      max_tokens: 600
    });

    const answer = completion.choices[0]?.message?.content || 'Unable to analyze inventory data at this time.';

    return {
      success: true,
      answer,
      metrics: {
        totalProducts: contextData.totalProductsCount,
        lowStockCount: contextData.lowStockCount,
        fastestMoving: contextData.topFastestMovingProducts[0] || 'N/A',
        valuation: contextData.totalInventoryValuation,
        pendingApprovals: contextData.pendingHumanApprovals
      }
    };
  } catch (err) {
    logger.error(`[Groq Analytics Error] ${err.message}`);
    
    // Resilient rule-based fallback response
    let fallbackAnswer = `### 📊 Live Inventory Analysis Summary\n\n`;
    fallbackAnswer += `* **Fastest Moving Products**: ${contextData.topFastestMovingProducts.join(', ')}\n`;
    fallbackAnswer += `* **Low Stock Items Requiring Attention**: ${contextData.lowStockCount > 0 ? contextData.lowStockItems.join(', ') : 'All products currently healthy'}\n`;
    fallbackAnswer += `* **Total Inventory Valuation**: ${contextData.totalInventoryValuation}\n`;
    fallbackAnswer += `* **Pending Human Approvals**: ${contextData.pendingHumanApprovals} order(s)\n`;

    return {
      success: true,
      answer: fallbackAnswer,
      metrics: {
        totalProducts: contextData.totalProductsCount,
        lowStockCount: contextData.lowStockCount,
        fastestMoving: contextData.topFastestMovingProducts[0] || 'N/A',
        valuation: contextData.totalInventoryValuation,
        pendingApprovals: contextData.pendingHumanApprovals
      }
    };
  }
};
