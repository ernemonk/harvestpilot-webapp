import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "harvest-hub-2025.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "harvest-hub-2025",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "harvest-hub-2025.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "100818252456",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:100818252456:web:ce249fddcfbb58e72f089d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
