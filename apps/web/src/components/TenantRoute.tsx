import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function TenantRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.roles.includes("SUPER_ADMIN")) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  return <>{children}</>;
}
