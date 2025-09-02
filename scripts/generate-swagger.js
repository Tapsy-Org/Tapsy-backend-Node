#!/usr/bin/env node

const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

// Function to get the appropriate server URL based on environment
function getServerUrl() {
  // Development environment (local)
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Production environment - check for specific environment indicators
  if (process.env.NODE_ENV === 'production') {
    // Check if we're in ECS dev environment
    if (process.env.ECS_ENVIRONMENT === 'dev' || 
        process.env.AWS_EXECUTION_ENV?.includes('AWS_ECS_FARGATE') && 
        process.env.ECS_CLUSTER === 'Tapsy' && 
        !process.env.PRODUCTION_DOMAIN) {
      return 'http://backend-dev-alb-278107495.us-west-1.elb.amazonaws.com';
    }
    
    // Check if we have a production domain set
    if (process.env.PRODUCTION_DOMAIN) {
      return process.env.PRODUCTION_DOMAIN;
    }
    
    // Default to dev ECS if no other indicators
    return 'http://backend-dev-alb-278107495.us-west-1.elb.amazonaws.com';
  }
  
  // Fallback
  return 'http://localhost:3000';
}

// Swagger configuration
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
        url: getServerUrl(),
        description: process.env.NODE_ENV === 'development' 
          ? 'Development server (Local)' 
          : 'Production server (ECS)',
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
        name: 'Reviews',
        description: 'Review management endpoints',
      },
      {
        name: 'Admin',
        description: 'Admin-only endpoints',
      },
      {
        name: 'AdminAuth',
        description: 'Admin authentication and login APIs',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

// Generate the swagger spec
const swaggerSpec = swaggerJsdoc(options);

// Ensure the dist directory exists
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Write the swagger spec to a JSON file
const outputPath = path.join(distDir, 'swagger.json');
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

console.log('✅ Swagger specification generated successfully at:', outputPath);
console.log('📊 Found', Object.keys(swaggerSpec.paths || {}).length, 'API endpoints');
