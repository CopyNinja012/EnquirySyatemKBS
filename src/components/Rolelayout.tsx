import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface RoleBasedRouteProps {
  /** Children to render if access is granted */
  children: React.ReactNode;
  /** Which roles may enter this route */
  allowedRoles: ("admin" | "user")[];
  /** Optional specific permission name */
  permission?: string;
  /** Where to redirect if access is denied */
  redirectTo?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  permission,
  redirectTo = "/unauthorized",
}) => {
  const { currentUser, isLoading, hasPermission } = useAuth();

  // 1️⃣ Loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-height-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-sky-600 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 2️⃣ Not logged in
  if (!currentUser) {
    console.log("❌ RoleBasedRoute: no current user, redirecting");
    return <Navigate to="/login" replace />;
  }

  // 3️⃣ Role not allowed
  if (!allowedRoles.includes(currentUser.role)) {
    console.log("❌ RoleBasedRoute: role not allowed:", currentUser.role);
    return <Navigate to={redirectTo} replace />;
  }

  // 4️⃣ Permission check (if provided)
  if (permission && !hasPermission(permission)) {
    console.log(`❌ RoleBasedRoute: missing permission "${permission}"`);
    return <Navigate to={redirectTo} replace />;
  }

  // 5️⃣ Access granted
  console.log("✅ RoleBasedRoute: access granted", {
    user: currentUser.username,
    role: currentUser.role,
    permission,
  });
  return <>{children}</>;
};

export default RoleBasedRoute;