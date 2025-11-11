import React, { useState, useEffect } from "react";
import { authUtils, type User } from "../contexts/AuthContext";
import { useAuth } from "../contexts/AuthContext";
import {
  UserPlus,
  Edit,
  Trash2,
  X,
  Save,
  Eye,
  EyeOff,
  Shield,
  Users,
  AlertCircle,
} from "lucide-react";

const UserManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    role: "user" as "admin" | "user",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await authUtils.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      showToast("Failed to load users", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "user",
    });
    setErrors({});
    setShowPassword(false);
  };

  const validateForm = async (isEdit: boolean = false): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    } else {
      const usernameExists = await authUtils.usernameExists(
        formData.username,
        isEdit ? selectedUser?.id : undefined
      );
      if (usernameExists) {
        newErrors.username = "Username already exists";
      }
    }

    // Password validation (required for new users, optional for edit)
    if (!isEdit) {
      if (!formData.password.trim()) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    // Email validation (REQUIRED for Firebase)
    if (!formData.email.trim()) {
      newErrors.email = "Email is required for Firebase Authentication";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    } else {
      const emailExists = await authUtils.emailExists(
        formData.email,
        isEdit ? selectedUser?.id : undefined
      );
      if (emailExists) {
        newErrors.email = "Email already exists";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async () => {
    if (!(await validateForm())) {
      showToast("Please fix the errors before saving", "error");
      return;
    }

    setIsLoading(true);
    try {
      await authUtils.addUser(
        {
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          createdBy: currentUser?.id,
          isActive: true,
        },
        formData.password // Password as second parameter
      );

      showToast("User added successfully", "success");
      await loadUsers();
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      console.error("Error adding user:", error);

      // Handle specific Firebase errors
      let errorMessage = "Failed to add user";
      if (error.message) {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !(await validateForm(true))) {
      showToast("Please fix the errors before saving", "error");
      return;
    }

    setIsLoading(true);
    try {
      const updates: Partial<User> = {
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
      };

      // Note: Firebase doesn't allow password updates through Firestore
      // You would need to use Firebase Auth's updatePassword() for this
      // For now, we'll show a message if they try to change password
      if (formData.password) {
        showToast(
          "Note: Password updates require re-authentication. User should use 'Forgot Password'",
          "error"
        );
        setIsLoading(false);
        return;
      }

      const success = await authUtils.updateUser(selectedUser.id, updates);

      if (success) {
        showToast("User updated successfully", "success");
        await loadUsers();
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
      } else {
        showToast("Failed to update user", "error");
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      showToast(error.message || "Failed to update user", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    if (selectedUser.id === currentUser?.id) {
      showToast("You cannot delete your own account", "error");
      return;
    }

    setIsLoading(true);
    try {
      const success = await authUtils.deleteUser(selectedUser.id);

      if (success) {
        showToast("User deactivated successfully", "success");
        await loadUsers();
        setShowDeleteConfirm(false);
        setSelectedUser(null);
      } else {
        showToast("Failed to delete user", "error");
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      showToast(error.message || "Failed to delete user", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "", // Don't populate password for security
      fullName: user.fullName,
      email: user.email || "",
      role: user.role,
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (user: User) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const activeUsers = users.filter((u) => u.isActive);
  const adminCount = activeUsers.filter((u) => u.role === "admin").length;
  const userCount = activeUsers.filter((u) => u.role === "user").length;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                User Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage user accounts and permissions
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <UserPlus size={20} />
              Add New User
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {activeUsers.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users size={24} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Administrators</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {adminCount}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Shield size={24} className="text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Regular Users</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {userCount}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Users size={24} className="text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                          <Users size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No users found
                        </h3>
                        <p className="text-gray-500">
                          Start by adding your first user
                        </p>
                      </td>
                    </tr>
                  ) : (
                    activeUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {user.username}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.role === "admin" ? "Administrator" : "User"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              disabled={isLoading}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Edit user"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(user)}
                              disabled={
                                user.id === currentUser?.id || isLoading
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                user.id === currentUser?.id
                                  ? "Cannot delete yourself"
                                  : "Delete user"
                              }
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <UserModal
          title="Add New User"
          formData={formData}
          errors={errors}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          onFormChange={setFormData}
          onSave={handleAddUser}
          onCancel={() => {
            setShowAddModal(false);
            resetForm();
          }}
          isEdit={false}
          isLoading={isLoading}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <UserModal
          title="Edit User"
          formData={formData}
          errors={errors}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          onFormChange={setFormData}
          onSave={handleEditUser}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            resetForm();
          }}
          isEdit={true}
          isLoading={isLoading}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Deactivate User
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will disable the user account
                </p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to deactivate user{" "}
              <span className="font-semibold">{selectedUser.username}</span>?
              They will no longer be able to log in.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUser(null);
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Deactivate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

// User Modal Component
const UserModal: React.FC<any> = ({
  title,
  formData,
  errors,
  showPassword,
  setShowPassword,
  onFormChange,
  onSave,
  onCancel,
  isEdit,
  isLoading,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                onFormChange({ ...formData, username: e.target.value })
              }
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100 ${
                errors.username ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="Enter username"
            />
            {errors.username && (
              <p className="text-xs text-red-500 mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email (REQUIRED for Firebase) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-1">
                (Required for Firebase login)
              </span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                onFormChange({ ...formData, email: e.target.value })
              }
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100 ${
                errors.email ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {!isEdit && <span className="text-red-500">*</span>}
              {isEdit && (
                <span className="text-xs text-orange-600 ml-1">
                  (Password updates not supported - user should reset via email)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  onFormChange({ ...formData, password: e.target.value })
                }
                disabled={isLoading || isEdit}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none pr-10 disabled:bg-gray-100 ${
                  errors.password ? "border-red-400" : "border-gray-300"
                }`}
                placeholder={
                  isEdit ? "Cannot change password here" : "Min. 6 characters"
                }
              />
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
            {!isEdit && (
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                onFormChange({ ...formData, fullName: e.target.value })
              }
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100 ${
                errors.fullName ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="Enter full name"
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  role: e.target.value as "admin" | "user",
                })
              }
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
            >
              <option value="user">User (Read & Edit)</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
          </div>

          {/* Firebase Info Notice */}
          {!isEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle
                  size={16}
                  className="text-blue-600 mt-0.5 flex-shrink-0"
                />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">Firebase Authentication</p>
                  <p>
                    User will be created in Firebase Auth and can log in using
                    their email and password.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isLoading}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save size={18} />
                {isEdit ? "Update" : "Add"} User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Component
const Toast: React.FC<any> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${
        type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? (
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span className="text-sm font-medium max-w-xs">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80 flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
};

export default UserManagement;
