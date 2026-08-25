import { runRestockProcurementAgent } from './groqAgentService.js';
import { Product, RestockRequest, PurchaseOrder, ApprovalsQueue, AgentLog } from '../models/index.js';
import { sendPurchaseOrderEmail } from './emailService.js';
import { sendPurchaseOrderSMS } from './smsService.js';
import { logger } from '../utils/logger.js';

export const triggerRestockWorkflow = async ({ productId, userId }) => {
  return runRestockProcurementAgent({ productId, userId });
};

export const resumeRestockWorkflow = async ({ threadId, approved, userId }) => {
  const approvalItem = await ApprovalsQueue.findOne({ where: { threadId } });
  if (!approvalItem) {
    throw new Error(`No pending approval found for thread ID '${threadId}'.`);
  }

  if (approvalItem.status !== 'PENDING') {
    return {
      status: approvalItem.status.toLowerCase(),
      message: `Approval decision for this order has already been recorded as ${approvalItem.status}.`,
      threadId,
      restockRequestId: approvalItem.restockRequestId
    };
  }

  const restockReq = await RestockRequest.findByPk(approvalItem.restockRequestId, {
    include: [{ model: Product, as: 'product' }]
  });

  if (!restockReq) {
    throw new Error(`Restock request #${approvalItem.restockRequestId} not found.`);
  }

  logger.info(`▶️ Processing Human Decision for thread ${threadId}. Decision: ${approved ? 'APPROVED' : 'REJECTED'}`);

  let po = await PurchaseOrder.findOne({ where: { restockRequestId: restockReq.id } });

  if (approved) {
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
      });
    } else if (po.status !== 'SENT') {
      po.status = 'SENT';
      await po.save();
    }

    restockReq.status = 'APPROVED';
    await restockReq.save();

    approvalItem.status = 'APPROVED';
    approvalItem.approvedBy = userId;
    await approvalItem.save();

    if (restockReq.product) {
      sendPurchaseOrderEmail({
        supplierEmail: restockReq.product.supplierEmail,
        supplierName: restockReq.product.supplierName,
        poId: po.id,
        productName: restockReq.product.name,
        sku: restockReq.product.sku,
        quantity: restockReq.quantity,
        unitCost: restockReq.product.unitCost,
        totalCost: restockReq.totalCost
      }).catch(e => logger.warn(`PO email dispatch notice: ${e.message}`));

      sendPurchaseOrderSMS({
        supplierPhone: restockReq.product.supplierPhone,
        supplierName: restockReq.product.supplierName,
        poId: po.id,
        productName: restockReq.product.name,
        sku: restockReq.product.sku,
        quantity: restockReq.quantity,
        unitCost: restockReq.product.unitCost,
        totalCost: restockReq.totalCost
      }).catch(e => logger.warn(`PO SMS dispatch notice: ${e.message}`));
    }

    await AgentLog.create({
      productId: restockReq.productId,
      restockRequestId: restockReq.id,
      action: 'HUMAN_APPROVAL_EXECUTED',
      status: 'APPROVED',
      message: `Administrator approved purchase order #${po.id}. Supplier notified via Email & SMS.`
    });

    return {
      status: 'approved',
      message: 'Purchase order approved and sent to supplier.',
      threadId,
      restockRequestId: approvalItem.restockRequestId,
      result: { status: 'PO_SENT', purchaseOrderId: po.id }
    };
  } else {
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
        status: 'REJECTED'
      });
    } else {
      po.status = 'REJECTED';
      await po.save();
    }

    restockReq.status = 'REJECTED';
    await restockReq.save();

    approvalItem.status = 'REJECTED';
    approvalItem.approvedBy = userId;
    await approvalItem.save();

    await AgentLog.create({
      productId: restockReq.productId,
      restockRequestId: restockReq.id,
      action: 'HUMAN_APPROVAL_EXECUTED',
      status: 'REJECTED',
      message: `Purchase order rejected by administrator.`
    });

    return {
      status: 'rejected',
      message: 'Purchase order rejected by administrator.',
      threadId,
      restockRequestId: approvalItem.restockRequestId,
      result: { status: 'REJECTED' }
    };
  }
};
