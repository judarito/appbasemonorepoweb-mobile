import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { AlertTriangle } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isSuperAdmin = user.roles.includes("SUPER_ADMIN");
  if (!isSuperAdmin) {
    return (
      <div className="hero">
        <AlertTriangle size={48} color="#ef4444" />
        <h1 className="hero-title" style={{ color: "#ef4444" }}>Acceso Denegado</h1>
        <p className="hero-description">No tienes los privilegios de SUPER_ADMIN para ver esta consola.</p>
        <Link to="/" className="btn btn-secondary">Regresar al Inicio</Link>
      </div>
    );
  }

  return <>{children}</>;
}
