import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";
import { AppListView, StatusBadge } from "../components";
import type { ColumnDefinition, FilterDefinition } from "../components/AppListView.types";
import { ImpersonationBanner } from "../components/ImpersonationBanner";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { NotFoundPage, ForbiddenPage, UnauthorizedPage, ServerErrorPage } from "../components/ErrorPages";
import { Breadcrumb } from "../components/Breadcrumb";
import { NotificationCenter } from "../components/NotificationCenter";
import { UserMenu } from "../components/UserMenu";
import { TenantSelector } from "../components/TenantSelector";
import {
  Sun, Moon, Layers, Activity, Database, Cpu, Clock, CheckCircle, AlertTriangle,
  HelpCircle, FileCode2, Users, Settings, History, Key, Plus, Trash2, Edit, Eye,
  LogOut, X, Globe, FolderOpen, UploadCloud, Download, Save, Menu, SlidersHorizontal,
  Lock, Palette, MapPin, Bell, Shield, ChevronRight, Home as HomeIcon, RefreshCw,
  User, ChevronDown, BellDot, Mail, Ban, SearchX, ServerCrash, AlertOctagon, Bug, RotateCw,
  ShieldCheck,
} from "lucide-react";
import SuperadminTelemetryView from "./superadmin/TelemetryView";

// --- VISTA: AUDITORÍA ---
function AuditLogsView() {
  const fetcher = async (query: { page: number; pageSize: number; search?: string; action?: string; result?: string; dateFrom?: string; dateTo?: string }) => {
    const res = await api.get<{ items: any[]; totalItems: number }>("/superadmin/audit-logs", {
      params: {
        page: query.page, pageSize: query.pageSize,
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
    { key: "createdAt", header: "Fecha", sortable: true, width: "160px", render: (log) => <span style={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>{formatDate(log.createdAt)}</span> },
    { key: "action", header: "Acción", sortable: true, render: (log) => <code className="audit-action">{log.action}</code> },
    { key: "result", header: "Resultado", sortable: true, width: "120px", render: (log) => <StatusBadge status={log.result} /> },
    { key: "actorEmail", header: "Actor", sortable: false, render: (log) => <span style={{ fontSize: "0.82rem" }}>{log.actorEmail || log.actorUserId?.slice(0, 8) || "—"}</span> },
    { key: "entityType", header: "Entidad", sortable: true, render: (log) => (<span style={{ fontSize: "0.8rem" }}><span>{log.entityType}</span>{log.entityId && <span className="text-muted"> · {log.entityId.slice(0, 8)}…</span>}</span>) },
    { key: "ipAddress", header: "IP", sortable: false, width: "130px", render: (log) => <span style={{ fontSize: "0.78rem" }}>{log.ipAddress || "—"}</span> },
  ];

  const filters: FilterDefinition[] = [
    { key: "action", label: "Acción", type: "text", placeholder: "Ej. AUTH_LOGIN" },
    { key: "result", label: "Resultado", type: "select", options: [{ label: "SUCCESS", value: "SUCCESS" }, { label: "FAILURE", value: "FAILURE" }, { label: "DENIED", value: "DENIED" }] },
    { key: "dateFrom", label: "Desde", type: "date" },
    { key: "dateTo", label: "Hasta", type: "date" },
  ];

  return (
    <div className="view-container">
      <AppListView title="Bitácora de Auditoría" fetcher={fetcher} columns={columns} filters={filters} defaultPageSize={10} allowedPageSizes={[10, 20, 50, 100]} searchPlaceholder="Filtrar por acción..." enableExport exportFileName="auditoria_baseforge" />
    </div>
  );
}

// --- TELEMETRÍA Y OBSERVABILIDAD ---
// --- DASHBOARD ---
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
        setStats({ tenants: tenantsRes.totalItems, plans: plansRes.totalItems, features: featuresRes.totalItems });
        setLogs(logsRes.items || []);
      } catch (err) { console.error("Error cargando dashboard:", err); }
      finally { setLoading(false); }
    }
    loadDashboardData();
  }, []);

  if (loading) return <div className="loading-state">Cargando datos del sistema...</div>;

  return (
    <div className="view-container">
      <header className="view-header"><h1>Consola de Control de Plataforma</h1><p>Resumen operacional del tenant engine y logs globales.</p></header>
      <section className="stats-grid animate-fade-in">
        <div className="stat-card"><div className="stat-icon"><Users size={24} /></div><div className="stat-details"><span className="stat-value">{stats.tenants}</span><span className="stat-label">Inquilinos Registrados</span></div></div>
        <div className="stat-card"><div className="stat-icon"><Layers size={24} /></div><div className="stat-details"><span className="stat-value">{stats.plans}</span><span className="stat-label">Planes de Suscripción</span></div></div>
        <div className="stat-card"><div className="stat-icon"><Settings size={24} /></div><div className="stat-details"><span className="stat-value">{stats.features}</span><span className="stat-label">Características Activas</span></div></div>
      </section>
      <section className="dashboard-section animate-fade-in" style={{ marginTop: "2rem" }}>
        <h2 style={{ marginBottom: "1rem", fontWeight: 700 }}>Registro Reciente de Auditoría</h2>
        <div className="table-container"><table><thead><tr><th>Fecha/Hora</th><th>Actor</th><th>Acción</th><th>Entidad</th><th>ID Entidad</th><th>Resultado</th></tr></thead><tbody>
          {logs.map((log) => (<tr key={log.id}><td>{new Date(log.createdAt).toLocaleString()}</td><td style={{ color: "#a78bfa" }}>{log.actorEmail || "Sistema / Soporte"}</td><td><strong>{log.action}</strong></td><td>{log.entityType}</td><td><code style={{ fontSize: "0.8rem" }}>{log.entityId}</code></td><td><span className={`badge-status ${log.result === "SUCCESS" ? "status-active" : "status-inactive"}`}>{log.result}</span></td></tr>))}
          {logs.length === 0 && (<tr><td colSpan={6} style={{ textAlign: "center" }}>No hay registros de auditoría aún.</td></tr>)}
        </tbody></table></div>
      </section>
    </div>
  );
}

