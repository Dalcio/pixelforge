import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let appInitialized = false;

export function initFirebase() {
  // Validate required Firebase configuration
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      "Firebase configuration is incomplete. Please check your environment variables."
    );
    return;
  }

  if (!appInitialized) {
    try {
      const app = initializeApp(firebaseConfig);

      // Only initialize analytics if measurementId is provided
      if (firebaseConfig.measurementId) {
        getAnalytics(app);
      }

      appInitialized = true;
      console.log("Firebase initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
    }
  }
}
