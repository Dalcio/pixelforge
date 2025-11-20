import dotenv from 'dotenv';
import { createApp } from './app';
import { initializeFirebase } from './lib/firebase-initializer';

dotenv.config();

initializeFirebase();

const app = createApp();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
