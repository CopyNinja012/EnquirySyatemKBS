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
  deleteUser as firebaseDeleteUser,
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
  deleteDoc,
} from "firebase/firestore";
import { auth, db, secondaryAuth } from "../config/firebase";

/* ───────────────────────────────
   TYPES & CONTEXT
──────────────────────────────── */
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
  permissions?: string[];
  updatedAt?: string;
  passwordChangedAt?: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (
    email: string,
    password: string,
    rememberMe: boolean
  ) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  canDelete: () => boolean;
  hasPermission: (perm: string) => boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ───────────────────────────────
   CONSTANTS
──────────────────────────────── */
const AUTH_STORAGE_KEY = "auth_current_user";
const REMEMBER_ME_KEY = "auth_remember_me";
const USERS_COLLECTION = "users";

const DEFAULT_ADMIN: Omit<User, "id"> = {
  username: "admin",
  role: "admin",
  fullName: "Aditya Chougule",
  email: "admin@enquirysystem.com",
  createdAt: new Date().toISOString(),
  isActive: true,
  permissions: [
    "Add Enquiry",
    "Search Enquiry",
    "View Enquiry",
    "Manage Payment Details",
    "Today's Follow-ups",
    "All Follow-ups",
    "Import Advertisement",
    "View Advertisement Data",
    "Search Advertisement",
  ],
};

const DEFAULT_ADMIN_PASSWORD = "admin@123";

