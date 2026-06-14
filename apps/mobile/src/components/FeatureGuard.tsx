import React from "react";
import { useAuth } from "../context/AuthContext";

interface FeatureGuardProps {
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function FeatureGuard({
  featureName,
  children,
  fallback = null,
}: FeatureGuardProps) {
  const { user } = useAuth();

  // Simulación: comprobamos si el tenant tiene la feature habilitada en su perfil o addons
  // En producción esto leería de user?.tenant?.features o similar
  const hasFeature = user?.roles?.includes("SUPER_ADMIN") || true; 

  if (!hasFeature) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
