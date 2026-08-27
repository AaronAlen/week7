import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VendorEvaluation, User } from '../models/index.js';
import { runVendorEvaluationAgent } from '../services/groqAgentService.js';
import { extractDocumentText } from '../utils/documentExtractor.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const samplePdfDir = path.resolve(__dirname, '../../sample_vendor_pdfs');

export const evaluateVendors = async (req, res, next) => {
  try {
    let {
      title,
      productCategory,
      targetQuantity,
      priorityFocus,
      vendorProposals
    } = req.body;

    if (typeof vendorProposals === 'string') {
      try {
        vendorProposals = JSON.parse(vendorProposals);
      } catch (e) {
        vendorProposals = [];
      }
    }

    if (!Array.isArray(vendorProposals)) {
      vendorProposals = [];
    }

    // Process uploaded documents
    const uploadedFiles = [];
    const documentSnippets = [];

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        uploadedFiles.push({
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path
        });

        // Extract full text from PDF / text / csv / json
        try {
          const text = await extractDocumentText(file.path, file.originalname);
          if (text && text.trim().length > 0) {
            documentSnippets.push(`[Attached Document: ${file.originalname}]\n${text}`);
          }
        } catch (readErr) {
          logger.warn(`Could not extract text from document: ${file.originalname}`);
        }
      }
    }

    // Check if at least 2 vendors exist via manual proposals OR via uploaded docs
    if (vendorProposals.length < 2 && documentSnippets.length < 2 && (vendorProposals.length + documentSnippets.length) < 2) {
      return res.status(400).json({
        error: 'Please upload at least 2 vendor quote documents or provide at least 2 vendor proposals to compare.'
      });
    }

    const result = await runVendorEvaluationAgent({
      title: title || 'Multi-Vendor Sourcing Review',
      productCategory: productCategory || 'General Catalog',
      targetQuantity: Number(targetQuantity) || 100,
      priorityFocus: priorityFocus || 'BALANCED',
      vendorProposals,
      documentSnippets,
      uploadedFiles,
      userId: req.user?.id || null,
      senderName: req.user?.name || req.body.senderName || 'Procurement Specialist',
      senderRole: req.user?.role || req.body.senderRole || 'MANAGER',
      senderEmail: req.user?.email || req.body.senderEmail || 'procurement@stockpilot.com'
    });

    // Broadcast to WebSocket clients
    if (req.app.get('io')) {
      req.app.get('io').emit('vendor:evaluated', {
        id: result.evaluationId,
        title: result.evaluation.title,
        bestVendorName: result.decision.bestVendorName,
        score: result.decision.overallRecommendationScore
      });
    }

    return res.status(201).json({
      success: true,
      message: `Evaluation completed successfully. Winner: ${result.decision.bestVendorName}`,
      data: result
    });
  } catch (err) {
    logger.error(`[Vendor Evaluation Controller] ${err.message}`);
    next(err);
  }
};

export const getSamplePdfs = async (req, res, next) => {
  try {
    const manifestPath = path.join(samplePdfDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return res.json({ success: true, samples: data });
    }
    return res.json({ success: true, samples: [] });
  } catch (err) {
    next(err);
  }
};

export const getEvaluations = async (req, res, next) => {
  try {
    const list = await VendorEvaluation.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
    return res.json(list);
  } catch (err) {
    next(err);
  }
};

export const getEvaluationById = async (req, res, next) => {
  try {
    const evaluation = await VendorEvaluation.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
    if (!evaluation) {
      return res.status(404).json({ error: 'Vendor evaluation record not found' });
    }
    return res.json(evaluation);
  } catch (err) {
    next(err);
  }
};

export const deleteEvaluation = async (req, res, next) => {
  try {
    const evaluation = await VendorEvaluation.findByPk(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ error: 'Vendor evaluation not found' });
    }
    await evaluation.destroy();
    return res.json({ success: true, message: 'Vendor evaluation deleted' });
  } catch (err) {
    next(err);
  }
};

export const sendVendorEmail = async (req, res, next) => {
  try {
    const { to, vendorName, subject, content } = req.body;
    if (!to || !content) {
      return res.status(400).json({ error: 'Recipient email and message content are required.' });
    }

    const { sendVendorProposalEmail } = await import('../services/emailService.js');
    const result = await sendVendorProposalEmail({
      to,
      vendorName: vendorName || 'Vendor Partner',
      subject,
      content
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `Official RFP email successfully dispatched to ${to}`,
        result
      });
    } else {
      return res.status(500).json({
        error: result.error || 'Failed to dispatch email'
      });
    }
  } catch (err) {
    next(err);
  }
};

export const sendVendorSMS = async (req, res, next) => {
  try {
    const { to, vendorName, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: 'Recipient phone number and message are required.' });
    }

    const { sendVendorProposalSMS } = await import('../services/smsService.js');
    const result = await sendVendorProposalSMS({
      to,
      vendorName: vendorName || 'Vendor Partner',
      message
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `SMS alert successfully dispatched to ${to} (${result.provider})`,
        result
      });
    } else {
      return res.status(400).json({
        error: result.error || 'Failed to dispatch SMS'
      });
    }
  } catch (err) {
    next(err);
  }
};
