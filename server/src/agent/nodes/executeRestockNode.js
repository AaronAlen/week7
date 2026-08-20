import { PurchaseOrder, RestockRequest, AgentLog } from '../../models/index.js';
import { sendPurchaseOrderEmail } from '../../services/emailService.js';
import { sendPurchaseOrderSMS } from '../../services/smsService.js';
import { logger } from '../../utils/logger.js';

export const executeRestockNode = async (state) => {
  logger.agent(`[Node 3: executeRestockNode] Executing for restock request #${state.restockRequestId}`);

  const restockReq = await RestockRequest.findByPk(state.restockRequestId);

  // Case A: Requires human review & was rejected
  if (state.requiresHumanReview && state.isApproved === false) {
    logger.agent(`[executeRestockNode] Restock request #${state.restockRequestId} REJECTED by human.`);

    if (restockReq) {
      restockReq.status = 'REJECTED';
      await restockReq.save();
    }

    let po = await PurchaseOrder.findOne({ where: { restockRequestId: state.restockRequestId } });
    if (!po) {
      po = await PurchaseOrder.create({
        restockRequestId: state.restockRequestId,
        productId: state.productId,
        quantity: state.calculatedReorderQty,
        unitCost: state.unitCost,
        totalCost: state.totalCost,
        supplierName: state.supplierName,
        supplierEmail: state.supplierEmail,
        supplierPhone: state.supplierPhone,
        status: 'REJECTED'
      });
    } else {
      po.status = 'REJECTED';
      await po.save();
    }

    await AgentLog.create({
      productId: state.productId,
      restockRequestId: state.restockRequestId,
      action: 'CANCEL_RESTOCK',
      status: 'REJECTED',
      message: `Restock request #${state.restockRequestId} was rejected during human review. Purchase order cancelled. Product remains in LOW_STOCK state.`
    });

    return {
      ...state,
      status: 'REJECTED',
      logs: ['Restock request rejected by administrator. No purchase order dispatched.']
    };
  }

  // Case B: Auto-approved OR Human-approved -> Execute PO & Send Email + SMS
  logger.agent(`[executeRestockNode] Proceeding with PO creation and supplier email/SMS dispatch.`);

  let po = await PurchaseOrder.findOne({ where: { restockRequestId: state.restockRequestId } });
  if (!po) {
    po = await PurchaseOrder.create({
      restockRequestId: state.restockRequestId,
      productId: state.productId,
      quantity: state.calculatedReorderQty,
      unitCost: state.unitCost,
      totalCost: state.totalCost,
      supplierName: state.supplierName,
      supplierEmail: state.supplierEmail,
      supplierPhone: state.supplierPhone,
      status: 'SENT'
    });
  } else {
    po.status = 'SENT';
    await po.save();
  }

  if (restockReq) {
    restockReq.status = 'APPROVED';
    await restockReq.save();
  }

  // Dispatch Email
  let emailDispatched = false;
  try {
    await sendPurchaseOrderEmail({
      supplierEmail: state.supplierEmail,
      supplierName: state.supplierName,
      poId: po.id,
      productName: state.productName,
      sku: state.sku,
      quantity: state.calculatedReorderQty,
      unitCost: state.unitCost,
      totalCost: state.totalCost
    });
    emailDispatched = true;
  } catch (err) {
    logger.error(`[executeRestockNode] Email dispatch error (non-fatal): ${err.message}`);
  }

  // Dispatch SMS
  let smsDispatched = false;
  try {
    const smsRes = await sendPurchaseOrderSMS({
      supplierPhone: state.supplierPhone,
      supplierName: state.supplierName,
      poId: po.id,
      productName: state.productName,
      sku: state.sku,
      quantity: state.calculatedReorderQty,
      unitCost: state.unitCost,
      totalCost: state.totalCost
    });
    smsDispatched = smsRes.success;
  } catch (err) {
    logger.error(`[executeRestockNode] SMS dispatch error (non-fatal): ${err.message}`);
  }

  await AgentLog.create({
    productId: state.productId,
    restockRequestId: state.restockRequestId,
    action: 'EXECUTE_RESTOCK',
    status: 'PO_SENT',
    message: `Created Purchase Order #${po.id} for ${state.calculatedReorderQty} units of '${state.productName}'. Total: $${Number(state.totalCost).toFixed(2)}. ${emailDispatched ? 'Email dispatched.' : ''} ${smsDispatched ? 'SMS dispatched.' : ''}`
  });

  return {
    ...state,
    purchaseOrderId: po.id,
    status: 'PO_SENT',
    logs: [`Purchase order #${po.id} generated and sent to supplier ${state.supplierEmail}${state.supplierPhone ? ` (${state.supplierPhone})` : ''}.`]
  };
};
