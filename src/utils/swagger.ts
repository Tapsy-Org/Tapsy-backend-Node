import fs from 'fs';
import path from 'path';

// Function to get the appropriate server URL based on environment
function getServerUrl(): string {
  // Development environment (local)
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  if (process.env.NODE_ENV === 'production') {
    if (process.env.ECS_ENVIRONMENT === 'dev') {
      return 'http://backend-dev-alb-278107495.us-west-1.elb.amazonaws.com';
    }
    // Check if we have a production domain set
    if (process.env.ECS_ENVIRONMENT === 'dev') {
      return '';
    }
    // Default to dev ECS if no other indicators
    return 'http://backend-dev-alb-278107495.us-west-1.elb.amazonaws.com';
  }
  // Fallback
  return 'http://localhost:3000';
}

// Load the pre-generated swagger specification
let swaggerSpec: {
  openapi: string;
  info: Record<string, unknown>;
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, unknown>;
  components: Record<string, unknown>;
};

try {
  const swaggerPath = path.join(process.cwd(), 'dist', 'swagger.json');
  const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
  swaggerSpec = JSON.parse(swaggerContent);

  // Update the server URL dynamically based on current environment
  if (swaggerSpec.servers && swaggerSpec.servers.length > 0) {
    swaggerSpec.servers[0].url = getServerUrl();
    swaggerSpec.servers[0].description =
      process.env.NODE_ENV === 'development'
        ? 'Development server (Local)'
        : 'Production server (ECS)';
  }

  console.log('✅ Loaded pre-generated Swagger specification with URL:', getServerUrl());
} catch (error) {
  console.error('Failed to load pre-generated Swagger specification', error);

  // Fallback: basic swagger spec without API endpoints
  swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Tapsy API',
      version: '1.0.0',
      description: 'API documentation for the Tapsy application',
    },
    servers: [
      {
        url: getServerUrl(),
        description:
          process.env.NODE_ENV === 'development'
            ? 'Development server (Local)'
            : 'Production server (ECS)',
      },
    ],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };
}

export default swaggerSpec;
