import { authUtils } from "../contexts/AuthContext";
import type { User } from "../contexts/AuthContext";

/**
 * userService
 * ─────────────────────────────
 * Thin wrapper around authUtils.
 * Provides a more semantic, app-level API for user CRUD,
 * with explicit permission handling and soft deletion.
 */
export const userService = {
  /** Fetch all users (active + inactive) */
  async getAllUsers(): Promise<User[]> {
    return await authUtils.getAllUsers();
  },

  /** Get single user by Firestore document ID */
  async getUserById(id: string): Promise<User | null> {
    return await authUtils.getUserById(id);
  },

  /** Create a new user (admin‑only in app logic) */
  async createUser(
    userData: {
      username: string;
      fullName: string;
      email: string;
      role: "admin" | "user";
      createdBy?: string;
      /** optional explicit permissions */
      permissions?: string[];
    },
    password: string
  ): Promise<User> {
    try {
      return await authUtils.addUser(
        {
          username: userData.username,
          fullName: userData.fullName,
          email: userData.email,
          role: userData.role,
          createdBy: userData.createdBy,
          permissions: userData.permissions ?? [],
          isActive: true,
        },
        password
      );
    } catch (error) {
      console.error("❌ userService.createUser error:", error);
      throw error;
    }
  },

  /** Update user data (name, role, permissions, etc.) */
  async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    try {
      // Call with 2 arguments since newPassword is optional
      return await authUtils.updateUser(id, updates);
    } catch (error) {
      console.error("❌ userService.updateUser error:", error);
      return false;
    }
  },

  /** Update user password - sends password reset email */
  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      return await authUtils.updateUserPassword(userId, newPassword);
    } catch (error) {
      console.error("❌ userService.updateUserPassword error:", error);
      return false;
    }
  },

  /** Send password reset email */
  async sendPasswordResetEmail(email: string): Promise<boolean> {
    try {
      return await authUtils.sendPasswordResetEmail(email);
    } catch (error) {
      console.error("❌ userService.sendPasswordResetEmail error:", error);
      throw error;
    }
  },

  /** Soft delete → sets isActive = false */
  async deactivateUser(id: string): Promise<boolean> {
    try {
      return await authUtils.deleteUser(id);
    } catch (error) {
      console.error("❌ userService.deactivateUser error:", error);
      return false;
    }
  },

  /** Reactivate a deactivated (soft‑deleted) user */
  async reactivateUser(id: string): Promise<boolean> {
    try {
      return await authUtils.updateUser(id, { isActive: true });
    } catch (error) {
      console.error("❌ userService.reactivateUser error:", error);
      return false;
    }
  },

  /** Check if a username already exists (excluding an optional ID) */
  async usernameExists(username: string, excludeId?: string): Promise<boolean> {
    return await authUtils.usernameExists(username, excludeId);
  },

  /** Check if an email already exists (excluding an optional ID) */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    return await authUtils.emailExists(email, excludeId);
  },

  /** Fetch only active users */
  async getActiveUsers(): Promise<User[]> {
    const all = await authUtils.getAllUsers();
    return all.filter((u) => u.isActive);
  },

  /** Fetch users by role (admin or user) */
  async getUsersByRole(role: "admin" | "user"): Promise<User[]> {
    const all = await authUtils.getAllUsers();
    return all.filter((u) => u.role === role && u.isActive);
  },

  /** Fetch users who have a certain permission, e.g. "Add Enquiry" */
  async getUsersByPermission(permission: string): Promise<User[]> {
    const all = await authUtils.getAllUsers();
    return all.filter(
      (u) => u.isActive && (u.permissions || []).includes(permission)
    );
  },
};

export default userService;