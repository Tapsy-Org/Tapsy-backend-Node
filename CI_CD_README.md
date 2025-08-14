# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline is designed to ensure code quality, security, and reliable deployments.

## Workflow Files

### 1. `.github/workflows/Branch-check.yml` - Main CI/CD Pipeline
- **Purpose**: Comprehensive pipeline that includes all checks and deployments
- **Triggers**: Push to main/develop, Pull requests to main/develop
- **Jobs**:
  - `branch-naming`: Validates branch naming conventions
  - `test-and-quality`: Runs tests, linting, and quality checks
  - `build`: Builds the application
  - `security-scan`: Runs security audits
  - `deploy-staging`: Deploys to staging (develop branch)
  - `deploy-production`: Deploys to production (main branch)

### 2. `.github/workflows/test.yml` - Dedicated Test Suite
- **Purpose**: Focused testing workflow
- **Triggers**: Push to main/develop, Pull requests to main/develop
- **Features**:
  - Matrix testing with Node.js 18.x and 20.x
  - Unit tests, integration tests, and coverage
  - Codecov integration
  - Test artifact uploads

### 3. `.github/workflows/security.yml` - Security Audit
- **Purpose**: Security-focused workflow
- **Triggers**: Push to main/develop, Pull requests, Weekly schedule
- **Features**:
  - npm audit
  - audit-ci checks
  - Snyk security scanning
  - Vulnerability reporting

### 4. `.github/workflows/deploy.yml` - Deployment
- **Purpose**: Dedicated deployment workflow
- **Triggers**: Push to main/develop
- **Features**:
  - Staging deployment (develop branch)
  - Production deployment (main branch)
  - Environment-specific configurations

## Pipeline Stages

### 1. Code Quality Checks
```bash
npm run lint          # ESLint checks
npm run type-check    # TypeScript type checking
npm run format:check  # Prettier formatting check
```

### 2. Testing
```bash
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage    # Full test suite with coverage
```

### 3. Security
```bash
npm audit --audit-level=moderate  # npm security audit
npx audit-ci --moderate          # CI-friendly audit
```

### 4. Build
```bash
npm run build  # TypeScript compilation
```

## Branch Strategy

### Branch Naming Convention
- `feature/<name>` - New features
- `bugfix/<name>` - Bug fixes
- `hotfix/<name>` - Critical fixes
- `main` - Production branch
- `develop` - Development branch

### Deployment Strategy
- **Staging**: Automatic deployment from `develop` branch
- **Production**: Automatic deployment from `main` branch
- **Pull Requests**: Run tests and quality checks only

## Environment Variables

### Required Secrets
- `SNYK_TOKEN` - Snyk security scanning token
- Environment-specific secrets for deployment

### Optional Secrets
- `CODECOV_TOKEN` - For enhanced Codecov integration

## Test Coverage

The pipeline includes comprehensive test coverage:
- **Unit Tests**: 85 tests covering controllers, services, middleware, and utilities
- **Integration Tests**: API endpoint testing with Supertest
- **Coverage Reports**: Generated and uploaded to Codecov

### Coverage Targets
- Controllers: 100%
- Services: 100%
- Middleware: 100%
- Utilities: 100%

## Security Features

### Automated Security Checks
- **Dependency Audits**: Weekly automated security audits
- **Vulnerability Scanning**: Snyk integration for vulnerability detection
- **Code Quality**: ESLint security rules
- **Type Safety**: TypeScript for compile-time error detection

### Security Best Practices
- No secrets in code
- Environment-specific configurations
- Automated vulnerability reporting
- Dependency update monitoring

## Deployment Environments

### Staging Environment
- **Branch**: `develop`
- **Purpose**: Pre-production testing
- **Auto-deploy**: Yes
- **Manual approval**: No

### Production Environment
- **Branch**: `main`
- **Purpose**: Live production
- **Auto-deploy**: Yes
- **Manual approval**: No (can be configured)

## Monitoring and Reporting

### Test Results
- Test artifacts are uploaded and retained for 30 days
- Coverage reports are sent to Codecov
- Test results are visible in GitHub Actions

### Security Reports
- Security audit results are reported in the workflow
- Vulnerability alerts are sent for high-severity issues
- Weekly security reports are generated

### Deployment Status
- Deployment status is tracked in GitHub Actions
- Environment-specific deployment logs
- Rollback capabilities (manual)

## Troubleshooting

### Common Issues

1. **Branch Naming Failures**
   - Ensure branch names follow the convention: `feature/`, `bugfix/`, or `hotfix/`

2. **Test Failures**
   - Check test logs in GitHub Actions
   - Ensure all tests pass locally before pushing

3. **Security Audit Failures**
   - Review vulnerability reports
   - Update dependencies as needed
   - Address high-severity issues

4. **Deployment Failures**
   - Check environment variables
   - Verify deployment credentials
   - Review deployment logs

### Local Development

To run the same checks locally:

```bash
# Install dependencies
npm ci

# Run quality checks
npm run lint
npm run type-check
npm run format:check

# Run tests
npm run test:unit
npm run test:integration
npm run test:coverage

# Run security audit
npm audit
npx audit-ci --moderate

# Build
npm run build
```

## Contributing

When contributing to this project:

1. Create a feature branch following the naming convention
2. Ensure all tests pass locally
3. Run quality checks before pushing
4. Create a pull request to `develop`
5. Wait for CI/CD pipeline to complete
6. Address any issues reported by the pipeline

## Support

For issues with the CI/CD pipeline:
1. Check the GitHub Actions logs
2. Review this documentation
3. Contact the development team
4. Create an issue in the repository
