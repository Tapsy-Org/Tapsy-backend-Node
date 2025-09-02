import fs from 'fs';
import path from 'path';
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

  console.log('✅ Loaded pre-generated Swagger specification with URL:', '/');
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
        url: '/',
        description: 'Current Environment Server',
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
