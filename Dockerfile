# Start with a fresh, dependable Node.js base. We're ready to build!
FROM node:22-alpine AS builder

# Define DATABASE_URL as a build argument and set it as an environment variable.
# This makes it available during the build process for commands like 'prisma db push'.
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# --- Diagnostic Step ---
# This command will print the value of DATABASE_URL during the build process.
# Look for this output when you run 'docker-compose build --no-cache'.
# It should show the full connection string. If it's empty, the variable is not being passed correctly.
RUN echo "DATABASE_URL during build: $DATABASE_URL"
# --- End Diagnostic Step ---

# Set the stage—this is where the magic happens.
WORKDIR /usr/src/app

# Let's get our essential files in place, ensuring we have a solid foundation.
COPY package*.json ./

# IMPORTANT: Copy the prisma directory and its contents here,
# BEFORE running npm install, so schema.prisma is available for 'prisma generate'
COPY prisma ./prisma

# All aboard! We're installing every dependency needed for a successful build. No shortcuts here!
# This step might trigger 'prisma generate' via a postinstall script.
RUN npm install

# Bringing the rest of the application into the fold. The team is now complete.
COPY . .

# Run the database deployment/push for development.
# This step now has access to DATABASE_URL through the build argument.
# RUN npm run db:dev:deploy

# The moment of truth! We're building the TypeScript for optimal performance.
# This compiles your source code (e.g., TypeScript) into JavaScript.
RUN npm run build

# --- Runtime Stage ---
# Define the command to run the application.
# Your package.json defines a 'start' script that handles both building
# and running the compiled server (dist/server.js).
# Using 'npm start' here ensures your Dockerfile uses your defined startup logic.
CMD [ "npm", "start" ]
