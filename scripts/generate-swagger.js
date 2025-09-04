#!/usr/bin/env node

const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

// Function to extract tags from route files
function extractTagsFromRouteFiles(routeFiles) {
  const tags = new Map(); // Use Map to avoid duplicates
  
  routeFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Look for @swagger tags definitions with more flexible regex
      const tagMatches = content.match(/@swagger[\s\S]*?tags:\s*\n\s*-\s*name:\s*([^\n]+)\s*\n\s*description:\s*([^\n]+)/g);
      
      if (tagMatches) {
        tagMatches.forEach(match => {
          const nameMatch = match.match(/name:\s*([^\n]+)/);
          const descMatch = match.match(/description:\s*([^\n]+)/);
          
          if (nameMatch && descMatch) {
            const name = nameMatch[1].trim();
            const description = descMatch[1].trim();
            tags.set(name, description);
          }
        });
      }
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}:`, error.message);
    }
  });
  
  // Convert Map to array format expected by swagger-jsdoc
  return Array.from(tags.entries()).map(([name, description]) => ({
    name,
    description
  }));
}

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
        UserSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            user_type: { type: 'string', enum: ['INDIVIDUAL', 'BUSINESS', 'ADMIN'] },
            logo_url: { type: 'string', nullable: true },
          },
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current Environment Server',
      },
    ],
    tags: [], // Will be populated dynamically from route files
  },
  // Will be populated dynamically below
  apis: [],
};

// Find all route files dynamically
const routesDir = path.join(__dirname, '..', 'src', 'routes');
const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.ts'));

// Update the apis array with all found route files
const fullRoutePaths = routeFiles.map(file => path.join(routesDir, file));
options.apis = fullRoutePaths;

// Extract tags dynamically from route files
const extractedTags = extractTagsFromRouteFiles(fullRoutePaths);
options.definition.tags = extractedTags;

// console.log('Found route files:', routeFiles);
// console.log('Extracted tags:', extractedTags.map(tag => `${tag.name}: ${tag.description}`));
// console.log('Scanning files for Swagger documentation:', options.apis);

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

console.log('Swagger specification generated successfully at:', outputPath);
console.log('Found', Object.keys(swaggerSpec.paths || {}).length, 'API endpoints');

// Log all found endpoints
// if (swaggerSpec.paths) {
//   console.log('\nFound endpoints:');
//   Object.keys(swaggerSpec.paths).forEach(path => {
//     const methods = Object.keys(swaggerSpec.paths[path]);
//     console.log(`  ${path}: ${methods.join(', ')}`);
//   });
// }

// Log all found tags
if (swaggerSpec.tags) {
  console.log('\nFound tags:');
  swaggerSpec.tags.forEach(tag => {
    console.log(`  - ${tag.name}: ${tag.description}`);
  });
}
