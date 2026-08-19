import { Command } from '@langchain/langgraph';
import { Op } from 'sequelize';
import { restockAgent } from '../agent/agentGraph.js';
import { Product, RestockRequest, ApprovalsQueue, AgentLog } from '../models/index.js';
import { logger } from '../utils/logger.js';

export const triggerRestockWorkflow = async ({ productId, userId }) => {
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found.`);
  }

  // Ensure duplicate active restock request does not already exist using Op.in
  const existingActive = await RestockRequest.findOne({
    where: {
      productId,
      status: { [Op.in]: ['PENDING', 'AWAITING_APPROVAL'] }
    }
  });

  if (existingActive) {
    const approval = await ApprovalsQueue.findOne({ where: { restockRequestId: existingActive.id } });
    return {
      status: existingActive.status === 'AWAITING_APPROVAL' ? 'approval_required' : 'pending',
      message: `An active restock request (#${existingActive.id}) already exists for product '${product.name}'.`,
      restockRequestId: existingActive.id,
      threadId: approval ? approval.threadId : null,
      productName: product.name
    };
  }

  const threadId = `restock-prod-${productId}-${Date.now()}`;
  const config = { configurable: { thread_id: threadId } };

  logger.info(`🤖 Triggering LangGraph Restock Workflow for Product #${productId} (${product.name}). Thread: ${threadId}`);

  const initialState = {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    currentStock: product.currentStock,
    safetyThreshold: product.safetyThreshold,
    targetStock: product.targetStock,
    unitCost: Number(product.unitCost),
    supplierName: product.supplierName,
    supplierEmail: product.supplierEmail,
    threadId,
    createdBy: userId
  };

  const result = await restockAgent.invoke(initialState, config);

  // Check state snapshot to see if workflow hit an interrupt (HITL approval required)
  const currentState = await restockAgent.getState(config);

  if (currentState.tasks && currentState.tasks.length > 0 && currentState.tasks[0].interrupts?.length > 0) {
    const interruptInfo = currentState.tasks[0].interrupts[0].value;
    logger.info(`⏸️ Restock Workflow interrupted for thread ${threadId}. Human approval required.`);
    
    return {
      status: 'approval_required',
      message: `Purchase order cost ($${Number(result.totalCost || interruptInfo.totalCost).toFixed(2)}) exceeds $1000 threshold. Administrator approval required.`,
      threadId,
      restockRequestId: result.restockRequestId || interruptInfo.restockRequestId,
      details: interruptInfo
    };
  }

  return {
    status: 'completed',
    message: result.status === 'PO_SENT' 
      ? `Purchase order generated & sent to ${product.supplierEmail} for '${product.name}'.` 
      : `Stock level for '${product.name}' (${product.currentStock}) is healthy. No restock needed.`,
    threadId,
    restockRequestId: result.restockRequestId,
    result
  };
};

export const resumeRestockWorkflow = async ({ threadId, approved, userId }) => {
  const config = { configurable: { thread_id: threadId } };

  const approvalItem = await ApprovalsQueue.findOne({ where: { threadId } });
  if (!approvalItem) {
    throw new Error(`No pending approval found for thread ID '${threadId}'.`);
  }

  logger.info(`▶️ Resuming LangGraph Restock Workflow for thread ${threadId}. Decision: ${approved ? 'APPROVED' : 'REJECTED'}`);

  const command = new Command({
    resume: {
      approved: Boolean(approved),
      approvedBy: userId
    }
  });

  const result = await restockAgent.invoke(command, config);

  return {
    status: approved ? 'approved' : 'rejected',
    message: approved ? 'Purchase order approved and sent to supplier.' : 'Purchase order rejected by administrator.',
    threadId,
    restockRequestId: approvalItem.restockRequestId,
    result
  };
};