// --- INQUILINOS (TENANTS) ---
function TenantsView() {
  const { startImpersonation } = useAuthStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [newTenant, setNewTenant] = useState({ code: "", name: "", slug: "", adminEmail: "", adminPassword: "", planId: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [featuresCatalog, setFeaturesCatalog] = useState<any[]>([]);
  const [overridesList, setOverridesList] = useState<Record<string, { enabled: boolean; validUntil: string }>>({});
  const [savingOverrides, setSavingOverrides] = useState(false);

  useEffect(() => { api.get<{ items: any[] }>("/superadmin/plans").then((res) => setPlans(res.items || [])).catch(() => {}); }, []);

  const handleCreateTenant = async (e: React.FormEvent) => { e.preventDefault(); setCreateLoading(true); setCreateError(""); try { await api.post("/superadmin/tenants", newTenant); setShowCreateModal(false); setNewTenant({ code: "", name: "", slug: "", adminEmail: "", adminPassword: "", planId: "" }); } catch (err: any) { setCreateError(err.message || "Error al crear tenant."); } finally { setCreateLoading(false); } };
  const handleImpersonation = async (tenantId: string) => { try { const res = await api.post<{ accessToken: string }>("/superadmin/support/session", { tenantId, durationMinutes: 30 }); startImpersonation(res.accessToken, tenantId); } catch (err: any) { alert("Error al iniciar modo soporte: " + err.message); } };

  const openOverrideModal = async (tenant: any) => { setSelectedTenant(tenant); setShowOverrideModal(true); try { const allFeatures = await api.get<{ items: any[] }>("/superadmin/features"); const activeOverrides = await api.get<{ items: any[] }>(`/superadmin/tenants/${tenant.id}/features`); const initial: Record<string, { enabled: boolean; validUntil: string }> = {}; allFeatures.items.forEach((feat) => { const match = activeOverrides.items.find((o: any) => o.featureId === feat.id); initial[feat.id] = { enabled: match ? match.enabled : false, validUntil: match?.validUntil ? new Date(match.validUntil).toISOString().split("T")[0] : "" }; }); setFeaturesCatalog(allFeatures.items || []); setOverridesList(initial); } catch (err) { console.error(err); } };
  const handleSaveOverrides = async () => { if (!selectedTenant) return; setSavingOverrides(true); try { const payload = Object.entries(overridesList).filter(([_, d]) => d.enabled).map(([featureId, data]) => ({ featureId, enabled: true, validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : null })); await api.post(`/superadmin/tenants/${selectedTenant.id}/features`, { features: payload }); setShowOverrideModal(false); } catch (err: any) { alert("Error: " + err.message); } finally { setSavingOverrides(false); } };

  const fetcher = async (query: { page: number; pageSize: number; search?: string }) => { const res = await api.get<{ items: any[]; totalItems: number }>("/superadmin/tenants", { params: { page: query.page, pageSize: query.pageSize, ...(query.search && { search: query.search }) } }); return { items: res.items, totalItems: res.totalItems }; };
  const columns: ColumnDefinition<any>[] = [
    { key: "code", header: "Código", sortable: true, render: (t) => <strong>{t.code}</strong> },
    { key: "name", header: "Nombre", sortable: true },
    { key: "slug", header: "Slug", render: (t) => <code style={{ fontSize: "0.85rem" }}>/{t.slug}</code> },
    { key: "status", header: "Estado", sortable: true, width: "110px", render: (t) => <StatusBadge status={t.status} /> },
    { key: "createdAt", header: "Creado el", sortable: true, width: "130px", render: (t) => new Date(t.createdAt).toLocaleDateString() },
  ];
  const rowActions: import("../components/AppListView.types").RowAction<any>[] = [
    { label: "Soporte", icon: <Key size={14} />, onClick: (t) => handleImpersonation(t.id) },
    { label: "Características", icon: <Settings size={14} />, onClick: (t) => openOverrideModal(t) },
  ];

  return (
    <div className="view-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div><h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Inquilinos (Tenants)</h1><p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>Organizaciones dadas de alta en la plataforma.</p></div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary"><Plus size={16} /> Nuevo Tenant</button>
      </div>
      <AppListView title="" fetcher={fetcher} columns={columns} rowActions={rowActions} defaultPageSize={10} allowedPageSizes={[10, 20, 50, 100]} searchPlaceholder="Buscar por código o nombre..." />
      {showCreateModal && (<div className="modal-backdrop"><div className="modal animate-fade-in"><header className="modal-header"><h3>Crear Nuevo Inquilino</h3><button onClick={() => setShowCreateModal(false)} className="btn-close"><X size={18} /></button></header>
        {createError && <div className="alert alert-error" style={{ margin: "1rem" }}>{createError}</div>}
        <form onSubmit={handleCreateTenant} className="modal-body form-group">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}><div><label>Código del Tenant</label><input type="text" value={newTenant.code} onChange={(e) => setNewTenant({ ...newTenant, code: e.target.value })} placeholder="E.g. ACME" required /></div><div><label>Nombre Comercial</label><input type="text" value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} placeholder="E.g. ACME Corporation" required /></div></div>
          <label>Slug de URL</label><input type="text" value={newTenant.slug} onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })} placeholder="E.g. acme" required />
          <label>Plan Inicial</label><select value={newTenant.planId} onChange={(e) => setNewTenant({ ...newTenant, planId: e.target.value })} required><option value="">-- Seleccionar Plan --</option>{plans.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.billingCycle})</option>))}</select>
          <hr style={{ margin: "1.5rem 0", borderColor: "hsl(var(--border))" }} /><h4>Administrador Inicial</h4>
          <label>Correo Electrónico</label><input type="email" value={newTenant.adminEmail} onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })} placeholder="admin@acme.com" required />
          <label>Contraseña</label><input type="password" value={newTenant.adminPassword} onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })} placeholder="••••••••••••" required />
          <footer className="modal-footer" style={{ marginTop: "2rem" }}><button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button><button type="submit" className="btn btn-primary" disabled={createLoading}>{createLoading ? "Registrando..." : "Crear Tenant"}</button></footer>
        </form></div></div>)}
      {showOverrideModal && selectedTenant && (<div className="modal-backdrop"><div className="modal animate-fade-in" style={{ maxWidth: "600px" }}><header className="modal-header"><h3>Overrides: {selectedTenant.name}</h3><button onClick={() => setShowOverrideModal(false)} className="btn-close"><X size={18} /></button></header>
        <div className="modal-body"><p style={{ color: "hsl(var(--muted-foreground))", marginBottom: "1.5rem" }}>Habilita características específicas para este inquilino, eludiendo la restricción de su plan.</p>
          <div className="overrides-catalog">{featuresCatalog.map((feat) => { const item = overridesList[feat.id] || { enabled: false, validUntil: "" }; return (<div key={feat.id} className="override-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0", borderBottom: "1px solid hsl(var(--border))" }}><div><strong>{feat.name}</strong><span style={{ display: "block", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>{feat.code} — {feat.description || "Sin descripción."}</span></div><div style={{ display: "flex", alignItems: "center", gap: "1rem" }}><input type="date" value={item.validUntil} onChange={(e) => setOverridesList({ ...overridesList, [feat.id]: { ...item, validUntil: e.target.value } })} disabled={!item.enabled} className="date-input" title="Vigente hasta" /><label className="switch"><input type="checkbox" checked={item.enabled} onChange={(e) => setOverridesList({ ...overridesList, [feat.id]: { ...item, enabled: e.target.checked } })} /><span className="slider round"></span></label></div></div>); })}</div>
          <footer className="modal-footer" style={{ marginTop: "2rem" }}><button type="button" onClick={() => setShowOverrideModal(false)} className="btn btn-secondary">Cancelar</button><button type="button" onClick={handleSaveOverrides} className="btn btn-primary" disabled={savingOverrides}>{savingOverrides ? "Guardando..." : "Guardar Cambios"}</button></footer>
        </div></div></div>)}
    </div>
  );
}

