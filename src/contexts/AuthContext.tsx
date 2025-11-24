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
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  // 👉 add these:
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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
        isActive: Boolean((d.data() as any).isActive),
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

      await signOut(secondaryAuth);

      console.log("✅ User created successfully");
      return { id: firebaseUid, ...newUser };
    } catch (err) {
      console.error("❌ addUser error:", err);
      await signOut(secondaryAuth).catch(() => {});
      throw err;
    }
  },

  /** Update user fields (Firestore only - email updates allowed, password via reset email) */
  updateUser: async (
    id: string,
    updates: Partial<User>,
    newPassword?: string
  ): Promise<boolean> => {
    try {
      console.log("🔄 Updating user info...");

      const currentUser = await authUtils.getUserById(id);
      if (!currentUser) {
        throw new Error("User not found");
      }

      if (updates.email && updates.email !== currentUser.email) {
        const emailInUse = await authUtils.emailExists(updates.email, id);
        if (emailInUse) {
          throw new Error("This email is already in use by another account.");
        }

        console.warn(
          "⚠️ Email updated in Firestore. User should verify their email or use password reset to sync Firebase Auth."
        );
      }

      const {
        firebaseUid,
        createdAt,
        id: userId,
        passwordChangedAt,
        password,
        ...data
      } = updates;

      const ref = doc(db, USERS_COLLECTION, id);
      await updateDoc(ref, {
        ...data,
        updatedAt: new Date().toISOString(),
      });

      if (newPassword) {
        console.warn(
          "⚠️ Password changes should be done via sendPasswordResetEmail method"
        );
      }

      console.log("✅ User updated successfully");
      return true;
    } catch (err: any) {
      console.error("❌ updateUser error:", err);
      throw err;
    }
  },

  /** Update user password using password reset email */
  updateUserPassword: async (
    userId: string,
    _newPassword: string
  ): Promise<boolean> => {
    try {
      const user = await authUtils.getUserById(userId);
      if (!user || !user.email) {
        throw new Error("User not found");
      }

      await authUtils.sendPasswordResetEmail(user.email);

      console.log("✅ Password reset email sent to user");
      return true;
    } catch (err) {
      console.error("❌ updateUserPassword error:", err);
      throw err;
    }
  },

  /** Send password reset email to user */
  sendPasswordResetEmail: async (email: string): Promise<boolean> => {
    try {
      await firebaseSendPasswordResetEmail(auth, email);
      console.log("✅ Password reset email sent to:", email);
      return true;
    } catch (err: any) {
      console.error("❌ sendPasswordResetEmail error:", err);
      if (err.code === "auth/user-not-found") {
        throw new Error("No user found with this email address.");
      }
      if (err.code === "auth/invalid-email") {
        throw new Error("Invalid email address.");
      }
      throw new Error("Failed to send password reset email. Please try again.");
    }
  },

  deleteUser: async (id: string): Promise<boolean> => {
    try {
      const ref = doc(db, USERS_COLLECTION, id);
      await updateDoc(ref, {
        isActive: false,
        updatedAt: new Date().toISOString(),
      });
      console.log("✅ User deactivated");
      return true;
    } catch (err) {
      console.error("❌ deleteUser error:", err);
      return false;
    }
  },

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

  usernameExists: async (
    username: string,
    excludeId?: string
  ): Promise<boolean> => {
    const all = await authUtils.getAllUsers();
    return all.some(
      (u) => u.username === username && (!excludeId || u.id !== excludeId)
    );
  },

  emailExists: async (email: string, excludeId?: string): Promise<boolean> => {
    const all = await authUtils.getAllUsers();
    return all.some(
      (u) => u.email === email && (!excludeId || u.id !== excludeId)
    );
  },

  getCurrentUser: (): User | null => {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser: (user: User | null) => {
    if (user) sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(AUTH_STORAGE_KEY);
  },

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

  /** Admin changes their own password (current logged-in Firebase user) */
  changeOwnPassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    const fUser = auth.currentUser;

    if (!fUser || !fUser.email) {
      throw new Error("No authenticated user.");
    }

    const cred = EmailAuthProvider.credential(fUser.email, currentPassword);
    await reauthenticateWithCredential(fUser, cred);
    await updatePassword(fUser, newPassword);

    const userDoc = await authUtils.getUserByFirebaseUid(fUser.uid);
    if (userDoc) {
      const ref = doc(db, USERS_COLLECTION, userDoc.id);
      await updateDoc(ref, {
        passwordChangedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log("✅ Password changed for current user");
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