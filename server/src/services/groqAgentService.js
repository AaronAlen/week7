import Groq from 'groq-sdk';
import { Op } from 'sequelize';
import { env } from '../config/env.js';
import {
  Product,
  InventoryTransaction,
  RestockRequest,
  PurchaseOrder,
  ApprovalsQueue,
  AgentLog,
  User,
  RefundRequest,
  FraudAlert,
  VendorEvaluation
} from '../models/index.js';
import { sendPurchaseOrderEmail } from './emailService.js';
import { sendPurchaseOrderSMS } from './smsService.js';
import { logger } from '../utils/logger.js';

const groq = new Groq({
  apiKey: env.GROQ_API_KEY || process.env.GROQ_API_KEY || 'gsk_fallback_key'
});

const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'groq/compound',
  'groq/compound-mini'
];

async function callGroqWithFallback(params) {
  let lastError = null;
  for (const model of GROQ_MODELS) {
    try {
      return await groq.chat.completions.create({
        ...params,
        model
      });
    } catch (err) {
      lastError = err;
      const isRecoverable =
        err.status === 404 ||
        err.status === 413 ||
        err.status === 429 ||
        err.code === 'model_not_found' ||
        err.code === 'model_decommissioned' ||
        err.code === 'rate_limit_exceeded' ||
        err.type === 'tokens' ||
        err.message?.includes('decommissioned') ||
        err.message?.includes('does not exist') ||
        err.message?.includes('Request too large') ||
        err.message?.includes('Rate limit');

      if (isRecoverable) {
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('All Groq models failed');
}

/**
 * =========================================================================
 * AGENT 1: Autonomous Customer Support & Refund Processing Agent
 * =========================================================================
 * 4-Step Pipeline:
 *  1. ROUTE: Reads message, classifies intent (REFUND, DAMAGE, EXCHANGE, INQUIRY)
 *  2. REASON: Checks purchase date, product condition, return policies, context
 *  3. VERIFY: Enforces safety guardrail (Threshold $150 & 30-day window)
 *  4. EXECUTE / PAUSE:
 *     - Under $150 & Valid -> Auto-approves, restores inventory, generates email draft
 *     - Over $150 or Policy Exception -> Pauses & pushes to Manager Approval Queue
 */
export const runCustomerRefundAgent = async ({
  orderNumber,
  customerName,
  customerEmail,
  productId,
  amount,
  daysSincePurchase = 0,
  reason,
  customerMessage,
  userId
}) => {
  const product = productId ? await Product.findByPk(productId) : null;
  const numAmount = Number(amount) || (product ? Number(product.unitCost) : 50.0);
  const numDays = Number(daysSincePurchase) || 0;

  const systemPrompt = `You are StockPilot's Senior Autonomous Customer Support & Refund Policy AI Agent.
Analyze the customer's return/refund claim or inquiry using policy guidelines, intent classification, and deep contextual reasoning.
Address the customer's specific message, exact claim reason, and the elapsed purchase timeframe with personalized, professional care.

You must respond with ONLY a valid JSON object matching this exact structure:
{
  "intent": "REFUND_REQUEST" | "DAMAGE_CLAIM" | "EXCHANGE_REQUEST" | "INQUIRY" | "INVALID_CLAIM",
  "isEligible": boolean,
  "autoRefundApproved": boolean,
  "requiresHumanApproval": boolean,
  "restockEligible": boolean,
  "confidenceScore": number,
  "policyExplanation": "string",
  "recommendedAction": "AUTO_REFUND_RESTOCK" | "AUTO_REFUND_SCRAP" | "ESCALATE_TO_MANAGER" | "ANSWER_INQUIRY" | "REJECT_EXPIRED",
  "customerEmailDraft": "string"
}`;

  const userPrompt = `Evaluate incoming customer communication:
Customer: ${customerName} (${customerEmail})
Order Number: ${orderNumber}
Product: ${product ? `${product.name} (SKU: ${product.sku})` : 'General Catalog Item'}
Claimed Amount: $${numAmount.toFixed(2)}
Days Elapsed Since Purchase: ${numDays} days
Customer Stated Reason: ${reason}
Customer Actual Message: "${customerMessage}"

EVALUATION RULES:
1. Intent & Context Analysis:
   - Carefully read the customer's actual message "${customerMessage}".
   - If the message is a general/unrelated inquiry, classify as "INQUIRY".
   - If the message reports broken goods, cracks, transit damage, or defect, classify as "DAMAGE_CLAIM".
   - If the message reports general return or change of mind, classify as "REFUND_REQUEST".
2. Store Policy Guidelines:
   - Return Window: 30 days from purchase.
   - Auto-Approval Threshold: <= $150.00.
   - Case A: If purchase was made > 30 days ago (e.g. ${numDays} days), the claim has expired. Set isEligible = false, autoRefundApproved = false, recommendedAction = "REJECT_EXPIRED". Draft a polite email explaining the 30-day policy limitation.
   - Case B: If within 30 days but amount > $150.00 (e.g. $${numAmount.toFixed(2)}), set requiresHumanApproval = true, autoRefundApproved = false, recommendedAction = "ESCALATE_TO_MANAGER". Draft an email acknowledging their specific issue (referencing their actual message) and letting them know a manager is reviewing the claim.
   - Case C: If within 30 days and <= $150.00, set autoRefundApproved = true, recommendedAction = "AUTO_REFUND_RESTOCK" (or SCRAP if damaged). Draft an email confirming full refund.
3. Write a personalized, empathetic, customer-centric customerEmailDraft explicitly referencing the customer's actual words.`;

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
    logger.warn(`[Groq Refund Agent Fallback] ${err.message}`);
    const isUnderThreshold = numAmount <= 150;
    const isWithinWindow = numDays <= 30;
    const isDamaged = reason.toLowerCase().includes('damage') || customerMessage.toLowerCase().includes('crack') || customerMessage.toLowerCase().includes('broken') || customerMessage.toLowerCase().includes('torn');
    const isExpired = numDays > 30;

    let explanation = '';
    let emailDraft = '';
    let recAction = 'ESCALATE_TO_MANAGER';
    let autoApprove = false;
    let reqHuman = true;

    if (isExpired) {
      autoApprove = false;
      reqHuman = true;
      recAction = 'REJECT_EXPIRED';
      explanation = `Order was purchased ${numDays} days ago, which exceeds our standard 30-day return policy window. Escalated for supervisor exception evaluation.`;
      emailDraft = `Dear ${customerName},\n\nThank you for reaching out regarding Order #${orderNumber}.\n\nWe understand you are seeking a refund for your purchase ("${customerMessage}"). Our standard policy allows returns and refund claims within 30 days of purchase. As your order was completed ${numDays} days ago, our management team is reviewing your request to determine if a store credit or replacement exception can be made.\n\nBest regards,\nCustomer Support Team`;
    } else if (!isUnderThreshold) {
      autoApprove = false;
      reqHuman = true;
      recAction = 'ESCALATE_TO_MANAGER';
      explanation = `Claim amount of $${numAmount.toFixed(2)} exceeds the automated threshold ($150.00). Flagged for manager review regarding "${customerMessage}".`;
      emailDraft = `Dear ${customerName},\n\nThank you for contacting us regarding Order #${orderNumber}.\n\nWe have received your request stating: "${customerMessage}". Because your claim amount of $${numAmount.toFixed(2)} is categorized as high-value, our operations manager is reviewing your order details and photos to issue the appropriate authorization within 24 hours.\n\nBest regards,\nCustomer Support Team`;
    } else {
      autoApprove = true;
      reqHuman = false;
      recAction = isDamaged ? 'AUTO_REFUND_SCRAP' : 'AUTO_REFUND_RESTOCK';
      explanation = `Claim ($${numAmount.toFixed(2)}, ${numDays} days elapsed) is within the 30-day policy and below the $150 threshold. Auto-approved.`;
      emailDraft = `Dear ${customerName},\n\nThank you for contacting us regarding Order #${orderNumber}.\n\nWe have processed your refund request ("${customerMessage}") in full for $${numAmount.toFixed(2)}. The funds will return to your original payment method within 3-5 business days.\n\nBest regards,\nCustomer Support Team`;
    }

    decision = {
      intent: isDamaged ? 'DAMAGE_CLAIM' : 'REFUND_REQUEST',
      isEligible: !isExpired,
      autoRefundApproved: autoApprove,
      requiresHumanApproval: reqHuman,
      restockEligible: !isDamaged,
      confidenceScore: 0.95,
      policyExplanation: explanation,
      recommendedAction: recAction,
      customerEmailDraft: emailDraft
    };
  }

  const isAutoApproved = Boolean(decision.autoRefundApproved && numAmount <= 150 && !decision.requiresHumanApproval);
  const status = isAutoApproved ? 'APPROVED' : 'PENDING_APPROVAL';

  // 1. Create Refund Request Record
  const refund = await RefundRequest.create({
    orderNumber,
    customerName,
    customerEmail,
    productId: product ? product.id : null,
    amount: numAmount,
    daysSincePurchase: numDays,
    reason,
    customerMessage,
    status,
    isAutoApproved,
    requiresHumanReview: !isAutoApproved,
    aiReasoning: decision.policyExplanation,
    customerEmailDraft: decision.customerEmailDraft,
    restockQuantity: decision.restockEligible ? 1 : 0
  });

  // 2. If Auto-Approved and Restock Eligible -> Update Inventory
  if (isAutoApproved && decision.restockEligible && product) {
    await product.increment('currentStock', { by: 1 });
    await InventoryTransaction.create({
      productId: product.id,
      type: 'RESTOCK',
      quantity: 1,
      reason: `Customer Refund Auto-Restock (Order #${orderNumber})`,
      performedBy: userId || null
    });
  }

  // 3. Record Agent Audit Log
  await AgentLog.create({
    productId: product ? product.id : null,
    action: 'GROQ_AI_REFUND_EVALUATION',
    status: isAutoApproved ? 'AUTO_APPROVED' : 'PAUSED_FOR_APPROVAL',
    message: `Groq AI processed refund for Order #${orderNumber} ($${numAmount.toFixed(2)}). Intent: ${decision.intent}. Decision: ${status}. Explanation: ${decision.policyExplanation}`
  });

  return {
    success: true,
    refundId: refund.id,
    orderNumber,
    status,
    isAutoApproved,
    requiresHumanReview: !isAutoApproved,
    decision,
    refund
  };
};

/**
 * =========================================================================
 * AGENT 2: Autonomous Operations & Fraud Prevention AI Agent
 * =========================================================================
 * 4-Step Pipeline:
 *  1. ROUTE: Inspects transaction, order velocity, item demand, customer metadata
 *  2. REASON: Synthesizes risk factors (burst quantities, stock-draining, anomaly signals)
 *  3. VERIFY: Computes Risk Score (0.00 to 1.00) & classifies risk tier
 *  4. EXECUTE / PAUSE:
 *     - Score < 0.70 -> Clears order for instant warehouse dispatch & fulfillment
 *     - Score >= 0.70 -> Freezes transaction, flags for Human Manager review
 */
export const runFraudDetectionAgent = async ({
  transactionId,
  orderNumber,
  customerName,
  customerEmail,
  productId,
  quantity = 1,
  totalAmount,
  paymentMethod = 'CREDIT_CARD',
  shippingCountry = 'US',
  billingCountry = 'US',
  ipAddress = '192.168.1.1',
  userId
}) => {
  const product = productId ? await Product.findByPk(productId) : null;
  const numQty = Number(quantity) || 1;
  const numAmount = Number(totalAmount) || (product ? Number(product.unitCost) * numQty : 150.0);

  // Check recent sales volume for anomaly detection
  const recentProductSales = product
    ? await InventoryTransaction.count({
        where: {
          productId: product.id,
          type: 'SALE',
          createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      })
    : 0;

  const currentStock = product ? product.currentStock : 100;
  const stockDrainRatio = currentStock > 0 ? (numQty / currentStock) : 1.0;

  const systemPrompt = `You are StockPilot's Senior Autonomous Fraud Prevention & Risk Analyst AI Agent.
Analyze the incoming order transaction for financial risk, identity mismatch, velocity anomalies, and stock-draining risks.
You must respond with ONLY a valid JSON object matching this exact structure:
{
  "riskScore": number, // Float between 0.00 (safest) and 1.00 (highest risk)
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "isHighRisk": boolean,
  "shouldFreezeOrder": boolean,
  "riskFactors": ["string"],
  "analystSummary": "string",
  "recommendedAction": "APPROVE_DISPATCH" | "FREEZE_AND_ALERT_MANAGER" | "CANCEL_AND_BLACKLIST"
}`;

  const userPrompt = `Analyze transaction risk:
Order Number: ${orderNumber || `ORD-${Date.now()}`}
Customer: ${customerName} (${customerEmail})
Product: ${product ? `${product.name} (Current Stock: ${currentStock}, SKU: ${product.sku})` : 'Catalog Product'}
Quantity Requested: ${numQty} units
Stock Drain Percentage: ${(stockDrainRatio * 100).toFixed(1)}% of available stock
Total Order Amount: $${numAmount.toFixed(2)}
Payment Method: ${paymentMethod}
Shipping Country: ${shippingCountry} | Billing Country: ${billingCountry}
24-Hour Velocity on Item: ${recentProductSales} orders

EVALUATION CRITERIA:
1. Quantity Spike: If order requests > 30 units or > 60% of total warehouse stock, assign elevated risk score (+0.35 to +0.50).
2. Location Mismatch: If Billing Country !== Shipping Country, assign additional risk factor (+0.25).
3. Extreme Transaction Value: Orders > $2,500 by new/unverified accounts warrant verification (+0.30).
4. Normal orders (reasonable quantity, matching address, standard value) should receive risk score < 0.30.
5. If riskScore >= 0.70, set shouldFreezeOrder = true and isHighRisk = true. Otherwise false.`;

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
    logger.warn(`[Groq Fraud Agent Fallback] ${err.message}`);
    const isQuantitySpike = numQty >= 40 || stockDrainRatio >= 0.6;
    const isGeoMismatch = shippingCountry !== billingCountry;
    const isHighValue = numAmount >= 2500;

    let score = 0.15;
    const factors = [];
    if (isQuantitySpike) {
      score += 0.40;
      factors.push(`Abnormal order volume (${numQty} units, ${(stockDrainRatio * 100).toFixed(0)}% of stock).`);
    }
    if (isGeoMismatch) {
      score += 0.25;
      factors.push(`Cross-border mismatch: Billing (${billingCountry}) differs from Shipping (${shippingCountry}).`);
    }
    if (isHighValue) {
      score += 0.20;
      factors.push(`High single-transaction capital exposure ($${numAmount.toFixed(2)}).`);
    }

    const finalScore = Math.min(0.99, Number(score.toFixed(2)));
    const isHighRisk = finalScore >= 0.70;

    decision = {
      riskScore: finalScore,
      riskLevel: finalScore >= 0.85 ? 'CRITICAL' : finalScore >= 0.70 ? 'HIGH' : finalScore >= 0.40 ? 'MEDIUM' : 'LOW',
      isHighRisk,
      shouldFreezeOrder: isHighRisk,
      riskFactors: factors.length > 0 ? factors : ['Standard customer transaction profile.'],
      analystSummary: isHighRisk
        ? `Order flagged with risk score ${finalScore}. Multiple compounding anomaly signals detected.`
        : `Order verified with safe risk score ${finalScore}. Passed all autonomous safety checks.`,
      recommendedAction: isHighRisk ? 'FREEZE_AND_ALERT_MANAGER' : 'APPROVE_DISPATCH'
    };
  }

  const riskScore = Number(decision.riskScore) || 0.1;
  const isFrozen = Boolean(decision.shouldFreezeOrder || riskScore >= 0.70);
  const status = isFrozen ? 'PENDING_REVIEW' : 'CLEARED_RELEASED';

  // 1. Create Fraud Alert Record
  const alert = await FraudAlert.create({
    orderNumber: orderNumber || `ORD-${Date.now()}`,
    customerName,
    customerEmail,
    productId: product ? product.id : null,
    quantity: numQty,
    totalAmount: numAmount,
    riskScore,
    riskLevel: decision.riskLevel || (riskScore >= 0.70 ? 'HIGH' : 'LOW'),
    riskFactors: decision.riskFactors || [],
    aiExplanation: decision.analystSummary,
    status,
    isFrozen
  });

  // 2. Record Agent Audit Log
  await AgentLog.create({
    productId: product ? product.id : null,
    action: 'GROQ_AI_FRAUD_INSPECTION',
    status: isFrozen ? 'FROZEN_HIGH_RISK' : 'CLEARED_SAFE',
    message: `Groq AI inspected Order #${alert.orderNumber} ($${numAmount.toFixed(2)}). Risk Score: ${riskScore} (${decision.riskLevel}). Status: ${status}. Summary: ${decision.analystSummary}`
  });

  return {
    success: true,
    alertId: alert.id,
    orderNumber: alert.orderNumber,
    riskScore,
    riskLevel: alert.riskLevel,
    isFrozen,
    status,
    decision,
    alert
  };
};

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
  const baselineReorderQty = Math.max(1, product.targetStock - product.currentStock);
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
1. Reorder quantity should bring stock close to target capacity (${product.targetStock}) without excessive overstocking.
2. Calculate totalCost = recommendedQuantity * unitCost.
3. If totalCost > 1000, set requiresHumanApproval = true. Otherwise false.
4. Calculate burnRatePerDay based on recent sales and daysUntilStockout = currentStock / burnRate.
5. Provide a sharp, professional executiveSummary explaining your calculation for management review.`;

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
 * =========================================================================
 * AGENT 4: Interactive Dashboard & Chat Analytics AI Agent
 * =========================================================================
 * Analyzes live database tables and answers questions in natural language.
 */
export const runInventoryAnalyticsAgent = async ({ query, userId }) => {
  const products = await Product.findAll({ order: [['currentStock', 'ASC']] });
  const lowStockProducts = products.filter(p => p.currentStock <= p.safetyThreshold);
  const overTargetProducts = products.filter(p => p.currentStock > p.targetStock);
  
  const recentSales = await InventoryTransaction.findAll({
    where: { type: 'SALE' },
    limit: 50,
    order: [['createdAt', 'DESC']],
    include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }]
  });

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
  const pendingRefundsCount = await RefundRequest.count({ where: { status: 'PENDING_APPROVAL' } });

  const contextData = {
    totalProductsCount: products.length,
    lowStockCount: lowStockProducts.length,
    lowStockItems: lowStockProducts.map(p => `${p.name} (Current Stock: ${p.currentStock}, Safety Threshold: ${p.safetyThreshold}, Target Stock: ${p.targetStock})`),
    overTargetCount: overTargetProducts.length,
    overTargetItems: overTargetProducts.map(p => `${p.name} (Current Stock: ${p.currentStock} units, Target Stock: ${p.targetStock} units, Surplus: +${p.currentStock - p.targetStock} units)`),
    topFastestMovingProducts: topSellingList.length > 0 ? topSellingList : ['No recent sales recorded yet'],
    totalInventoryValuation: `$${totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    pendingRestockApprovals: pendingApprovalsCount,
    pendingRefundApprovals: pendingRefundsCount,
    allProductList: products.map(p => ({
      name: p.name,
      sku: p.sku,
      currentStock: p.currentStock,
      safetyThreshold: p.safetyThreshold,
      targetStock: p.targetStock,
      surplusOverTarget: p.currentStock > p.targetStock ? p.currentStock - p.targetStock : 0,
      unitCost: `$${Number(p.unitCost).toFixed(2)}`,
      totalValuation: `$${(p.currentStock * Number(p.unitCost)).toFixed(2)}`,
      supplier: p.supplierName,
      status: p.stockStatus
    }))
  };

  const systemPrompt = `You are StockPilot's Senior AI Inventory & Operations Analytics Copilot.
You have real-time live database telemetry spanning catalog products, current vs target stock, safety thresholds, sales velocity, valuation, and approvals.

CRITICAL SCOPE & DOMAIN BOUNDARY:
1. STRICT SCOPE ENFORCEMENT: You must ONLY answer questions directly related to StockPilot's project database: inventory stock levels, product catalog, safety thresholds, target counts, sales velocity, suppliers, purchase orders, restock workflows, and customer refunds.
2. REJECT GENERAL / TRIVIA QUESTIONS: If the user asks an unrelated general knowledge question (e.g., geography, trivia, "what is the capital of India", general world facts, politics, weather, entertainment, etc.), DO NOT answer the general question.
   - Politely decline by responding:
   "I am StockPilot's specialized Inventory & Operations Intelligence Agent. I only answer questions related to our project's inventory database, product catalog, stock levels, suppliers, and procurement workflows."
   - Then provide 2-3 supply chain and catalog questions they can ask about our live inventory.
3. INVENTORY TELEMETRY QUERIES:
   - If the user asks about products exceeding target stock or overstocked items (e.g. "which inventory stock product has higher count than target count"), explicitly name the products where currentStock > targetStock (e.g. "${contextData.overTargetItems.join('; ')}"), state the exact current vs target quantities and the surplus amount.
   - If the user asks about low stock, sales velocity, valuation, or suppliers, cite the exact figures from the LIVE DATABASE SNAPSHOT below.
4. Format your answer using clean markdown, bold highlights, and clear tables or bullet points.

LIVE DATABASE SNAPSHOT:
- Products with Current Stock HIGHER than Target Stock: ${contextData.overTargetCount > 0 ? contextData.overTargetItems.join(' | ') : 'None (no products currently exceed target stock)'}
- Low Stock Items (Current <= Safety Threshold): ${contextData.lowStockCount > 0 ? contextData.lowStockItems.join(' | ') : 'All products healthy'}
- Total Catalog Products: ${contextData.totalProductsCount}
- Top Selling Products: ${contextData.topFastestMovingProducts.join(', ')}
- Total Inventory Capital Valuation: ${contextData.totalInventoryValuation}
- Pending Restock Approvals (> $1000): ${contextData.pendingRestockApprovals}
- Pending Refund Approvals (> $150): ${contextData.pendingRefundApprovals}
- Full Product Detail Records: ${JSON.stringify(contextData.allProductList, null, 2)}`;

  try {
    const completion = await callGroqWithFallback({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.2,
      max_tokens: 1500
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
        pendingApprovals: contextData.pendingRestockApprovals,
        pendingRefunds: contextData.pendingRefundApprovals
      }
    };
  } catch (err) {
    logger.error(`[Groq Analytics Error] ${err.message}`);
    
    const qLower = (query || '').toLowerCase();
    let fallbackAnswer = '';

    if (qLower.includes('higher') || qLower.includes('target') || qLower.includes('overstock') || qLower.includes('surplus') || qLower.includes('more than target')) {
      if (overTargetProducts.length > 0) {
        fallbackAnswer = `### 📦 Products with Stock Higher than Target Stock\n\n`;
        fallbackAnswer += `The following **${overTargetProducts.length} product(s)** currently have inventory levels exceeding their configured target stock:\n\n`;
        overTargetProducts.forEach(p => {
          const surplus = p.currentStock - p.targetStock;
          fallbackAnswer += `* **${p.name}** (\`${p.sku}\`):\n`;
          fallbackAnswer += `  - **Current Stock**: **${p.currentStock} units**\n`;
          fallbackAnswer += `  - **Target Stock**: **${p.targetStock} units** (Safety Threshold: ${p.safetyThreshold} units)\n`;
          fallbackAnswer += `  - **Surplus**: **+${surplus} units above target** (Valued at $${(surplus * Number(p.unitCost)).toFixed(2)})\n\n`;
        });
        fallbackAnswer += `> **Recommendation**: Consider promotional campaigns or slowing re-orders to normalize working capital.`;
      } else {
        fallbackAnswer = `### 📦 Stock vs. Target Analysis\n\nCurrently, **no products** have inventory counts exceeding their target stock levels. All items are operating at or below target capacity.`;
      }
    } else if (qLower.includes('capital') || qLower.includes('india') || qLower.includes('weather') || qLower.includes('president') || qLower.includes('movie')) {
      fallbackAnswer = `I am StockPilot's specialized Inventory & Operations Intelligence Agent. I can only answer questions regarding our project's inventory database, product catalog, stock levels, suppliers, sales trends, and procurement workflows.\n\n> **Suggested questions you can ask me:**\n* *"Which inventory stock product has higher count than target count?"*\n* *"Which products are currently below their safety threshold?"*\n* *"What is our total inventory capital valuation?"*\n* *"What are our top fastest-moving products by sales volume?"*`;
    } else if (qLower.includes('low') || qLower.includes('risk') || qLower.includes('shortage') || qLower.includes('reorder')) {
      fallbackAnswer = `### ⚠️ Low Stock & Restock Alerts\n\n`;
      if (lowStockProducts.length > 0) {
        fallbackAnswer += `The following products have fallen below their safety thresholds:\n\n`;
        lowStockProducts.forEach(p => {
          fallbackAnswer += `* **${p.name}** (\`${p.sku}\`): Current **${p.currentStock} units** (Safety Threshold: **${p.safetyThreshold} units**, Target: **${p.targetStock} units**)\n`;
        });
      } else {
        fallbackAnswer = `All products are currently above their safety thresholds. No critical stockouts detected.`;
      }
    } else {
      fallbackAnswer = `### 📊 Live Operations & Inventory Analysis\n\n`;
      fallbackAnswer += `* **Over-Target Inventory**: ${contextData.overTargetCount > 0 ? contextData.overTargetItems.join(', ') : 'None'}\n`;
      fallbackAnswer += `* **Fastest Moving Products**: ${contextData.topFastestMovingProducts.join(', ')}\n`;
      fallbackAnswer += `* **Low Stock Items Requiring Attention**: ${contextData.lowStockCount > 0 ? contextData.lowStockItems.join(', ') : 'All products currently healthy'}\n`;
      fallbackAnswer += `* **Total Inventory Valuation**: ${contextData.totalInventoryValuation}\n`;
      fallbackAnswer += `* **Pending Human Approvals**: ${contextData.pendingRestockApprovals} restock order(s), ${contextData.pendingRefundApprovals} refund(s)\n`;
    }

    return {
      success: true,
      answer: fallbackAnswer,
      metrics: {
        totalProducts: contextData.totalProductsCount,
        lowStockCount: contextData.lowStockCount,
        fastestMoving: contextData.topFastestMovingProducts[0] || 'N/A',
        valuation: contextData.totalInventoryValuation,
        pendingApprovals: contextData.pendingRestockApprovals,
        pendingRefunds: contextData.pendingRefundApprovals
      }
    };
  }
};

/**
 * =========================================================================
 * AGENT 5: Autonomous Vendor Selection & Supplier Intelligence AI Agent
 * =========================================================================
 * Multi-Criteria Decision Analysis (MCDA) across Price, Warranty, Quality, Lead Time, and Reliability.
 */
export const runVendorEvaluationAgent = async ({
  title = 'Multi-Vendor Supplier Comparison',
  productCategory = 'General Catalog',
  targetQuantity = 100,
  priorityFocus = 'BALANCED',
  vendorProposals = [],
  documentSnippets = [],
  uploadedFiles = [],
  userId,
  senderName = 'Procurement Specialist',
  senderRole = 'MANAGER',
  senderEmail = 'procurement@stockpilot.com'
}) => {
  const hasProposals = Array.isArray(vendorProposals) && vendorProposals.length >= 2;
  const hasDocuments = Array.isArray(documentSnippets) && documentSnippets.length >= 2;

  if (!hasProposals && !hasDocuments && (vendorProposals.length + documentSnippets.length) < 2) {
    throw new Error('At least 2 vendor proposals or uploaded quote documents are required for multi-vendor comparison.');
  }

  const systemPrompt = `You are StockPilot's Chief Procurement Officer & Supplier Intelligence AI Agent.
Evaluate and compare multiple vendor proposals, contract terms, warranties, quality standards, and pricing structures.
Extract vendor contact information (email, phone) and commercial details directly from raw document text.

You must respond with ONLY a valid JSON object matching this exact structure:
{
  "bestVendorName": "string",
  "bestVendorEmail": "string",
  "bestVendorPhone": "string",
  "overallRecommendationScore": number, // 0 to 100
  "extractedVendors": [
    {
      "vendorName": "string",
      "vendorEmail": "string",
      "vendorPhone": "string",
      "unitPrice": number,
      "warrantyMonths": number,
      "leadTimeDays": number,
      "qualityGrade": "string",
      "defectRatePct": "string",
      "paymentTerms": "string",
      "notes": "string"
    }
  ],
  "scoringMatrix": [
    {
      "vendorName": "string",
      "vendorEmail": "string",
      "vendorPhone": "string",
      "priceScore": number, // 0-100
      "qualityScore": number, // 0-100
      "warrantyScore": number, // 0-100
      "leadTimeScore": number, // 0-100
      "compositeScore": number, // 0-100
      "pros": ["string"],
      "cons": ["string"],
      "estimatedTotalContractCost": number
    }
  ],
  "executiveSummary": "string", // Multi-paragraph detailed analysis explaining why the winner was chosen
  "keyTradeoffs": [
    {
      "comparison": "string",
      "analysis": "string"
    }
  ],
  "riskAnalysis": "string", // Hidden traps, MOQ constraints, SLA risks
  "negotiationStrategy": "string", // Actionable counter-offer advice to extract better pricing or terms
  "emailSubject": "string", // Subject line for procurement email
  "emailDraft": "string", // Formal procurement email to the chosen vendor signed by ${senderName} (${senderRole}) without any phone number
  "smsDraft": "string" // Natural, polite, human-written business SMS (e.g. 'Hi [Vendor Name] team, this is ${senderName} from StockPilot. We have approved your quotation for ${targetQuantity} units of ${title}. Please reply with your pro-forma invoice to confirm the order. Thank you!')
}`;

  const userPrompt = `Compare and evaluate vendor proposals for procurement:
Procurement Title: ${title}
Product Category: ${productCategory}
Target Volume: ${targetQuantity} units
Strategic Priority Focus: ${priorityFocus} (options: BALANCED, LOWEST_PRICE, HIGHEST_QUALITY, LONGEST_WARRANTY, FASTEST_LEAD_TIME)
Sender / Logged-in User: ${senderName} (${senderRole}) <${senderEmail}>

${vendorProposals.length > 0 ? `SUBMITTED VENDOR PROPOSALS & CONTRACT DETAILS:\n${JSON.stringify(vendorProposals, null, 2)}` : 'No manual form inputs provided. Extract all vendor proposals and contact info directly from the attached documents below.'}

ATTACHED VENDOR DOCUMENTS, QUOTATION SHEETS & WARRANTY CONTRACTS:
${documentSnippets.length > 0 ? documentSnippets.join('\n\n====================\n\n') : 'No additional raw document text provided.'}

EVALUATION & DISPATCH INSTRUCTIONS:
1. Parse every distinct vendor quote and extract their official contact email address and phone number.
2. Rank all vendors from highest composite score to lowest in the "scoringMatrix" according to ${priorityFocus}.
3. EMAIL SIGNATURE RULE: Sign the email using ONLY the logged-in user's details:
   Best regards,
   ${senderName}
   ${senderRole} | StockPilot Sourcing
   ${senderEmail}
   CRITICAL: DO NOT include any phone number in the email. DO NOT use placeholders like [Your Name], [Phone], [Email].
4. SMS DRAFT RULE: Write a warm, courteous, and completely natural human-written SMS text that any vendor can instantly understand (e.g. "Hi [Vendor Name] team, this is ${senderName} from StockPilot. We have approved your quotation for ${targetQuantity} units of ${title}. Please reply with your pro-forma invoice to confirm the order. Thank you!"). DO NOT use robotic shorthand like 'awarded 500x' or 'check your email'.`;

  let decision;
  try {
    const completion = await callGroqWithFallback({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 4000
    });

    decision = JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch (err) {
    logger.warn(`[Groq Vendor Agent Warning] ${err.message}. Using intelligent analytical fallback.`);
    
    // Parse proposal candidates from documentSnippets if manual forms are empty
    let effectiveProposals = Array.isArray(vendorProposals) && vendorProposals.length > 0 ? [...vendorProposals] : [];
    if (effectiveProposals.length === 0 && Array.isArray(documentSnippets) && documentSnippets.length > 0) {
      effectiveProposals = documentSnippets.map((snippet, idx) => {
        const nameMatch = snippet.match(/SUPPLIER NAME:\s*([^\n\r]+)/i) || snippet.match(/ISSUING ENTITY:\s*([^\n\r]+)/i);
        const emailMatch = snippet.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
        const phoneMatch = snippet.match(/(?:Tel|Phone|WhatsApp|Line|Secure Line)[\s:]*([+\d\s()-]{8,20})/i);
        const priceMatch = snippet.match(/Unit Price[^\$]*\$([0-9.]+)/i) || snippet.match(/Unit Quote[^\$]*\$([0-9.]+)/i) || snippet.match(/\$([0-9.]+)\s*USD/i);
        const warrantyMatch = snippet.match(/([0-9]+)\s*Months/i);
        const leadTimeMatch = snippet.match(/([0-9]+)\s*Business Days/i) || snippet.match(/([0-9]+)\s*Days/i);
        const gradeMatch = snippet.match(/Quality Certification & Grade\s*([^\n\r]+)/i) || snippet.match(/Quality Grade[^\n\r]*\s*([^\n\r]+)/i);
        const defectMatch = snippet.match(/([0-9.]+)%\s*(?:\(Verified|threshold|tolerance)?/i);
        const paymentMatch = snippet.match(/Commercial Payment Terms\s*([^\n\r]+)/i);

        return {
          vendorName: nameMatch ? nameMatch[1].trim() : `Supplier Proposal #${idx + 1}`,
          vendorEmail: emailMatch ? emailMatch[1].trim() : `sales@supplier${idx + 1}.com`,
          vendorPhone: phoneMatch ? phoneMatch[1].trim() : `+1 555 010${idx + 1}`,
          unitPrice: priceMatch ? parseFloat(priceMatch[1]) : (35 + idx * 4),
          warrantyMonths: warrantyMatch ? parseInt(warrantyMatch[1]) : 12,
          leadTimeDays: leadTimeMatch ? parseInt(leadTimeMatch[1]) : 14,
          qualityGrade: gradeMatch ? gradeMatch[1].trim() : 'Commercial Grade A',
          defectRatePct: defectMatch ? `${defectMatch[1]}%` : '1.0%',
          paymentTerms: paymentMatch ? paymentMatch[1].trim() : 'Net 30 Days',
          notes: ''
        };
      });
    }

    if (effectiveProposals.length === 0) {
      effectiveProposals = [
        { vendorName: 'Apex Component Dynamics', vendorEmail: 'sales@apexcomponents.co.uk', vendorPhone: '+44 20 7946 0912', unitPrice: 42.5, warrantyMonths: 24, leadTimeDays: 10, qualityGrade: 'Grade A+' },
        { vendorName: 'Global Sourcing Inc.', vendorEmail: 'quotes@globalsourcing.com', vendorPhone: '+1 214 555 0199', unitPrice: 31.5, warrantyMonths: 6, leadTimeDays: 28, qualityGrade: 'Grade C' }
      ];
    }

    // Dynamic Multi-Criteria Weights based on Strategic Priority
    let wPrice = 0.30, wWarranty = 0.25, wQuality = 0.25, wLeadTime = 0.20;
    if (priorityFocus === 'LOWEST_PRICE') {
      wPrice = 0.60; wWarranty = 0.15; wQuality = 0.15; wLeadTime = 0.10;
    } else if (priorityFocus === 'LONGEST_WARRANTY') {
      wWarranty = 0.55; wPrice = 0.20; wQuality = 0.15; wLeadTime = 0.10;
    } else if (priorityFocus === 'HIGHEST_QUALITY') {
      wQuality = 0.55; wWarranty = 0.20; wPrice = 0.15; wLeadTime = 0.10;
    } else if (priorityFocus === 'FASTEST_LEAD_TIME') {
      wLeadTime = 0.55; wPrice = 0.20; wWarranty = 0.15; wQuality = 0.10;
    }

    const minPrice = Math.min(...effectiveProposals.map(p => Number(p.unitPrice) || 50));
    const maxWarranty = Math.max(...effectiveProposals.map(p => Number(p.warrantyMonths) || 12));
    const minLead = Math.min(...effectiveProposals.map(p => Number(p.leadTimeDays) || 14));

    const scored = effectiveProposals.map((v, idx) => {
      const price = Number(v.unitPrice) || 50;
      const warranty = Number(v.warrantyMonths) || 12;
      const leadTime = Number(v.leadTimeDays) || 14;
      const totalCost = price * Number(targetQuantity);

      const priceScore = Math.max(20, Math.min(100, Math.round((minPrice / Math.max(1, price)) * 100)));
      const qualityScore = (v.qualityGrade?.toLowerCase().includes('a++') || v.qualityGrade?.toLowerCase().includes('tuv') || v.qualityGrade?.toLowerCase().includes('military')) ? 98 :
                           (v.qualityGrade?.toLowerCase().includes('a+') || v.qualityGrade?.toLowerCase().includes('iso')) ? 90 :
                           (v.qualityGrade?.toLowerCase().includes('grade a') || v.qualityGrade?.toLowerCase().includes('rohs')) ? 82 : 65;
      const warrantyScore = Math.max(20, Math.min(100, Math.round((warranty / Math.max(1, maxWarranty)) * 100)));
      const leadTimeScore = Math.max(20, Math.min(100, Math.round((minLead / Math.max(1, leadTime)) * 100)));
      
      const composite = Math.round((priceScore * wPrice) + (qualityScore * wQuality) + (warrantyScore * wWarranty) + (leadTimeScore * wLeadTime));

      return {
        vendorName: v.vendorName || `Vendor #${idx + 1}`,
        vendorEmail: v.vendorEmail || `sales@vendor${idx + 1}.com`,
        vendorPhone: v.vendorPhone || `+1 555 010${idx + 1}`,
        priceScore,
        qualityScore,
        warrantyScore,
        leadTimeScore,
        compositeScore: composite,
        pros: [
          `Unit quote of $${price.toFixed(2)} ($${totalCost.toLocaleString()} total contract)`,
          `${warranty} months warranty protection (${(warranty/12).toFixed(1)} yrs)`,
          `${leadTime} days production turnaround`
        ],
        cons: [
          defectScore(v.defectRatePct),
          price > (minPrice * 1.25) ? 'Higher unit investment' : 'Standard commercial terms'
        ],
        estimatedTotalContractCost: totalCost
      };
    });

    function defectScore(rate) {
      if (!rate) return 'Standard defect margin';
      const num = parseFloat(rate);
      return num > 1.5 ? `Elevated defect tolerance (${rate})` : `Strict defect SLA (${rate})`;
    }

    scored.sort((a, b) => b.compositeScore - a.compositeScore);
    const winner = scored[0];

    decision = {
      bestVendorName: winner.vendorName,
      bestVendorEmail: winner.vendorEmail || 'sales@vendor.com',
      bestVendorPhone: winner.vendorPhone || '+1 555 0199',
      overallRecommendationScore: winner.compositeScore,
      scoringMatrix: scored,
      executiveSummary: `Based on Multi-Criteria Decision Analysis evaluating ${effectiveProposals.length} suppliers for ${targetQuantity} units of ${title} with strategic priority "${priorityFocus}", **${winner.vendorName}** emerges as the premier procurement partner with a top composite score of ${winner.compositeScore}/100. They provide the most favorable alignment across pricing, warranty duration, quality certifications, and delivery SLAs.`,
      keyTradeoffs: [
        {
          comparison: `${scored[0]?.vendorName} vs ${scored[1]?.vendorName || 'Competitors'}`,
          analysis: `Selecting ${scored[0]?.vendorName} achieves optimal risk-adjusted returns by balancing contractual protection against upfront unit investment.`
        }
      ],
      riskAnalysis: 'Key risks include confirming sample verification batches and ensuring defect replacement timelines are strictly codified into the final binding purchase contract.',
      negotiationStrategy: `Leverage your ${targetQuantity}-unit volume commitment to request an additional 3-5% volume discount or Net 45/60 payment terms.`,
      emailSubject: `Award Notification – ${winner.vendorName} for ${title}`,
      emailDraft: `Dear ${winner.vendorName} Sales & Contracts Team,\n\nWe are pleased to inform you that your quotation for ${title} (${targetQuantity} units) has been selected as our winning proposal.\n\nPlease reply with your formal Pro-Forma Invoice, final Master Service Agreement (MSA), and banking details for deposit processing.\n\nBest regards,\n${senderName}\n${senderRole} | StockPilot Sourcing\n${senderEmail}`,
      smsDraft: `Hi ${winner.vendorName} team, this is ${senderName} from StockPilot. We have approved your quotation for ${targetQuantity} units of ${title}. Please reply with your pro-forma invoice to confirm the order. Thank you!`
    };
  }

  // Sanitize emailDraft to guarantee no phone numbers and replace any lingering placeholders
  if (decision.emailDraft) {
    let cleanedEmail = decision.emailDraft
      .replace(/\[Your Name\]/gi, senderName)
      .replace(/\[Name\]/gi, senderName)
      .replace(/\[Email\]/gi, senderEmail)
      .replace(/\[Phone\]/gi, '')
      .replace(/(?:Phone|Tel|Mobile|WhatsApp)[\s:]*\[?[+\d\s()-]+\]?/gi, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    // Ensure proper user sign-off if AI truncated signature
    if (!cleanedEmail.includes(senderName)) {
      cleanedEmail += `\n\nBest regards,\n${senderName}\n${senderRole} | StockPilot Sourcing\n${senderEmail}`;
    }

    decision.emailDraft = cleanedEmail;
  }

  // Sanitize smsDraft to guarantee human, courteous, natural messaging
  if (decision.smsDraft) {
    let cleanSms = decision.smsDraft;
    if (
      cleanSms.toLowerCase().includes('check your email') ||
      cleanSms.toLowerCase().includes('check email') ||
      cleanSms.startsWith('StockPilot:') ||
      cleanSms.includes('awarded')
    ) {
      cleanSms = `Hi ${decision.bestVendorName} team, this is ${senderName} from StockPilot. We have approved your quotation for ${targetQuantity} units of ${title}. Please reply with your pro-forma invoice to confirm the order. Thank you!`;
    }
    decision.smsDraft = cleanSms;
  }

  // Save to database
  const evaluation = await VendorEvaluation.create({
    title,
    productCategory,
    targetQuantity: Number(targetQuantity),
    priorityFocus,
    vendorProposals,
    bestVendorName: decision.bestVendorName,
    overallRecommendationScore: decision.overallRecommendationScore,
    scoringMatrix: decision.scoringMatrix || [],
    executiveSummary: decision.executiveSummary,
    keyTradeoffs: decision.keyTradeoffs || [],
    negotiationStrategy: decision.negotiationStrategy,
    emailDraft: decision.emailDraft,
    uploadedFiles,
    evaluatedBy: userId || null
  });

  // Log action
  await AgentLog.create({
    action: 'GROQ_AI_VENDOR_EVALUATION',
    status: 'EVALUATION_COMPLETED',
    message: `Groq AI evaluated ${vendorProposals.length} vendor proposals for '${title}'. Winner: ${decision.bestVendorName} (Score: ${decision.overallRecommendationScore}/100). Strategic Priority: ${priorityFocus}.`
  });

  return {
    success: true,
    evaluationId: evaluation.id,
    decision,
    evaluation
  };
};

