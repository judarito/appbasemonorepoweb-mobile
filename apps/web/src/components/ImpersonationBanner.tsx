import React from "react";
import { AlertTriangle } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export function ImpersonationBanner() {
  const { impersonatedToken, impersonatedTenantId, stopImpersonation } = useAuthStore();

  if (!impersonatedToken) return null;

  return (
    <div className="impersonation-banner">
      <div className="banner-content">
        <AlertTriangle size={18} className="banner-icon animate-pulse" />
        <span>
          <strong>MODO SOPORTE ACTIVO:</strong> Suplantando Tenant ID <code>{impersonatedTenantId}</code>. 
          Las mutaciones globales están restringidas en este modo.
        </span>
      </div>
      <button onClick={stopImpersonation} className="btn btn-secondary btn-sm">
        Finalizar Soporte
      </button>
    </div>
  );
}
