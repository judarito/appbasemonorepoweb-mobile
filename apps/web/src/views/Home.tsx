import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sun, Moon, Layers, ShieldCheck, Settings, HelpCircle, CheckCircle,
  AlertTriangle, LogOut, Activity,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function Home() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [healthData, setHealthData] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Branding dinámico
  useEffect(() => {
    const applyBranding = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/v1/settings/public");
        if (!res.ok) return;
        const json = await res.json();
        const settingsList: any[] = json?.data?.settings || [];
        const primaryColor = settingsList.find((s: any) => s.key === "branding.primary_color")?.value;
        const appName = settingsList.find((s: any) => s.key === "general.app_name")?.value;
        if (primaryColor) {
          document.documentElement.style.setProperty("--color-primary-raw", primaryColor);
        }
        if (appName) {
          document.title = `${appName} — BaseForge SaaS`;
        }
      } catch {
        // silencioso
      }
    };
    applyBranding();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const testApiHealth = async () => {
    setChecking(true);
    setHealthData(null);
    try {
      const response = await fetch("http://localhost:3000/health");
      const data = await response.json();
      setHealthData(data);
    } catch (error: any) {
      setHealthData({
        success: false,
        error: {
          code: "CONNECTION_FAILED",
          message: "No se pudo conectar con la API en http://localhost:3000. ¿Está el servidor encendido?",
        }
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="app-container">
      <div className="glow-bg"></div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">BF</div>
          <span>BaseForge SaaS</span>
        </div>
        <div className="nav-links">
          {token && user ? (
            <>
              {user.roles.includes("SUPER_ADMIN") ? (
                <Link to="/superadmin/dashboard" className="nav-link">Consola Superadmin</Link>
              ) : (
                <Link to="/app/dashboard" className="nav-link">Ir a mi espacio</Link>
              )}
              <button onClick={() => { logout(); navigate("/"); }} className="btn btn-secondary btn-sm">
                <LogOut size={14} /> Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Consola Superadmin</Link>
              <a href="#features" className="nav-link">Características</a>
              <a href="#api-test" className="nav-link">Prueba API</a>
            </>
          )}
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* Banner para no-superadmins */}
      {token && user && !user.roles.includes("SUPER_ADMIN") && (
        <div className="impersonation-banner" style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" }}>
          <div className="banner-content">
            <AlertTriangle size={18} />
            <span>
              <strong>Sesión activa:</strong> {user.email} — Roles: {user.roles.join(", ")}.
              La consola Superadmin solo está disponible para usuarios con rol <strong>SUPER_ADMIN</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Hero */}
      <header className="hero animate-fade-in">
        <div className="badge">
          <Layers size={14} />
          <span>Monorepo Base Inicializado v0.0.1</span>
        </div>
        <h1 className="hero-title">La Fundación para tu próximo SaaS Multitenant</h1>
        <p className="hero-description">
          BaseForge provee la arquitectura y estructura técnica lista para usar:
          Base de Datos PostgreSQL, API modular con Bun/Hono, Frontend React, y App Móvil con Expo.
        </p>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link to="/login" className="btn btn-primary">
            Consola Superadmin
          </Link>
          <a href="#api-test" className="btn btn-secondary">
            Probar Conexión API
          </a>
        </div>
      </header>

      {/* Showcase Cards Grid */}
      <section id="features" className="grid">
        <div className="card">
          <div className="card-icon"><Layers size={20} /></div>
          <h3 className="card-title">Arquitectura Multitenant</h3>
          <p className="card-desc">
            Aislamiento de datos con PostgreSQL. Columna `tenant_id` y contexto
            de inquilino seguro a nivel transaccional (RLS listo en la BD).
          </p>
        </div>
        <div className="card">
          <div className="card-icon"><ShieldCheck size={20} /></div>
          <h3 className="card-title">Seguridad & RBAC</h3>
          <p className="card-desc">
            Esquema completo para usuarios, roles y permisos. Autorización
            en la API mediante tokens de acceso firmados y refresh tokens rotativos.
          </p>
        </div>
        <div className="card">
          <div className="card-icon"><Settings size={20} /></div>
          <h3 className="card-title">Límites & Features</h3>
          <p className="card-desc">
            Administración centralizada de planes de precios, catálogo global de características
            y asignación dinámica con overrides específicos por inquilino.
          </p>
        </div>
      </section>

      {/* Live API Connection Test */}
      <section id="api-test" className="hero" style={{ padding: "4rem 2rem 2rem 2rem" }}>
        <h2 className="hero-title" style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          Prueba de Conexión de API
        </h2>
        <p className="hero-description" style={{ fontSize: "1rem", marginBottom: "1.5rem" }}>
          Esta sección realiza una consulta real a tu API Hono local en <code style={{ background: "hsl(var(--secondary))", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>http://localhost:3000/health</code> para validar el CORS y la comunicación.
        </p>
        <button onClick={testApiHealth} disabled={checking} className="btn btn-primary" style={{ width: "200px" }}>
          {checking ? "Consultando..." : "Verificar API"}
        </button>
        {healthData && (
          <div style={{
            marginTop: "2rem", width: "100%", maxWidth: "500px", textAlign: "left",
            background: "rgba(15, 23, 42, 0.6)", border: "1px solid hsl(var(--border))",
            borderRadius: "8px", padding: "1.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              {healthData.success ? (
                <><CheckCircle color="#10b981" size={20} /><span style={{ color: "#10b981", fontWeight: 600 }}>API Conectada</span></>
              ) : (
                <><HelpCircle color="#ef4444" size={20} /><span style={{ color: "#ef4444", fontWeight: 600 }}>Error de Conexión</span></>
              )}
            </div>
            <pre style={{ fontFamily: "monospace", fontSize: "0.85rem", overflowX: "auto", color: healthData.success ? "#a78bfa" : "#ef4444" }}>
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>
        )}
      </section>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} BaseForge SaaS. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
