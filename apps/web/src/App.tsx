import React, { useState, useEffect, useRef } from "react";
import { AppListView, StatusBadge, ConfirmDialog } from "./components";
import type { ColumnDefinition, FilterDefinition } from "./components/AppListView.types";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { api } from "./lib/api";
import {
  Sun,
  Moon,
  Layers,
  ShieldCheck,
  Activity,
  Database,
  Smartphone,
  CheckCircle,
  HelpCircle,
  FileCode2,
  Users,
  Settings,
  History,
  Key,
  Plus,
  Trash2,
  Edit,
  Eye,
  LogOut,
  X,
  AlertTriangle,
  Check,
  Globe,
  Save,
  Menu,
  SlidersHorizontal,
  Lock,
  Palette,
  MapPin,
  Bell,
  Shield,
  ChevronRight,
  Home as HomeIcon,
  RefreshCw,
  User,
  ChevronDown,
  BellDot,
  Mail,
  Ban,
  SearchX,
  ServerCrash,
  AlertOctagon,
  Bug,
  RotateCw
} from "lucide-react";

// --- MIDDLEWARES Y COMPONENTES DE RUTA ---
function ProtectedRoute({ children }: { children: React.ReactNode }) {
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

function ImpersonationBanner() {
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

// --- VISTA DE LOGIN ---
function LoginView() {
  const { login, token, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const from = (location.state as any)?.from?.pathname || "/superadmin/dashboard";

  useEffect(() => {
    if (!token || !user) return;

    if (user.roles.includes("SUPER_ADMIN")) {
      navigate(from, { replace: true });
    } else {
      // Usuario autenticado pero no superadmin → redirigir al tenant dashboard
      navigate("/app/dashboard", { replace: true });
    }
  }, [token, user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.post<{ accessToken: string }>("/auth/login", { email, password });
      login(res.accessToken);
    } catch (err: any) {
      setErrorMsg(err.message || "Credenciales incorrectas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container login-page">
      <div className="glow-bg"></div>
      <div className="login-card animate-fade-in">
        <div className="brand" style={{ justifyContent: "center", marginBottom: "1.5rem" }}>
          <div className="brand-icon">BF</div>
          <span>BaseForge SaaS</span>
        </div>
        <h2 style={{ textAlign: "center", marginBottom: "2rem", fontWeight: 700 }}>Consola Superadmin</h2>

        {errorMsg && (
          <div className="alert alert-error">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-group">
          <label>Correo Electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="superadmin@baseforge.local"
            required
          />

          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
          />

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
            {loading ? "Iniciando Sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- BREADCRUMB DINÁMICO ---
const breadcrumbMap: Record<string, { label: string; parent?: string }> = {
  "dashboard": { label: "Dashboard", parent: undefined },
  "tenants": { label: "Inquilinos", parent: undefined },
  "plans": { label: "Planes", parent: undefined },
  "features": { label: "Características", parent: undefined },
  "settings": { label: "Configuración", parent: undefined },
  "audit": { label: "Auditoría", parent: undefined },
};

function Breadcrumb() {
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);

  // Only show breadcrumb inside /superadmin/*
  if (pathParts.length < 2 || pathParts[0] !== "superadmin") return null;

  const crumbs: { label: string; path: string }[] = [];
  let accumulatedPath = "";

  for (const part of pathParts) {
    accumulatedPath += `/${part}`;
    const mapping = breadcrumbMap[part];
    if (mapping) {
      crumbs.push({ label: mapping.label, path: accumulatedPath });
    } else {
      // Fallback: humanizar el segmento
      crumbs.push({
        label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
        path: accumulatedPath,
      });
    }
  }

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link to="/superadmin/dashboard" className="breadcrumb-item" title="Inicio">
        <HomeIcon size={14} />
      </Link>
      {crumbs.map((crumb, index) => (
        <span key={crumb.path} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span className="breadcrumb-separator">
            <ChevronRight size={12} />
          </span>
          {index === crumbs.length - 1 ? (
            <span className="breadcrumb-item active">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="breadcrumb-item">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

// --- CENTRO DE NOTIFICACIONES ---
interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success" | "error";
}

function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Nuevo tenant registrado",
      description: "El inquilino 'Acme Corp' se ha registrado exitosamente.",
      time: "hace 5 min",
      read: false,
      type: "success",
    },
    {
      id: "2",
      title: "Límite de usuarios alcanzado",
      description: "El tenant 'Demo' ha alcanzado el 90% de su límite de usuarios.",
      time: "hace 1 hora",
      read: false,
      type: "warning",
    },
    {
      id: "3",
      title: "Suscripción próxima a vencer",
      description: "La suscripción del tenant 'Test' expirará en 3 días.",
      time: "hace 2 horas",
      read: true,
      type: "warning",
    },
    {
      id: "4",
      title: "Modo soporte finalizado",
      description: "El modo soporte para el tenant 'Acme' ha expirado automáticamente.",
      time: "hace 1 día",
      read: true,
      type: "info",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Cerrar al hacer clic fuera
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="dropdown-container" ref={ref}>
      <button
        className="topbar-btn"
        onClick={() => setOpen(!open)}
        title="Notificaciones"
        aria-label="Abrir centro de notificaciones"
      >
        {unreadCount > 0 ? <BellDot size={18} /> : <Bell size={18} />}
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-panel animate-fade-in">
          <div className="notification-panel-header">
            <h4>Notificaciones</h4>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead}>Marcar todas como leídas</button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={32} />
                <span>No hay notificaciones</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.read ? "unread" : ""}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="notification-content">
                    <div className="notification-title">{n.title}</div>
                    <div className="notification-description">{n.description}</div>
                    <div className="notification-time">{n.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- MENÚ DE USUARIO ---
function UserMenu() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <div className="dropdown-container" ref={ref}>
      <button
        className="topbar-btn"
        onClick={() => setOpen(!open)}
        title="Menú de usuario"
        aria-label="Abrir menú de usuario"
        style={{ width: "auto", padding: "0 0.75rem", gap: "0.5rem" }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          {user?.email?.charAt(0).toUpperCase() || "U"}
        </div>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user?.email?.split("@")[0] || "Usuario"}
        </span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="dropdown-menu animate-fade-in">
          <div className="dropdown-header">
            <div className="user-name">{user?.email}</div>
            <div className="user-role">
              {user?.roles?.includes("SUPER_ADMIN") ? "Super Administrador" : user?.roles?.join(", ")}
            </div>
          </div>
          <div className="dropdown-items">
            <button className="dropdown-item" onClick={() => { setOpen(false); }}>
              <User size={16} />
              Mi Perfil
            </button>
            <button className="dropdown-item" onClick={() => { setOpen(false); navigate("/superadmin/settings"); }}>
              <Settings size={16} />
              Configuración
            </button>
            <div className="dropdown-divider" />
            <button className="dropdown-item text-danger" onClick={handleLogout}>
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SELECTOR DE TENANT (MODO SOPORTE) ---
function TenantSelector() {
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

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-icon">
            <AlertOctagon size={28} />
          </div>
          <h2 className="error-boundary-title">Algo salió mal</h2>
          <p className="error-boundary-description">
            Se produjo un error inesperado en esta sección. Por favor, intenta recargar la página.
          </p>
          {this.state.error && (
            <div className="error-boundary-details">
              <pre>{this.state.error.name}: {this.state.error.message}</pre>
            </div>
          )}
          <div className="error-actions">
            <button className="btn btn-primary" onClick={this.handleReset}>
              <RotateCw size={16} /> Reintentar
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => window.location.href = "/superadmin/dashboard"}
            >
              <HomeIcon size={16} /> Ir al Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- PÁGINAS DE ERROR ---
function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="error-page animate-fade-in">
      <div className="error-icon notfound">
        <SearchX size={40} />
      </div>
      <div className="error-code">404</div>
      <h2 className="error-title">Página no encontrada</h2>
      <p className="error-description">
        La página que buscas no existe o ha sido movida. Verifica la URL o regresa al inicio.
      </p>
      <div className="error-actions">
        <button className="btn btn-primary" onClick={() => navigate("/superadmin/dashboard")}>
          <HomeIcon size={16} /> Ir al Dashboard
        </button>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <RotateCw size={16} /> Regresar
        </button>
      </div>
    </div>
  );
}

function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className="error-page animate-fade-in">
      <div className="error-icon forbidden">
        <Ban size={40} />
      </div>
      <div className="error-code">403</div>
      <h2 className="error-title">Acceso denegado</h2>
      <p className="error-description">
        No tienes los permisos necesarios para acceder a esta sección.
        Contacta al administrador si crees que esto es un error.
      </p>
      <div className="error-actions">
        <button className="btn btn-primary" onClick={() => navigate("/superadmin/dashboard")}>
          <HomeIcon size={16} /> Ir al Dashboard
        </button>
      </div>
    </div>
  );
}

function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="error-page animate-fade-in">
      <div className="error-icon unauthorized">
        <Lock size={40} />
      </div>
      <div className="error-code">401</div>
      <h2 className="error-title">Sesión no autenticada</h2>
      <p className="error-description">
        Debes iniciar sesión para acceder a esta sección. Serás redirigido a la página de inicio de sesión.
      </p>
      <div className="error-actions">
        <button className="btn btn-primary" onClick={() => navigate("/login")}>
          <LogOut size={16} /> Iniciar Sesión
        </button>
      </div>
    </div>
  );
}

function ServerErrorPage() {
  const navigate = useNavigate();
  return (
    <div className="error-page animate-fade-in">
      <div className="error-icon server-error">
        <ServerCrash size={40} />
      </div>
      <div className="error-code">500</div>
      <h2 className="error-title">Error interno del servidor</h2>
      <p className="error-description">
        Ocurrió un error inesperado en el servidor. Por favor, intenta de nuevo más tarde.
        Si el problema persiste, contacta al equipo de soporte.
      </p>
      <div className="error-actions">
        <button className="btn btn-primary" onClick={() => navigate("/superadmin/dashboard")}>
          <HomeIcon size={16} /> Ir al Dashboard
        </button>
        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
          <RefreshCw size={16} /> Recargar Página
        </button>
      </div>
    </div>
  );
}

// --- LAYOUT DE SUPERADMIN ---
function SuperadminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const menuItems = [
    { path: "/superadmin/dashboard", label: "Dashboard", icon: <Activity size={18} /> },
    { path: "/superadmin/tenants", label: "Inquilinos", icon: <Users size={18} /> },
    { path: "/superadmin/plans", label: "Planes", icon: <Layers size={18} /> },
    { path: "/superadmin/features", label: "Características", icon: <Settings size={18} /> },
    { path: "/superadmin/menus", label: "Menús", icon: <Menu size={18} /> },
    { path: "/superadmin/settings", label: "Configuración", icon: <SlidersHorizontal size={18} /> },
    { path: "/superadmin/audit", label: "Auditoría", icon: <History size={18} /> },
  ];

  return (
    <div className="superadmin-layout-container">
      <ImpersonationBanner />
      <div className="superadmin-body">
        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-brand">
            <div className="brand-icon">BF</div>
            <span style={{ fontWeight: 800 }}>BaseForge</span>
          </div>
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} className={`sidebar-link ${active ? "active" : ""}`}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-footer">
            <div className="user-info">
              <span className="user-email">{user?.email}</span>
              <span className="user-badge">Super Admin</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", width: "100%", marginTop: "1rem" }}>
              <button onClick={toggleTheme} className="theme-toggle" style={{ width: "100%" }}>
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button onClick={logout} className="btn btn-secondary btn-icon-only" title="Cerrar Sesión">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          {/* Topbar */}
          <header className="topbar">
            <div className="topbar-left">
              <button onClick={() => setSidebarOpen(true)} className="sidebar-toggle" style={{ marginRight: "0.25rem" }} title="Abrir Menú">
                <Menu size={18} />
              </button>
              <Breadcrumb />
              <TenantSelector />
            </div>
            <div className="topbar-right">
              <NotificationCenter />
              <UserMenu />
            </div>
          </header>

          {/* Workspace */}
          <main className="workspace">
            <ErrorBoundary>
              <Routes>
                <Route path="dashboard" element={<DashboardView />} />
                <Route path="tenants" element={<TenantsView />} />
                <Route path="plans" element={<PlansView />} />
                <Route path="features" element={<FeaturesView />} />
                <Route path="menus" element={<SuperadminMenusView />} />
                <Route path="settings" element={<SettingsView />} />
                <Route path="audit" element={<AuditLogsView />} />
                <Route path="401" element={<UnauthorizedPage />} />
                <Route path="403" element={<ForbiddenPage />} />
                <Route path="404" element={<NotFoundPage />} />
                <Route path="500" element={<ServerErrorPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}

// --- VISTA 6: AUDITORÍA (con AppListView) ---
function AuditLogsView() {
  const fetcher = async (query: { page: number; pageSize: number; search?: string; action?: string; result?: string; dateFrom?: string; dateTo?: string }) => {
    const res = await api.get<{ items: any[]; totalItems: number }>("/superadmin/audit-logs", {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        ...(query.action && { action: query.action }),
        ...(query.result && { result: query.result }),
        ...(query.dateFrom && { dateFrom: query.dateFrom }),
        ...(query.dateTo && { dateTo: query.dateTo }),
      },
    });
    return { items: res.items, totalItems: res.totalItems };
  };

  const formatDate = (dateStr: string) =>
    dateStr ? new Date(dateStr).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "—";

  const columns: ColumnDefinition<any>[] = [
    {
      key: "createdAt",
      header: "Fecha",
      sortable: true,
      width: "160px",
      render: (log) => <span style={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>{formatDate(log.createdAt)}</span>,
    },
    {
      key: "action",
      header: "Acción",
      sortable: true,
      render: (log) => <code className="audit-action">{log.action}</code>,
    },
    {
      key: "result",
      header: "Resultado",
      sortable: true,
      width: "120px",
      render: (log) => <StatusBadge status={log.result} />,
    },
    {
      key: "actorEmail",
      header: "Actor",
      sortable: false,
      render: (log) => <span style={{ fontSize: "0.82rem" }}>{log.actorEmail || log.actorUserId?.slice(0, 8) || "—"}</span>,
    },
    {
      key: "entityType",
      header: "Entidad",
      sortable: true,
      render: (log) => (
        <span style={{ fontSize: "0.8rem" }}>
          <span>{log.entityType}</span>
          {log.entityId && <span className="text-muted"> · {log.entityId.slice(0, 8)}…</span>}
        </span>
      ),
    },
    {
      key: "ipAddress",
      header: "IP",
      sortable: false,
      width: "130px",
      render: (log) => <span style={{ fontSize: "0.78rem" }}>{log.ipAddress || "—"}</span>,
    },
  ];

  const filters: FilterDefinition[] = [
    { key: "action", label: "Acción", type: "text", placeholder: "Ej. AUTH_LOGIN" },
    {
      key: "result",
      label: "Resultado",
      type: "select",
      options: [
        { label: "SUCCESS", value: "SUCCESS" },
        { label: "FAILURE", value: "FAILURE" },
        { label: "DENIED", value: "DENIED" },
      ],
    },
    { key: "dateFrom", label: "Desde", type: "date" },
    { key: "dateTo", label: "Hasta", type: "date" },
  ];

  return (
    <div className="view-container">
      <AppListView
        title="Bitácora de Auditoría"
        fetcher={fetcher}
        columns={columns}
        filters={filters}
        defaultPageSize={20}
        allowedPageSizes={[10, 20, 50, 100]}
        searchPlaceholder="Filtrar por acción..."
        enableExport
        exportFileName="auditoria_baseforge"
      />
    </div>
  );
}

// --- VISTA 1: DASHBOARD ---
function DashboardView() {
  const [stats, setStats] = useState({ tenants: 0, plans: 0, features: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [tenantsRes, plansRes, featuresRes, logsRes] = await Promise.all([
          api.get<{ totalItems: number }>("/superadmin/tenants"),
          api.get<{ totalItems: number }>("/superadmin/plans"),
          api.get<{ totalItems: number }>("/superadmin/features"),
          api.get<{ items: any[] }>("/superadmin/audit-logs?pageSize=8"),
        ]);
        setStats({
          tenants: tenantsRes.totalItems,
          plans: plansRes.totalItems,
          features: featuresRes.totalItems,
        });
        setLogs(logsRes.items || []);
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-state">Cargando datos del sistema...</div>;
  }

  return (
    <div className="view-container">
      <header className="view-header">
        <h1>Consola de Control de Plataforma</h1>
        <p>Resumen operacional del tenant engine y logs globales.</p>
      </header>

      {/* Stats Cards */}
      <section className="stats-grid animate-fade-in">
        <div className="stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-details">
            <span className="stat-value">{stats.tenants}</span>
            <span className="stat-label">Inquilinos Registrados</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Layers size={24} /></div>
          <div className="stat-details">
            <span className="stat-value">{stats.plans}</span>
            <span className="stat-label">Planes de Suscripción</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Settings size={24} /></div>
          <div className="stat-details">
            <span className="stat-value">{stats.features}</span>
            <span className="stat-label">Características Activas</span>
          </div>
        </div>
      </section>

      {/* Recents Audit Logs */}
      <section className="dashboard-section animate-fade-in" style={{ marginTop: "2rem" }}>
        <h2 style={{ marginBottom: "1rem", fontWeight: 700 }}>Registro Reciente de Auditoría</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Actor</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>ID Entidad</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ color: "#a78bfa" }}>{log.actorEmail || "Sistema / Soporte"}</td>
                  <td><strong>{log.action}</strong></td>
                  <td>{log.entityType}</td>
                  <td><code style={{ fontSize: "0.8rem" }}>{log.entityId}</code></td>
                  <td>
                    <span className={`badge-status ${log.result === "SUCCESS" ? "status-active" : "status-inactive"}`}>
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>No hay registros de auditoría aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// --- VISTA 2: INQUILINOS (TENANTS) — con AppListView ---
function TenantsView() {
  const { startImpersonation } = useAuthStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  // Formulario Crear Tenant
  const [newTenant, setNewTenant] = useState({
    code: "", name: "", slug: "", adminEmail: "", adminPassword: "", planId: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Overrides
  const [featuresCatalog, setFeaturesCatalog] = useState<any[]>([]);
  const [overridesList, setOverridesList] = useState<Record<string, { enabled: boolean; validUntil: string }>>({});
  const [savingOverrides, setSavingOverrides] = useState(false);

  // Cargar planes para el modal de creación
  useEffect(() => {
    api.get<{ items: any[] }>("/superadmin/plans").then((res) => setPlans(res.items || [])).catch(() => {});
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    try {
      await api.post("/superadmin/tenants", newTenant);
      setShowCreateModal(false);
      setNewTenant({ code: "", name: "", slug: "", adminEmail: "", adminPassword: "", planId: "" });
    } catch (err: any) {
      setCreateError(err.message || "Error al crear tenant.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleImpersonation = async (tenantId: string) => {
    try {
      const res = await api.post<{ accessToken: string }>("/superadmin/support/session", { tenantId, durationMinutes: 30 });
      startImpersonation(res.accessToken, tenantId);
    } catch (err: any) {
      alert("Error al iniciar modo soporte: " + err.message);
    }
  };

  const openOverrideModal = async (tenant: any) => {
    setSelectedTenant(tenant);
    setShowOverrideModal(true);
    try {
      const allFeatures = await api.get<{ items: any[] }>("/superadmin/features");
      const activeOverrides = await api.get<{ items: any[] }>(`/superadmin/tenants/${tenant.id}/features`);
      const initial: Record<string, { enabled: boolean; validUntil: string }> = {};
      allFeatures.items.forEach((feat) => {
        const match = activeOverrides.items.find((o: any) => o.featureId === feat.id);
        initial[feat.id] = {
          enabled: match ? match.enabled : false,
          validUntil: match?.validUntil ? new Date(match.validUntil).toISOString().split("T")[0] : "",
        };
      });
      setFeaturesCatalog(allFeatures.items || []);
      setOverridesList(initial);
    } catch (err) { console.error(err); }
  };

  const handleSaveOverrides = async () => {
    if (!selectedTenant) return;
    setSavingOverrides(true);
    try {
      const payload = Object.entries(overridesList).filter(([_, d]) => d.enabled).map(([featureId, data]) => ({
        featureId, enabled: true, validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : null,
      }));
      await api.post(`/superadmin/tenants/${selectedTenant.id}/features`, { features: payload });
      setShowOverrideModal(false);
    } catch (err: any) { alert("Error: " + err.message); }
    finally { setSavingOverrides(false); }
  };

  const fetcher = async (query: { page: number; pageSize: number; search?: string }) => {
    const res = await api.get<{ items: any[]; totalItems: number }>("/superadmin/tenants", {
      params: { page: query.page, pageSize: query.pageSize, ...(query.search && { search: query.search }) },
    });
    return { items: res.items, totalItems: res.totalItems };
  };

  const columns: ColumnDefinition<any>[] = [
    { key: "code", header: "Código", sortable: true, render: (t) => <strong>{t.code}</strong> },
    { key: "name", header: "Nombre", sortable: true },
    { key: "slug", header: "Slug", render: (t) => <code style={{ fontSize: "0.85rem" }}>/{t.slug}</code> },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      width: "110px",
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: "createdAt",
      header: "Creado el",
      sortable: true,
      width: "130px",
      render: (t) => new Date(t.createdAt).toLocaleDateString(),
    },
  ];

  const rowActions: import("./components/AppListView.types").RowAction<any>[] = [
    {
      label: "Soporte",
      icon: <Key size={14} />,
      onClick: (t) => handleImpersonation(t.id),
    },
    {
      label: "Características",
      icon: <Settings size={14} />,
      onClick: (t) => openOverrideModal(t),
    },
  ];

  return (
    <div className="view-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Inquilinos (Tenants)</h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>Organizaciones dadas de alta en la plataforma.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Nuevo Tenant
        </button>
      </div>

      <AppListView
        title=""
        fetcher={fetcher}
        columns={columns}
        rowActions={rowActions}
        defaultPageSize={20}
        allowedPageSizes={[10, 20, 50, 100]}
        searchPlaceholder="Buscar por código o nombre..."
      />

      {/* MODAL CREAR TENANT */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal animate-fade-in">
            <header className="modal-header">
              <h3>Crear Nuevo Inquilino</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-close"><X size={18} /></button>
            </header>
            {createError && <div className="alert alert-error" style={{ margin: "1rem" }}>{createError}</div>}
            <form onSubmit={handleCreateTenant} className="modal-body form-group">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label>Código del Tenant</label>
                  <input type="text" value={newTenant.code} onChange={(e) => setNewTenant({ ...newTenant, code: e.target.value })} placeholder="E.g. ACME" required />
                </div>
                <div>
                  <label>Nombre Comercial</label>
                  <input type="text" value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} placeholder="E.g. ACME Corporation" required />
                </div>
              </div>
              <label>Slug de URL</label>
              <input type="text" value={newTenant.slug} onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })} placeholder="E.g. acme" required />
              <label>Plan Inicial</label>
              <select value={newTenant.planId} onChange={(e) => setNewTenant({ ...newTenant, planId: e.target.value })} required>
                <option value="">-- Seleccionar Plan --</option>
                {plans.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.billingCycle})</option>))}
              </select>
              <hr style={{ margin: "1.5rem 0", borderColor: "hsl(var(--border))" }} />
              <h4>Administrador Inicial</h4>
              <label>Correo Electrónico</label>
              <input type="email" value={newTenant.adminEmail} onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })} placeholder="admin@acme.com" required />
              <label>Contraseña</label>
              <input type="password" value={newTenant.adminPassword} onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })} placeholder="••••••••••••" required />
              <footer className="modal-footer" style={{ marginTop: "2rem" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? "Registrando..." : "Crear Tenant"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OVERRIDES */}
      {showOverrideModal && selectedTenant && (
        <div className="modal-backdrop">
          <div className="modal animate-fade-in" style={{ maxWidth: "600px" }}>
            <header className="modal-header">
              <h3>Overrides: {selectedTenant.name}</h3>
              <button onClick={() => setShowOverrideModal(false)} className="btn-close"><X size={18} /></button>
            </header>
            <div className="modal-body">
              <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: "1.5rem" }}>
                Habilita características específicas para este inquilino, eludiendo la restricción de su plan.
              </p>
              <div className="overrides-catalog">
                {featuresCatalog.map((feat) => {
                  const item = overridesList[feat.id] || { enabled: false, validUntil: "" };
                  return (
                    <div key={feat.id} className="override-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0", borderBottom: "1px solid hsl(var(--border))" }}>
                      <div>
                        <strong>{feat.name}</strong>
                        <span style={{ display: "block", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>{feat.code} — {feat.description || "Sin descripción."}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <input type="date" value={item.validUntil} onChange={(e) => setOverridesList({ ...overridesList, [feat.id]: { ...item, validUntil: e.target.value } })} disabled={!item.enabled} className="date-input" title="Vigente hasta" />
                        <label className="switch">
                          <input type="checkbox" checked={item.enabled} onChange={(e) => setOverridesList({ ...overridesList, [feat.id]: { ...item, enabled: e.target.checked } })} />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
              <footer className="modal-footer" style={{ marginTop: "2rem" }}>
                <button type="button" onClick={() => setShowOverrideModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="button" onClick={handleSaveOverrides} className="btn btn-primary" disabled={savingOverrides}>
                  {savingOverrides ? "Guardando..." : "Guardar Cambios"}
                </button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- VISTA 3: PLANES — con AppListView ---
function PlansView() {
  const [features, setFeatures] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const [newPlan, setNewPlan] = useState({
    code: "", name: "", description: "", status: "ACTIVE", billingCycle: "MONTHLY",
    price: 0, currencyCode: "COP", trialDays: 15, isPublic: true,
  });
  const [planFeaturesList, setPlanFeaturesList] = useState<Record<string, boolean>>({});

  // Cargar features para los modales
  useEffect(() => {
    api.get<{ items: any[] }>("/superadmin/features").then((res) => setFeatures(res.items || [])).catch(() => {});
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/superadmin/plans", newPlan);
      setShowCreateModal(false);
      setNewPlan({ code: "", name: "", description: "", status: "ACTIVE", billingCycle: "MONTHLY", price: 0, currencyCode: "COP", trialDays: 15, isPublic: true });
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("¿Eliminar este plan?")) return;
    try { await api.delete(`/superadmin/plans/${planId}`); }
    catch (err: any) { alert("Error: " + err.message); }
  };

  const openAssignModal = async (plan: any) => {
    setSelectedPlan(plan);
    setShowAssignModal(true);
    try {
      const activeFeatures = await api.get<{ items: any[] }>(`/superadmin/plans/${plan.id}/features`);
      const initial: Record<string, boolean> = {};
      features.forEach((feat) => { initial[feat.id] = activeFeatures.items.some((o: any) => o.featureId === feat.id && o.enabled); });
      setPlanFeaturesList(initial);
    } catch (err) { console.error(err); }
  };

  const handleSavePlanFeatures = async () => {
    if (!selectedPlan) return;
    try {
      const payload = Object.entries(planFeaturesList).map(([featureId, enabled]) => ({ featureId, enabled }));
      await api.post(`/superadmin/plans/${selectedPlan.id}/features`, { features: payload });
      setShowAssignModal(false);
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const fetcher = async (query: { page: number; pageSize: number }) => {
    const res = await api.get<{ items: any[]; totalItems: number }>("/superadmin/plans", {
      params: { page: query.page, pageSize: query.pageSize },
    });
    return { items: res.items, totalItems: res.totalItems };
  };

  const columns: ColumnDefinition<any>[] = [
    { key: "code", header: "Código", sortable: true, render: (p) => <strong>{p.code}</strong> },
    { key: "name", header: "Nombre", sortable: true },
    {
      key: "billingCycle",
      header: "Ciclo",
      sortable: true,
      width: "110px",
      render: (p) => p.billingCycle,
    },
    {
      key: "price",
      header: "Precio",
      sortable: true,
      width: "120px",
      render: (p) => `${Number(p.price).toLocaleString()} ${p.currencyCode}`,
    },
    {
      key: "trialDays",
      header: "Prueba",
      sortable: true,
      width: "90px",
      render: (p) => `${p.trialDays} días`,
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      width: "110px",
      render: (p) => <StatusBadge status={p.status} />,
    },
  ];

  const rowActions: import("./components/AppListView.types").RowAction<any>[] = [
    {
      label: "Features",
      icon: <Settings size={14} />,
      onClick: (p) => openAssignModal(p),
    },
    {
      label: "Eliminar",
      icon: <Trash2 size={14} />,
      onClick: (p) => handleDeletePlan(p.id),
      variant: "danger",
    },
  ];

  return (
    <div className="view-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Planes de Suscripción</h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>Catálogo y asignaciones de límites para los inquilinos.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Nuevo Plan
        </button>
      </div>

      <AppListView
        title=""
        fetcher={fetcher}
        columns={columns}
        rowActions={rowActions}
        defaultPageSize={20}
        allowedPageSizes={[10, 20, 50, 100]}
      />

      {/* MODAL CREAR PLAN */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal animate-fade-in">
            <header className="modal-header">
              <h3>Crear Nuevo Plan</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-close"><X size={18} /></button>
            </header>
            <form onSubmit={handleCreatePlan} className="modal-body form-group">
              <label>Código Único</label>
              <input type="text" value={newPlan.code} onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value.toUpperCase() })} placeholder="E.g. ENTERPRISE_PRO" required />
              <label>Nombre del Plan</label>
              <input type="text" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} placeholder="E.g. Enterprise Pro" required />
              <label>Descripción</label>
              <textarea value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} placeholder="E.g. Plan para grandes corporaciones" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label>Ciclo de Facturación</label>
                  <select value={newPlan.billingCycle} onChange={(e) => setNewPlan({ ...newPlan, billingCycle: e.target.value })}>
                    <option value="FREE">FREE</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="ANNUAL">ANNUAL</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>
                <div>
                  <label>Precio</label>
                  <input type="number" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })} min={0} required />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label>Días de Prueba</label>
                  <input type="number" value={newPlan.trialDays} onChange={(e) => setNewPlan({ ...newPlan, trialDays: Number(e.target.value) })} min={0} required />
                </div>
                <div>
                  <label>Visibilidad</label>
                  <select value={String(newPlan.isPublic)} onChange={(e) => setNewPlan({ ...newPlan, isPublic: e.target.value === "true" })}>
                    <option value="true">Público</option>
                    <option value="false">Oculto</option>
                  </select>
                </div>
              </div>
              <footer className="modal-footer" style={{ marginTop: "2rem" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Plan</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASIGNAR FEATURES */}
      {showAssignModal && selectedPlan && (
        <div className="modal-backdrop">
          <div className="modal animate-fade-in" style={{ maxWidth: "550px" }}>
            <header className="modal-header">
              <h3>Features: {selectedPlan.name}</h3>
              <button onClick={() => setShowAssignModal(false)} className="btn-close"><X size={18} /></button>
            </header>
            <div className="modal-body">
              <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: "1.5rem" }}>
                Características disponibles para los inquilinos de este plan.
              </p>
              <div className="features-checklist">
                {features.map((feat) => (
                  <div key={feat.id} className="checklist-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid hsl(var(--border))" }}>
                    <div>
                      <strong>{feat.name}</strong>
                      <span style={{ display: "block", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>{feat.code}</span>
                    </div>
                    <input type="checkbox" checked={!!planFeaturesList[feat.id]} onChange={(e) => setPlanFeaturesList({ ...planFeaturesList, [feat.id]: e.target.checked })} style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }} />
                  </div>
                ))}
              </div>
              <footer className="modal-footer" style={{ marginTop: "2rem" }}>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="button" onClick={handleSavePlanFeatures} className="btn btn-primary">Guardar Cambios</button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- VISTA 4: CARACTERÍSTICAS (FEATURES) ---
function FeaturesView() {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Formulario Feature
  const [newFeature, setNewFeature] = useState({
    code: "",
    name: "",
    description: "",
    valueType: "BOOLEAN",
    defaultValue: "false",
    isSystem: true,
  });

  const loadFeaturesData = async () => {
    try {
      const res = await api.get<{ items: any[] }>("/superadmin/features");
      setFeatures(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturesData();
  }, []);

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Parsear defaultValue según valueType
      let defVal: any = newFeature.defaultValue;
      if (newFeature.valueType === "BOOLEAN") {
        defVal = newFeature.defaultValue === "true";
      } else if (newFeature.valueType === "NUMBER") {
        defVal = Number(newFeature.defaultValue);
      }

      await api.post("/superadmin/features", {
        ...newFeature,
        defaultValue: defVal,
      });

      setShowCreateModal(false);
      setNewFeature({
        code: "",
        name: "",
        description: "",
        valueType: "BOOLEAN",
        defaultValue: "false",
        isSystem: true,
      });
      loadFeaturesData();
    } catch (err: any) {
      alert("Error al crear característica: " + err.message);
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta característica?")) return;
    try {
      await api.delete(`/superadmin/features/${id}`);
      loadFeaturesData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="loading-state">Cargando catálogo de características...</div>;

  return (
    <div className="view-container">
      <header className="view-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Catálogo de Características (Features)</h1>
          <p>Control funcional y permisos de capacidad a nivel de inquilino.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Nueva Feature
        </button>
      </header>

      {/* Tabla Features */}
      <div className="table-container animate-fade-in">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Tipo de Valor</th>
              <th>Valor por Defecto</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.id}>
                <td><code>{f.code}</code></td>
                <td><strong>{f.name}</strong></td>
                <td>{f.description || "Sin descripción."}</td>
                <td>{f.valueType}</td>
                <td><code>{JSON.stringify(f.defaultValue)}</code></td>
                <td style={{ textAlign: "right" }}>
                  <button onClick={() => handleDeleteFeature(f.id)} className="btn btn-secondary btn-sm" style={{ color: "#ef4444" }}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR FEATURE */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal animate-fade-in">
            <header className="modal-header">
              <h3>Crear Nueva Característica</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-close"><X size={18} /></button>
            </header>
            <form onSubmit={handleCreateFeature} className="modal-body form-group">
              <label>Código Único</label>
              <input
                type="text"
                value={newFeature.code}
                onChange={(e) => setNewFeature({ ...newFeature, code: e.target.value.toUpperCase() })}
                placeholder="E.g. REALTIME_CHAT"
                required
              />

              <label>Nombre Público</label>
              <input
                type="text"
                value={newFeature.name}
                onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                placeholder="E.g. Real-Time Chat"
                required
              />

              <label>Descripción</label>
              <textarea
                value={newFeature.description}
                onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                placeholder="E.g. Permite soporte técnico mediante chat en vivo en tiempo real"
              />

              <label>Tipo de Valor</label>
              <select
                value={newFeature.valueType}
                onChange={(e) => setNewFeature({ ...newFeature, valueType: e.target.value })}
              >
                <option value="BOOLEAN">BOOLEAN</option>
                <option value="NUMBER">NUMBER</option>
                <option value="STRING">STRING</option>
              </select>

              <label>Valor por Defecto</label>
              {newFeature.valueType === "BOOLEAN" ? (
                <select
                  value={newFeature.defaultValue}
                  onChange={(e) => setNewFeature({ ...newFeature, defaultValue: e.target.value })}
                >
                  <option value="false">FALSE (Deshabilitado)</option>
                  <option value="true">TRUE (Habilitado)</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={newFeature.defaultValue}
                  onChange={(e) => setNewFeature({ ...newFeature, defaultValue: e.target.value })}
                  placeholder="E.g. 0 o algún texto"
                  required
                />
              )}

              <footer className="modal-footer" style={{ marginTop: "2rem" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Feature</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- VISTA 5: CONFIGURACIÓN POR TENANT ---
type SettingTab = "general" | "branding" | "localization" | "notifications" | "security" | "email" | "integrations";

interface Setting {
  key: string;
  groupName: string;
  valueType: string;
  isPublic: boolean;
  value: any;
  description: string;
  isConfigured: boolean;
}

function SettingsView() {
  const { impersonatedTenantId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingTab>("general");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Selector de tenant para superadmin
  const [tenants, setTenants] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  const tabs: { id: SettingTab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <Globe size={16} /> },
    { id: "branding", label: "Branding", icon: <Palette size={16} /> },
    { id: "localization", label: "Localización", icon: <MapPin size={16} /> },
    { id: "notifications", label: "Notificaciones", icon: <Bell size={16} /> },
    { id: "security", label: "Seguridad", icon: <Shield size={16} /> },
    { id: "email", label: "Correo", icon: <Key size={16} /> },
    { id: "integrations", label: "Integraciones", icon: <Layers size={16} /> },
  ];

  // Obtener tenant headers para las peticiones
  const tenantHeaders = (): Record<string, string> => {
    const tid = impersonatedTenantId || selectedTenantId;
    return tid ? { "x-tenant-id": tid } : {};
  };

  // Cargar lista de tenants
  useEffect(() => {
    api.get<{ items: { id: string; name: string; code: string }[] }>("/superadmin/tenants")
      .then((res) => setTenants(res.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [selectedTenantId, impersonatedTenantId]);

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const headers = tenantHeaders();
      const data = await api.get<Setting[]>("/settings", { headers });
      setSettings(data);
      const initial: Record<string, any> = {};
      data.forEach((s: Setting) => { initial[s.key] = s.value; });
      setLocalValues(initial);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al cargar la configuración.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const settingsToUpdate = Object.entries(localValues).map(([key, value]) => ({ key, value }));
      const headers = tenantHeaders();
      await api.put("/settings", { settings: settingsToUpdate }, { headers });
      setSuccessMsg("¡Configuración guardada exitosamente!");
      const primaryColor = localValues["branding.primary_color"];
      if (primaryColor) {
        document.documentElement.style.setProperty("--color-primary-raw", primaryColor);
      }
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const setValue = (key: string, value: any) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const filteredSettings = settings.filter((s) => s.groupName === activeTab);

  const renderField = (setting: Setting) => {
    const value = localValues[setting.key];
    const isSecret = setting.valueType === "SECRET_REFERENCE";

    if (setting.valueType === "BOOLEAN") {
      return (
        <div className="settings-toggle-row">
          <span className="settings-toggle-label">{setting.description}</span>
          <button
            className={`toggle-slider ${value ? "active" : ""}`}
            onClick={() => setValue(setting.key, !value)}
            type="button"
          >
            <span className="toggle-knob" />
          </button>
        </div>
      );
    }

    if (setting.valueType === "NUMBER") {
      return (
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => setValue(setting.key, Number(e.target.value))}
          className="settings-input"
          placeholder={setting.description}
        />
      );
    }

    if (setting.key === "branding.primary_color") {
      return (
        <div className="settings-color-row">
          <input
            type="color"
            value={value || "#2563EB"}
            onChange={(e) => setValue(setting.key, e.target.value)}
            className="settings-color-picker"
          />
          <input
            type="text"
            value={value || ""}
            onChange={(e) => setValue(setting.key, e.target.value)}
            className="settings-input"
            placeholder="#2563EB"
            maxLength={20}
            style={{ flex: 1 }}
          />
          <div
            className="settings-color-preview"
            style={{ background: value || "#2563EB" }}
          />
        </div>
      );
    }

    return (
      <input
        type={isSecret ? "password" : "text"}
        value={isSecret && value === "********" ? "" : value ?? ""}
        onChange={(e) => setValue(setting.key, e.target.value)}
        className="settings-input"
        placeholder={isSecret ? "••••••••  (dejar vacío para no cambiar)" : setting.description}
      />
    );
  };

  const selectedTenant = tenants.find((t) => t.id === (impersonatedTenantId || selectedTenantId));

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Configuración del Tenant</h1>
          <p className="view-subtitle">Personaliza el comportamiento y apariencia de tu inquilino</p>
        </div>
        <div className="view-header-actions">
          {impersonatedTenantId ? (
            <div className="tenant-selector" title="Modo soporte activo">
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span className="tenant-selector-label">Tenant (soporte)</span>
                <span className="tenant-selector-value">
                  {selectedTenant?.name || impersonatedTenantId.slice(0, 8) + "…"}
                </span>
              </div>
            </div>
          ) : (
            <div className="settings-tenant-selector">
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="settings-tenant-select"
              >
                <option value="">-- Vista global (solo lectura) --</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !selectedTenantId}
            className="btn btn-primary"
          >
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="settings-layout">
        {/* Tabs laterales */}
        <nav className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Panel de contenido */}
        <div className="settings-panel">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <span>Cargando configuración...</span>
            </div>
          ) : filteredSettings.length === 0 ? (
            <div className="empty-state">
              <Settings size={40} />
              <p>No hay configuraciones en esta categoría.</p>
            </div>
          ) : (
            <div className="settings-fields">
              {filteredSettings.map((setting) => (
                <div key={setting.key} className="settings-field-row">
                  <div className="settings-field-meta">
                    <label className="settings-field-label">
                      {setting.key.split(".").slice(1).join(".").replace(/_/g, " ")}
                      {setting.valueType === "SECRET_REFERENCE" && (
                        <span className="settings-badge-secret">
                          <Lock size={11} /> secreto
                        </span>
                      )}
                      {setting.isPublic && (
                        <span className="settings-badge-public">
                          <Globe size={11} /> público
                        </span>
                      )}
                    </label>
                    <p className="settings-field-description">{setting.description}</p>
                  </div>
                  <div className="settings-field-control">
                    {renderField(setting)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- VISTA: MENUS DE PLATAFORMA (SUPERADMIN) ---
function SuperadminMenusView() {
  const [menus, setMenus] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any | null>(null);

  const [menuForm, setMenuForm] = useState({
    code: "",
    label: "",
    description: "",
    route: "",
    icon: "",
    sortOrder: 10,
    platform: "WEB",
    parentId: "",
    requiredPermissionId: "",
    requiredFeatureCode: "",
    isVisible: true,
    isActive: true,
  });

  const loadData = async () => {
    try {
      const [menusRes, permsRes, featsRes] = await Promise.all([
        api.get<{ items: any[] }>("/menus"),
        api.get<{ items: any[] }>("/superadmin/permissions"),
        api.get<{ items: any[] }>("/superadmin/features"),
      ]);
      setMenus(menusRes.items || []);
      setPermissions(permsRes.items || []);
      setFeatures(featsRes.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: menuForm.code,
        label: menuForm.label,
        description: menuForm.description || null,
        route: menuForm.route || null,
        icon: menuForm.icon || null,
        sortOrder: Number(menuForm.sortOrder),
        platform: menuForm.platform,
        parentId: menuForm.parentId || null,
        requiredPermissionId: menuForm.requiredPermissionId || null,
        requiredFeatureCode: menuForm.requiredFeatureCode || null,
        isVisible: menuForm.isVisible,
        isActive: menuForm.isActive,
      };

      if (editingMenu) {
        await api.patch(`/menus/${editingMenu.id}`, payload);
      } else {
        await api.post("/menus", payload);
      }

      setShowCreateModal(false);
      setEditingMenu(null);
      setMenuForm({
        code: "",
        label: "",
        description: "",
        route: "",
        icon: "",
        sortOrder: 10,
        platform: "WEB",
        parentId: "",
        requiredPermissionId: "",
        requiredFeatureCode: "",
        isVisible: true,
        isActive: true,
      });
      loadData();
    } catch (err: any) {
      alert("Error al guardar menú: " + err.message);
    }
  };

  const handleEdit = (menu: any) => {
    setEditingMenu(menu);
    setMenuForm({
      code: menu.code,
      label: menu.label,
      description: menu.description || "",
      route: menu.route || "",
      icon: menu.icon || "",
      sortOrder: menu.sortOrder || 10,
      platform: menu.platform || "WEB",
      parentId: menu.parentId || "",
      requiredPermissionId: menu.requiredPermissionId || "",
      requiredFeatureCode: menu.requiredFeatureCode || "",
      isVisible: menu.isVisible !== false,
      isActive: menu.isActive !== false,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este menú? Los submenús asociados podrían verse afectados.")) return;
    try {
      await api.delete(`/menus/${id}`);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="loading-state">Cargando menús y recursos...</div>;

  return (
    <div className="view-container">
      <header className="view-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Menús Globales del Sistema</h1>
          <p>Define la estructura de navegación global que heredarán los inquilinos.</p>
        </div>
        <button onClick={() => {
          setEditingMenu(null);
          setMenuForm({
            code: "",
            label: "",
            description: "",
            route: "",
            icon: "",
            sortOrder: 10,
            platform: "WEB",
            parentId: "",
            requiredPermissionId: "",
            requiredFeatureCode: "",
            isVisible: true,
            isActive: true,
          });
          setShowCreateModal(true);
        }} className="btn btn-primary">
          <Plus size={16} /> Nuevo Menú
        </button>
      </header>

      <div className="table-container animate-fade-in">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Etiqueta</th>
              <th>Ruta</th>
              <th>Icono</th>
              <th>Plataforma</th>
              <th>Orden</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((m) => (
              <tr key={m.id}>
                <td><code>{m.code}</code></td>
                <td>
                  <span style={{ fontWeight: 600 }}>{m.label}</span>
                  {m.parentId && (
                    <span className="badge" style={{ marginLeft: "0.5rem", fontSize: "0.75rem", backgroundColor: "#374151" }}>
                      Hijo de: {menus.find(x => x.id === m.parentId)?.label || m.parentId.slice(0, 8)}
                    </span>
                  )}
                </td>
                <td>{m.route ? <code>{m.route}</code> : "—"}</td>
                <td><code>{m.icon || "—"}</code></td>
                <td><StatusBadge status={m.platform} color="info" /></td>
                <td>{m.sortOrder}</td>
                <td>
                  <StatusBadge status={m.isActive ? "ACTIVE" : "INACTIVE"} />
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button onClick={() => handleEdit(m)} className="btn btn-secondary btn-sm">
                      <Edit size={14} /> Editar
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="btn btn-secondary btn-sm" style={{ color: "#ef4444" }}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal animate-fade-in">
            <header className="modal-header">
              <h3>{editingMenu ? "Editar Menú" : "Crear Nuevo Menú"}</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-close"><X size={18} /></button>
            </header>
            <form onSubmit={handleSaveMenu} className="modal-body form-group">
              <div className="form-grid-2">
                <div>
                  <label>Código del Menú</label>
                  <input
                    type="text"
                    value={menuForm.code}
                    onChange={(e) => setMenuForm({ ...menuForm, code: e.target.value })}
                    placeholder="E.g. tenant.dashboard"
                    required
                  />
                </div>
                <div>
                  <label>Etiqueta (Texto visible)</label>
                  <input
                    type="text"
                    value={menuForm.label}
                    onChange={(e) => setMenuForm({ ...menuForm, label: e.target.value })}
                    placeholder="E.g. Inicio"
                    required
                  />
                </div>
              </div>

              <label>Descripción</label>
              <textarea
                value={menuForm.description}
                onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                placeholder="E.g. Dashboard principal del tenant"
              />

              <div className="form-grid-2">
                <div>
                  <label>Ruta (URL)</label>
                  <input
                    type="text"
                    value={menuForm.route}
                    onChange={(e) => setMenuForm({ ...menuForm, route: e.target.value })}
                    placeholder="E.g. /app/dashboard"
                  />
                </div>
                <div>
                  <label>Icono (Nombre de componente Lucide)</label>
                  <input
                    type="text"
                    value={menuForm.icon}
                    onChange={(e) => setMenuForm({ ...menuForm, icon: e.target.value })}
                    placeholder="E.g. Home"
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div>
                  <label>Plataforma</label>
                  <select
                    value={menuForm.platform}
                    onChange={(e) => setMenuForm({ ...menuForm, platform: e.target.value })}
                  >
                    <option value="WEB">Web</option>
                    <option value="MOBILE">Mobile</option>
                    <option value="BOTH">Ambas</option>
                  </select>
                </div>
                <div>
                  <label>Orden (Sort Order)</label>
                  <input
                    type="number"
                    value={menuForm.sortOrder}
                    onChange={(e) => setMenuForm({ ...menuForm, sortOrder: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label>Menú Padre (Jerarquía)</label>
                  <select
                    value={menuForm.parentId}
                    onChange={(e) => setMenuForm({ ...menuForm, parentId: e.target.value })}
                  >
                    <option value="">-- Ninguno (Raíz) --</option>
                    {menus
                      .filter(m => !editingMenu || m.id !== editingMenu.id)
                      .map(m => (
                        <option key={m.id} value={m.id}>{m.label} ({m.code})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label>Permiso Requerido (Opcional)</label>
                  <select
                    value={menuForm.requiredPermissionId}
                    onChange={(e) => setMenuForm({ ...menuForm, requiredPermissionId: e.target.value })}
                  >
                    <option value="">-- Ninguno --</option>
                    {permissions.map(p => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Característica / Plan Requerido (Opcional)</label>
                  <select
                    value={menuForm.requiredFeatureCode}
                    onChange={(e) => setMenuForm({ ...menuForm, requiredFeatureCode: e.target.value })}
                  >
                    <option value="">-- Ninguna --</option>
                    {features.map(f => (
                      <option key={f.code} value={f.code}>{f.code} — {f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={menuForm.isVisible}
                    onChange={(e) => setMenuForm({ ...menuForm, isVisible: e.target.checked })}
                  />
                  <span>Visible</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={menuForm.isActive}
                    onChange={(e) => setMenuForm({ ...menuForm, isActive: e.target.checked })}
                  />
                  <span>Activo</span>
                </label>
              </div>

              <footer className="modal-footer" style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingMenu ? "Guardar" : "Crear"}</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- RUTA PRINCIPAL ---
function Home() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [healthData, setHealthData] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Branding dinámico: cargar config pública y aplicar color/nombre del tenant
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
        // silencioso si la API no está disponible
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
          <div className="card-icon">
            <Layers size={20} />
          </div>
          <h3 className="card-title">Arquitectura Multitenant</h3>
          <p className="card-desc">
            Aislamiento de datos con PostgreSQL. Columna `tenant_id` y contexto
            de inquilino seguro a nivel transaccional (RLS listo en la BD).
          </p>
        </div>

        <div className="card">
          <div className="card-icon">
            <ShieldCheck size={20} />
          </div>
          <h3 className="card-title">Seguridad & RBAC</h3>
          <p className="card-desc">
            Esquema completo para usuarios, roles y permisos. Autorización
            en la API mediante tokens de acceso firmados y refresh tokens rotativos.
          </p>
        </div>

        <div className="card">
          <div className="card-icon">
            <Settings size={20} />
          </div>
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

        <button
          onClick={testApiHealth}
          disabled={checking}
          className="btn btn-primary"
          style={{ width: "200px" }}
        >
          {checking ? "Consultando..." : "Verificar API"}
        </button>

        {healthData && (
          <div
            style={{
              marginTop: "2rem",
              width: "100%",
              maxWidth: "500px",
              textAlign: "left",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              padding: "1.5rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              {healthData.success ? (
                <>
                  <CheckCircle color="#10b981" size={20} />
                  <span style={{ color: "#10b981", fontWeight: 600 }}>API Conectada</span>
                </>
              ) : (
                <>
                  <HelpCircle color="#ef4444" size={20} />
                  <span style={{ color: "#ef4444", fontWeight: 600 }}>Error de Conexión</span>
                </>
              )}
            </div>

            <pre
              style={{
                fontFamily: "monospace",
                fontSize: "0.85rem",
                overflowX: "auto",
                color: healthData.success ? "#a78bfa" : "#ef4444"
              }}
            >
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

// --- RUTA PROTEGIDA PARA TENANT (no superadmin) ---
function TenantRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Superadmins no deberían usar el layout tenant
  if (user.roles.includes("SUPER_ADMIN")) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  return <>{children}</>;
}

// --- TENANT LAYOUT ---
function TenantLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { path: "/app/dashboard", label: "Dashboard", icon: <Activity size={18} /> },
    { path: "/app/users", label: "Usuarios", icon: <Users size={18} /> },
    { path: "/app/roles", label: "Roles", icon: <ShieldCheck size={18} /> },
    { path: "/app/settings", label: "Configuración", icon: <SlidersHorizontal size={18} /> },
  ];

  return (
    <div className="superadmin-layout-container">
      <div className="superadmin-body">
        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-brand">
            <div className="brand-icon">BF</div>
            <span style={{ fontWeight: 800 }}>BaseForge</span>
          </div>
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} className={`sidebar-link ${active ? "active" : ""}`}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-footer">
            <div className="user-info">
              <span className="user-email">{user?.email}</span>
              <span className="user-badge">{user?.roles?.join(", ") || "Usuario"}</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", width: "100%", marginTop: "1rem" }}>
              <button onClick={() => setTheme((p) => (p === "dark" ? "light" : "dark"))} className="theme-toggle" style={{ width: "100%" }}>
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button onClick={() => { logout(); navigate("/"); }} className="btn btn-secondary btn-icon-only" title="Cerrar Sesión">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <header className="topbar">
            <div className="topbar-left">
              <button onClick={() => setSidebarOpen(true)} className="sidebar-toggle" style={{ marginRight: "0.25rem" }} title="Abrir Menú">
                <Menu size={18} />
              </button>
              <Breadcrumb />
            </div>
            <div className="topbar-right">
              <NotificationCenter />
              <UserMenu />
            </div>
          </header>

          <main className="workspace">
            <ErrorBoundary>
              <Routes>
                <Route path="dashboard" element={<TenantDashboardView />} />
                <Route path="users" element={<TenantUsersView />} />
                <Route path="roles" element={<TenantRolesView />} />
                <Route path="settings" element={<SettingsView />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}

// --- TENANT USERS VIEW ---
function TenantUsersView() {
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetcher = async (query: { page: number; pageSize: number; search?: string }) => {
    const token = useAuthStore.getState().getEffectiveToken();
    const res = await fetch(`http://localhost:3000/api/v1/users?page=${query.page}&pageSize=${query.pageSize}${query.search ? `&q=${encodeURIComponent(query.search)}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    return {
      items: json.data?.items || [],
      totalItems: json.meta?.pagination?.totalItems || 0,
    };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const token = useAuthStore.getState().getEffectiveToken();
      const res = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Error al crear usuario");
      setShowCreate(false);
      setForm({ email: "", firstName: "", lastName: "", password: "" });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const columns: ColumnDefinition<any>[] = [
    { key: "email", header: "Email", sortable: true },
    { key: "displayName", header: "Nombre", sortable: true, render: (u) => u.displayName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "—" },
    { key: "status", header: "Estado", sortable: true, width: "110px", render: (u) => <StatusBadge status={u.status} /> },
    { key: "lastLoginAt", header: "Último acceso", sortable: true, width: "160px", render: (u) => u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—" },
  ];

  return (
    <div className="view-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Usuarios</h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>Usuarios de tu organización</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      <AppListView
        title=""
        key={refreshKey}
        fetcher={fetcher}
        columns={columns}
        defaultPageSize={20}
        allowedPageSizes={[10, 20, 50, 100]}
        searchPlaceholder="Buscar por email o nombre..."
      />

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo Usuario</h3>
              <button onClick={() => setShowCreate(false)} className="btn-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="modal-body form-group">
              {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
              <label>Correo electrónico</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@tenant.com" required />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label>Nombre</label>
                  <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Juan" required />
                </div>
                <div>
                  <label>Apellido</label>
                  <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Pérez" required />
                </div>
              </div>
              <label>Contraseña temporal</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
              <div className="modal-footer" style={{ marginTop: "1.5rem", padding: 0, border: "none" }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- TENANT ROLES VIEW ---
function TenantRolesView() {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({ code: "", name: "", description: "" });
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetcher = async (query: { page: number; pageSize: number }) => {
    const res = await api.get<{ items: any[]; totalItems: number }>(`/roles?page=${query.page}&pageSize=${query.pageSize}`);
    return {
      items: res.items || [],
      totalItems: res.totalItems || 0,
    };
  };

  useEffect(() => {
    const loadMenus = async () => {
      try {
        const res = await api.get<{ items: any[] }>("/menus");
        setMenus(res.items || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadMenus();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api.post("/roles", {
        ...form,
        menuIds: selectedMenuIds,
      });
      setShowCreate(false);
      setForm({ code: "", name: "", description: "" });
      setSelectedMenuIds([]);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = async (role: any) => {
    setError("");
    try {
      const res = await api.get<any>(`/roles/${role.id}`);
      setEditingId(role.id);
      setForm({
        code: res.code,
        name: res.name,
        description: res.description || "",
      });
      setSelectedMenuIds(res.menuIds || []);
      setShowEdit(true);
    } catch (err: any) {
      alert("Error al cargar detalles del rol: " + err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api.patch(`/roles/${editingId}`, {
        name: form.name,
        description: form.description,
        menuIds: selectedMenuIds,
      });
      setShowEdit(false);
      setEditingId(null);
      setForm({ code: "", name: "", description: "" });
      setSelectedMenuIds([]);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = async (role: any) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/roles/${role.id}`);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert("Error al eliminar el rol: " + err.message);
    }
  };

  const columns: ColumnDefinition<any>[] = [
    { key: "code", header: "Código", sortable: true, render: (r) => <strong>{r.code}</strong> },
    { key: "name", header: "Nombre", sortable: true },
    { key: "description", header: "Descripción", sortable: false },
    { key: "isDefault", header: "Default", sortable: true, width: "90px", render: (r) => r.isDefault ? <StatusBadge status="Sí" color="success" /> : "—" },
    {
      key: "actions",
      header: "Acciones",
      sortable: false,
      render: (r) => {
        const isTenantAdmin = r.code === "TENANT_ADMIN";
        return (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => handleEditClick(r)}
              className="btn btn-secondary btn-sm"
              disabled={isTenantAdmin}
              title={isTenantAdmin ? "No se puede editar el rol Administrador del tenant" : "Editar rol"}
            >
              <Edit size={14} /> Editar
            </button>
            <button
              onClick={() => handleDeleteClick(r)}
              className={`btn btn-sm ${isTenantAdmin ? "btn-secondary" : "btn-danger"}`}
              disabled={isTenantAdmin}
              title={isTenantAdmin ? "No se puede eliminar el rol Administrador del tenant" : "Eliminar rol"}
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="view-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Roles</h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>Roles y permisos de tu organización</p>
        </div>
        <button onClick={() => {
          setForm({ code: "", name: "", description: "" });
          setSelectedMenuIds([]);
          setShowCreate(true);
        }} className="btn btn-primary">
          <Plus size={16} /> Nuevo Rol
        </button>
      </div>

      <AppListView
        title=""
        key={refreshKey}
        fetcher={fetcher}
        columns={columns}
        defaultPageSize={20}
        allowedPageSizes={[10, 20, 50, 100]}
      />

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo Rol</h3>
              <button onClick={() => setShowCreate(false)} className="btn-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="modal-body form-group">
              {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
              <label>Código único</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, "_") })} placeholder="E.g. MANAGER" required />
              <label>Nombre</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="E.g. Manager" required />
              <label>Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción del rol" rows={3} />
              
              <label style={{ marginTop: "1rem", display: "block" }}>Menús Asociados</label>
              <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-md)", padding: "0.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {menus.length === 0 ? (
                  <span style={{ fontSize: "0.9rem", color: "hsl(var(--muted-foreground))" }}>No hay menús configurados.</span>
                ) : (
                  menus.map((m) => (
                    <label key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedMenuIds.includes(m.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMenuIds([...selectedMenuIds, m.id]);
                          } else {
                            setSelectedMenuIds(selectedMenuIds.filter((id) => id !== m.id));
                          }
                        }}
                      />
                      <div>
                        <span style={{ fontWeight: 500 }}>{m.label}</span>
                        <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginLeft: "0.5rem" }}>({m.code})</span>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="modal-footer" style={{ marginTop: "1.5rem", padding: 0, border: "none" }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creando..." : "Crear Rol"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="modal-backdrop" onClick={() => setShowEdit(false)}>
          <div className="modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Rol</h3>
              <button onClick={() => setShowEdit(false)} className="btn-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdate} className="modal-body form-group">
              {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
              <label>Código único (Solo lectura)</label>
              <input type="text" value={form.code} disabled style={{ opacity: 0.6 }} />
              <label>Nombre</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <label>Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              
              <label style={{ marginTop: "1rem", display: "block" }}>Menús Asociados</label>
              <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-md)", padding: "0.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {menus.length === 0 ? (
                  <span style={{ fontSize: "0.9rem", color: "hsl(var(--muted-foreground))" }}>No hay menús configurados.</span>
                ) : (
                  menus.map((m) => (
                    <label key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedMenuIds.includes(m.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMenuIds([...selectedMenuIds, m.id]);
                          } else {
                            setSelectedMenuIds(selectedMenuIds.filter((id) => id !== m.id));
                          }
                        }}
                      />
                      <div>
                        <span style={{ fontWeight: 500 }}>{m.label}</span>
                        <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginLeft: "0.5rem" }}>({m.code})</span>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="modal-footer" style={{ marginTop: "1.5rem", padding: 0, border: "none" }}>
                <button type="button" onClick={() => setShowEdit(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- TENANT DASHBOARD ---
function TenantDashboardView() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ users: 0, roles: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // El tenantId se toma del JWT automáticamente
        const [usersRes, rolesRes] = await Promise.all([
          api.get<{ totalItems: number }>("/users"),
          api.get<{ totalItems: number }>("/roles"),
        ]);
        setStats({
          users: usersRes.totalItems,
          roles: rolesRes.totalItems,
        });
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return <div className="loading-state"><div className="loading-spinner" /><span>Cargando...</span></div>;
  }

  return (
    <div className="view-container">
      <header className="view-header">
        <h1>Panel de Control</h1>
        <p>Bienvenido, {user?.email}</p>
      </header>
      <section className="stats-grid animate-fade-in">
        <div className="stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-details">
            <span className="stat-value">{stats.users}</span>
            <span className="stat-label">Usuarios</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ShieldCheck size={24} /></div>
          <div className="stat-details">
            <span className="stat-value">{stats.roles}</span>
            <span className="stat-label">Roles</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Activity size={24} /></div>
          <div className="stat-details">
            <span className="stat-value">—</span>
            <span className="stat-label">Tu espacio de trabajo</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/superadmin/*" element={
          <ProtectedRoute>
            <SuperadminLayout />
          </ProtectedRoute>
        } />
        <Route path="/app/*" element={
          <TenantRoute>
            <TenantLayout />
          </TenantRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
