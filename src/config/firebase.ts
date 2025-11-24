import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { browserSessionPersistence, getAuth, setPersistence } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId:import.meta.env.VITE_FIREBASE_APP_ID,
};
// Initialize Firebase - Primary App
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

// ✅ Set default persistence to SESSION
// This will be overridden by login() when user checks "Remember Me"
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("✅ Default auth persistence: SESSION (closes with browser)");
  })
  .catch((error) => {
    console.error("❌ Error setting default persistence:", error);
  });

// 🔥 Secondary Firebase App for creating users without affecting admin session
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);

// Set persistence for secondary auth as well
setPersistence(secondaryAuth, browserSessionPersistence)
  .then(() => {
    console.log("✅ Secondary auth persistence: SESSION");
  })
  .catch((error) => {
    console.error("❌ Error setting secondary auth persistence:", error);
  });

export default app;