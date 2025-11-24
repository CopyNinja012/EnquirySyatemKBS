import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserShield,
  FaEnvelope,
  FaCalendar,
  FaShieldAlt,
  FaLock,
} from "react-icons/fa";
import { useAuth, authUtils } from "../contexts/AuthContext";

const BRANDING = {
  companyName: "Kali Byte Solutions",
  logo: "/favicon1.png",
};

const AdminProfile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  const getUserInitials = () => {
    const name = currentUser?.fullName || "User";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ---------- Change password state ----------
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [changing, setChanging] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentPassword || !newPassword || !confirmNew) {
      setPwdError("Please fill all fields.");
      return;
    }
    if (newPassword !== confirmNew) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters.");
      return;
    }

    try {
      setChanging(true);
      await authUtils.changeOwnPassword(currentPassword, newPassword);
      setPwdSuccess(
        "Password updated successfully. Use the new password next time you log in."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNew("");
    } catch (err: any) {
      if (err.code === "auth/wrong-password") {
        setPwdError("Current password is incorrect.");
      } else if (err.code === "auth/requires-recent-login") {
        setPwdError("Please log out and log back in, then try again.");
      } else {
        setPwdError(err?.message || "Failed to change password.");
      }
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Page Header */}
        <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
          <FaUserShield className="text-purple-600 text-xl sm:text-2xl flex-shrink-0" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            Admin Profile
          </h1>
          <span className="text-[10px] sm:text-xs px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
            Administrator
          </span>
        </div>

        {/* Profile Card */}
        <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg flex-shrink-0">
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 truncate">
                {currentUser?.fullName || "Admin User"}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 truncate">
                @{currentUser?.username || "username"}
              </p>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Email */}
            <div className="flex items-start gap-3 p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none">
              <div className="p-2 bg-sky-50 rounded-lg flex-shrink-0">
                <FaEnvelope className="text-sky-600 text-sm sm:text-base" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">
                  Email Address
                </p>
                <p className="text-sm sm:text-base text-gray-800 font-medium truncate">
                  {currentUser?.email || "N/A"}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3 p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none">
              <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                <FaShieldAlt className="text-purple-600 text-sm sm:text-base" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">
                  Role
                </p>
                <p className="text-sm sm:text-base text-gray-800 font-medium capitalize">
                  {currentUser?.role || "N/A"}
                </p>
              </div>
            </div>

            {/* Account Created */}
            <div className="flex items-start gap-3 p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none">
              <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                <FaCalendar className="text-green-600 text-sm sm:text-base" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">
                  Account Created
                </p>
                <p className="text-sm sm:text-base text-gray-800 font-medium">
                  {formatDate(currentUser?.createdAt)}
                </p>
              </div>
            </div>

            {/* Account Status */}
            <div className="flex items-start gap-3 p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none">
              <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">
                  Status
                </p>
                <p className="text-sm sm:text-base text-green-600 font-medium">
                  Active
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Card */}
        {currentUser?.permissions && currentUser.permissions.length > 0 && (
          <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <FaShieldAlt className="text-purple-600 text-sm sm:text-base flex-shrink-0" />
              <span>Permissions</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentUser.permissions.map((permission, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-sky-50 border border-sky-200 rounded-lg"
                >
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">
                    {permission}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Password Card */}
        <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <FaLock className="text-sky-600 text-sm sm:text-base flex-shrink-0" />
            <span>Change Password</span>
          </h3>

          <form
            onSubmit={handleChangePassword}
            className="space-y-3 sm:space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Current password
              </label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  New password
                </label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Confirm new password
                </label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={confirmNew}
                  onChange={(e) => setConfirmNew(e.target.value)}
                />
              </div>
            </div>

            {pwdError && (
              <p className="text-sm text-red-600 mt-1">{pwdError}</p>
            )}
            {pwdSuccess && (
              <p className="text-sm text-green-600 mt-1">{pwdSuccess}</p>
            )}

            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters long.
            </p>

            <button
              type="submit"
              disabled={changing}
              className="mt-3 inline-flex items-center px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
            >
              {changing ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Organization Card */}
        <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
            Organization
          </h3>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <img
              src={BRANDING.logo}
              alt={`${BRANDING.companyName} logo`}
              className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain rounded-lg border border-gray-200 p-2 flex-shrink-0"
            />
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">
                Company Name
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-800">
                {BRANDING.companyName}
              </p>
            </div>
          </div>
        </div>

        {/* Info Box - Mobile Only */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg sm:hidden">
          <div className="flex gap-2">
            <svg
              className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-blue-700 leading-relaxed">
              Swipe horizontally to view all profile details if content appears
              cut off.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;