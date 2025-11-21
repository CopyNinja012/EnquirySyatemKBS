import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userService } from "@/Services/UserServices";
import {
  User as UserIcon,
  Mail,
  Lock,
  UserPlus,
  Shield,
  Trash2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import type { User } from "../contexts/AuthContext";

const UserManagement: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    role: "user" as "admin" | "user",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    try {
      // Validation
      if (
        !formData.username ||
        !formData.email ||
        !formData.password ||
        !formData.fullName
      ) {
        throw new Error("All fields are required");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Check if username exists
      const usernameExists = await userService.usernameExists(
        formData.username
      );
      if (usernameExists) {
        throw new Error("Username already exists");
      }

      // Check if email exists
      const emailExists = await userService.emailExists(formData.email);
      if (emailExists) {
        throw new Error("Email already exists");
      }

      // Create user
      await userService.createUser(
        {
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          createdBy: currentUser?.id,
        },
        formData.password
      );

      setFormSuccess(`✅ User "${formData.username}" created successfully!`);

      // Reset form
      setFormData({
        username: "",
        fullName: "",
        email: "",
        password: "",
        role: "user",
      });

      // Reload users
      await loadUsers();

      // Hide form after 2 seconds
      setTimeout(() => {
        setShowCreateForm(false);
        setFormSuccess("");
      }, 2000);
    } catch (error: any) {
      setFormError(error.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateUser = async (userId: string, username: string) => {
    if (
      !window.confirm(
        `Are you sure you want to deactivate user "${username}"?`
      )
    ) {
      return;
    }

    try {
      await userService.deactivateUser(userId);
      await loadUsers();
      alert(`User "${username}" deactivated successfully`);
    } catch (error) {
      alert("Failed to deactivate user");
    }
  };

  const handleReactivateUser = async (userId: string, username: string) => {
    try {
      await userService.reactivateUser(userId);
      await loadUsers();
      alert(`User "${username}" reactivated successfully`);
    } catch (error) {
      alert("Failed to reactivate user");
    }
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-5 max-w-md w-full">
          <p className="text-red-800 text-sm sm:text-base">
            ⛔ Access Denied: Admin only
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">
            User Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage system users and permissions
          </p>
        </div>

        {/* Create User Button */}
        <div className="mb-5 sm:mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full sm:w-auto bg-sky-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-sky-700 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <UserPlus size={18} className="sm:w-5 sm:h-5" />
            {showCreateForm ? "Cancel" : "Create New User"}
          </button>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-5 sm:mb-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
              Create New User
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-4 sm:space-y-5">
              {/* Username */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Username *
                </label>
                <div className="relative">
                  <UserIcon
                    className="absolute left-3 top-2.5 sm:top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  placeholder="Enter full name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-2.5 sm:top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    placeholder="user@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Password * (min 6 characters)
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-2.5 sm:top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    placeholder="Enter password"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Role *
                </label>
                <div className="relative">
                  <Shield
                    className="absolute left-3 top-2.5 sm:top-3 text-gray-400"
                    size={18}
                  />
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "admin" | "user",
                      })
                    }
                    className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Error/Success Messages */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle
                    size={18}
                    className="sm:w-5 sm:h-5 text-red-600 mt-0.5"
                  />
                  <p className="text-xs sm:text-sm text-red-800">
                    {formError}
                  </p>
                </div>
              )}

              {formSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                  <Check
                    size={18}
                    className="sm:w-5 sm:h-5 text-green-600 mt-0.5"
                  />
                  <p className="text-xs sm:text-sm text-green-800">
                    {formSuccess}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-sky-600 text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormError("");
                    setFormSuccess("");
                  }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table (Desktop/Tablet) */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-gray-500 text-sm"
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-gray-500 text-sm"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className={!user.isActive ? "bg-gray-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-sky-100 rounded-full flex items-center justify-center">
                            <UserIcon size={20} className="text-sky-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check size={14} className="mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <X size={14} className="mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {user.id !== currentUser?.id &&
                          (user.isActive ? (
                            <button
                              onClick={() =>
                                handleDeactivateUser(user.id, user.username)
                              }
                              className="text-red-600 hover:text-red-900 flex items-center gap-1 ml-auto"
                            >
                              <Trash2 size={16} />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleReactivateUser(user.id, user.username)
                              }
                              className="text-green-600 hover:text-green-900 flex items-center gap-1 ml-auto"
                            >
                              <Check size={16} />
                              Reactivate
                            </button>
                          ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No users found
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 ${
                    !user.isActive ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon size={20} className="text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 truncate">
                    {user.email}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role.toUpperCase()}
                    </span>
                    {user.isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-800">
                        <Check size={12} className="mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-800">
                        <X size={12} className="mr-1" />
                        Inactive
                      </span>
                    )}
                    <span className="text-[11px] text-gray-500 ml-auto">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {user.id !== currentUser?.id && (
                    <div className="mt-3 flex justify-end">
                      {user.isActive ? (
                        <button
                          onClick={() =>
                            handleDeactivateUser(user.id, user.username)
                          }
                          className="text-xs text-red-600 hover:text-red-900 flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleReactivateUser(user.id, user.username)
                          }
                          className="text-xs text-green-600 hover:text-green-900 flex items-center gap-1"
                        >
                          <Check size={14} />
                          Reactivate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600">Total Users</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {users.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600">Active Users</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {users.filter((u) => u.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600">Admins</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-600">
              {users.filter((u) => u.role === "admin" && u.isActive).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;