/* ───────────────────────────────
   FIRESTORE + AUTH UTILITIES
──────────────────────────────── */
export const authUtils = {
  /** Get all users */
  getAllUsers: async (): Promise<User[]> => {
    try {
      const snapshot = await getDocs(collection(db, USERS_COLLECTION));
      const users = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        isActive: Boolean(d.data().isActive),
      })) as User[];
      return users;
    } catch (err) {
      console.error("❌ getAllUsers error:", err);
      return [];
    }
  },

  /** Get user by Firestore ID */
  getUserById: async (id: string): Promise<User | null> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, id);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as User;
      }
      return null;
    } catch (err) {
      console.error("❌ getUserById error:", err);
      return null;
    }
  },

  /** Get user by Firebase UID */
  getUserByFirebaseUid: async (firebaseUid: string): Promise<User | null> => {
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        where("firebaseUid", "==", firebaseUid)
      );
      const res = await getDocs(q);
      if (!res.empty) {
        const docSnap = res.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (err) {
      console.error("❌ getUserByFirebaseUid error:", err);
      return null;
    }
  },

  /** Search by username */
  findUserByUsername: async (username: string): Promise<User | null> => {
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        where("username", "==", username),
        where("isActive", "==", true)
      );
      const res = await getDocs(q);
      if (!res.empty) {
        const docSnap = res.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (err) {
      console.error("❌ findUserByUsername error:", err);
      return null;
    }
  },

  /** Search by email */
  findUserByEmail: async (email: string): Promise<User | null> => {
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        where("email", "==", email),
        where("isActive", "==", true)
      );
      const res = await getDocs(q);
      if (!res.empty) {
        const docSnap = res.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (err) {
      console.error("❌ findUserByEmail error:", err);
      return null;
    }
  },

  /** Validate credentials before Firebase login */
  validateCredentials: async (
    usernameOrEmail: string,
    password: string,
    rememberMe: boolean
  ): Promise<{ user: User; firebaseUser: FirebaseUser }> => {
    let user: User | null = null;
    if (usernameOrEmail.includes("@")) {
      user = await authUtils.findUserByEmail(usernameOrEmail);
    } else {
      user = await authUtils.findUserByUsername(usernameOrEmail);
    }

    if (!user || !user.email) {
      throw new Error("Invalid email or password");
    }

    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "true" : "false");

    const credential = await signInWithEmailAndPassword(
      auth,
      user.email,
      password
    );

    if (!user.isActive) {
      await signOut(auth);
      throw new Error("Account deactivated");
    }

    return { user, firebaseUser: credential.user };
  },

  /** Create new user (adds Firebase Auth + Firestore) */
  addUser: async (
    userData: Omit<User, "id" | "firebaseUid" | "createdAt">,
    password: string
  ): Promise<User> => {
    try {
      // Use secondary auth instance to prevent logging out the admin
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        userData.email,
        password
      );
      const firebaseUid = cred.user.uid;

      const newUser: Omit<User, "id"> = {
        ...userData,
        firebaseUid,
        createdAt: new Date().toISOString(),
        isActive: true,
        passwordChangedAt: new Date().toISOString(),
      };

      const ref = doc(db, USERS_COLLECTION, firebaseUid);
      await setDoc(ref, newUser);

      // Sign out from secondary auth immediately to clean up
      await signOut(secondaryAuth);

      console.log("✅ User created successfully");
      return { id: firebaseUid, ...newUser };
    } catch (err) {
      console.error("❌ addUser error:", err);
      await signOut(secondaryAuth).catch(() => {});
      throw err;
    }
  },

  /** Update user password - Admin only */
  updatePassword: async (
    userId: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      console.log("🔐 Starting password update for user:", userId);

      // Get current user data
      const currentUser = await authUtils.getUserById(userId);
      if (!currentUser) {
        throw new Error("User not found");
      }

      console.log("📧 User email:", currentUser.email);

      // Step 1: Create new Firebase Auth user with new password
      console.log("🔄 Creating new auth user with new password...");
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        currentUser.email,
        newPassword
      );
      const newFirebaseUid = cred.user.uid;
      console.log("✅ New auth user created with UID:", newFirebaseUid);

      // Step 2: Prepare updated user data
      const updatedUserData = {
        ...currentUser,
        firebaseUid: newFirebaseUid,
        updatedAt: new Date().toISOString(),
        passwordChangedAt: new Date().toISOString(),
      };
      delete (updatedUserData as any).id;

      // Step 3: Save to new Firestore document
      console.log("💾 Saving to new Firestore document...");
      const newRef = doc(db, USERS_COLLECTION, newFirebaseUid);
      await setDoc(newRef, updatedUserData);
      console.log("✅ New Firestore document created");

      // Step 4: Delete old Firestore document
      console.log("🗑️ Deleting old Firestore document...");
      const oldRef = doc(db, USERS_COLLECTION, userId);
      await deleteDoc(oldRef);
      console.log("✅ Old Firestore document deleted");

      // Step 5: Sign out from secondary auth
      await signOut(secondaryAuth);
      console.log("✅ Secondary auth signed out");

      console.log("✅ Password updated successfully!");
      console.log("🔐 Old password will no longer work");
      console.log("🔐 New password is now active");

      return true;
    } catch (err: any) {
      console.error("❌ updatePassword error:", err);

      // Handle specific errors
      if (err.code === "auth/email-already-in-use") {
        console.error("❌ Email already in use - this shouldn't happen");
        throw new Error(
          "Password update failed. The email is already associated with another account."
        );
      }

      if (err.code === "auth/weak-password") {
        throw new Error("Password is too weak. Please use a stronger password.");
      }

      // Clean up secondary auth
      await signOut(secondaryAuth).catch(() => {});
      
      throw new Error(err.message || "Failed to update password");
    }
  },

  /** Update user fields (with optional password change) */
  updateUser: async (
    id: string,
    updates: Partial<User>,
    newPassword?: string
  ): Promise<boolean> => {
    try {
      // If password needs to be updated
      if (newPassword && newPassword.trim() !== "") {
        console.log("🔄 Updating user with new password...");
        
        // Get current user data
        const currentUser = await authUtils.getUserById(id);
        if (!currentUser) {
          throw new Error("User not found");
        }

        // Create new auth user with new password
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          currentUser.email,
          newPassword
        );
        const newFirebaseUid = cred.user.uid;

        // Merge current data with updates
        const updatedData = {
          ...currentUser,
          ...updates,
          firebaseUid: newFirebaseUid,
          updatedAt: new Date().toISOString(),
          passwordChangedAt: new Date().toISOString(),
        };

        // Remove id field
        const { id: _id, ...firestoreData } = updatedData as any;

        // Create new document with new UID
        const newRef = doc(db, USERS_COLLECTION, newFirebaseUid);
        await setDoc(newRef, firestoreData);

        // Delete old document
        const oldRef = doc(db, USERS_COLLECTION, id);
        await deleteDoc(oldRef);

        // Clean up secondary auth
        await signOut(secondaryAuth);

        console.log("✅ User and password updated successfully");
        return true;
      } else {
        // No password change - just update Firestore
        const { firebaseUid, createdAt, id: userId, passwordChangedAt, ...data } = updates;
        const ref = doc(db, USERS_COLLECTION, id);
        await updateDoc(ref, {
          ...data,
          updatedAt: new Date().toISOString(),
        });
        console.log("✅ User updated successfully (no password change)");
        return true;
      }
    } catch (err: any) {
      console.error("❌ updateUser error:", err);
      
      if (err.code === "auth/email-already-in-use") {
        throw new Error("Email already in use. Password not updated.");
      }
      
      await signOut(secondaryAuth).catch(() => {});
      return false;
    }
  },

  /** Soft delete user (set isActive=false) */
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      const ref = doc(db, USERS_COLLECTION, id);
      await updateDoc(ref, {
        isActive: false,
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.error("❌ deleteUser error:", err);
      return false;
    }
  },

  /** Hard delete user (remove from Firestore completely) */
  hardDeleteUser: async (id: string): Promise<boolean> => {
    try {
      const ref = doc(db, USERS_COLLECTION, id);
      await deleteDoc(ref);
      console.log("✅ User permanently deleted");
      return true;
    } catch (err) {
      console.error("❌ hardDeleteUser error:", err);
      return false;
    }
  },

  /** Check duplicate username */
  usernameExists: async (
    username: string,
    excludeId?: string
  ): Promise<boolean> => {
    const all = await authUtils.getAllUsers();
    return all.some(
      (u) => u.username === username && (!excludeId || u.id !== excludeId)
    );
  },

  /** Check duplicate email */
  emailExists: async (email: string, excludeId?: string): Promise<boolean> => {
    const all = await authUtils.getAllUsers();
    return all.some(
      (u) => u.email === email && (!excludeId || u.id !== excludeId)
    );
  },

  /** Persist current user in session */
  getCurrentUser: (): User | null => {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser: (user: User | null) => {
    if (user)
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(AUTH_STORAGE_KEY);
  },

  /** Initialize default admin if Firestore empty */
  initializeDefaultAdmin: async (): Promise<void> => {
    try {
      const all = await authUtils.getAllUsers();
      if (all.length === 0) {
        const existing = await authUtils.findUserByEmail(DEFAULT_ADMIN.email);
        if (!existing) {
          try {
            await authUtils.addUser(DEFAULT_ADMIN, DEFAULT_ADMIN_PASSWORD);
            console.log("✅ Default admin created");
          } catch (error: any) {
            if (error.code === "auth/email-already-in-use") {
              console.log(
                "⚠️ Admin email exists in Auth but not in Firestore."
              );
            } else {
              console.error("❌ Error creating default admin:", error);
            }
          }
        } else {
          console.log("✅ Admin already exists");
        }
      }
    } catch (error) {
      console.error("❌ Error initializing admin:", error);
    }
  },
};

