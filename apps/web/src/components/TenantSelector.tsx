import React from "react";
import { X } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export function TenantSelector() {
  const { impersonatedTenantId, stopImpersonation } = useAuthStore();

  if (!impersonatedTenantId) return null;

  return (
    <div className="tenant-selector" title="Modo soporte activo. Haz clic para finalizar.">
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span className="tenant-selector-label">Tenant activo</span>
        <span className="tenant-selector-value">
          {impersonatedTenantId.slice(0, 8)}…
        </span>
      </div>
      <button
        onClick={stopImpersonation}
        className="btn btn-secondary btn-sm"
        style={{ flexShrink: 0, fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
        title="Finalizar modo soporte"
      >
        <X size={12} />
      </button>
    </div>
  );
}
