import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tapsy API',
      version: '1.0.0',
      description: 'API documentation for the Tapsy application',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        UploadResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            file: {
              type: 'object',
              properties: {
                originalName: { type: 'string' },
                mimeType: { type: 'string' },
                size: { type: 'number' },
                path: { type: 'string' },
              },
            },
          },
        },
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
