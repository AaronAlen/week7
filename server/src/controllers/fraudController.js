import { z } from 'zod';
import { FraudAlert, Product, User, AgentLog } from '../models/index.js';
import { runFraudDetectionAgent } from '../services/groqAgentService.js';

const analyzeFraudSchema = z.object({
  orderNumber: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid customer email'),
  productId: z.number().optional().nullable(),
  quantity: z.number().int().positive('Quantity must be positive'),
  totalAmount: z.number().positive('Total amount must be positive'),
  paymentMethod: z.string().optional().default('CREDIT_CARD'),
  shippingCountry: z.string().optional().default('US'),
  billingCountry: z.string().optional().default('US'),
  ipAddress: z.string().optional().default('127.0.0.1')
});

const fraudDecisionSchema = z.object({
  decision: z.enum(['RELEASE', 'CANCEL']),
  notes: z.string().optional().default('')
});

export const analyzeFraudWithAgent = async (req, res, next) => {
  try {
    const validated = analyzeFraudSchema.parse(req.body);
    const result = await runFraudDetectionAgent({
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

export const getFraudAlerts = async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }

    const alerts = await FraudAlert.findAll({
      where,
      limit: Number(limit),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'unitCost', 'currentStock'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });

    res.status(200).json(alerts);
  } catch (error) {
    next(error);
  }
};

export const decideFraudAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = fraudDecisionSchema.parse(req.body);

    const alert = await FraudAlert.findByPk(id, {
      include: [{ model: Product, as: 'product' }]
    });

    if (!alert) {
      return res.status(404).json({ error: 'Fraud alert record not found' });
    }

    if (alert.status !== 'PENDING_REVIEW') {
      return res.status(400).json({ error: `Fraud alert is already ${alert.status}` });
    }

    const isReleased = validated.decision === 'RELEASE';
    alert.status = isReleased ? 'CLEARED_RELEASED' : 'BLOCKED_CANCELLED';
    alert.isFrozen = false;
    alert.reviewedBy = req.user.id;
    alert.reviewNotes = validated.notes;
    await alert.save();

    await AgentLog.create({
      productId: alert.productId,
      action: 'HUMAN_FRAUD_REVIEW_DECISION',
      status: alert.status,
      message: `Risk Analyst #${req.user.id} (${req.user.name}) ${alert.status} Order #${alert.orderNumber} (Risk Score: ${alert.riskScore}). Notes: ${validated.notes || 'None'}`
    });

    res.status(200).json({
      success: true,
      message: `Order #${alert.orderNumber} fraud review completed: ${alert.status}`,
      alert
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    next(error);
  }
};
