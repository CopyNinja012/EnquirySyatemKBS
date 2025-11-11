import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { browserSessionPersistence, getAuth, setPersistence } from 'firebase/auth';

// 🔥 Replace with YOUR Firebase config from Step 1.2
const firebaseConfig = {
  apiKey: "AIzaSyBNTjMvjKHJPINgXZuBtsqDkS_IIRamMYw",
  authDomain: "enquirymanagementsystem-fe636.firebaseapp.com",
  projectId: "enquirymanagementsystem-fe636",
  storageBucket: "enquirymanagementsystem-fe636.firebasestorage.app",
  messagingSenderId: "564733286793",
  appId: "1:564733286793:web:f8681537f9d93aa5a86958",
  measurementId: "G-1DJM78ER7T"
};

// Initialize Firebase
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

export default app;