import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'production' ? '' : '.env.development';
dotenv.config({ path: envFile });

import app from './app';
import prisma from './config/db';

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