// --- PLANES ---
function PlansView() {
  const [features, setFeatures] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [newPlan, setNewPlan] = useState({ code: "", name: "", description: "", status: "ACTIVE", billingCycle: "MONTHLY", price: 0, currencyCode: "COP", trialDays: 15, isPublic: true });
  const [planFeaturesList, setPlanFeaturesList] = useState<Record<string, boolean>>({});

  useEffect(() => { api.get<{ items: any[] }>("/superadmin/features").then((res) => setFeatures(res.items || [])).catch(() => {}); }, []);

  const handleCreatePlan = async (e: React.FormEvent) => { e.preventDefault(); try { await api.post("/superadmin/plans", newPlan); setShowCreateModal(false); setNewPlan({ code: "", name: "", description: "", status: "ACTIVE", billingCycle: "MONTHLY", price: 0, currencyCode: "COP", trialDays: 15, isPublic: true }); } catch (err: any) { alert("Error: " + err.message); } };
  const handleDeletePlan = async (planId: string) => { if (!confirm("¿Eliminar este plan?")) return; try { await api.delete(`/superadmin/plans/${planId}`); } catch (err: any) { alert("Error: " + err.message); } };
  const openAssignModal = async (plan: any) => { setSelectedPlan(plan); setShowAssignModal(true); try { const activeFeatures = await api.get<{ items: any[] }>(`/superadmin/plans/${plan.id}/features`); const initial: Record<string, boolean> = {}; features.forEach((feat) => { initial[feat.id] = activeFeatures.items.some((o: any) => o.featureId === feat.id && o.enabled); }); setPlanFeaturesList(initial); } catch (err) { console.error(err); } };
  const handleSavePlanFeatures = async () => { if (!selectedPlan) return; try { const payload = Object.entries(planFeaturesList).map(([featureId, enabled]) => ({ featureId, enabled })); await api.post(`/superadmin/plans/${selectedPlan.id}/features`, { features: payload }); setShowAssignModal(false); } catch (err: any) { alert("Error: " + err.message); } };

  const fetcher = async (query: { page: number; pageSize: number }) => { const res = await api.get<{ items: any[]; totalItems: number }>("/superadmin/plans", { params: { page: query.page, pageSize: query.pageSize } }); return { items: res.items, totalItems: res.totalItems }; };
  const columns: ColumnDefinition<any>[] = [
    { key: "code", header: "Código", sortable: true, render: (p) => <strong>{p.code}</strong> },
    { key: "name", header: "Nombre", sortable: true },
    { key: "billingCycle", header: "Ciclo", sortable: true, width: "110px", render: (p) => p.billingCycle },
    { key: "price", header: "Precio", sortable: true, width: "120px", render: (p) => `${Number(p.price).toLocaleString()} ${p.currencyCode}` },
    { key: "trialDays", header: "Prueba", sortable: true, width: "90px", render: (p) => `${p.trialDays} días` },
    { key: "status", header: "Estado", sortable: true, width: "110px", render: (p) => <StatusBadge status={p.status} /> },
  ];
  const rowActions: import("../components/AppListView.types").RowAction<any>[] = [
    { label: "Features", icon: <Settings size={14} />, onClick: (p) => openAssignModal(p) },
    { label: "Eliminar", icon: <Trash2 size={14} />, onClick: (p) => handleDeletePlan(p.id), variant: "danger" },
  ];

  return (
    <div className="view-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div><h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Planes de Suscripción</h1><p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>Catálogo y asignaciones de límites para los inquilinos.</p></div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary"><Plus size={16} /> Nuevo Plan</button>
      </div>
      <AppListView title="" fetcher={fetcher} columns={columns} rowActions={rowActions} defaultPageSize={10} allowedPageSizes={[10, 20, 50, 100]} />
      {showCreateModal && (<div className="modal-backdrop"><div className="modal animate-fade-in"><header className="modal-header"><h3>Crear Nuevo Plan</h3><button onClick={() => setShowCreateModal(false)} className="btn-close"><X size={18} /></button></header>
        <form onSubmit={handleCreatePlan} className="modal-body form-group">
          <label>Código Único</label><input type="text" value={newPlan.code} onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value.toUpperCase() })} placeholder="E.g. ENTERPRISE_PRO" required />
          <label>Nombre del Plan</label><input type="text" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} placeholder="E.g. Enterprise Pro" required />
          <label>Descripción</label><textarea value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} placeholder="E.g. Plan para grandes corporaciones" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}><div><label>Ciclo de Facturación</label><select value={newPlan.billingCycle} onChange={(e) => setNewPlan({ ...newPlan, billingCycle: e.target.value })}><option value="FREE">FREE</option><option value="MONTHLY">MONTHLY</option><option value="ANNUAL">ANNUAL</option><option value="CUSTOM">CUSTOM</option></select></div><div><label>Precio</label><input type="number" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })} min={0} required /></div></div>
          <footer className="modal-footer" style={{ marginTop: "2rem" }}><button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button><button type="submit" className="btn btn-primary">Crear Plan</button></footer>
        </form></div></div>)}
      {showAssignModal && selectedPlan && (<div className="modal-backdrop"><div className="modal animate-fade-in" style={{ maxWidth: "550px" }}><header className="modal-header"><h3>Features: {selectedPlan.name}</h3><button onClick={() => setShowAssignModal(false)} className="btn-close"><X size={18} /></button></header>
        <div className="modal-body"><p style={{ color: "hsl(var(--muted-foreground))", marginBottom: "1.5rem" }}>Características disponibles para los inquilinos de este plan.</p>
          <div className="features-checklist">{features.map((feat) => (<div key={feat.id} className="checklist-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid hsl(var(--border))" }}><div><strong>{feat.name}</strong><span style={{ display: "block", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>{feat.code}</span></div><input type="checkbox" checked={!!planFeaturesList[feat.id]} onChange={(e) => setPlanFeaturesList({ ...planFeaturesList, [feat.id]: e.target.checked })} style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }} /></div>))}</div>
          <footer className="modal-footer" style={{ marginTop: "2rem" }}><button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">Cancelar</button><button type="button" onClick={handleSavePlanFeatures} className="btn btn-primary">Guardar Cambios</button></footer>
        </div></div></div>)}
    </div>
  );
}

