import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  evaluateVendors,
  getSamplePdfs,
  getEvaluations,
  getEvaluationById,
  deleteEvaluation,
  sendVendorEmail,
  sendVendorSMS
} from '../controllers/vendorEvaluationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'vendor-doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB per file
});

const router = express.Router();

router.use(authenticateToken);

// Get list of generated test sample vendor PDFs
router.get('/samples', getSamplePdfs);

// Evaluate multiple vendors (supports up to 20 uploaded PDF/TXT/CSV files)
router.post('/evaluate', upload.array('documents', 20), evaluateVendors);

// Dispatch official email via Nodemailer
router.post('/send-email', sendVendorEmail);

// Dispatch official SMS via Twilio
router.post('/send-sms', sendVendorSMS);

// Get all vendor evaluations history
router.get('/', getEvaluations);

// Get single evaluation by ID
router.get('/:id', getEvaluationById);

// Delete evaluation (Managers and Admins only)
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), deleteEvaluation);

export default router;
