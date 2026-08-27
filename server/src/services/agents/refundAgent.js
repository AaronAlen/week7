import { Product, InventoryTransaction, RefundRequest, AgentLog } from '../../models/index.js';
import { callGroqWithFallback } from './groqClient.js';
import { logger } from '../../utils/logger.js';

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
    const msgLower = (customerMessage || '').trim().toLowerCase();
    const isGreetingOrInquiry =
      msgLower === 'hi' ||
      msgLower === 'hello' ||
      msgLower === 'hey' ||
      msgLower === 'hi ' ||
      msgLower === 'help' ||
      msgLower.startsWith('good morning') ||
      msgLower.startsWith('good afternoon') ||
      (msgLower.length < 8 && !msgLower.includes('refund') && !msgLower.includes('break') && !msgLower.includes('crack') && !msgLower.includes('damage'));

    const isUnderThreshold = numAmount <= 150;
    const isWithinWindow = numDays <= 30;
    const isDamaged = reason.toLowerCase().includes('damage') || msgLower.includes('crack') || msgLower.includes('broken') || msgLower.includes('torn');
    const isExpired = numDays > 30;

    let intent = 'REFUND_REQUEST';
    let explanation = '';
    let emailDraft = '';
    let recAction = 'ESCALATE_TO_MANAGER';
    let autoApprove = false;
    let reqHuman = true;

    if (isGreetingOrInquiry) {
      intent = 'INQUIRY';
      autoApprove = false;
      reqHuman = false;
      recAction = 'ANSWER_INQUIRY';
      explanation = `The customer's message only says "${customerMessage}", which does not constitute a damage report or formal refund claim. Treated as a general inquiry.`;
      emailDraft = `Hi ${customerName},\n\nThank you for reaching out! We received your message "${customerMessage}" and want to make sure we address any questions or concerns you may have about your recent order (${orderNumber}).\n\nPlease let us know how we can assist you—whether you have a question about your product, delivery, or account.\n\nWe look forward to hearing from you!\n\nBest regards,\nCustomer Support Team`;
    } else if (isExpired) {
      intent = isDamaged ? 'DAMAGE_CLAIM' : 'REFUND_REQUEST';
      autoApprove = false;
      reqHuman = true;
      recAction = 'REJECT_EXPIRED';
      explanation = `Order was purchased ${numDays} days ago, which exceeds our standard 30-day return policy window. Escalated for supervisor exception evaluation.`;
      emailDraft = `Dear ${customerName},\n\nThank you for reaching out regarding Order #${orderNumber}.\n\nWe understand you are seeking a refund for your purchase ("${customerMessage}"). Our standard policy allows returns and refund claims within 30 days of purchase. As your order was completed ${numDays} days ago, our management team is reviewing your request to determine if a store credit or replacement exception can be made.\n\nBest regards,\nCustomer Support Team`;
    } else if (!isUnderThreshold) {
      intent = isDamaged ? 'DAMAGE_CLAIM' : 'REFUND_REQUEST';
      autoApprove = false;
      reqHuman = true;
      recAction = 'ESCALATE_TO_MANAGER';
      explanation = `Claim amount of $${numAmount.toFixed(2)} exceeds the automated threshold ($150.00). Flagged for manager review regarding "${customerMessage}".`;
      emailDraft = `Dear ${customerName},\n\nThank you for contacting us regarding Order #${orderNumber}.\n\nWe have received your request stating: "${customerMessage}". Because your claim amount of $${numAmount.toFixed(2)} is categorized as high-value, our operations manager is reviewing your order details and photos to issue the appropriate authorization within 24 hours.\n\nBest regards,\nCustomer Support Team`;
    } else {
      intent = isDamaged ? 'DAMAGE_CLAIM' : 'REFUND_REQUEST';
      autoApprove = true;
      reqHuman = false;
      recAction = isDamaged ? 'AUTO_REFUND_SCRAP' : 'AUTO_REFUND_RESTOCK';
      explanation = `Claim ($${numAmount.toFixed(2)}, ${numDays} days elapsed) is within the 30-day policy and below the $150 threshold. Auto-approved.`;
      emailDraft = `Dear ${customerName},\n\nThank you for contacting us regarding Order #${orderNumber}.\n\nWe have processed your refund request ("${customerMessage}") in full for $${numAmount.toFixed(2)}. The funds will return to your original payment method within 3-5 business days.\n\nBest regards,\nCustomer Support Team`;
    }

    decision = {
      intent,
      isEligible: !isExpired && !isGreetingOrInquiry,
      autoRefundApproved: autoApprove,
      requiresHumanApproval: reqHuman,
      restockEligible: !isDamaged && !isGreetingOrInquiry,
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
    action: 'REFUND_POLICY_EVALUATION',
    status: isAutoApproved ? 'AUTO_APPROVED' : 'PAUSED_FOR_APPROVAL',
    message: `System evaluated refund claim for Order #${orderNumber} ($${numAmount.toFixed(2)}). Intent: ${decision.intent}. Decision: ${status}. Explanation: ${decision.policyExplanation}`
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
