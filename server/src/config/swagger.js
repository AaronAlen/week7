import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StockPilot REST API Documentation',
      version: '1.0.0',
      description: 'API specs for StockPilot Intelligent Inventory Restock Management System with LangGraph Agent & Human-in-the-Loop Approval',
      contact: {
        name: 'StockPilot Support',
        email: 'support@stockpilot.io'
      }
    },
    servers: [
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
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`📖 Swagger API documentation available at http://localhost:${env.PORT}/api-docs`);
};
