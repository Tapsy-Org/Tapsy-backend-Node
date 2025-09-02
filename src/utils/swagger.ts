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
        Location: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            location: { type: 'string' },
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
            location_type: {
              type: 'string',
              enum: ['HOME', 'WORK', 'OTHER'],
              description: 'Type of location',
            },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['location', 'latitude', 'longitude', 'location_type'],
        },
        CreateLocationRequest: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'Street address' },
            latitude: {
              type: 'number',
              minimum: -90,
              maximum: 90,
              description: 'Latitude coordinate',
            },
            longitude: {
              type: 'number',
              minimum: -180,
              maximum: 180,
              description: 'Longitude coordinate',
            },
            location_type: {
              type: 'string',
              enum: ['HOME', 'WORK', 'OTHER'],
              description: 'Type of location',
            },
            city: { type: 'string', description: 'City name' },
            state: { type: 'string', description: 'State/province name' },
            country: { type: 'string', description: 'Country name' },
          },
          required: ['location', 'latitude', 'longitude', 'location_type'],
        },
        UpdateLocationRequest: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'Street address' },
            latitude: {
              type: 'number',
              minimum: -90,
              maximum: 90,
              description: 'Latitude coordinate',
            },
            longitude: {
              type: 'number',
              minimum: -180,
              maximum: 180,
              description: 'Longitude coordinate',
            },
            location_type: {
              type: 'string',
              enum: ['HOME', 'WORK', 'OTHER'],
              description: 'Type of location',
            },
            city: { type: 'string', description: 'City name' },
            state: { type: 'string', description: 'State/province name' },
            country: { type: 'string', description: 'Country name' },
          },
        },
        NearbyLocation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            location: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            location_type: { type: 'string', enum: ['HOME', 'WORK', 'OTHER'] },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                username: { type: 'string' },
                user_type: { type: 'string', enum: ['INDIVIDUAL', 'BUSINESS', 'ADMIN'] },
                logo_url: { type: 'string' },
              },
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'fail'] },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['fail'] },
            statusCode: { type: 'number' },
            message: { type: 'string' },
            details: { type: 'object' },
          },
        },
      },
    },
    servers: [
      {
        url: 'Development server',
        description: 'Development server',
      },
      {
        url: 'Production server',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Locations',
        description: 'Location management endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Categories',
        description: 'Category management endpoints',
      },
      {
        name: 'Admin',
        description: 'Admin-only endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
