import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { setupSwagger } from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import restockRoutes from './routes/restockRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import agentLogRoutes from './routes/agentLogRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import userRoutes from './routes/userRoutes.js';
import refundRoutes from './routes/refundRoutes.js';
import fraudRoutes from './routes/fraudRoutes.js';
import vendorEvaluationRoutes from './routes/vendorEvaluationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust Render / Cloud reverse proxy for secure HTTPS cookies
app.set('trust proxy', 1);

// Enable CORS with Credentials for HttpOnly Cookie support
app.use(cors({
  origin: (origin, callback) => {
    // Allow local development ports and matching client url
    const allowed = [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
    if (!origin || allowed.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

// Cookie Parser Middleware
app.use(cookieParser());

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads Directory statically
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/restocks', restockRoutes);
app.use('/api', approvalRoutes);
app.use('/api/agent-logs', agentLogRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/vendor-evaluations', vendorEvaluationRoutes);

// Swagger Documentation
setupSwagger(app);

// Global Error Handler
app.use(errorHandler);

export default app;
