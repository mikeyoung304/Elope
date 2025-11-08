/**
 * ProtectedRoute - Role-based route protection
 * Ensures users can only access routes matching their role
 */

import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "../../contexts/AuthContext";
import { Loading } from "../../ui/Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return <Loading label="Checking authentication" />;
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is allowed
  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on actual role
    if (user.role === "PLATFORM_ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === "TENANT_ADMIN") {
      return <Navigate to="/tenant/dashboard" replace />;
    }
    // Fallback to login if role not recognized
    return <Navigate to="/login" replace />;
  }

  // Authorized - render children
  return <>{children}</>;
}
