import { Op } from 'sequelize';
import { Product, InventoryTransaction, FraudAlert, AgentLog } from '../../models/index.js';
import { callGroqWithFallback } from './groqClient.js';
import { logger } from '../../utils/logger.js';

/**
 * =========================================================================
 * AGENT 2: Autonomous Operations & Risk Analysis Agent
 * =========================================================================
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

  const systemPrompt = `You are StockPilot's Senior Autonomous Operations & Risk Analyst AI Agent.
Analyze the incoming order transaction for financial risk, identity mismatch, velocity anomalies, and stock-draining risks.
You must respond with ONLY a valid JSON object matching this exact structure:
{
  "riskScore": number,
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
24-Hour Velocity on Item: ${recentProductSales} orders`;

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
    logger.warn(`[Risk Agent Fallback] ${err.message}`);
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

  let alert = null;
  if (FraudAlert) {
    alert = await FraudAlert.create({
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
  }

  await AgentLog.create({
    productId: product ? product.id : null,
    action: 'SECURITY_RISK_AUDIT',
    status: isFrozen ? 'FROZEN_HIGH_RISK' : 'CLEARED_SAFE',
    message: `System audited Order #${orderNumber || 'N/A'} ($${numAmount.toFixed(2)}). Risk Score: ${riskScore} (${decision.riskLevel}). Status: ${status}. Summary: ${decision.analystSummary}`
  });

  return {
    success: true,
    alertId: alert?.id,
    orderNumber: orderNumber || alert?.orderNumber,
    riskScore,
    riskLevel: alert?.riskLevel || decision.riskLevel,
    isFrozen,
    status,
    decision,
    alert
  };
};