// --- CARACTERÍSTICAS (FEATURES) ---
function FeaturesView() {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFeature, setNewFeature] = useState({ code: "", name: "", description: "", valueType: "BOOLEAN", defaultValue: "false", isSystem: true });

  const loadFeaturesData = async () => { try { const res = await api.get<{ items: any[] }>("/superadmin/features"); setFeatures(res.items || []); } catch (err) { console.error(err); } finally { setLoading(false); } };
  useEffect(() => { loadFeaturesData(); }, []);

  const handleCreateFeature = async (e: React.FormEvent) => { e.preventDefault(); try { let defVal: any = newFeature.defaultValue; if (newFeature.valueType === "BOOLEAN") defVal = newFeature.defaultValue === "true"; else if (newFeature.valueType === "NUMBER") defVal = Number(newFeature.defaultValue); await api.post("/superadmin/features", { ...newFeature, defaultValue: defVal }); setShowCreateModal(false); setNewFeature({ code: "", name: "", description: "", valueType: "BOOLEAN", defaultValue: "false", isSystem: true }); loadFeaturesData(); } catch (err: any) { alert("Error al crear característica: " + err.message); } };
  const handleDeleteFeature = async (id: string) => { if (!confirm("¿Estás seguro de que deseas eliminar esta característica?")) return; try { await api.delete(`/superadmin/features/${id}`); loadFeaturesData(); } catch (err: any) { alert("Error: " + err.message); } };

  if (loading) return <div className="loading-state">Cargando catálogo de características...</div>;

  return (
    <div className="view-container">
      <header className="view-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><h1>Catálogo de Características (Features)</h1><p>Control funcional y permisos de capacidad a nivel de inquilino.</p></div><button onClick={() => setShowCreateModal(true)} className="btn btn-primary"><Plus size={16} /> Nueva Feature</button></header>
      <div className="table-container animate-fade-in"><table><thead><tr><th>Código</th><th>Nombre</th><th>Descripción</th><th>Tipo de Valor</th><th>Valor por Defecto</th><th style={{ textAlign: "right" }}>Acciones</th></tr></thead><tbody>{features.map((f) => (<tr key={f.id}><td><code>{f.code}</code></td><td><strong>{f.name}</strong></td><td>{f.description || "Sin descripción."}</td><td>{f.valueType}</td><td><code>{JSON.stringify(f.defaultValue)}</code></td><td style={{ textAlign: "right" }}><button onClick={() => handleDeleteFeature(f.id)} className="btn btn-secondary btn-sm" style={{ color: "#ef4444" }}><Trash2 size={14} /> Eliminar</button></td></tr>))}</tbody></table></div>
      {showCreateModal && (<div className="modal-backdrop"><div className="modal animate-fade-in"><header className="modal-header"><h3>Crear Nueva Característica</h3><button onClick={() => setShowCreateModal(false)} className="btn-close"><X size={18} /></button></header>
        <form onSubmit={handleCreateFeature} className="modal-body form-group">
          <label>Código Único</label><input type="text" value={newFeature.code} onChange={(e) => setNewFeature({ ...newFeature, code: e.target.value.toUpperCase() })} placeholder="E.g. REALTIME_CHAT" required />
          <label>Nombre Público</label><input type="text" value={newFeature.name} onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })} placeholder="E.g. Real-Time Chat" required />
          <label>Descripción</label><textarea value={newFeature.description} onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })} placeholder="E.g. Permite soporte técnico mediante chat en vivo en tiempo real" />
          <label>Tipo de Valor</label><select value={newFeature.valueType} onChange={(e) => setNewFeature({ ...newFeature, valueType: e.target.value })}><option value="BOOLEAN">BOOLEAN</option><option value="NUMBER">NUMBER</option><option value="STRING">STRING</option></select>
          <label>Valor por Defecto</label>{newFeature.valueType === "BOOLEAN" ? (<select value={newFeature.defaultValue} onChange={(e) => setNewFeature({ ...newFeature, defaultValue: e.target.value })}><option value="false">FALSE (Deshabilitado)</option><option value="true">TRUE (Habilitado)</option></select>) : (<input type="text" value={newFeature.defaultValue} onChange={(e) => setNewFeature({ ...newFeature, defaultValue: e.target.value })} placeholder="E.g. 0 o algún texto" required />)}
          <footer className="modal-footer" style={{ marginTop: "2rem" }}><button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button><button type="submit" className="btn btn-primary">Crear Feature</button></footer>
        </form></div></div>)}
    </div>
  );
}

