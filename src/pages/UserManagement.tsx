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
  AlertCircle,
  Check,
  Key,
} from "lucide-react";

/* ---------------------------------------------
   master permission list & role defaults
--------------------------------------------- */
const ALL_PERMISSIONS = [
  "Add Enquiry",
  "Search Enquiry",
  "View Enquiry",
  "Manage Payment Details",
  "Today's Follow-ups",
  "All Follow-ups",
  "Import Advertisement",
  "View Advertisement Data",
  "Search Advertisement",
];

const ROLE_DEFAULTS: Record<"admin" | "user", string[]> = {
  admin: [...ALL_PERMISSIONS],
  user: [
    "Add Enquiry",
    "Search Enquiry",
    "View Enquiry",
    "Today's Follow-ups",
    "View Advertisement Data",
    "Search Advertisement",
  ],
};

/* --------------------------------------------- */

const UserManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    role: "user" as "admin" | "user",
    permissions: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    try {
      if (initialLoading) setInitialLoading(true);
      const all = await authUtils.getAllUsers();
      setUsers(all);
    } catch {
      showToast("Failed to load users", "error");
    } finally {
      setInitialLoading(false);
    }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function resetForm() {
    setFormData({
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "user",
      permissions: ROLE_DEFAULTS.user,
    });
    setErrors({});
    setShowPassword(false);
    setChangePassword(false);
  }

  /* ---------------------------------------------
     validation
  --------------------------------------------- */
  async function validate(isEdit = false) {
    const e: Record<string, string> = {};
    if (!formData.username.trim()) e.username = "Username required";
    if (!formData.fullName.trim()) e.fullName = "Full name required";
    if (!formData.email.trim()) e.email = "Email required";

    // Password validation
    if (!isEdit && !formData.password.trim()) {
      e.password = "Password required";
    } else if (isEdit && changePassword && !formData.password.trim()) {
      e.password = "Password required when changing password";
    } else if (formData.password.trim() && formData.password.length < 6) {
      e.password = "Password must be at least 6 characters";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ---------------------------------------------
     CRUD actions
  --------------------------------------------- */
  async function handleAdd() {
    if (!(await validate())) {
      showToast("Please fix form errors.", "error");
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
          permissions: formData.permissions,
          createdBy: currentUser?.id,
          isActive: true,
        },
        formData.password
      );
      showToast("User added successfully!", "success");
      await loadUsers();
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      showToast(err?.message || "Add user failed", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEdit() {
    if (!selectedUser || !(await validate(true))) return;
    setIsLoading(true);
    try {
      const newPassword =
        changePassword && formData.password.trim()
          ? formData.password
          : undefined;

      await authUtils.updateUser(
        selectedUser.id,
        {
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          permissions: formData.permissions,
        },
        newPassword
      );

      showToast(
        changePassword
          ? "User and password updated successfully!"
          : "User updated successfully!",
        "success"
      );
      await loadUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } catch (err: any) {
      showToast(err?.message || "Update failed", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedUser) return;
    try {
      setIsLoading(true);
      await authUtils.deleteUser(selectedUser.id);
      showToast("User deactivated successfully!", "success");
      await loadUsers();
    } catch (err: any) {
      showToast(err?.message || "Delete failed", "error");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
    }
  }

  /* --------------------------------------------- */

  const activeUsers = users.filter((u) => u.isActive);
  const adminCount = activeUsers.filter((u) => u.role === "admin").length;
  const userCount = activeUsers.filter((u) => u.role === "user").length;

  return (
    <>
      <div className="min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Add users and assign permissions
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-green-700 transition-colors"
            >
              <UserPlus size={18} className="sm:w-5 sm:h-5" /> Add User
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
            <Stat label="Total Users" count={activeUsers.length} color="blue" />
            <Stat label="Admins" count={adminCount} color="purple" />
            <Stat label="Users" count={userCount} color="green" />
          </div>

          {/* Users table / mobile list */}
          <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
            {initialLoading ? (
              <div className="py-10 flex justify-center items-center">
                <div className="h-8 w-8 border-2 border-t-green-600 border-gray-200 rounded-full animate-spin" />
              </div>
            ) : activeUsers.length === 0 ? (
              <p className="py-8 text-center text-sm sm:text-base text-gray-500">
                No users found
              </p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          Role
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          Username
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          Email
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeUsers.map((u) => {
                        const isCurrentUser = u.id === currentUser?.id;
                        return (
                          <tr
                            key={u.id}
                            className="border-t hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-2 font-medium text-gray-900">
                              {u.fullName}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  u.role === "admin"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {u.role === "admin" && <Shield size={12} />}
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {u.username}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {u.email}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setFormData({
                                      username: u.username,
                                      password: "",
                                      fullName: u.fullName,
                                      email: u.email,
                                      role: u.role,
                                      permissions: u.permissions || [],
                                    });
                                    setChangePassword(false);
                                    setShowEditModal(true);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit user"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                                  disabled={isCurrentUser}
                                  title={
                                    isCurrentUser
                                      ? "You cannot deactivate your own account"
                                      : "Deactivate user"
                                  }
                                  onClick={() => {
                                    if (isCurrentUser) return;
                                    setSelectedUser(u);
                                    setShowDeleteConfirm(true);
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list */}
                <div className="md:hidden divide-y divide-gray-200">
                  {activeUsers.map((u) => {
                    const isCurrentUser = u.id === currentUser?.id;
                    return (
                      <div
                        key={u.id}
                        className="p-4 flex flex-col gap-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sky-700 font-semibold text-sm">
                              {u.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {u.fullName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              @{u.username}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              u.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {u.role === "admin" && (
                              <Shield size={12} className="mr-1" />
                            )}
                            {u.role}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 truncate">
                          {u.email}
                        </p>

                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setFormData({
                                username: u.username,
                                password: "",
                                fullName: u.fullName,
                                email: u.email,
                                role: u.role,
                                permissions: u.permissions || [],
                              });
                              setChangePassword(false);
                              setShowEditModal(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button
                            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={isCurrentUser}
                            onClick={() => {
                              if (isCurrentUser) return;
                              setSelectedUser(u);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 size={14} />
                            Deactivate
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {(showAddModal || showEditModal) && (
        <UserModal
          title={showAddModal ? "Add User" : "Edit User"}
          formData={formData}
          errors={errors}
          roleDefaults={ROLE_DEFAULTS}
          allPermissions={ALL_PERMISSIONS}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          changePassword={changePassword}
          setChangePassword={setChangePassword}
          onFormChange={setFormData}
          isEdit={showEditModal}
          isLoading={isLoading}
          onCancel={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedUser(null);
            resetForm();
          }}
          onSave={showAddModal ? handleAdd : handleEdit}
        />
      )}

      {showDeleteConfirm && selectedUser && (
        <ConfirmDelete
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedUser(null);
          }}
          onConfirm={handleDelete}
          loading={isLoading}
          user={selectedUser}
        />
      )}

      {toast && (
        <div
          className={`fixed top-3 sm:top-4 right-2 left-2 sm:left-auto sm:right-4 px-4 sm:px-6 py-2.5 sm:py-3 text-white rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-in max-w-xs sm:max-w-sm mx-auto sm:mx-0 text-xs sm:text-sm ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <Check size={16} className="sm:w-5 sm:h-5" />
          ) : (
            <AlertCircle size={16} className="sm:w-5 sm:h-5" />
          )}
          <span className="truncate">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-1 hover:opacity-80"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
};

/* --------------------------------------------- */

const Stat = ({ label, count, color }: any) => {
  const colorClasses: Record<
    string,
    { bg: string; border: string }
  > = {
    blue: { bg: "bg-blue-50", border: "border-blue-500" },
    purple: { bg: "bg-purple-50", border: "border-purple-500" },
    green: { bg: "bg-green-50", border: "border-green-500" },
  };
  const cls = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`p-3 sm:p-4 ${cls.bg} border-l-4 ${cls.border} rounded-lg`}
    >
      <p className="text-xs sm:text-sm text-gray-600 font-medium">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
        {count}
      </p>
    </div>
  );
};

/* ---------- Modal with permission checkboxes ---------- */
const UserModal = ({
  title,
  formData,
  errors,
  allPermissions,
  roleDefaults,
  showPassword,
  setShowPassword,
  changePassword,
  setChangePassword,
  onFormChange,
  onCancel,
  onSave,
  isEdit,
  isLoading,
}: any) => {
  function togglePermission(permission: string) {
    const has = formData.permissions.includes(permission);
    const next = has
      ? formData.permissions.filter((p: string) => p !== permission)
      : [...formData.permissions, permission];
    onFormChange({ ...formData, permissions: next });
  }

  function handleRoleChange(value: "admin" | "user") {
    onFormChange({
      ...formData,
      role: value,
      permissions: [...roleDefaults[value]],
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-start p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl my-6 sm:my-8 shadow-2xl">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center rounded-t-xl">
          <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
          <button
            onClick={onCancel}
            className="hover:bg-white/20 p-1 rounded transition-colors"
            disabled={isLoading}
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Basic fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Username"
              value={formData.username}
              onChange={(v: any) =>
                onFormChange({ ...formData, username: v })
              }
              error={errors.username}
              disabled={isLoading}
            />
            <Field
              label="Full Name"
              value={formData.fullName}
              onChange={(v: any) =>
                onFormChange({ ...formData, fullName: v })
              }
              error={errors.fullName}
              disabled={isLoading}
            />
            <Field
              label="Email"
              type="email"
              value={formData.email}
              onChange={(v: any) => onFormChange({ ...formData, email: v })}
              error={errors.email}
              disabled={isLoading}
            />
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Role
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.role}
                onChange={(e) =>
                  handleRoleChange(e.target.value as "admin" | "user")
                }
                disabled={isLoading}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Password Section */}
          {isEdit ? (
            <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                <input
                  type="checkbox"
                  id="changePassword"
                  checked={changePassword}
                  onChange={(e) => {
                    setChangePassword(e.target.checked);
                    if (!e.target.checked) {
                      onFormChange({ ...formData, password: "" });
                    }
                  }}
                  className="w-4 h-4 text-green-600 accent-green-600"
                  disabled={isLoading}
                />
                <label
                  htmlFor="changePassword"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer"
                >
                  <Key size={16} />
                  Change Password
                </label>
              </div>

              {changePassword && (
                <div className="mt-2 sm:mt-3">
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        onFormChange({
                          ...formData,
                          password: e.target.value,
                        })
                      }
                      className={`w-full border rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.password ? "border-red-400" : "border-gray-300"
                      }`}
                      placeholder="Enter new password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.password}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 6 characters
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    onFormChange({ ...formData, password: e.target.value })
                  }
                  className={`w-full border rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.password ? "border-red-400" : "border-gray-300"
                  }`}
                  placeholder="Enter password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters
              </p>
            </div>
          )}

          {/* Permission checkboxes */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Shield size={16} />
              Permissions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-lg p-3 sm:p-4 bg-gray-50 max-h-60 overflow-y-auto">
              {allPermissions.map((perm: string) => (
                <label
                  key={perm}
                  className="flex items-center gap-2 text-xs sm:text-sm hover:bg-white p-2 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 accent-green-600"
                    checked={formData.permissions.includes(perm)}
                    onChange={() => togglePermission(perm)}
                    disabled={isLoading}
                  />
                  <span className="text-gray-700">{perm}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-end gap-2 sm:gap-3 bg-gray-50 rounded-b-xl border-t">
          <button
            onClick={onCancel}
            className="bg-gray-200 px-4 sm:px-5 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isLoading}
            className="bg-green-600 text-white px-5 sm:px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium text-sm sm:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <Save size={16} />
            {isLoading ? "Processing..." : isEdit ? "Update User" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* small helper components ---------------------------------- */
const Field = ({
  label,
  value,
  onChange,
  error,
  type = "text",
  disabled = false,
}: any) => (
  <div>
    <label className="block text-sm font-medium mb-1 text-gray-700">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
        error ? "border-red-400" : "border-gray-300"
      }`}
      disabled={disabled}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const ConfirmDelete = ({ user, onCancel, onConfirm, loading }: any) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-3 sm:p-4 z-50">
    <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-red-100 rounded-full">
          <AlertCircle className="text-red-600" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Confirm Deactivation
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            This action can be reversed later
          </p>
        </div>
      </div>
      <p className="mb-6 text-sm sm:text-base text-gray-700">
        Are you sure you want to deactivate{" "}
        <span className="font-semibold text-gray-900">{user.fullName}</span>{" "}
        (<span className="text-gray-600">{user.username}</span>)?
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-200 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? "Processing..." : "Deactivate"}
        </button>
      </div>
    </div>
  </div>
);

export default UserManagement;