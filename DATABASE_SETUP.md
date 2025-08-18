# Database Setup Guide

## Environment Files Setup

Create the following environment files in your project root:

### `.env.development`
```env
# Development Environment Configuration
NODE_ENV=development
PORT=3000

# Database Configuration (Development)
DATABASE_URL="postgresql://username:password@localhost:5432/tapsy_dev?schema=public"

# Firebase Configuration (Development)
FIREBASE_PROJECT_ID=project-mvp-cd027
# FIREBASE_SERVICE_ACCOUNT_JSON= # Optional: Use environment variable or fall back to serviceAccountKey.json
# GOOGLE_APPLICATION_CREDENTIALS= # Optional: Path to service account file

# Auth Configuration
AUTH_TEST_MODE=true
TEST_PHONE_NUMBER=+15555550123

# Email Configuration (Development)
EMAIL_FROM="dev@tapsy.com"
EMAIL_HOST="smtp.mailtrap.io"
EMAIL_PORT=2525
EMAIL_USER="your_mailtrap_user"
EMAIL_PASS="your_mailtrap_pass"

# Other Development Settings
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### `.env.production`
```env
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database Configuration (Production)
DATABASE_URL="postgresql://prod_user:prod_password@your-prod-host:5432/tapsy_prod?schema=public"

# Firebase Configuration (Production)
FIREBASE_PROJECT_ID=your-prod-firebase-project
FIREBASE_SERVICE_ACCOUNT_JSON= # Required for production

# Auth Configuration
AUTH_TEST_MODE=false

# Email Configuration (Production)
EMAIL_FROM="noreply@tapsy.com"
EMAIL_HOST="your-smtp-host"
EMAIL_PORT=587
EMAIL_USER="your_email_user"
EMAIL_PASS="your_email_password"

# Other Production Settings
LOG_LEVEL=error
CORS_ORIGIN=https://yourdomain.com
```

## Available Database Commands

### Development Commands

```bash
# Install dependencies and generate Prisma client
npm install

# Generate Prisma client (automatically runs after npm install)
npm run db:generate

# Push schema changes to development database (for rapid prototyping)
npm run db:dev:deploy

# Create and apply a new migration in development
npm run db:dev:migrate

# Reset development database (WARNING: Deletes all data)
npm run db:dev:reset

# Run database seed script (if you create one)
npm run db:dev:seed

# Open Prisma Studio for development database
npm run db:dev:studio
```

### Production Commands

```bash
# Apply pending migrations to production database
npm run db:prod:deploy

# Check migration status in production
npm run db:prod:status

# Reset production database (DANGER: Use with extreme caution)
npm run db:prod:reset
```

## Usage Examples

### 1. Initial Development Setup
```bash
# 1. Create .env.development file with your database URL
# 2. Install dependencies
npm install

# 3. Apply existing migrations to your dev database
npm run db:dev:deploy

# 4. Start development server
npm run dev
```

### 2. Making Schema Changes
```bash
# 1. Modify prisma/schema.prisma
# 2. Create and apply migration
npm run db:dev:migrate

# 3. Name your migration when prompted
# Example: "add_user_preferences_table"
```

### 3. Production Deployment
```bash
# 1. Ensure .env.production is properly configured
# 2. Apply migrations to production
npm run db:prod:deploy

# 3. Check that all migrations were applied
npm run db:prod:status
```

## Important Notes

1. **Environment Files**: Create both `.env.development` and `.env.production` files based on the examples above.

2. **Database URLs**: Update the DATABASE_URL in each environment file with your actual database credentials.

3. **Migrations**: Always test migrations in development before applying to production.

4. **Production Safety**: The production reset command includes `--force` flag. Use with extreme caution.

5. **Firebase Setup**: Ensure your Firebase service account key is properly configured for each environment.

## Troubleshooting

### Common Issues:

1. **"Environment file not found"**:
   - Ensure you've created the correct `.env.development` or `.env.production` file

2. **"Database connection failed"**:
   - Check your DATABASE_URL format and credentials
   - Ensure your PostgreSQL server is running

3. **"Migration failed"**:
   - Check for syntax errors in your schema.prisma
   - Ensure database user has proper permissions

4. **"Prisma client not generated"**:
   - Run `npm run db:generate` manually
   - Check for TypeScript compilation errors
