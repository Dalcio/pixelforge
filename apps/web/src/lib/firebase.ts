import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCd-_f5FOLvd8EcEolY2kxrQhwb-MlP9YE",
  authDomain: "image-transformation-64f36.firebaseapp.com",
  projectId: "image-transformation-64f36",
  storageBucket: "image-transformation-64f36.firebasestorage.app",
  messagingSenderId: "493643052188",
  appId: "1:493643052188:web:fa88943256e91c8053a959",
  measurementId: "G-6QDXTQN7LK",
};

let appInitialized = false;

export function initFirebase() {
  if (!appInitialized && firebaseConfig.apiKey) {
    try {
      const app = initializeApp(firebaseConfig);
      getAnalytics(app);
      appInitialized = true;
      console.log("Firebase initialized");
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
    }
  }
}
