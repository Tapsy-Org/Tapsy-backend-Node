# Tapsy Backend Node.js

A robust backend server for the Tapsy project, built with Node.js, Express.js, TypeScript, PostgreSQL, and Prisma ORM.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Tapsy-backend-Node.git
cd Tapsy-backend-Node

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.development
# Configure your .env.development file

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:dev:deploy

# Start development server
npm run dev
```

### Common Commands
```bash
# Generate test token
npx ts-node src/scripts/generateTestToken.ts

# Database migrations
npx dotenv -e .env.development -- npx prisma migrate dev --name your_migration_name

# Run tests
npm run test

# Lint and format
npm run lint
npm run format
```

## 📚 Documentation

- [Contributing Guide](docs/CONTRIBUTING.md) - How to contribute to the project
- [PR Quick Reference](docs/PR_QUICK_REFERENCE.md) - Quick guide for creating pull requests
- [Database Setup](docs/DATABASE_SETUP.md) - Database configuration and setup
- [API Documentation](docs/REVIEW_API.md) - API endpoints and usage
- [User Category System](docs/USER_CATEGORY_SYSTEM.md) - User categorization system
- [Location API](docs/LOCATION_API_README.md) - Location-related endpoints

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details on how to:

- Set up your development environment
- Create feature branches
- Submit pull requests
- Follow our coding standards
- Write tests

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🏗️ Project Structure

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── routes/          # API route definitions
├── middlewares/     # Express middlewares
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── __tests__/       # Test files
```

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

- Check existing [issues](../../issues)
- Review project documentation
- Contact maintainers for urgent issues

---

Built with ❤️ by Mechlin Technologies