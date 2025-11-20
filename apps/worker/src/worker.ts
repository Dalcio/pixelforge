import dotenv from 'dotenv';
import { initializeFirebase } from './lib/firebase-initializer';
import { createWorker } from './queue/worker-initializer';

dotenv.config();

initializeFirebase();

const worker = createWorker();

console.log('Worker started and waiting for jobs...');

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});
