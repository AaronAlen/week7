import { interrupt } from '@langchain/langgraph';
import { ApprovalsQueue, RestockRequest, AgentLog } from '../../models/index.js';
import { logger } from '../../utils/logger.js';

export const humanApprovalNode = async (state) => {
  logger.agent(`[Node 2: humanApprovalNode] Initiating Human-in-the-Loop interrupt for threadId: ${state.threadId}`);

  // Create or update ApprovalsQueue entry
  let approvalItem = await ApprovalsQueue.findOne({ where: { restockRequestId: state.restockRequestId } });
  if (!approvalItem) {
    approvalItem = await ApprovalsQueue.create({
      restockRequestId: state.restockRequestId,
      threadId: state.threadId,
      status: 'PENDING'
    });
  }

  await AgentLog.create({
    productId: state.productId,
    restockRequestId: state.restockRequestId,
    action: 'HITL_INTERRUPT',
    status: 'PAUSED',
    message: `Workflow paused for human approval. Total cost $${Number(state.totalCost).toFixed(2)} exceeds threshold of $1000.`
  });

  // Interrupt execution and payload returned to API / caller
  const resumeValue = interrupt({
    message: 'This purchase order exceeds the automatic approval limit of $1000. Administrator approval is required.',
    restockRequestId: state.restockRequestId,
    threadId: state.threadId,
    productId: state.productId,
    productName: state.productName,
    sku: state.sku,
    currentStock: state.currentStock,
    safetyThreshold: state.safetyThreshold,
    targetStock: state.targetStock,
    reorderQuantity: state.calculatedReorderQty,
    unitCost: state.unitCost,
    totalCost: state.totalCost,
    supplierName: state.supplierName,
    supplierEmail: state.supplierEmail
  });

  logger.agent(`[humanApprovalNode] Resumed with value:`, resumeValue);

  const approved = Boolean(resumeValue?.approved);

  // Update DB approval queue status
  approvalItem.status = approved ? 'APPROVED' : 'REJECTED';
  if (resumeValue?.approvedBy) {
    approvalItem.approvedBy = resumeValue.approvedBy;
  }
  await approvalItem.save();

  await AgentLog.create({
    productId: state.productId,
    restockRequestId: state.restockRequestId,
    action: 'HITL_RESUME',
    status: approved ? 'APPROVED' : 'REJECTED',
    message: `Human decision received: Order ${approved ? 'APPROVED' : 'REJECTED'}.`
  });

  return {
    ...state,
    isApproved: approved,
    status: approved ? 'APPROVED' : 'REJECTED',
    logs: [`Human approval decision: ${approved ? 'APPROVED' : 'REJECTED'}`]
  };
};
