# Use Node.js LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Expose the app port (change if your backend runs on another port)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
