import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  AlertCircle,
  X,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

const LOGO_SRC = "/favicon1.png"; // change to "/favicon1.svg" or "/kali_byte_logo.png" if needed

// Mock API functions - Replace these with your actual API calls
const sendPasswordResetOTP = async (email: string): Promise<boolean> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Sending OTP to ${email}`);
      resolve(true);
    }, 1500);
  });
};

const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
  // Simulate API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Mock verification - accept "123456" as valid OTP
      if (otp === "123456") {
        resolve(true);
      } else {
        reject(new Error("Invalid OTP. Please try again."));
      }
    }, 1000);
  });
};

const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<boolean> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Resetting password for ${email}`);
      resolve(true);
    }, 1500);
  });
};

type ForgotPasswordStep = "email" | "otp" | "newPassword" | "success";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] =
    useState<ForgotPasswordStep>("email");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const navigate = useNavigate();
  const { login, isAuthenticated, currentUser } = useAuth();

  // Navigate to dashboard when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser && !isLoading) {
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

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => {
        setOtpTimer(otpTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setError("");
    setShowErrorPopup(false);
    setIsLoading(true);

    // Validate email format
    if (!email.trim()) {
      setError("Please enter your email address");
      setShowErrorPopup(true);
      setIsLoading(false);
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      setShowErrorPopup(true);
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      setShowErrorPopup(true);
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(email.trim(), password, rememberMe);
      if (success) {
        // Navigation will happen via useEffect
      }
    } catch (err: any) {
      const errorMessage =
        err?.message ||
        err?.toString() ||
        "An error occurred during login. Please try again.";
      setError(errorMessage);
      setShowErrorPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const closeErrorPopup = () => {
    setShowErrorPopup(false);
    setError("");
  };

  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotPasswordStep("email");
    setResetEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotPasswordError("");
    setOtpTimer(0);
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep("email");
    setResetEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotPasswordError("");
    setOtpTimer(0);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError("");

    if (!resetEmail.trim()) {
      setForgotPasswordError("Please enter your email address");
      return;
    }

    if (!resetEmail.includes("@") || !resetEmail.includes(".")) {
      setForgotPasswordError("Please enter a valid email address");
      return;
    }

    setForgotPasswordLoading(true);

    try {
      await sendPasswordResetOTP(resetEmail);
      setForgotPasswordStep("otp");
      setOtpTimer(60); // 60 seconds countdown
      setForgotPasswordError("");
    } catch (err: any) {
      setForgotPasswordError(
        err?.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0) return;

    setForgotPasswordError("");
    setForgotPasswordLoading(true);

    try {
      await sendPasswordResetOTP(resetEmail);
      setOtpTimer(60);
      setOtp("");
      setForgotPasswordError("");
    } catch (err: any) {
      setForgotPasswordError(
        err?.message || "Failed to resend OTP. Please try again."
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError("");

    if (!otp.trim()) {
      setForgotPasswordError("Please enter the OTP");
      return;
    }

    if (otp.length !== 6) {
      setForgotPasswordError("OTP must be 6 digits");
      return;
    }

    setForgotPasswordLoading(true);

    try {
      await verifyOTP(resetEmail, otp);
      setForgotPasswordStep("newPassword");
      setForgotPasswordError("");
    } catch (err: any) {
      setForgotPasswordError(
        err?.message || "Invalid OTP. Please try again."
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError("");

    if (!newPassword.trim()) {
      setForgotPasswordError("Please enter a new password");
      return;
    }

    if (newPassword.length < 8) {
      setForgotPasswordError("Password must be at least 8 characters long");
      return;
    }

    if (!confirmPassword.trim()) {
      setForgotPasswordError("Please confirm your password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotPasswordError("Passwords do not match");
      return;
    }

    setForgotPasswordLoading(true);

    try {
      await resetPassword(resetEmail, otp, newPassword);
      setForgotPasswordStep("success");
      setForgotPasswordError("");
    } catch (err: any) {
      setForgotPasswordError(
        err?.message || "Failed to reset password. Please try again."
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleBackToLogin = () => {
    closeForgotPassword();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4 py-6 sm:px-6 lg:px-8 flex items-center">
      {/* Error Popup Modal */}
      {showErrorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black bg-opacity-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md p-5 sm:p-6 animate-slideDown">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
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
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                {error}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeErrorPopup}
                className="flex-1 bg-red-600 text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black bg-opacity-50 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md p-5 sm:p-6 animate-slideDown my-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {forgotPasswordStep === "email" && "Forgot Password"}
                  {forgotPasswordStep === "otp" && "Verify OTP"}
                  {forgotPasswordStep === "newPassword" && "Reset Password"}
                  {forgotPasswordStep === "success" && "Success!"}
                </h3>
              </div>
              <button
                onClick={closeForgotPassword}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Email Step */}
            {forgotPasswordStep === "email" && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Enter your email address and we'll send you a one-time
                  password (OTP) to reset your password.
                </p>

                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={20} className="text-gray-400" />
                    </div>
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm sm:text-base"
                      placeholder="Enter your email address"
                      disabled={forgotPasswordLoading}
                    />
                  </div>
                </div>

                {forgotPasswordError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                    <p className="flex items-center gap-2">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      {forgotPasswordError}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    className="flex-1 bg-gray-200 text-gray-700 py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all"
                    disabled={forgotPasswordLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-sky-600 text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? (
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
                        Sending...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* OTP Verification Step */}
            {forgotPasswordStep === "otp" && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm text-sky-800 mb-4">
                  <p className="flex items-start gap-2">
                    <Mail size={16} className="flex-shrink-0 mt-0.5" />
                    <span>
                      We've sent a 6-digit OTP to{" "}
                      <strong>{resetEmail}</strong>
                    </span>
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      if (value.length <= 6) {
                        setOtp(value);
                      }
                    }}
                    className="block w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm sm:text-base text-center tracking-widest font-mono text-2xl"
                    placeholder="000000"
                    maxLength={6}
                    disabled={forgotPasswordLoading}
                  />
                </div>

                {forgotPasswordError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                    <p className="flex items-center gap-2">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      {forgotPasswordError}
                    </p>
                  </div>
                )}

                <div className="text-center">
                  {otpTimer > 0 ? (
                    <p className="text-sm text-gray-600">
                      Resend OTP in{" "}
                      <span className="font-semibold text-sky-600">
                        {otpTimer}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      className="text-sm text-sky-600 hover:text-sky-700 font-semibold"
                      disabled={forgotPasswordLoading}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordStep("email")}
                    className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all"
                    disabled={forgotPasswordLoading}
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-sky-600 text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={forgotPasswordLoading || otp.length !== 6}
                  >
                    {forgotPasswordLoading ? (
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
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mt-4">
                  <p className="flex items-start gap-2">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                      For demo purposes, use OTP: <strong>123456</strong>
                    </span>
                  </p>
                </div>
              </form>
            )}

            {/* New Password Step */}
            {forgotPasswordStep === "newPassword" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Enter your new password below.
                </p>

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={20} className="text-gray-400" />
                    </div>
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm sm:text-base"
                      placeholder="Enter new password"
                      disabled={forgotPasswordLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
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

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={20} className="text-gray-400" />
                    </div>
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm sm:text-base"
                      placeholder="Confirm new password"
                      disabled={forgotPasswordLoading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
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

                {forgotPasswordError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                    <p className="flex items-center gap-2">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      {forgotPasswordError}
                    </p>
                  </div>
                )}

                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-800">
                  <p className="font-medium mb-1">Password requirements:</p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>At least 8 characters long</li>
                    <li>Both passwords must match</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordStep("otp")}
                    className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all"
                    disabled={forgotPasswordLoading}
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-sky-600 text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? (
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
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Success Step */}
            {forgotPasswordStep === "success" && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Password Reset Successful!
                  </h4>
                  <p className="text-sm text-gray-600">
                    Your password has been reset successfully. You can now log
                    in with your new password.
                  </p>
                </div>

                <button
                  onClick={handleBackToLogin}
                  className="w-full bg-sky-600 text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main responsive container */}
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 lg:gap-12">
        {/* LEFT PANEL (desktop/tablet only) */}
        <div className="hidden md:flex flex-1 flex-col space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-sky-100 rounded-2xl shadow-md ring-1 ring-sky-200">
            <img
              src={LOGO_SRC}
              alt="Company logo"
              className="h-16 w-16 object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-base lg:text-lg">
              Sign in to Enquiry Management System
            </p>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Secure, role-based access
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Manage and track enquiries in one place
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Optimized for desktop and mobile
            </li>
          </ul>
        </div>

        {/* RIGHT PANEL (form) */}
        <div className="flex-1 w-full max-w-md mx-auto md:max-w-lg">
          {/* Mobile / small-screen header */}
          <div className="md:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-100 rounded-2xl shadow-md ring-1 ring-sky-200 mb-4">
              <img
                src={LOGO_SRC}
                alt="Company logo"
                className="h-16 w-16 object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Sign in to Enquiry Management System
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={20} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm sm:text-base"
                    placeholder="Enter your email address"
                    required
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
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
                    className="block w-full pl-10 pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm sm:text-base"
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

              {/* Forgot Password and Remember Me Row */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="text-xs sm:text-sm text-sky-600 hover:text-sky-700 font-semibold transition-colors order-1"
                >
                  Forgot Password?
                </button>

                <label className="flex items-center gap-2 cursor-pointer group order-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    disabled={isLoading}
                  />
                  <span className="text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
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
                  {rememberMe && (
                    <span className="text-xs text-sky-600 font-medium whitespace-nowrap ml-1">
                      ✓ Stay logged in
                    </span>
                  )}
                </label>
              </div>

              {/* Info about Remember Me */}
              {rememberMe ? (
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-2.5 sm:p-3 text-xs text-sky-800">
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
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 sm:p-3 text-xs text-amber-800">
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
                className="w-full bg-sky-600 text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
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
              <p className="text-xs sm:text-sm text-gray-600">
                © 2025 Enquiry Management System
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                © By Kali-Byte Solutions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shrink {
          from { width: 100%; } to { width: 0%; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-shrink { animation: shrink 5s linear forwards; }
      `}</style>
    </div>
  );
};

export default Login;