import { z } from 'zod';
import { RefundRequest, Product, User, InventoryTransaction, AgentLog } from '../models/index.js';
import { runCustomerRefundAgent } from '../services/groqAgentService.js';

const processRefundSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid customer email'),
  productId: z.number().optional().nullable(),
  amount: z.number().positive('Refund amount must be greater than 0'),
  daysSincePurchase: z.number().min(0).default(0),
  reason: z.string().min(1, 'Reason is required'),
  customerMessage: z.string().min(1, 'Customer message is required')
});

const decisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional().default('')
});

export const processRefundWithAgent = async (req, res, next) => {
  try {
    const validated = processRefundSchema.parse(req.body);
    const result = await runCustomerRefundAgent({
      ...validated,
      userId: req.user.id
    });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    next(error);
  }
};

export const getRefunds = async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }

    const refunds = await RefundRequest.findAll({
      where,
      limit: Number(limit),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'unitCost', 'currentStock'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });

    res.status(200).json(refunds);
  } catch (error) {
    next(error);
  }
};

export const decideRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = decisionSchema.parse(req.body);

    const refund = await RefundRequest.findByPk(id, {
      include: [{ model: Product, as: 'product' }]
    });

    if (!refund) {
      return res.status(404).json({ error: 'Refund request not found' });
    }

    if (refund.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: `Refund request is already ${refund.status}` });
    }

    const isApproved = validated.decision === 'APPROVE';
    refund.status = isApproved ? 'APPROVED' : 'REJECTED';
    refund.reviewedBy = req.user.id;
    refund.reviewNotes = validated.notes;
    await refund.save();

    // If approved and has restock quantity, update inventory
    if (isApproved && refund.restockQuantity > 0 && refund.productId) {
      const product = await Product.findByPk(refund.productId);
      if (product) {
        await product.increment('currentStock', { by: refund.restockQuantity });
        await InventoryTransaction.create({
          productId: product.id,
          type: 'RESTOCK',
          quantity: refund.restockQuantity,
          reason: `Human-Approved Refund Restock (Order #${refund.orderNumber})`,
          performedBy: req.user.id
        });
      }
    }

    await AgentLog.create({
      productId: refund.productId,
      action: 'HUMAN_REFUND_DECISION',
      status: refund.status,
      message: `Manager #${req.user.id} (${req.user.name}) ${refund.status} refund for Order #${refund.orderNumber} ($${Number(refund.amount).toFixed(2)}). Notes: ${validated.notes || 'None'}`
    });

    res.status(200).json({
      success: true,
      message: `Refund request #${refund.id} has been ${refund.status.toLowerCase()}.`,
      refund
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    next(error);
  }
};

export const sendRefundCustomerEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { to, customerName, subject, content } = req.body;

    let refund = null;
    if (id && id !== 'custom') {
      refund = await RefundRequest.findByPk(id);
    }

    const recipientEmail = to || refund?.customerEmail;
    const recipientName = customerName || refund?.customerName;
    const orderNum = refund?.orderNumber || req.body.orderNumber || 'ORD-SUPPORT';

    if (!recipientEmail || !content) {
      return res.status(400).json({ error: 'Recipient email and email content are required.' });
    }

    const { sendCustomerSupportEmail } = await import('../services/emailService.js');
    const result = await sendCustomerSupportEmail({
      to: recipientEmail,
      customerName: recipientName,
      orderNumber: orderNum,
      subject: subject || `Update Regarding Your Order #${orderNum} - StockPilot Customer Support`,
      content
    });

    if (refund) {
      refund.customerEmailDraft = content;
      await refund.save();
    }

    await AgentLog.create({
      action: 'CUSTOMER_SUPPORT_EMAIL_SENT',
      status: result.success ? 'SUCCESS' : 'FAILED',
      message: `Support email dispatched to ${recipientEmail} for Order #${orderNum} (${result.success ? 'Delivered via Nodemailer' : 'Failed'}).`
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `Customer support email successfully dispatched to ${recipientEmail}`,
        result
      });
    } else {
      return res.status(500).json({
        error: result.error || 'Failed to dispatch email via Nodemailer'
      });
    }
  } catch (error) {
    next(error);
  }
};
