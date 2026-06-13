import { useState, useEffect } from "react";
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
  Globe
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
    if (token && user?.roles.includes("SUPER_ADMIN")) {
      navigate(from, { replace: true });
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

// --- LAYOUT DE SUPERADMIN ---
function SuperadminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const menuItems = [
    { path: "/superadmin/dashboard", label: "Dashboard", icon: <Activity size={18} /> },
    { path: "/superadmin/tenants", label: "Inquilinos", icon: <Users size={18} /> },
    { path: "/superadmin/plans", label: "Planes", icon: <Layers size={18} /> },
    { path: "/superadmin/features", label: "Características", icon: <Settings size={18} /> },
  ];

  return (
    <div className="superadmin-layout-container">
      <ImpersonationBanner />
      <div className="superadmin-body">
        {/* Sidebar */}
        <aside className="sidebar">
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

        {/* Workspace */}
        <main className="workspace">
          <Routes>
            <Route path="dashboard" element={<DashboardView />} />
            <Route path="tenants" element={<TenantsView />} />
            <Route path="plans" element={<PlansView />} />
            <Route path="features" element={<FeaturesView />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
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

// --- VISTA 2: INQUILINOS (TENANTS) ---
function TenantsView() {
  const { startImpersonation } = useAuthStore();
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  // Formulario Crear Tenant
  const [newTenant, setNewTenant] = useState({
    code: "",
    name: "",
    slug: "",
    adminEmail: "",
    adminPassword: "",
    planId: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Formulario Overrides
  const [featuresCatalog, setFeaturesCatalog] = useState<any[]>([]);
  const [overridesList, setOverridesList] = useState<Record<string, { enabled: boolean; validUntil: string }>>({});
  const [savingOverrides, setSavingOverrides] = useState(false);

  // Load Tenants & Plans
  const loadTenantsAndPlans = async () => {
    try {
      const [tenantsRes, plansRes] = await Promise.all([
        api.get<{ items: any[] }>("/superadmin/tenants", { params: { search } }),
        api.get<{ items: any[] }>("/superadmin/plans"),
      ]);
      setTenants(tenantsRes.items || []);
      setPlans(plansRes.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantsAndPlans();
  }, [search]);

  // Handler Crear Tenant
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    try {
      await api.post("/superadmin/tenants", newTenant);
      setShowCreateModal(false);
      setNewTenant({ code: "", name: "", slug: "", adminEmail: "", adminPassword: "", planId: "" });
      loadTenantsAndPlans();
    } catch (err: any) {
      setCreateError(err.message || "Error al crear tenant.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Handler Generar Sesión Soporte
  const handleImpersonation = async (tenantId: string) => {
    try {
      const res = await api.post<{ accessToken: string }>("/superadmin/support/session", {
        tenantId,
        durationMinutes: 30,
      });
      startImpersonation(res.accessToken, tenantId);
    } catch (err: any) {
      alert("Error al iniciar modo soporte: " + err.message);
    }
  };

  // Abrir Modal Override Features
  const openOverrideModal = async (tenant: any) => {
    setSelectedTenant(tenant);
    setShowOverrideModal(true);
    try {
      // 1. Cargar todas las features del catálogo
      const allFeatures = await api.get<{ items: any[] }>("/superadmin/features");
      setFeaturesCatalog(allFeatures.items || []);

      // 2. Cargar overrides actuales del tenant
      const activeOverrides = await api.get<{ items: any[] }>(`/superadmin/tenants/${tenant.id}/features`);

      const initialOverrides: Record<string, { enabled: boolean; validUntil: string }> = {};
      allFeatures.items.forEach((feat) => {
        const matchingOverride = activeOverrides.items.find((o: any) => o.featureId === feat.id);
        initialOverrides[feat.id] = {
          enabled: matchingOverride ? matchingOverride.enabled : false,
          validUntil: matchingOverride?.validUntil
            ? new Date(matchingOverride.validUntil).toISOString().split("T")[0]
            : "",
        };
      });
      setOverridesList(initialOverrides);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler Guardar Overrides
  const handleSaveOverrides = async () => {
    if (!selectedTenant) return;
    setSavingOverrides(true);
    try {
      const payload = Object.entries(overridesList)
        .filter(([_, data]) => data.enabled)
        .map(([featureId, data]) => ({
          featureId,
          enabled: true,
          validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : null,
        }));

      await api.post(`/superadmin/tenants/${selectedTenant.id}/features`, { features: payload });
      setShowOverrideModal(false);
    } catch (err: any) {
      alert("Error al guardar overrides: " + err.message);
    } finally {
      setSavingOverrides(false);
    }
  };

  if (loading) return <div className="loading-state">Cargando inquilinos...</div>;

  return (
    <div className="view-container">
      <header className="view-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Inquilinos (Tenants)</h1>
          <p>Organizaciones dadas de alta en la plataforma.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Nuevo Tenant
        </button>
      </header>

      {/* Filtros */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Buscar por código o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Tabla */}
      <div className="table-container animate-fade-in">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Estado</th>
              <th>Creado el</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.code}</strong></td>
                <td>{t.name}</td>
                <td><code style={{ fontSize: "0.85rem" }}>/{t.slug}</code></td>
                <td>
                  <span className={`badge-status ${t.status === "ACTIVE" ? "status-active" : "status-inactive"}`}>
                    {t.status}
                  </span>
                </td>
                <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleImpersonation(t.id)}
                      className="btn btn-secondary btn-sm"
                      title="Impersonar / Entrar en Modo Soporte"
                    >
                      <Key size={14} /> Soporte
                    </button>
                    <button
                      onClick={() => openOverrideModal(t)}
                      className="btn btn-secondary btn-sm"
                      title="Overrides de Características"
                    >
                      <Settings size={14} /> Características
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  <input
                    type="text"
                    value={newTenant.code}
                    onChange={(e) => setNewTenant({ ...newTenant, code: e.target.value })}
                    placeholder="E.g. ACME"
                    required
                  />
                </div>
                <div>
                  <label>Nombre Comercial</label>
                  <input
                    type="text"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    placeholder="E.g. ACME Corporation"
                    required
                  />
                </div>
              </div>

              <label>Slug de URL</label>
              <input
                type="text"
                value={newTenant.slug}
                onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                placeholder="E.g. acme"
                required
              />

              <label>Plan Inicial</label>
              <select
                value={newTenant.planId}
                onChange={(e) => setNewTenant({ ...newTenant, planId: e.target.value })}
                required
              >
                <option value="">-- Seleccionar Plan --</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.billingCycle})</option>
                ))}
              </select>

              <hr style={{ margin: "1.5rem 0", borderColor: "hsl(var(--border))" }} />
              <h4>Administrador Inicial</h4>

              <label>Correo Electrónico Administrador</label>
              <input
                type="email"
                value={newTenant.adminEmail}
                onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                placeholder="admin@acme.com"
                required
              />

              <label>Contraseña Administrador</label>
              <input
                type="password"
                value={newTenant.adminPassword}
                onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })}
                placeholder="••••••••••••"
                required
              />

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

      {/* MODAL OVERRIDES CARACTERÍSTICAS */}
      {showOverrideModal && selectedTenant && (
        <div className="modal-backdrop">
          <div className="modal animate-fade-in" style={{ maxWidth: "600px" }}>
            <header className="modal-header">
              <h3>Overrides de Características: {selectedTenant.name}</h3>
              <button onClick={() => setShowOverrideModal(false)} className="btn-close"><X size={18} /></button>
            </header>
            <div className="modal-body">
              <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: "1.5rem" }}>
                Habilita características del catálogo global específicas para este inquilino, eludiendo la restricción estándar de su plan actual.
              </p>
              <div className="overrides-catalog">
                {featuresCatalog.map((feat) => {
                  const item = overridesList[feat.id] || { enabled: false, validUntil: "" };
                  return (
                    <div key={feat.id} className="override-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0", borderBottom: "1px solid hsl(var(--border))" }}>
                      <div>
                        <strong>{feat.name}</strong>
                        <span style={{ display: "block", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
                          {feat.code} - {feat.description || "Sin descripción."}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <input
                          type="date"
                          value={item.validUntil}
                          onChange={(e) => setOverridesList({
                            ...overridesList,
                            [feat.id]: { ...item, validUntil: e.target.value }
                          })}
                          disabled={!item.enabled}
                          className="date-input"
                          title="Vigente hasta"
                        />
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={(e) => setOverridesList({
                              ...overridesList,
                              [feat.id]: { ...item, enabled: e.target.checked }
                            })}
                          />
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

// --- VISTA 3: PLANES ---
function PlansView() {
  const [plans, setPlans] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Formulario Plan
  const [newPlan, setNewPlan] = useState({
    code: "",
    name: "",
    description: "",
    status: "ACTIVE",
    billingCycle: "MONTHLY",
    price: 0,
    currencyCode: "COP",
    trialDays: 15,
    isPublic: true,
  });

  // Checklist Features Plan
  const [planFeaturesList, setPlanFeaturesList] = useState<Record<string, boolean>>({});

  const loadPlansData = async () => {
    try {
      const [plansRes, featuresRes] = await Promise.all([
        api.get<{ items: any[] }>("/superadmin/plans"),
        api.get<{ items: any[] }>("/superadmin/features"),
      ]);
      setPlans(plansRes.items || []);
      setFeatures(featuresRes.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlansData();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/superadmin/plans", newPlan);
      setShowCreateModal(false);
      setNewPlan({
        code: "",
        name: "",
        description: "",
        status: "ACTIVE",
        billingCycle: "MONTHLY",
        price: 0,
        currencyCode: "COP",
        trialDays: 15,
        isPublic: true,
      });
      loadPlansData();
    } catch (err: any) {
      alert("Error al crear plan: " + err.message);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este plan?")) return;
    try {
      await api.delete(`/superadmin/plans/${planId}`);
      loadPlansData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const openAssignModal = async (plan: any) => {
    setSelectedPlan(plan);
    setShowAssignModal(true);
    try {
      const activeFeatures = await api.get<{ items: any[] }>(`/superadmin/plans/${plan.id}/features`);
      const initialList: Record<string, boolean> = {};
      features.forEach((feat) => {
        initialList[feat.id] = activeFeatures.items.some((o: any) => o.featureId === feat.id && o.enabled);
      });
      setPlanFeaturesList(initialList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePlanFeatures = async () => {
    if (!selectedPlan) return;
    try {
      const payload = Object.entries(planFeaturesList)
        .map(([featureId, enabled]) => ({
          featureId,
          enabled,
        }));

      await api.post(`/superadmin/plans/${selectedPlan.id}/features`, { features: payload });
      setShowAssignModal(false);
    } catch (err: any) {
      alert("Error al guardar características del plan: " + err.message);
    }
  };

  if (loading) return <div className="loading-state">Cargando planes de suscripción...</div>;

  return (
    <div className="view-container">
      <header className="view-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Planes de Suscripción</h1>
          <p>Catálogo y asignaciones de límites para los inquilinos.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Nuevo Plan
        </button>
      </header>

      {/* Tabla de Planes */}
      <div className="table-container animate-fade-in">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Ciclo de Cobro</th>
              <th>Precio</th>
              <th>Período Prueba</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.code}</strong></td>
                <td>{p.name}</td>
                <td>{p.billingCycle}</td>
                <td>{Number(p.price).toLocaleString()} {p.currencyCode}</td>
                <td>{p.trialDays} días</td>
                <td>
                  <span className={`badge-status ${p.status === "ACTIVE" ? "status-active" : "status-inactive"}`}>
                    {p.status}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                    <button onClick={() => openAssignModal(p)} className="btn btn-secondary btn-sm">
                      <Settings size={14} /> Features
                    </button>
                    <button onClick={() => handleDeletePlan(p.id)} className="btn btn-secondary btn-sm" style={{ color: "#ef4444" }}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
              <input
                type="text"
                value={newPlan.code}
                onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value.toUpperCase() })}
                placeholder="E.g. ENTERPRISE_PRO"
                required
              />

              <label>Nombre del Plan</label>
              <input
                type="text"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                placeholder="E.g. Enterprise Pro"
                required
              />

              <label>Descripción</label>
              <textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                placeholder="E.g. Plan para grandes corporaciones"
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label>Ciclo de Facturación</label>
                  <select
                    value={newPlan.billingCycle}
                    onChange={(e) => setNewPlan({ ...newPlan, billingCycle: e.target.value })}
                  >
                    <option value="FREE">FREE</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="ANNUAL">ANNUAL</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>
                <div>
                  <label>Precio (Informativo)</label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                    min={0}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label>Días de Prueba (Trial)</label>
                  <input
                    type="number"
                    value={newPlan.trialDays}
                    onChange={(e) => setNewPlan({ ...newPlan, trialDays: Number(e.target.value) })}
                    min={0}
                    required
                  />
                </div>
                <div>
                  <label>Visibilidad Pública</label>
                  <select
                    value={String(newPlan.isPublic)}
                    onChange={(e) => setNewPlan({ ...newPlan, isPublic: e.target.value === "true" })}
                  >
                    <option value="true">Sí (Público)</option>
                    <option value="false">No (Oculto)</option>
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

      {/* MODAL MAPPING FEATURES PLAN */}
      {showAssignModal && selectedPlan && (
        <div className="modal-backdrop">
          <div className="modal animate-fade-in" style={{ maxWidth: "550px" }}>
            <header className="modal-header">
              <h3>Asociar Features al Plan: {selectedPlan.name}</h3>
              <button onClick={() => setShowAssignModal(false)} className="btn-close"><X size={18} /></button>
            </header>
            <div className="modal-body">
              <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: "1.5rem" }}>
                Selecciona las características que estarán disponibles para todos los inquilinos suscritos a este plan por defecto.
              </p>
              <div className="features-checklist">
                {features.map((feat) => (
                  <div key={feat.id} className="checklist-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid hsl(var(--border))" }}>
                    <div>
                      <strong>{feat.name}</strong>
                      <span style={{ display: "block", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
                        {feat.code}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!planFeaturesList[feat.id]}
                      onChange={(e) => setPlanFeaturesList({
                        ...planFeaturesList,
                        [feat.id]: e.target.checked,
                      })}
                      style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                    />
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

// --- RUTA PRINCIPAL ---
function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [healthData, setHealthData] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
          <Link to="/login" className="nav-link">Consola Superadmin</Link>
          <a href="#features" className="nav-link">Características</a>
          <a href="#api-test" className="nav-link">Prueba API</a>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
