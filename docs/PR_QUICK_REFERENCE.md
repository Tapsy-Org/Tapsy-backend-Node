# Pull Request Quick Reference

This is a quick reference guide for creating pull requests in the Tapsy Backend project.

## Quick PR Workflow

### 1. Setup (First time only)
```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Tapsy-backend-Node.git
cd Tapsy-backend-Node
git remote add upstream https://github.com/ORIGINAL_OWNER/Tapsy-backend-Node.git
```

### 2. Start New Feature
```bash
# Update develop branch
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name
```

### 3. Make Changes & Test
```bash
# Make your code changes
# Then run quality checks:
npm run lint
npm run lint:fix
npm run type-check
npm run test
npm run format:check
npm run format
```

### 4. Commit & Push
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 5. Create PR
- Go to your fork on GitHub
- Click "Compare & pull request"
- Fill out the PR template
- Submit for review

## Common Commands

### Git Commands
```bash
# Check status
git status

# Check current branch
git branch

# Switch branches
git checkout branch-name

# Pull latest changes
git pull upstream develop

# View commit history
git log --oneline -10
```

### Quality Checks
```bash
# Linting
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues

# Type checking
npm run type-check    # TypeScript validation

# Testing
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Formatting
npm run format:check  # Check formatting
npm run format        # Auto-format code
```

### Database Commands
```bash
# Development database
npm run db:dev:deploy    # Push schema changes
npm run db:dev:migrate   # Run migrations
npm run db:dev:seed      # Seed database
npm run db:dev:studio    # Open Prisma Studio

# Production database
npm run db:prod:deploy   # Deploy migrations
npm run db:prod:status   # Check migration status
```

## PR Template

Copy this template when creating your PR:

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

## Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
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

## Troubleshooting

### Common Issues

**Linting errors:**
```bash
npm run lint:fix
```

**Type errors:**
```bash
npm run type-check
```

**Test failures:**
```bash
npm run test -- --verbose
```

**Format issues:**
```bash
npm run format
```

**Database connection issues:**
- Check `.env.development` configuration
- Ensure PostgreSQL is running
- Run `npm run db:generate`

### Getting Help

- Check existing issues and PRs
- Review project documentation
- Ask questions in discussions
- Contact maintainers for urgent issues

## Quick Links

- [Full Contributing Guide](CONTRIBUTING.md)
- [Project README](../README.md)
- [Database Setup Guide](DATABASE_SETUP.md)
- [API Documentation](REVIEW_API.md)
