import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'missing-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "harvest-hub-2025.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "harvest-hub-2025",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "harvest-hub-2025.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "100818252456",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:100818252456:web:ce249fddcfbb58e72f089d"
};

// Initialize Firebase — lazy initialization to avoid SSR/build errors
let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

function getApp(): FirebaseApp {
  if (!_app) {
    _app = initializeApp(firebaseConfig);
  }
  return _app;
}

// Initialize Firebase Authentication and get a reference to the service
export const auth: Auth = typeof window !== 'undefined'
  ? (() => { if (!_auth) _auth = getAuth(getApp()); return _auth; })()
  : ({} as Auth);

// Initialize Cloud Firestore and get a reference to the service
export const db: Firestore = typeof window !== 'undefined'
  ? (() => { if (!_db) _db = getFirestore(getApp()); return _db; })()
  : ({} as Firestore);

export default getApp;
