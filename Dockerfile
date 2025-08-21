# Start with a fresh, dependable Node.js base. We're ready to build!
FROM node:22-alpine AS builder

# Set the stage—this is where the magic happens.
WORKDIR /usr/src/app

# Let's get our essential files in place, ensuring we have a solid foundation.
COPY package*.json ./

# All aboard! We're installing every dependency needed for a successful build. No shortcuts here!
RUN npm install

# Bringing the rest of the application into the fold. The team is now complete.
COPY . .

# Generating the Prisma client with a flourish! We're preparing for seamless database interaction.
RUN npx prisma generate

# The moment of truth! We're building the TypeScript for optimal performance.
RUN npm run build