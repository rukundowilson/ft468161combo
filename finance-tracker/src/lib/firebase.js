import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWmeBdENie09KYupGdQhBuhOMa1mw3aq0",
  authDomain: "fintra-93d29.firebaseapp.com",
  projectId: "fintra-93d29",
  storageBucket: "fintra-93d29.firebasestorage.app",
  messagingSenderId: "662611627874",
  appId: "1:662611627874:web:997f76192e21d7af1ee63b",
  measurementId: "G-S80GSZLHW0"
};

// Initialize Firebase only on client-side (prevent SSR issues)
let app;
let auth;

if (typeof window !== 'undefined') {
  // Initialize Firebase (prevent multiple initializations)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  
  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app);
} else {
  // Create a mock auth object for SSR
  auth = null;
}

// Lazy load Analytics only on client-side when needed
export const getAnalyticsInstance = () => {
  if (typeof window !== 'undefined' && app) {
    return import('firebase/analytics').then(({ getAnalytics }) => {
      return getAnalytics(app);
    });
  }
  return Promise.resolve(null);
};

export { auth };
export default app;
