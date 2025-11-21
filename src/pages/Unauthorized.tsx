import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-red-100">
          {/* Icon */}
          <div className="flex justify-center mb-5 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3 sm:mb-4">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-sm sm:text-base text-gray-600 text-center mb-5 sm:mb-6 px-1">
            Sorry, you don&apos;t have permission to access this page.
          </p>

          {/* User Info */}
          {currentUser && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-5 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-700">
                <span className="font-semibold">Logged in as:</span>{" "}
                {currentUser.fullName}
              </p>
              <p className="text-xs sm:text-sm text-gray-700 mt-1">
                <span className="font-semibold">Role:</span>{" "}
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] sm:text-xs font-medium ${
                    isAdmin()
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {currentUser.role.toUpperCase()}
                </span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <button
              onClick={handleGoHome}
              className="w-full bg-sky-600 text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} className="sm:w-5 sm:h-5" />
              Go to Dashboard
            </button>

            <button
              onClick={handleGoBack}
              className="w-full bg-gray-100 text-gray-700 py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;