# Contributing to Tapsy Backend

Thank you for your interest in contributing to the Tapsy Backend project! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Creating a Pull Request](#creating-a-pull-request)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Convention](#commit-message-convention)
- [Review Process](#review-process)
- [Deployment](#deployment)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your forked repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Tapsy-backend-Node.git
   cd Tapsy-backend-Node
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/Tapsy-backend-Node.git
   ```

## Development Setup

### Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env.development
   ```

2. Configure your database and other environment variables in `.env.development`

### Install Dependencies

```bash
npm install
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push database schema (development)
npm run db:dev:deploy

# Run migrations (development)
npm run db:dev:migrate

# Seed database (optional)
npm run db:dev:seed
```

### Development Server

```bash
npm run dev
```

## Branching Strategy

We follow a simplified Git Flow approach:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes

### Creating a Feature Branch

```bash
# Ensure you're on develop and up-to-date
git checkout develop
git pull upstream develop

# Create and checkout a new feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b bugfix/your-bug-description
```

## Creating a Pull Request

### 1. Prepare Your Changes

Before creating a PR, ensure your code follows our standards:

```bash
# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run type checking
npm run type-check

# Run tests
npm run test

# Check formatting
npm run format:check

# Format code if needed
npm run format
```

### 2. Commit Your Changes

Follow our commit message convention:

```bash
git add .
git commit -m "feat: add user authentication endpoint

- Implement JWT-based authentication
- Add login and register endpoints
- Include input validation and error handling
- Add comprehensive test coverage"
```

### 3. Push Your Branch

```bash
git push origin feature/your-feature-name
```

### 4. Create the Pull Request

1. Go to your forked repository on GitHub
2. Click "Compare & pull request" for your feature branch
3. Fill out the PR template (see below)

### 5. PR Template

Use this template when creating your PR:

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Closes #(issue number)

## Changes Made
- [ ] Feature A implemented
- [ ] Bug B fixed
- [ ] Tests added/updated
- [ ] Documentation updated

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] All existing tests still pass

## Checklist
- [ ] Code follows the project's style guidelines
- [ ] Self-review of code completed
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] Corresponding changes to documentation made
- [ ] No new warnings generated
- [ ] Tests added that prove fix is effective or feature works
- [ ] Any dependent changes documented

## Screenshots (if applicable)
Add screenshots for UI changes.

## Additional Notes
Any additional information or context.
```

## Code Standards

### TypeScript Guidelines

- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Use proper typing for all functions and variables
- Avoid `any` type - use proper typing or `unknown`

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Maximum line length: 100 characters
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### File Organization

- Controllers in `src/controllers/`
- Services in `src/services/`
- Routes in `src/routes/`
- Middleware in `src/middlewares/`
- Types in `src/types/`
- Utils in `src/utils/`

## Testing Guidelines

### Test Structure

- Unit tests in `src/__tests__/unit/`
- Integration tests in `src/__tests__/integration/`
- Test files should end with `.test.ts`

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

### Test Requirements

- All new features must have corresponding tests
- Maintain minimum 80% code coverage
- Tests should be independent and repeatable
- Use descriptive test names

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(auth): add JWT authentication middleware
fix(user): resolve user creation validation issue
docs(api): update API documentation
test(auth): add authentication integration tests
```

## Review Process

### PR Review Checklist

- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Error handling is appropriate

### Review Process

1. **Initial Review**: Automated checks must pass
2. **Code Review**: At least one maintainer must approve
3. **Testing**: All tests must pass
4. **Documentation**: Ensure documentation is updated
5. **Merge**: Once approved, maintainers will merge

### Addressing Review Comments

- Respond to all review comments
- Make requested changes in new commits
- Request re-review when ready
- Be respectful and open to feedback

## Deployment

### Development Deployment

```bash
# Build the project
npm run build

# Start development server
npm run dev
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Getting Help

- Check existing issues and PRs
- Review project documentation
- Ask questions in discussions
- Contact maintainers for urgent issues

## Code of Conduct

- Be respectful and inclusive
- Focus on the code, not the person
- Provide constructive feedback
- Help others learn and grow

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Tapsy Backend! 🚀