/* ───────────────────────────────
   CONTEXT PROVIDER
──────────────────────────────── */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await authUtils.initializeDefaultAdmin();

      // Only listen to primary auth state changes
      const unsub = onAuthStateChanged(auth, async (fUser) => {
        if (fUser) {
          const userData = await authUtils.getUserByFirebaseUid(fUser.uid);
          if (userData && userData.isActive) {
            setCurrentUser(userData);
            setIsAuthenticated(true);
            authUtils.setCurrentUser(userData);
          } else {
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      });
      return unsub;
    };
    const unsubPromise = init();
    return () => {
      unsubPromise.then((u) => u && u());
    };
  }, []);

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<boolean> => {
    const { user } = await authUtils.validateCredentials(
      email,
      password,
      rememberMe
    );
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      authUtils.setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setIsAuthenticated(false);
    authUtils.setCurrentUser(null);
    localStorage.removeItem(REMEMBER_ME_KEY);
  };

  const isAdmin = () => currentUser?.role === "admin";
  const canDelete = () => currentUser?.role === "admin";
  const hasPermission = (permission: string): boolean => {
    if (currentUser?.role === "admin") return true;
    return currentUser?.permissions?.includes(permission) ?? false;
  };

  const updateUserPassword = async (
    userId: string,
    newPassword: string
  ): Promise<boolean> => {
    if (!isAdmin()) {
      console.error("❌ Only admins can update passwords");
      throw new Error("Only administrators can update passwords");
    }
    return await authUtils.updatePassword(userId, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isAdmin,
        canDelete,
        hasPermission,
        isAuthenticated,
        isLoading,
        updateUserPassword,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

/* ───────────────────────────────
   HOOK
──────────────────────────────── */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};