// --- CONFIGURACIÓN (SETTINGS) ---
type SettingTab = "general" | "branding" | "localization" | "notifications" | "security" | "email" | "integrations" | "preferences";
interface Setting { key: string; groupName: string; valueType: string; isPublic: boolean; value: any; description: string; isConfigured: boolean; }

function UserPreferencesPanel() {
  const [pref, setPref] = useState({ emailEnabled: true, pushEnabled: true, inAppEnabled: true });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(""); const [error, setError] = useState("");

  const loadPreferences = async () => { setLoading(true); try { const res = await api.get<{ emailEnabled: boolean; pushEnabled: boolean; inAppEnabled: boolean }>("/notifications/preferences"); if (res) setPref(res); } catch (err: any) { console.error("Error loading preferences:", err); setError("Error al cargar las preferencias."); } finally { setLoading(false); } };
  useEffect(() => { loadPreferences(); }, []);

  const handleSave = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); setSuccess(""); setError(""); try { await api.put("/notifications/preferences", pref); setSuccess("Preferencias actualizadas con éxito."); setTimeout(() => setSuccess(""), 4000); } catch (err: any) { setError(err.message || "Error al actualizar las preferencias."); } finally { setSaving(false); } };

  if (loading) return (<div className="loading-state"><div className="loading-spinner" /><span>Cargando tus preferencias...</span></div>);

  return (
    <form onSubmit={handleSave} className="settings-fields">
      {success && <div className="toast success-toast animate-fade-in" style={{ position: "static", marginBottom: "1rem" }}>{success}</div>}
      {error && <div className="toast error-toast animate-fade-in" style={{ position: "static", marginBottom: "1rem" }}>{error}</div>}
      <div className="settings-field-row"><div className="settings-field-meta"><label className="settings-field-label">Notificaciones en la plataforma (In-App)</label><p className="settings-field-description">Recibir notificaciones directamente en el centro de alertas dentro de la aplicación.</p></div><div className="settings-field-control"><div className="settings-toggle-row"><button className={`toggle-slider ${pref.inAppEnabled ? "active" : ""}`} onClick={() => setPref(prev => ({ ...prev, inAppEnabled: !prev.inAppEnabled }))} type="button"><span className="toggle-knob" /></button></div></div></div>
      <div className="settings-field-row"><div className="settings-field-meta"><label className="settings-field-label">Notificaciones por Correo Electrónico</label><p className="settings-field-description">Recibir alertas e informes directamente en tu cuenta de correo registrada.</p></div><div className="settings-field-control"><div className="settings-toggle-row"><button className={`toggle-slider ${pref.emailEnabled ? "active" : ""}`} onClick={() => setPref(prev => ({ ...prev, emailEnabled: !prev.emailEnabled }))} type="button"><span className="toggle-knob" /></button></div></div></div>
      <div className="settings-field-row"><div className="settings-field-meta"><label className="settings-field-label">Notificaciones Push (Móvil)</label><p className="settings-field-description">Recibir alertas en tiempo real en tus dispositivos móviles enlazados.</p></div><div className="settings-field-control"><div className="settings-toggle-row"><button className={`toggle-slider ${pref.pushEnabled ? "active" : ""}`} onClick={() => setPref(prev => ({ ...prev, pushEnabled: !prev.pushEnabled }))} type="button"><span className="toggle-knob" /></button></div></div></div>
      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Guardando..." : "Guardar Preferencias"}</button></div>
    </form>
  );
}

