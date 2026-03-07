import app from './app';
import { SchemaService } from './services/schema.service';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Initialize Database Schema (Auto-Init & Pooling)
    await SchemaService.initializeSchema();

    // 2. Start Express
    app.listen(PORT, () => {
      console.log(`[LAB-AI Server] Running on http://localhost:${PORT}`);
      console.log(`[LAB-AI Status] Production-ready architecture initialized with DB Resilience.`);
    });
  } catch (error) {
    console.error('[Server Startup Failure]', error);
    process.exit(1);
  }
}

startServer();
