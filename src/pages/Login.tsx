import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Shield,
  Mail,
  AlertCircle,
  X,
} from "lucide-react";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, currentUser } = useAuth();

  // Navigate to dashboard when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser && !isLoading) {
      console.log("✅ User authenticated, navigating to dashboard");
      const timeoutId = setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, currentUser, navigate, isLoading]);

  // Auto-hide error popup after 5 seconds
  useEffect(() => {
    if (showErrorPopup) {
      const timer = setTimeout(() => {
        setShowErrorPopup(false);
        setError("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showErrorPopup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setError("");
    setShowErrorPopup(false);
    setIsLoading(true);

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username/email and password");
      setShowErrorPopup(true);
      setIsLoading(false);
      return;
    }

    console.log("🔐 Attempting login with:", {
      usernameOrEmail: username,
      passwordLength: password.length,
      rememberMe,
    });

    try {
      const success = await login(username.trim(), password, rememberMe);

      if (success) {
        console.log("✅ Login successful, redirecting...");
        // Navigation will happen automatically via useEffect
      }
    } catch (err: any) {
      console.error("❌ Login failed:", err);

      // Extract error message
      const errorMessage =
        err?.message ||
        err?.toString() ||
        "An error occurred during login. Please try again.";

      setError(errorMessage);
      setShowErrorPopup(true);
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  const closeErrorPopup = () => {
    setShowErrorPopup(false);
    setError("");
  };

  // Detect if input is email
  const isEmail = username.includes("@");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      {/* Error Popup Modal */}
      {showErrorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideDown">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Login Failed
                </h3>
              </div>
              <button
                onClick={closeErrorPopup}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Error Message */}
            <div className="mb-6">
              <p className="text-gray-700 text-base leading-relaxed">{error}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeErrorPopup}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
              >
                Try Again
              </button>
            </div>

            {/* Progress bar for auto-close */}
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div
                className="bg-red-600 h-full animate-shrink"
                style={{ animationDuration: "5s" }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl shadow-lg mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to Enquiry Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username/Email Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isEmail ? (
                    <Mail size={20} className="text-gray-400" />
                  ) : (
                    <User size={20} className="text-gray-400" />
                  )}
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  placeholder="Enter username or email"
                  required
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
              {username && (
                <p className="mt-1 text-xs text-gray-500">
                  {isEmail
                    ? "📧 Logging in with email"
                    : "👤 Logging in with username"}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex={-1}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff
                      size={20}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    />
                  ) : (
                    <Eye
                      size={20}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  Remember me
                </span>
                <div className="relative group/tooltip">
                  <svg
                    className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {/* Tooltip */}
                  <div className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
                    Stay logged in until you logout
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </label>
              {rememberMe && (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Stay logged in
                </span>
              )}
            </div>

            {/* Info about Remember Me */}
            {rememberMe ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                <p className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  You'll stay logged in even after closing the browser
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <p className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  You'll be logged out when you close the browser
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              © 2025 Enquiry Management System
            </p>
            <p className="text-xs text-gray-500 mt-1">
              © By Kali-Byte Solutions
            </p>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-shrink {
          animation: shrink 5s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default Login;
