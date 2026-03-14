import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { SchemaService } from './services/schema.service';
import { WhatsAppConnection } from './whatsapp/connection';
import { SelfPingService } from './services/self_ping.service';

const PORT = process.env.PORT || 5000;

// Global error handlers to catch silent crashes
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  try {
    console.log('[Server] Starting initialization sequence...');
    
    // 1. Initialize Database Schema (Auto-Init & Pooling)
    await SchemaService.initializeSchema();

    // 2. Initialize WhatsApp Bridge
    await WhatsAppConnection.connect();

    // 3. Initialize Self-Ping Service (Pulse)
    SelfPingService.start();

    // 4. Start Express
    const server = app.listen(PORT, () => {
      console.log(`[LAB-AI Server] Running on http://localhost:${PORT}`);
      console.log(`[LAB-AI Status] Production-ready architecture initialized with DB Resilience.`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[Server Error] Port ${PORT} is already in use.`);
      } else {
        console.error('[Server Error]', error);
      }
      process.exit(1);
    });

    // Keep-alive logging
    console.log('[Server] Listener established. Event loop active.');

    // Keep-alive interval to prevent premature exit on some environments
    setInterval(() => {
      if (process.env.NODE_ENV === 'development') {
        // Optional heartbeat log
      }
    }, 60000);

  } catch (error) {
    console.error('[Server Startup Failure]', error);
    process.exit(1);
  }
}

startServer();
