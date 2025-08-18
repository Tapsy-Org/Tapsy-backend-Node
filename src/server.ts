import dotenv from 'dotenv';

import app from './app';
import prisma from './config/db';

// Load correct .env file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const PORT = process.env.PORT;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to the database');

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to DB', error);
    process.exit(1);
  }
}

startServer();
