# Stage 1: Base image with working directory
FROM node:22-alpine AS base
WORKDIR /usr/src/app

# Stage 2: Install all dependencies for caching
FROM base AS dependencies
COPY package*.json ./
RUN npm ci

# Stage 3: Build the application
FROM dependencies AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 4: Final, small production image
FROM base AS production
ENV NODE_ENV=production

# Copy only production packages and package.json
COPY package.json ./
RUN npm ci --only=production

# Copy the built application and necessary Prisma assets from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

# This command runs migrations and then starts the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]