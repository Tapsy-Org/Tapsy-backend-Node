# -----------------------
# Stage 1: Build
# -----------------------
    FROM node:22-alpine AS builder

    # Set working directory
    WORKDIR /usr/src/app
    
    # Copy package.json and lock files
    COPY package*.json ./
    
    # Install all dependencies (including dev, needed for build)
    RUN npm install
    
    # Copy the rest of the application
    COPY . .
    
    # Generate Prisma client
    RUN npx prisma generate
    
    # Build TypeScript -> dist/
    RUN npm run build
    
    
    # -----------------------
    # Stage 2: Production
    # -----------------------
    FROM node:22-alpine
    
    # Set working directory
    WORKDIR /usr/src/app
    
    # Copy only package files and install prod dependencies
    COPY package*.json ./
    RUN npm install --ignore-scripts
    
    # Copy compiled app from builder stage
    COPY --from=builder /usr/src/app/dist ./dist
    COPY --from=builder /usr/src/app/prisma ./prisma
    COPY --from=builder /usr/src/app/generated ./generated
    
    # Expose app port
    EXPOSE 3000
    
    # Start the app
    CMD ["node", "dist/server.js"]
    