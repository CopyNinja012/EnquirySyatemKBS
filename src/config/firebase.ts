import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { browserSessionPersistence, getAuth, setPersistence } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZXd8SIcnils4jpEUpt_gW5ME1NVxPmFE",
  authDomain: "enquirymgmt-662ed.firebaseapp.com",
  projectId: "enquirymgmt-662ed",
  storageBucket: "enquirymgmt-662ed.firebasestorage.app",
  messagingSenderId: "249253198264",
  appId: "1:249253198264:web:3c9ba9937ac81eb1abb74d"
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