function SettingsView() {
  const { impersonatedTenantId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingTab>("general");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(""); const [errorMsg, setErrorMsg] = useState("");
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
    { id: "preferences", label: "Mis Preferencias", icon: <User size={16} /> },
  ];

  const tenantHeaders = (): Record<string, string> => { const tid = impersonatedTenantId || selectedTenantId; return tid ? { "x-tenant-id": tid } : {}; };

  useEffect(() => { api.get<{ items: { id: string; name: string; code: string }[] }>("/superadmin/tenants").then((res) => setTenants(res.items || [])).catch(() => {}); }, []);
  useEffect(() => { fetchSettings(); }, [selectedTenantId, impersonatedTenantId]);

  const fetchSettings = async () => { setLoading(true); setErrorMsg(""); try { const headers = tenantHeaders(); const data = await api.get<Setting[]>("/settings", { headers }); setSettings(data); const initial: Record<string, any> = {}; data.forEach((s: Setting) => { initial[s.key] = s.value; }); setLocalValues(initial); } catch (err: any) { setErrorMsg(err.message || "Error al cargar la configuración."); } finally { setLoading(false); } };

  const handleSave = async () => { setSaving(true); setSuccessMsg(""); setErrorMsg(""); try { const settingsToUpdate = Object.entries(localValues).map(([key, value]) => ({ key, value })); const headers = tenantHeaders(); await api.put("/settings", { settings: settingsToUpdate }, { headers }); setSuccessMsg("¡Configuración guardada exitosamente!"); const primaryColor = localValues["branding.primary_color"]; if (primaryColor) document.documentElement.style.setProperty("--color-primary-raw", primaryColor); setTimeout(() => setSuccessMsg(""), 4000); } catch (err: any) { setErrorMsg(err.message || "Error al guardar la configuración."); } finally { setSaving(false); } };

  const setValue = (key: string, value: any) => { setLocalValues((prev) => ({ ...prev, [key]: value })); };
  const filteredSettings = settings.filter((s) => s.groupName === activeTab);

  const renderField = (setting: Setting) => {
    const value = localValues[setting.key];
    const isSecret = setting.valueType === "SECRET_REFERENCE";
    if (setting.valueType === "BOOLEAN") return (<div className="settings-toggle-row"><span className="settings-toggle-label">{setting.description}</span><button className={`toggle-slider ${value ? "active" : ""}`} onClick={() => setValue(setting.key, !value)} type="button"><span className="toggle-knob" /></button></div>);
    if (setting.valueType === "NUMBER") return <input type="number" value={value ?? ""} onChange={(e) => setValue(setting.key, Number(e.target.value))} className="settings-input" placeholder={setting.description} />;
    if (setting.key === "branding.primary_color") return (<div className="settings-color-row"><input type="color" value={value || "#2563EB"} onChange={(e) => setValue(setting.key, e.target.value)} className="settings-color-picker" /><input type="text" value={value || ""} onChange={(e) => setValue(setting.key, e.target.value)} className="settings-input" placeholder="#2563EB" maxLength={20} style={{ flex: 1 }} /><div className="settings-color-preview" style={{ background: value || "#2563EB" }} /></div>);
    return <input type={isSecret ? "password" : "text"} value={isSecret && value === "********" ? "" : value ?? ""} onChange={(e) => setValue(setting.key, e.target.value)} className="settings-input" placeholder={isSecret ? "••••••••  (dejar vacío para no cambiar)" : setting.description} />;
  };

  const selectedTenant = tenants.find((t) => t.id === (impersonatedTenantId || selectedTenantId));

  return (
    <div className="view-container">
      <div className="view-header"><div><h1 className="view-title">Configuración del Tenant</h1><p className="view-subtitle">Personaliza el comportamiento y apariencia de tu inquilino</p></div>
        <div className="view-header-actions">{impersonatedTenantId ? (<div className="tenant-selector" title="Modo soporte activo"><div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}><span className="tenant-selector-label">Tenant (soporte)</span><span className="tenant-selector-value">{selectedTenant?.name || impersonatedTenantId.slice(0, 8) + "…"}</span></div></div>) : (<div className="settings-tenant-selector"><select value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)} className="settings-tenant-select"><option value="">-- Vista global (solo lectura) --</option>{tenants.map((t) => (<option key={t.id} value={t.id}>{t.name} ({t.code})</option>))}</select></div>)}
          <button onClick={handleSave} disabled={saving || !selectedTenantId} className="btn btn-primary"><Save size={16} />{saving ? "Guardando..." : "Guardar Cambios"}</button></div></div>
      {successMsg && (<div className="alert alert-success" style={{ marginBottom: "1rem" }}><CheckCircle size={16} /><span>{successMsg}</span></div>)}
      {errorMsg && (<div className="alert alert-error" style={{ marginBottom: "1rem" }}><AlertTriangle size={16} /><span>{errorMsg}</span></div>)}
      <div className="settings-layout"><nav className="settings-tabs">{tabs.map((tab) => (<button key={tab.id} className={`settings-tab-btn ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>{tab.icon}<span>{tab.label}</span></button>))}</nav>
        <div className="settings-panel">{activeTab === "preferences" ? (<UserPreferencesPanel />) : loading ? (<div className="loading-state"><div className="loading-spinner" /><span>Cargando configuración...</span></div>) : filteredSettings.length === 0 ? (<div className="empty-state"><Settings size={40} /><p>No hay configuraciones en esta categoría.</p></div>) : (<div className="settings-fields">{filteredSettings.map((setting) => (<div key={setting.key} className="settings-field-row"><div className="settings-field-meta"><label className="settings-field-label">{setting.key.split(".").slice(1).join(".").replace(/_/g, " ")}{setting.valueType === "SECRET_REFERENCE" && (<span className="settings-badge-secret"><Lock size={11} /> secreto</span>)}{setting.isPublic && (<span className="settings-badge-public"><Globe size={11} /> público</span>)}</label><p className="settings-field-description">{setting.description}</p></div><div className="settings-field-control">{renderField(setting)}</div></div>))}</div>)}</div></div>
    </div>
  );
}

// --- MENÚS DE PLATAFORMA (SUPERADMIN) ---
function SuperadminMenusView() {
  const [menus, setMenus] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any | null>(null);
  const [menuForm, setMenuForm] = useState({ code: "", label: "", description: "", route: "", icon: "", sortOrder: 10, platform: "WEB", parentId: "", requiredPermissionId: "", requiredFeatureCode: "", isVisible: true, isActive: true });

  const loadData = async () => { try { const [menusRes, permsRes, featsRes] = await Promise.all([api.get<{ items: any[] }>("/menus"), api.get<{ items: any[] }>("/superadmin/permissions"), api.get<{ items: any[] }>("/superadmin/features")]); setMenus(menusRes.items || []); setPermissions(permsRes.items || []); setFeatures(featsRes.items || []); } catch (err) { console.error(err); } finally { setLoading(false); } };
  useEffect(() => { loadData(); }, []);

  const handleSaveMenu = async (e: React.FormEvent) => { e.preventDefault(); try { const payload = { code: menuForm.code, label: menuForm.label, description: menuForm.description || null, route: menuForm.route || null, icon: menuForm.icon || null, sortOrder: Number(menuForm.sortOrder), platform: menuForm.platform, parentId: menuForm.parentId || null, requiredPermissionId: menuForm.requiredPermissionId || null, requiredFeatureCode: menuForm.requiredFeatureCode || null, isVisible: menuForm.isVisible, isActive: menuForm.isActive }; if (editingMenu) { await api.patch(`/menus/${editingMenu.id}`, payload); } else { await api.post("/menus", payload); } setShowCreateModal(false); setEditingMenu(null); setMenuForm({ code: "", label: "", description: "", route: "", icon: "", sortOrder: 10, platform: "WEB", parentId: "", requiredPermissionId: "", requiredFeatureCode: "", isVisible: true, isActive: true }); loadData(); } catch (err: any) { alert("Error al guardar menú: " + err.message); } };

  const handleEdit = (menu: any) => { setEditingMenu(menu); setMenuForm({ code: menu.code, label: menu.label, description: menu.description || "", route: menu.route || "", icon: menu.icon || "", sortOrder: menu.sortOrder || 10, platform: menu.platform || "WEB", parentId: menu.parentId || "", requiredPermissionId: menu.requiredPermissionId || "", requiredFeatureCode: menu.requiredFeatureCode || "", isVisible: menu.isVisible !== false, isActive: menu.isActive !== false }); setShowCreateModal(true); };
  const handleDelete = async (id: string) => { if (!confirm("¿Estás seguro de que deseas eliminar este menú? Los submenús asociados podrían verse afectados.")) return; try { await api.delete(`/menus/${id}`); loadData(); } catch (err: any) { alert("Error: " + err.message); } };

  if (loading) return <div className="loading-state">Cargando menús y recursos...</div>;

  return (
    <div className="view-container">
      <header className="view-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><h1>Menús Globales del Sistema</h1><p>Define la estructura de navegación global que heredarán los inquilinos.</p></div><button onClick={() => { setEditingMenu(null); setMenuForm({ code: "", label: "", description: "", route: "", icon: "", sortOrder: 10, platform: "WEB", parentId: "", requiredPermissionId: "", requiredFeatureCode: "", isVisible: true, isActive: true }); setShowCreateModal(true); }} className="btn btn-primary"><Plus size={16} /> Nuevo Menú</button></header>
      <div className="table-container animate-fade-in"><table><thead><tr><th>Código</th><th>Etiqueta</th><th>Ruta</th><th>Icono</th><th>Plataforma</th><th>Orden</th><th>Estado</th><th style={{ textAlign: "right" }}>Acciones</th></tr></thead><tbody>{menus.map((m) => (<tr key={m.id}><td><code>{m.code}</code></td><td><span style={{ fontWeight: 600 }}>{m.label}</span>{m.parentId && (<span className="badge" style={{ marginLeft: "0.5rem", fontSize: "0.75rem", backgroundColor: "#374151" }}>Hijo de: {menus.find(x => x.id === m.parentId)?.label || m.parentId.slice(0, 8)}</span>)}</td><td>{m.route ? <code>{m.route}</code> : "—"}</td><td><code>{m.icon || "—"}</code></td><td><StatusBadge status={m.platform} color="info" /></td><td>{m.sortOrder}</td><td><StatusBadge status={m.isActive ? "ACTIVE" : "INACTIVE"} /></td><td style={{ textAlign: "right" }}><div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}><button onClick={() => handleEdit(m)} className="btn btn-secondary btn-sm"><Edit size={14} /> Editar</button><button onClick={() => handleDelete(m.id)} className="btn btn-secondary btn-sm" style={{ color: "#ef4444" }}><Trash2 size={14} /> Eliminar</button></div></td></tr>))}</tbody></table></div>
      {showCreateModal && (<div className="modal-backdrop"><div className="modal animate-fade-in"><header className="modal-header"><h3>{editingMenu ? "Editar Menú" : "Crear Nuevo Menú"}</h3><button onClick={() => setShowCreateModal(false)} className="btn-close"><X size={18} /></button></header>
        <form onSubmit={handleSaveMenu} className="modal-body form-group">
          <div className="form-grid-2"><div><label>Código del Menú</label><input type="text" value={menuForm.code} onChange={(e) => setMenuForm({ ...menuForm, code: e.target.value })} placeholder="E.g. tenant.dashboard" required /></div><div><label>Etiqueta (Texto visible)</label><input type="text" value={menuForm.label} onChange={(e) => setMenuForm({ ...menuForm, label: e.target.value })} placeholder="E.g. Inicio" required /></div></div>
          <label>Descripción</label><textarea value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} placeholder="E.g. Dashboard principal del tenant" />
          <div className="form-grid-2"><div><label>Ruta (URL)</label><input type="text" value={menuForm.route} onChange={(e) => setMenuForm({ ...menuForm, route: e.target.value })} placeholder="E.g. /app/dashboard" /></div><div><label>Icono (Nombre de componente Lucide)</label><input type="text" value={menuForm.icon} onChange={(e) => setMenuForm({ ...menuForm, icon: e.target.value })} placeholder="E.g. Home" /></div></div>
          <div className="form-grid-3"><div><label>Plataforma</label><select value={menuForm.platform} onChange={(e) => setMenuForm({ ...menuForm, platform: e.target.value })}><option value="WEB">Web</option><option value="MOBILE">Mobile</option><option value="BOTH">Ambas</option></select></div><div><label>Orden (Sort Order)</label><input type="number" value={menuForm.sortOrder} onChange={(e) => setMenuForm({ ...menuForm, sortOrder: Number(e.target.value) })} required /></div><div><label>Menú Padre (Jerarquía)</label><select value={menuForm.parentId} onChange={(e) => setMenuForm({ ...menuForm, parentId: e.target.value })}><option value="">-- Ninguno (Raíz) --</option>{menus.filter(m => !editingMenu || m.id !== editingMenu.id).map(m => (<option key={m.id} value={m.id}>{m.label} ({m.code})</option>))}</select></div></div>
          <div className="form-grid-2"><div><label>Permiso Requerido (Opcional)</label><select value={menuForm.requiredPermissionId} onChange={(e) => setMenuForm({ ...menuForm, requiredPermissionId: e.target.value })}><option value="">-- Ninguno --</option>{permissions.map(p => (<option key={p.id} value={p.id}>{p.code} — {p.name}</option>))}</select></div><div><label>Característica / Plan Requerido (Opcional)</label><select value={menuForm.requiredFeatureCode} onChange={(e) => setMenuForm({ ...menuForm, requiredFeatureCode: e.target.value })}><option value="">-- Ninguna --</option>{features.map(f => (<option key={f.code} value={f.code}>{f.code} — {f.name}</option>))}</select></div></div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}><label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><input type="checkbox" checked={menuForm.isVisible} onChange={(e) => setMenuForm({ ...menuForm, isVisible: e.target.checked })} /><span>Visible</span></label><label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><input type="checkbox" checked={menuForm.isActive} onChange={(e) => setMenuForm({ ...menuForm, isActive: e.target.checked })} /><span>Activo</span></label></div>
          <footer className="modal-footer" style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}><button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button><button type="submit" className="btn btn-primary">{editingMenu ? "Guardar" : "Crear"}</button></footer>
        </form></div></div>)}
    </div>
  );
}

// --- SUPERADMIN LAYOUT ---
export default function SuperadminSection() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const toggleTheme = () => { setTheme((prev) => (prev === "dark" ? "light" : "dark")); };

  const menuItems = [
    { path: "/superadmin/dashboard", label: "Dashboard", icon: <Activity size={18} /> },
    { path: "/superadmin/tenants", label: "Inquilinos", icon: <Users size={18} /> },
    { path: "/superadmin/plans", label: "Planes", icon: <Layers size={18} /> },
    { path: "/superadmin/features", label: "Características", icon: <Settings size={18} /> },
    { path: "/superadmin/menus", label: "Menús", icon: <Menu size={18} /> },
    { path: "/superadmin/settings", label: "Configuración", icon: <SlidersHorizontal size={18} /> },
    { path: "/superadmin/audit", label: "Auditoría", icon: <History size={18} /> },
    { path: "/superadmin/telemetry", label: "Métricas & Salud", icon: <Cpu size={18} /> },
  ];

  return (
    <div className="superadmin-layout-container">
      <ImpersonationBanner />
      <div className="superadmin-body">
        {sidebarOpen && (<div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />)}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-brand"><div className="brand-icon">BF</div><span style={{ fontWeight: 800 }}>BaseForge</span></div>
          <nav className="sidebar-nav">{menuItems.map((item) => { const active = location.pathname.startsWith(item.path); return (<Link key={item.path} to={item.path} className={`sidebar-link ${active ? "active" : ""}`}>{item.icon}<span>{item.label}</span></Link>); })}</nav>
          <div className="sidebar-footer"><div className="user-info"><span className="user-email">{user?.email}</span><span className="user-badge">Super Admin</span></div><div style={{ display: "flex", gap: "0.5rem", width: "100%", marginTop: "1rem" }}><button onClick={toggleTheme} className="theme-toggle" style={{ width: "100%" }}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button><button onClick={logout} className="btn btn-secondary btn-icon-only" title="Cerrar Sesión"><LogOut size={16} /></button></div></div>
        </aside>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <header className="topbar"><div className="topbar-left"><button onClick={() => setSidebarOpen(true)} className="sidebar-toggle" style={{ marginRight: "0.25rem" }} title="Abrir Menú"><Menu size={18} /></button><Breadcrumb /><TenantSelector /></div><div className="topbar-right"><NotificationCenter /><UserMenu /></div></header>
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
                <Route path="telemetry" element={<SuperadminTelemetryView />} />
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
