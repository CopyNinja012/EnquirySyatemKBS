import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

export interface User {
  id: string;
  username: string;
  password?: string;
  role: "admin" | "user";
  fullName: string;
  email: string;
  createdAt: string;
  createdBy?: string;
  isActive: boolean;
  firebaseUid?: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (
    username: string,
    password: string,
    rememberMe: boolean
  ) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  canDelete: () => boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "auth_current_user";
const REMEMBER_ME_KEY = "auth_remember_me";
const USERS_COLLECTION = "users";

// Default admin credentials
const DEFAULT_ADMIN: Omit<User, "id"> = {
  username: "admin",
  role: "admin",
  fullName: "System Administrator",
  email: "admin@gmail.com",
  createdAt: new Date().toISOString(),
  isActive: true,
};

const DEFAULT_ADMIN_PASSWORD = "admin@123";

export const authUtils = {
  // Get all users from Firestore
  getAllUsers: async (): Promise<User[]> => {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const snapshot = await getDocs(usersRef);

      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isActive: Boolean(doc.data().isActive),
      })) as User[];

      console.log("📋 Loaded", users.length, "users from Firestore");
      return users;
    } catch (error) {
      console.error("❌ Error reading users:", error);
      return [];
    }
  },

  // Get user by Firestore document ID
  getUserById: async (id: string): Promise<User | null> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, id);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data(),
          isActive: Boolean(userDoc.data().isActive),
        } as User;
      }
      return null;
    } catch (error) {
      console.error("❌ Error getting user by ID:", error);
      return null;
    }
  },

  // Get user by Firebase Auth UID
  getUserByFirebaseUid: async (firebaseUid: string): Promise<User | null> => {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("firebaseUid", "==", firebaseUid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        return {
          id: userDoc.id,
          ...userDoc.data(),
          isActive: Boolean(userDoc.data().isActive),
        } as User;
      }
      return null;
    } catch (error) {
      console.error("❌ Error getting user by Firebase UID:", error);
      return null;
    }
  },

  // Find user by username
  findUserByUsername: async (username: string): Promise<User | null> => {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(
        usersRef,
        where("username", "==", username),
        where("isActive", "==", true)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        return {
          id: userDoc.id,
          ...userDoc.data(),
          isActive: true,
        } as User;
      }
      return null;
    } catch (error) {
      console.error("❌ Error finding user by username:", error);
      return null;
    }
  },

  // Find user by email
  findUserByEmail: async (email: string): Promise<User | null> => {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(
        usersRef,
        where("email", "==", email),
        where("isActive", "==", true)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        return {
          id: userDoc.id,
          ...userDoc.data(),
          isActive: true,
        } as User;
      }
      return null;
    } catch (error) {
      console.error("❌ Error finding user by email:", error);
      return null;
    }
  },

  // Validate credentials - Throws errors for better error handling
  validateCredentials: async (
    usernameOrEmail: string,
    password: string,
    rememberMe: boolean
  ): Promise<{ user: User; firebaseUser: FirebaseUser }> => {
    try {
      let user: User | null = null;

      // Detect if input is email or username
      if (usernameOrEmail.includes("@")) {
        console.log("🔍 Searching by email:", usernameOrEmail);
        user = await authUtils.findUserByEmail(usernameOrEmail);
      } else {
        console.log("🔍 Searching by username:", usernameOrEmail);
        user = await authUtils.findUserByUsername(usernameOrEmail);
      }

      // User not found in Firestore
      if (!user || !user.email) {
        console.log("❌ User not found in Firestore");
        throw new Error(
          "Invalid username/email or password. Please try again."
        );
      }

      console.log("✅ User found in Firestore:", user.username);
      console.log("📧 Authenticating with email:", user.email);

      // Set persistence based on Remember Me
      if (rememberMe) {
        console.log("💾 Remember Me: Enabled (browserLocalPersistence)");
        console.log("   → Will stay logged in even after closing browser");
        await setPersistence(auth, browserLocalPersistence);
        localStorage.setItem(REMEMBER_ME_KEY, "true");
      } else {
        console.log("🔒 Remember Me: Disabled (browserSessionPersistence)");
        console.log("   → Will logout when browser/tab is closed");
        await setPersistence(auth, browserSessionPersistence);
        localStorage.setItem(REMEMBER_ME_KEY, "false");
      }

      // Authenticate with Firebase Auth
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(
          auth,
          user.email,
          password
        );
      } catch (authError: any) {
        console.error("❌ Firebase Auth error:", authError.code);

        // Handle specific Firebase Auth errors
        switch (authError.code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
          case "auth/user-not-found":
            throw new Error(
              "Invalid username/email or password. Please try again."
            );

          case "auth/too-many-requests":
            throw new Error(
              "Too many failed login attempts. Please try again later."
            );

          case "auth/network-request-failed":
            throw new Error(
              "Network error. Please check your internet connection."
            );

          case "auth/user-disabled":
            throw new Error(
              "This account has been disabled. Please contact support."
            );

          default:
            throw new Error(
              authError.message || "Login failed. Please try again."
            );
        }
      }

      // Check if user is active
      if (!user.isActive) {
        console.log("❌ User account is inactive");
        await signOut(auth);
        throw new Error(
          "Your account has been deactivated. Please contact an administrator."
        );
      }

      console.log("✅ User authenticated successfully:", user.username);
      return { user, firebaseUser: userCredential.user };
    } catch (error: any) {
      // Re-throw the error to be caught by login function
      throw error;
    }
  },

  // Add new user
  addUser: async (
    userData: Omit<User, "id" | "createdAt" | "firebaseUid">,
    password: string
  ): Promise<User> => {
    try {
      console.log("📧 Creating Firebase Auth user with email:", userData.email);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        password
      );

      const firebaseUid = userCredential.user.uid;
      console.log("✅ Firebase Auth user created with UID:", firebaseUid);

      const newUser: Omit<User, "id"> = {
        ...userData,
        firebaseUid,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      const userRef = doc(db, USERS_COLLECTION, firebaseUid);
      await setDoc(userRef, newUser);

      console.log("✅ Firestore document created");
      console.log("✅ User created:", userData.username);

      return {
        id: firebaseUid,
        ...newUser,
      };
    } catch (error: any) {
      console.error("❌ Error adding user:", error);

      if (error.code === "auth/email-already-in-use") {
        throw new Error("Email is already in use");
      } else if (error.code === "auth/weak-password") {
        throw new Error("Password should be at least 6 characters");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      }

      throw error;
    }
  },

  // Update user
  updateUser: async (id: string, updates: Partial<User>): Promise<boolean> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, id);
      const { firebaseUid, createdAt, ...updateData } = updates;
      await updateDoc(userRef, updateData);
      console.log("✅ User updated:", id);
      return true;
    } catch (error) {
      console.error("❌ Error updating user:", error);
      return false;
    }
  },

  // Delete user
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, id);
      await updateDoc(userRef, { isActive: false });
      console.log("✅ User deactivated:", id);
      return true;
    } catch (error) {
      console.error("❌ Error deleting user:", error);
      return false;
    }
  },

  // Check if username exists
  usernameExists: async (
    username: string,
    excludeId?: string
  ): Promise<boolean> => {
    const users = await authUtils.getAllUsers();
    return users.some(
      (u) => u.username === username && (!excludeId || u.id !== excludeId)
    );
  },

  // Check if email exists
  emailExists: async (email: string, excludeId?: string): Promise<boolean> => {
    const users = await authUtils.getAllUsers();
    return users.some(
      (u) => u.email === email && (!excludeId || u.id !== excludeId)
    );
  },

  // Get current user from session storage
  getCurrentUser: (): User | null => {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  // Save current user to session storage
  setCurrentUser: (user: User | null): void => {
    if (user) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  // Check if user has delete permission
  canDelete: (user: User | null): boolean => {
    return user?.role === "admin";
  },

  // Initialize default admin
  initializeDefaultAdmin: async (): Promise<void> => {
    try {
      const users = await authUtils.getAllUsers();

      if (users.length === 0) {
        console.log(
          "🔧 No users found in Firestore, creating default admin..."
        );

        const existingUser = await authUtils.findUserByEmail(
          DEFAULT_ADMIN.email
        );

        if (!existingUser) {
          try {
            const newUser = await authUtils.addUser(
              DEFAULT_ADMIN,
              DEFAULT_ADMIN_PASSWORD
            );

            console.log("✅ Default admin created successfully!");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("📧 Email:    ", DEFAULT_ADMIN.email);
            console.log("👤 Username: ", DEFAULT_ADMIN.username);
            console.log("🔑 Password: ", DEFAULT_ADMIN_PASSWORD);
            console.log("🆔 UID:      ", newUser.id);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("⚠️  CHANGE THIS PASSWORD IMMEDIATELY!");
          } catch (error: any) {
            if (error.message === "Email is already in use") {
              console.log(
                "⚠️  Email exists in Firebase Auth but not in Firestore"
              );
              console.log(
                "🔧 Please delete the user from Firebase Console → Authentication"
              );
            }
          }
        } else {
          console.log("✅ Admin user already exists");
        }
      } else {
        console.log("✅ Users already exist, skipping admin creation");
      }
    } catch (error: any) {
      console.error("❌ Error initializing default admin:", error);
    }
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        // Initialize default admin (if needed)
        await authUtils.initializeDefaultAdmin();

        // Listen to Firebase Auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            console.log("🔐 Firebase user detected:", firebaseUser.email);

            // Get user data from Firestore
            const userData = await authUtils.getUserByFirebaseUid(
              firebaseUser.uid
            );

            if (userData && userData.isActive) {
              console.log("✅ User data loaded:", userData.username);

              // Check persistence mode
              const rememberMe =
                localStorage.getItem(REMEMBER_ME_KEY) === "true";
              console.log(
                `💾 Session type: ${
                  rememberMe
                    ? "Persistent (Remember Me enabled)"
                    : "Session (closes with browser)"
                }`
              );

              setCurrentUser(userData);
              setIsAuthenticated(true);
              authUtils.setCurrentUser(userData);
            } else {
              console.log("❌ User inactive or not found in Firestore");
              setCurrentUser(null);
              setIsAuthenticated(false);
              authUtils.setCurrentUser(null);
            }
          } else {
            console.log("🚪 No Firebase user logged in");
            setCurrentUser(null);
            setIsAuthenticated(false);
            authUtils.setCurrentUser(null);
          }

          setIsLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("❌ Error initializing auth:", error);
        setIsLoading(false);
      }
    };

    const unsubscribePromise = initializeAuth();

    // Cleanup function
    return () => {
      unsubscribePromise.then((unsubscribe) => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);

  const login = async (
    username: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<boolean> => {
    try {
      const result = await authUtils.validateCredentials(
        username,
        password,
        rememberMe
      );

      if (result) {
        console.log("✅ Login successful:", result.user.username);
        console.log(
          `💾 Remember Me: ${rememberMe ? "✓ Enabled" : "✗ Disabled"}`
        );
        return true;
      }

      throw new Error("Invalid username/email or password. Please try again.");
    } catch (error: any) {
      console.error("❌ Login error:", error.message || error);
      // Re-throw the error so Login component can display it
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAuthenticated(false);
      authUtils.setCurrentUser(null);
      localStorage.removeItem(REMEMBER_ME_KEY);
      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  const isAdmin = (): boolean => {
    return currentUser?.role === "admin";
  };

  const canDelete = (): boolean => {
    return currentUser?.role === "admin";
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isAdmin,
        canDelete,
        isAuthenticated,
        isLoading,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
