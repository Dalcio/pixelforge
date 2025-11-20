import dotenv from 'dotenv';
import { createApp } from './app';
import { initializeFirebase } from './lib/firebase-initializer';
import { Server } from 'http';

dotenv.config();

// Global exception handlers - must be set up before any async code
process.on('uncaughtException', (error: Error) => {
  console.error('\n❌ [FATAL] Uncaught Exception:');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('\nShutting down API server due to uncaught exception...');
  
  // Give time for logs to flush
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('\n❌ [FATAL] Unhandled Promise Rejection:');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  
  if (reason instanceof Error) {
    console.error('Stack:', reason.stack);
  }
  
  console.error('\nShutting down API server due to unhandled rejection...');
  
  // Give time for logs to flush
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

initializeFirebase();

const app = createApp();
const port = process.env.PORT || 3000;

const server: Server = app.listen(port, () => {
  console.log(`✓ API server running on port ${port}`);
});

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('\n⚠ SIGTERM received, closing API server gracefully...');
  
  server.close((err) => {
    if (err) {
      console.error('✗ Error closing server:', err);
      process.exit(1);
    }
    console.log('✓ Server closed successfully');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠ Forcefully shutting down after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', async () => {
  console.log('\n⚠ SIGINT received (Ctrl+C), closing API server gracefully...');
  
  server.close((err) => {
    if (err) {
      console.error('✗ Error closing server:', err);
      process.exit(1);
    }
    console.log('✓ Server closed successfully');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠ Forcefully shutting down after timeout');
    process.exit(1);
  }, 10000);
});
