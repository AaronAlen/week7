import swaggerUi from 'swagger-ui-express';
import { env } from './env.js';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'StockPilot REST API Documentation',
    version: '1.0.0',
    description: 'API specs for StockPilot Intelligent Inventory Restock Management System with LangGraph HITL Workflow Agent, Real-time WebSockets, and RBAC.',
    contact: {
      name: 'StockPilot Engineering',
      email: 'support@stockpilot.io'
    }
  },
  servers: [
    {
      url: 'https://week7-rwe2.onrender.com',
      description: 'Production Server (Render)'
    },
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token retrieved from POST /api/auth/login'
      }
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'admin@stockpilot.io' },
          password: { type: 'string', example: 'password123' }
        }
      },
      ProductInput: {
        type: 'object',
        required: ['name', 'sku', 'currentStock', 'safetyThreshold', 'targetStock', 'unitCost', 'supplierName', 'supplierEmail'],
        properties: {
          name: { type: 'string', example: 'Wireless Mechanical Keyboard' },
          description: { type: 'string', example: 'Custom tactile mechanical switches with RGB.' },
          sku: { type: 'string', example: 'SKU-KEYBOARD-101' },
          currentStock: { type: 'integer', example: 5 },
          safetyThreshold: { type: 'integer', example: 10 },
          targetStock: { type: 'integer', example: 40 },
          unitCost: { type: 'number', example: 75.00 },
          supplierName: { type: 'string', example: 'KeyTech Ltd' },
          supplierEmail: { type: 'string', example: 'orders@keytech.com' },
          supplierPhone: { type: 'string', example: '+15550192800' }
        }
      },
      SaleRequest: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'integer', example: 1 },
          quantity: { type: 'integer', example: 2 },
          notes: { type: 'string', example: 'POS Counter Sale' }
        }
      },
      AdjustRequest: {
        type: 'object',
        required: ['productId', 'quantity', 'reason'],
        properties: {
          productId: { type: 'integer', example: 1 },
          quantity: { type: 'integer', example: -1 },
          reason: { type: 'string', example: 'Damaged item written off' }
        }
      },
      TriggerRestockRequest: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'integer', example: 2 }
        }
      },
      ApprovalDecisionRequest: {
        type: 'object',
        required: ['threadId', 'approved'],
        properties: {
          threadId: { type: 'string', example: 'restock-prod-2-1787550000000' },
          approved: { type: 'boolean', example: true },
          notes: { type: 'string', example: 'Approved by procurement manager' }
        }
      },
      ChatMessageRequest: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', example: 'What products are currently below safety threshold?' }
        }
      }
    }
  },
  tags: [
    { name: 'Auth', description: 'Authentication & Session Management' },
    { name: 'Products', description: 'Catalog & Stock Threshold Management' },
    { name: 'Inventory', description: 'Sales, Adjustments, and Stock Auditing' },
    { name: 'Restocks & AI Workflow', description: 'LangGraph Agent Restock Evaluation & Human-in-the-Loop' },
    { name: 'Purchase Orders', description: 'Supplier Purchase Orders' },
    { name: 'AI Assistant Chat', description: 'LangGraph Intelligent Inventory Chatbot' },
    { name: 'Agent Logs', description: 'Real-time LangGraph Execution Tracing' },
    { name: 'Users', description: 'User Profile & Admin RBAC Management' }
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with credentials',
        description: 'Returns a 15-minute JWT access token and sets a 7-day HttpOnly refresh token cookie.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid email or password' }
        }
      }
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'Issues a new 15-minute access token using the HttpOnly refresh token cookie.',
        responses: {
          200: { description: 'Token refreshed successfully' },
          400: { description: 'Refresh token is required' },
          403: { description: 'Invalid or expired refresh token' }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out and clear session cookies',
        responses: {
          200: { description: 'Logged out successfully' }
        }
      }
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'Get all catalog products',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of products retrieved' }
        }
      },
      post: {
        tags: ['Products'],
        summary: 'Create a new product (Admin / Manager)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductInput' }
            }
          }
        },
        responses: {
          201: { description: 'Product created successfully' },
          400: { description: 'Validation error' }
        }
      }
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get single product details with recent transactions',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Product details' },
          404: { description: 'Product not found' }
        }
      },
      put: {
        tags: ['Products'],
        summary: 'Update product details (Admin / Manager)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductInput' }
            }
          }
        },
        responses: {
          200: { description: 'Product updated successfully' }
        }
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete product (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Product deleted' }
        }
      }
    },
    '/api/inventory/sell': {
      post: {
        tags: ['Inventory'],
        summary: 'Record a sale and reduce stock (ACID transaction)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SaleRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Sale processed, auto-evaluates restock trigger' },
          400: { description: 'Insufficient stock' }
        }
      }
    },
    '/api/inventory/adjust': {
      post: {
        tags: ['Inventory'],
        summary: 'Manual stock adjustment (Admin / Manager)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdjustRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Stock adjusted' }
        }
      }
    },
    '/api/inventory/transactions': {
      get: {
        tags: ['Inventory'],
        summary: 'Get all inventory audit transactions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of transactions' }
        }
      }
    },
    '/api/restocks': {
      get: {
        tags: ['Restocks & AI Workflow'],
        summary: 'List all restock requests',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of restock requests' }
        }
      }
    },
    '/api/restocks/trigger': {
      post: {
        tags: ['Restocks & AI Workflow'],
        summary: 'Trigger LangGraph AI restock agent for a product',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TriggerRestockRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Restock evaluated: Auto-approved or routed to HITL approval' }
        }
      }
    },
    '/api/approvals': {
      get: {
        tags: ['Restocks & AI Workflow'],
        summary: 'List pending Human-in-the-Loop restock approvals',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of pending approvals' }
        }
      }
    },
    '/api/approve-restock': {
      post: {
        tags: ['Restocks & AI Workflow'],
        summary: 'Submit Human-in-the-Loop decision (Approve or Reject)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApprovalDecisionRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Workflow resumed with decision' }
        }
      }
    },
    '/api/purchase-orders': {
      get: {
        tags: ['Purchase Orders'],
        summary: 'List all purchase orders',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of purchase orders' }
        }
      }
    },
    '/api/chat/messages': {
      get: {
        tags: ['AI Assistant Chat'],
        summary: 'Get AI assistant chat message history',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of chat messages' }
        }
      },
      post: {
        tags: ['AI Assistant Chat'],
        summary: 'Send a prompt/message to the LangGraph AI Assistant',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChatMessageRequest' }
            }
          }
        },
        responses: {
          200: { description: 'AI Assistant response' }
        }
      }
    },
    '/api/agent-logs': {
      get: {
        tags: ['Agent Logs'],
        summary: 'Get real-time agent execution trace logs',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of agent logs' }
        }
      }
    },
    '/api/users/profile': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User profile object' }
        }
      }
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users (Admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of users' }
        }
      }
    }
  }
};

export const setupSwagger = (app) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'StockPilot API Docs'
    })
  );
  console.log(`📖 Swagger API documentation active at http://localhost:${env.PORT}/api-docs`);
};
