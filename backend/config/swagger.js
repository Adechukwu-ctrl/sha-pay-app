const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sha Pay API',
      version: '1.0.0',
      description: 'API documentation for Sha Pay - An intermediary payment application for service providers and requirers',
      contact: {
        name: 'Sha Pay Team',
        email: 'support@shapay.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.shapay.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            phone: {
              type: 'string',
              description: 'User phone number'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            userType: {
              type: 'string',
              enum: ['provider', 'requirer'],
              description: 'Type of user'
            },
            isVerified: {
              type: 'boolean',
              description: 'Whether user is verified'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            }
          }
        },
        Service: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique service identifier'
            },
            title: {
              type: 'string',
              description: 'Service title'
            },
            description: {
              type: 'string',
              description: 'Service description'
            },
            category: {
              type: 'string',
              description: 'Service category'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Service price'
            },
            providerId: {
              type: 'string',
              format: 'uuid',
              description: 'Service provider ID'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              description: 'Service status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Service creation timestamp'
            }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique booking identifier'
            },
            serviceId: {
              type: 'string',
              format: 'uuid',
              description: 'Service ID'
            },
            providerId: {
              type: 'string',
              format: 'uuid',
              description: 'Provider ID'
            },
            requesterId: {
              type: 'string',
              format: 'uuid',
              description: 'Requester ID'
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed'],
              description: 'Booking status'
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Booking amount'
            },
            scheduledDate: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled service date'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Booking creation timestamp'
            }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique payment identifier'
            },
            bookingId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated booking ID'
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Payment amount'
            },
            serviceCharge: {
              type: 'number',
              format: 'float',
              description: 'Service charge (2.5%)'
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
              description: 'Payment status'
            },
            paymentMethod: {
              type: 'string',
              enum: ['card', 'bank_transfer', 'wallet'],
              description: 'Payment method'
            },
            transactionId: {
              type: 'string',
              description: 'External transaction ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Payment creation timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Error details'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js']
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi
};