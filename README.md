# Tapsy Backend Node.js

A robust backend server for the Tapsy project, built with Node.js, Express.js, TypeScript, PostgreSQL, and Prisma ORM.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.15.0-2D3748)](https://www.prisma.io/)

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Redis (for caching and sessions)
- AWS S3 bucket (for file storage)
- Firebase project (for push notifications)
- SendGrid account (for email services)

### Installation
```bash
# Clone the repository
git clone https://github.com/Tapsy-Org/Tapsy-backend-Node.git
cd Tapsy-backend-Node

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.development
# Configure your .env.development file with your actual values

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:dev:deploy

# Seed the database (optional)
npm run db:dev:seed

# Start development server
npm run dev
```

### Common Commands
```bash
# Generate test token
npx ts-node src/scripts/generateTestToken.ts

# Database operations
npm run db:dev:deploy     # Push schema changes to database
npm run db:dev:migrate    # Create and run migrations
npm run db:dev:reset      # Reset database (WARNING: deletes all data)
npm run db:dev:seed       # Seed database with sample data
npm run db:dev:studio     # Open Prisma Studio

# Production database
npm run db:prod:deploy    # Deploy migrations to production
npm run db:prod:status    # Check migration status

# Development
npm run dev               # Start development server
npm run dev:simple       # Start without swagger generation
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # Run TypeScript type checking

# Swagger Documentation
npm run swagger:generate # Generate Swagger documentation
npm run swagger:watch    # Watch for changes and regenerate docs
```

## Documentation

- [Database Setup](docs/DATABASE_SETUP.md) - Database configuration and setup
- [API Documentation](docs/REVIEW_API.md) - API endpoints and usage
- [User Category System](docs/USER_CATEGORY_SYSTEM.md) - User categorization system
- [Location API](docs/LOCATION_API_README.md) - Location-related endpoints
- [Notification API](docs/NOTIFICATION_API.md) - Push notification system
- [Interaction API](docs/INTERACTION_API.md) - Like, comment, and follow interactions
- [Feed Algorithm](docs/FEED_ALGORITHM_IMPLEMENTATION.md) - Content feed algorithm
- [Unified User System](docs/UNIFIED_USER_SYSTEM.md) - User management system
- [Development Guide](docs/DEVELOPMENT.md) - Internal development guidelines
- [CI/CD Setup](docs/CI_CD_README.md) - Continuous integration and deployment

## 👥 Team

This is a private project developed by the Tapsy organization team. For internal development guidelines and standards, please refer to our internal documentation.

## 🧪 Testing

The project includes comprehensive testing with Jest and Supertest:

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Test individual functions and classes in isolation
- **Integration Tests**: Test API endpoints and database interactions
- **Mocked Dependencies**: External services are mocked for reliable testing

## Project Structure

```
src/
├── controllers/     # Request handlers and API endpoints
├── services/        # Business logic and data processing
├── routes/          # API route definitions and middleware
├── middlewares/     # Express middlewares (auth, validation, etc.)
├── config/          # Database, Redis, and Firebase configuration
├── types/           # TypeScript type definitions
├── utils/           # Utility functions and helpers
├── scripts/         # Utility scripts and tools
├── __tests__/       # Test files (unit and integration)
└── app.ts           # Express app configuration

prisma/
├── schema.prisma    # Database schema definition
├── migrations/      # Database migration files
├── seed.ts          # Database seeding script
└── admin-seed.ts    # Admin user seeding script

docs/                # Comprehensive API documentation
Docker/              # Docker configuration files
aws/                 # AWS deployment configurations
```

## Environment Variables

The application requires several environment variables to function properly. Copy `.env.example` to `.env.development` and configure the following:

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `REDIS_URL` - Redis connection string
- `AWS_ACCESS_KEY_ID` - AWS S3 access key
- `AWS_SECRET_ACCESS_KEY` - AWS S3 secret key
- `AWS_BUCKET_NAME` - S3 bucket name
- `AWS_REGION` - AWS region
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Firebase private key
- `FIREBASE_CLIENT_EMAIL` - Firebase client email
- `SG_API_KEY` - SendGrid API key
- `FROM_EMAIL` - Email sender address

### Optional Variables
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `GOOGLE_API_KEY` - Google Maps API key
- `GEMINI_API_KEY` - Google Gemini API key
- `ONBOARDING_VIDEO_URL` - Onboarding video URL

## Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t tapsy-backend .

# Run container
docker run -p 5000:5000 --env-file .env tapsy-backend
```

### AWS ECS Deployment
The project includes AWS ECS task definitions in the `aws/` directory for easy deployment to AWS.

## License

This project is licensed under the ISC License.

## Support

- Review project documentation
- Contact the development team for technical issues
- Check internal documentation for troubleshooting guides

---

Built with ❤️ by [Mechlin Technologies](https://mechlintechnologies.com)