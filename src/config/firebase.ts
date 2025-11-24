import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  browserSessionPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDZXd8SIcnils4jpEUpt_gW5ME1NVxPmFE",
  authDomain: "enquirymgmt-662ed.firebaseapp.com",
  projectId: "enquirymgmt-662ed",
  storageBucket: "enquirymgmt-662ed.firebasestorage.app",
  messagingSenderId: "249253198264",
  appId: "1:249253198264:web:3c9ba9937ac81eb1abb74d",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app); // ✅ needed for httpsCallable

setPersistence(auth, browserSessionPersistence).catch(console.error);

// Secondary app for creating users
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);
setPersistence(secondaryAuth, browserSessionPersistence).catch(console.error);

export default app;