import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TenantRoute } from "./components/TenantRoute";

// ─── Lazy-loaded route-level chunks ────────────────────────────────────────
// Cada chunk se descarga sólo cuando el usuario visita esa ruta por primera vez.
const HomeView = lazy(() => import("./views/Home"));
const LoginView = lazy(() => import("./views/LoginView"));
const ForgotPasswordView = lazy(() => import("./views/LoginView").then(m => ({ default: m.ForgotPasswordView })));
const ResetPasswordView = lazy(() => import("./views/LoginView").then(m => ({ default: m.ResetPasswordView })));
const SuperadminSection = lazy(() => import("./views/SuperadminSection"));
const TenantSection = lazy(() => import("./views/TenantSection"));

// ─── Suspense fallback ─────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="app-container">
      <div className="glow-bg"></div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div
            className="animate-spin"
            style={{
              width: 32, height: 32,
              border: "3px solid hsl(var(--border))",
              borderTopColor: "var(--color-primary, #2563eb)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>Cargando...</span>
        </div>
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/forgot-password" element={<ForgotPasswordView />} />
          <Route path="/reset-password" element={<ResetPasswordView />} />
          <Route
            path="/superadmin/*"
            element={
              <ProtectedRoute>
                <SuperadminSection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/*"
            element={
              <TenantRoute>
                <TenantSection />
              </TenantRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
