import { initializeApp, FirebaseApp } from "firebase/app";
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

let firebaseApp: FirebaseApp | null = null;

export function initFirebase(): FirebaseApp | null {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase configuration is incomplete. Missing:", {
      apiKey: !firebaseConfig.apiKey,
      projectId: !firebaseConfig.projectId,
    });
    return null;
  }

  if (!firebaseApp) {
    try {
      firebaseApp = initializeApp(firebaseConfig);

      if (firebaseConfig.measurementId) {
        getAnalytics(firebaseApp);
      }
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      return null;
    }
  }

  return firebaseApp;
}

export function getFirebaseApp(): FirebaseApp | null {
  return firebaseApp;
}
