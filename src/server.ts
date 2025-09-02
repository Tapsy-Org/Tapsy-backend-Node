import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

import app from './app';
import prisma from './config/db';

// Load env file based on environment
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
dotenv.config({ path: envFile });

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
export const io = new Server(server, {
  cors: { origin: '*' }, // ⚠️ In production, replace "*" with frontend URL
});

// Store online users (userId -> socketId)
export const onlineUsers = new Map<string, string>();

io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  // Register user
  socket.on('register', (userId: string) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      console.log(`✅ User ${userId} registered with socket ${socket.id}`);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    for (const [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
      }
    }
  });
});

const PORT = process.env.PORT || 5000; // fallback for safety

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to the database');

    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to DB', error);
    process.exit(1);
  }
}

startServer();
