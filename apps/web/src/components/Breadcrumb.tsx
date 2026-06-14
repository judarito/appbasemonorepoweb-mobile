import React from "react";
import { useLocation } from "react-router-dom";

const breadcrumbMap: Record<string, { label: string; parent?: string }> = {
  "dashboard": { label: "Dashboard", parent: undefined },
  "tenants": { label: "Inquilinos", parent: undefined },
  "plans": { label: "Planes", parent: undefined },
  "features": { label: "Características", parent: undefined },
  "settings": { label: "Configuración", parent: undefined },
  "audit": { label: "Auditoría", parent: undefined },
};

export function Breadcrumb() {
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);

  // Only show breadcrumb inside /superadmin/* or /app/*
  if (pathParts.length < 2) return null;

  const crumbs: { label: string; path: string }[] = [];
  let accumulatedPath = "";

  for (const part of pathParts) {
    accumulatedPath += `/${part}`;
    const mapping = breadcrumbMap[part];
    if (mapping) {
      crumbs.push({ label: mapping.label, path: accumulatedPath });
    }
  }

  if (crumbs.length === 0) return null;

  return (
    <nav className="breadcrumb">
      {crumbs.map((crumb, idx) => (
        <React.Fragment key={crumb.path}>
          {idx > 0 && <span className="breadcrumb-separator">/</span>}
          <a href={crumb.path} className="breadcrumb-link">{crumb.label}</a>
        </React.Fragment>
      ))}
    </nav>
  );
}
