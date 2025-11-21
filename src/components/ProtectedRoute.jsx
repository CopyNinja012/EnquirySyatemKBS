import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type ProtectedRouteProps = {
  /** Require admin role */
  adminOnly?: boolean;
  /** Specific permission required (must match Firestore field) */
  permission?: string;
  /** Elements rendered inside when using as a wrapper */
  children?: React.ReactNode;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  adminOnly = false,
  permission,
  children,
}) => {
  const { isAuthenticated, isLoading, currentUser, isAdmin, hasPermission } =
    useAuth();

  // 1️⃣ Show a loading spinner until Firebase/user data ready
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

  // 2️⃣ Check authentication
  if (!isAuthenticated || !currentUser) {
    console.warn("ProtectedRoute: not authenticated → redirecting /login");
    return <Navigate to="/login" replace />;
  }

  // 3️⃣ Admin‑only check
  const isAdminUser =
    typeof isAdmin === "function" ? isAdmin() : currentUser.role === "admin";

  if (adminOnly && !isAdminUser) {
    console.warn("ProtectedRoute: user not admin → redirecting /");
    return <Navigate to="/" replace />;
  }

  // 4️⃣ Permission check
  if (permission && !hasPermission(permission)) {
    console.warn(
      `ProtectedRoute: missing permission "${permission}" → redirect /unauthorized`
    );
    return <Navigate to="/unauthorized" replace />;
  }

  // 5️⃣ All clear → render children (wrapper usage) or outlet (nested routes)
  return <>{children ?? <Outlet />}</>;
};

export default ProtectedRoute;