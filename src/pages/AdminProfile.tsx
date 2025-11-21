import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserShield, FaEnvelope, FaCalendar, FaShieldAlt } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex items-center gap-2 mb-6">
        <FaUserShield className="text-purple-600 text-2xl" />
        <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>
        <span className="ml-2 text-xs px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
          Administrator
        </span>
      </div>

      {/* Profile Card */}
      <div className="bg-white border rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-6 mb-6 pb-6 border-b">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {currentUser?.fullName || "Admin User"}
            </h2>
            <p className="text-gray-600">
              @{currentUser?.username || "username"}
            </p>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-sky-50 rounded-lg">
              <FaEnvelope className="text-sky-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Email Address</p>
              <p className="text-gray-800 font-medium">
                {currentUser?.email || "N/A"}
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <FaShieldAlt className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Role</p>
              <p className="text-gray-800 font-medium capitalize">
                {currentUser?.role || "N/A"}
              </p>
            </div>
          </div>

          {/* Account Created */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <FaCalendar className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Account Created</p>
              <p className="text-gray-800 font-medium">
                {formatDate(currentUser?.createdAt)}
              </p>
            </div>
          </div>

          {/* Account Status */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Status</p>
              <p className="text-green-600 font-medium">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Card */}
      {currentUser?.permissions && currentUser.permissions.length > 0 && (
        <div className="bg-white border rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaShieldAlt className="text-purple-600" />
            Permissions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentUser.permissions.map((permission, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-sky-50 border border-sky-200 rounded-lg"
              >
                <svg
                  className="w-4 h-4 text-sky-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-gray-700 font-medium">
                  {permission}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Card */}
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Organization
        </h3>
        <div className="flex items-center gap-4">
          <img
            src={BRANDING.logo}
            alt={`${BRANDING.companyName} logo`}
            className="h-24 w-24 object-contain rounded-lg border border-gray-200 p-2"
          />
          <div>
            <p className="text-sm text-gray-500 font-medium">Company Name</p>
            <p className="text-xl font-bold text-gray-800">
              {BRANDING.companyName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;