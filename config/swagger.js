const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auto-UC2 API Documentation',
      version: '1.0.0',
      description: 'Professional API documentation for the Auto-UC2 Agentic Negotiation Platform.',
      contact: {
        name: 'API Support',
        email: 'support@auto-uc2.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000/api/v1',
        description: 'Development Server'
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
  // Paths to files containing OpenAPI definitions
  apis: ['./routes/*.js', './models/*.js'] 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
