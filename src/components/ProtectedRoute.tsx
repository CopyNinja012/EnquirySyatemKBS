import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, currentUser } = useAuth();

  console.log("ProtectedRoute - isLoading:", isLoading);
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
  console.log("ProtectedRoute - currentUser:", currentUser);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !currentUser) {
    console.log("❌ Not authenticated, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ Authenticated, rendering protected content");
  return <Outlet />;
};

export default ProtectedRoute;
