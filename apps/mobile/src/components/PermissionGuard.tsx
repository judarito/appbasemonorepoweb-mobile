import React from "react";
import { useAuth } from "../context/AuthContext";

interface PermissionGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PermissionGuard({
  allowedRoles,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { user } = useAuth();

  const hasPermission = user?.roles?.some((role) => allowedRoles.includes(role));

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
