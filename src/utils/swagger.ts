import fs from 'fs';
import path from 'path';

// Type definition for swagger specification
type SwaggerSpec = {
  openapi: string;
  info: Record<string, unknown>;
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, unknown>;
  components: Record<string, unknown>;
};

// Fallback swagger spec
const fallbackSwaggerSpec: SwaggerSpec = {
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

// Function to load swagger specification
function loadSwaggerSpec(): SwaggerSpec {
  try {
    const swaggerPath = path.join(process.cwd(), 'dist', 'swagger.json');
    const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
    const spec = JSON.parse(swaggerContent);

    return spec;
  } catch (error) {
    console.error('Error loading Swagger specification:', error);
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using fallback Swagger specification - run npm run swagger:generate');
    }
    return fallbackSwaggerSpec;
  }
}

// Cache for swagger spec with refresh capability
let cachedSwaggerSpec: SwaggerSpec | null = null;
let lastModified = 0;

// Function to get swagger spec with caching and auto-refresh in development
function getSwaggerSpec(): SwaggerSpec {
  const swaggerPath = path.join(process.cwd(), 'dist', 'swagger.json');

  try {
    const stats = fs.statSync(swaggerPath);
    const currentModified = stats.mtime.getTime();

    // In development, check if file has been modified and reload if necessary
    if (
      process.env.NODE_ENV === 'development' &&
      (cachedSwaggerSpec === null || currentModified > lastModified)
    ) {
      cachedSwaggerSpec = loadSwaggerSpec();
      lastModified = currentModified;
    } else if (cachedSwaggerSpec === null) {
      // First load in production
      cachedSwaggerSpec = loadSwaggerSpec();
      lastModified = currentModified;
    }

    return cachedSwaggerSpec;
  } catch (error) {
    console.error('Error loading Swagger specification:', error);
    // File doesn't exist, return fallback
    if (cachedSwaggerSpec === null) {
      cachedSwaggerSpec = fallbackSwaggerSpec;
    }
    return cachedSwaggerSpec;
  }
}

// Export the getter function for dynamic loading
export { getSwaggerSpec };

// Export the initial spec for backward compatibility
export default getSwaggerSpec();
