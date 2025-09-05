#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Tapsy Backend Development Server...\n');

// Function to run swagger generation
function generateSwagger() {
  return new Promise((resolve, reject) => {    
    const swaggerProcess = spawn('node', ['scripts/generate-swagger.js'], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    swaggerProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Swagger documentation generated successfully\n');
        resolve();
      } else {
        console.error('Failed to generate Swagger documentation');
        reject(new Error(`Swagger generation failed with code ${code}`));
      }
    });

    swaggerProcess.on('error', (error) => {
      console.error('Error running swagger generation:', error);
      reject(error);
    });
  });
}

// Function to start the development server
function startDevServer() {
  console.log('Starting development server with nodemon...\n');
  
  const nodemonProcess = spawn('npm', ['run', 'dev:simple'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  });

  nodemonProcess.on('error', (error) => {
    console.error('Error starting nodemon:', error);
    process.exit(1);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down development server...');
    nodemonProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down development server...');
    nodemonProcess.kill('SIGTERM');
    process.exit(0);
  });
}

// Main execution
async function main() {
  try {
    await generateSwagger();
    startDevServer();
  } catch (error) {
    console.error('Failed to start development environment:', error.message);
    process.exit(1);
  }
}

main();
