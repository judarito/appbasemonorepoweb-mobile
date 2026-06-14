import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";
import { AppListView, StatusBadge } from "../components";
import type { ColumnDefinition } from "../components/AppListView.types";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { NotFoundPage } from "../components/ErrorPages";
import { Breadcrumb } from "../components/Breadcrumb";
import { NotificationCenter } from "../components/NotificationCenter";
import { UserMenu } from "../components/UserMenu";
import {
  Sun, Moon, Activity, Users, ShieldCheck, Settings, SlidersHorizontal, FolderOpen,
  Menu, LogOut, Plus, X, Trash2, Edit, AlertTriangle, UploadCloud, Download,
  Home as HomeIcon, FileCode2, CheckCircle, RefreshCw, Save,
} from "lucide-react";

// --- SETTINGS VIEW (simplified for tenant) ---
type SettingTab = "general" | "branding" | "localization" | "notifications" | "security" | "email" | "integrations" | "preferences";
interface Setting { key: string; groupName: string; valueType: string; isPublic: boolean; value: any; description: string; isConfigured: boolean; }

function TenantSettingsView() {
  const [activeTab, setActiveTab] = useState<SettingTab>("general");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const tabs: { id: SettingTab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <Settings size={16} /> },
    { id: "branding", label: "Branding", icon: <SlidersHorizontal size={16} /> },
    { id: "localization", label: "Localización", icon: <SlidersHorizontal size={16} /> },
    { id: "notifications", label: "Notificaciones", icon: <SlidersHorizontal size={16} /> },
    { id: "security", label: "Seguridad", icon: <ShieldCheck size={16} /> },
  ];

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true); setErrorMsg("");
    try {
      const data = await api.get<Setting[]>("/settings");
      setSettings(data);
      const initial: Record<string, any> = {};
      data.forEach((s: Setting) => { initial[s.key] = s.value; });
      setLocalValues(initial);
    } catch (err: any) { setErrorMsg(err.message || "Error al cargar la configuración."); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setSuccessMsg(""); setErrorMsg("");
    try {
      const settingsToUpdate = Object.entries(localValues).map(([key, value]) => ({ key, value }));
      await api.put("/settings", { settings: settingsToUpdate });
      setSuccessMsg("¡Configuración guardada exitosamente!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) { setErrorMsg(err.message || "Error al guardar la configuración."); }
    finally { setSaving(false); }
  };

  const setValue = (key: string, value: any) => { setLocalValues((prev) => ({ ...prev, [key]: value })); };
  const filteredSettings = settings.filter((s) => s.groupName === activeTab);

  const renderField = (setting: Setting) => {
    const value = localValues[setting.key];
    if (setting.valueType === "BOOLEAN") return (<div className="settings-toggle-row"><span className="settings-toggle-label">{setting.description}</span><button className={`toggle-slider ${value ? "active" : ""}`} onClick={() => setValue(setting.key, !value)} type="button"><span className="toggle-knob" /></button></div>);
    if (setting.valueType === "NUMBER") return <input type="number" value={value ?? ""} onChange={(e) => setValue(setting.key, Number(e.target.value))} className="settings-input" placeholder={setting.description} />;
    if (setting.key === "branding.primary_color") return (<div className="settings-color-row"><input type="color" value={value || "#2563EB"} onChange={(e) => setValue(setting.key, e.target.value)} className="settings-color-picker" /><input type="text" value={value || ""} onChange={(e) => setValue(setting.key, e.target.value)} className="settings-input" placeholder="#2563EB" maxLength={20} style={{ flex: 1 }} /><div className="settings-color-preview" style={{ background: value || "#2563EB" }} /></div>);
    return <input type="text" value={value ?? ""} onChange={(e) => setValue(setting.key, e.target.value)} className="settings-input" placeholder={setting.description} />;
  };

  return (
    <div className="view-container">
      <div className="view-header"><div><h1 className="view-title">Configuración</h1><p className="view-subtitle">Personaliza tu espacio de trabajo</p></div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary"><Save size={16} />{saving ? "Guardando..." : "Guardar Cambios"}</button></div>
      {successMsg && (<div className="alert alert-success" style={{ marginBottom: "1rem" }}><CheckCircle size={16} /><span>{successMsg}</span></div>)}
      {errorMsg && (<div className="alert alert-error" style={{ marginBottom: "1rem" }}><AlertTriangle size={16} /><span>{errorMsg}</span></div>)}
      <div className="settings-layout"><nav className="settings-tabs">{tabs.map((tab) => (<button key={tab.id} className={`settings-tab-btn ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>{tab.icon}<span>{tab.label}</span></button>))}</nav>
        <div className="settings-panel">{loading ? (<div className="loading-state"><div className="loading-spinner" /><span>Cargando configuración...</span></div>) : filteredSettings.length === 0 ? (<div className="empty-state"><Settings size={40} /><p>No hay configuraciones en esta categoría.</p></div>) : (<div className="settings-fields">{filteredSettings.map((setting) => (<div key={setting.key} className="settings-field-row"><div className="settings-field-meta"><label className="settings-field-label">{setting.key.split(".").slice(1).join(".").replace(/_/g, " ")}</label><p className="settings-field-description">{setting.description}</p></div><div className="settings-field-control">{renderField(setting)}</div></div>))}</div>)}</div></div>
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
        const [usersRes, rolesRes] = await Promise.all([
          api.get<{ totalItems: number }>("/users"),
          api.get<{ totalItems: number }>("/roles"),
        ]);
        setStats({ users: usersRes.totalItems, roles: rolesRes.totalItems });
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="loading-state"><div className="loading-spinner" /><span>Cargando...</span></div>;

  return (
    <div className="view-container">
      <header className="view-header"><h1>Panel de Control</h1><p>Bienvenido, {user?.email}</p></header>
      <section className="stats-grid animate-fade-in">
        <div className="stat-card"><div className="stat-icon"><Users size={24} /></div><div className="stat-details"><span className="stat-value">{stats.users}</span><span className="stat-label">Usuarios</span></div></div>
        <div className="stat-card"><div className="stat-icon"><ShieldCheck size={24} /></div><div className="stat-details"><span className="stat-value">{stats.roles}</span><span className="stat-label">Roles</span></div></div>
        <div className="stat-card"><div className="stat-icon"><Activity size={24} /></div><div className="stat-details"><span className="stat-value">—</span><span className="stat-label">Tu espacio de trabajo</span></div></div>
      </section>
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
    const json = await api.getRaw<{ success: boolean; data: { items: any[] }; meta: { pagination: { totalItems: number } } }>("/users", {
      params: { page: query.page, pageSize: query.pageSize, ...(query.search && { q: query.search }) },
    });
    return { items: json.data?.items || [], totalItems: json.meta?.pagination?.totalItems || 0 };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setError("");
    try {
      await api.post("/users", form);
      setShowCreate(false);
      setForm({ email: "", firstName: "", lastName: "", password: "" });
      setRefreshKey((k) => k + 1);
    } catch (err: any) { setError(err.message); }
    finally { setCreating(false); }
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
        <div><h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Usuarios</h1><p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>Usuarios de tu organización</p></div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary"><Plus size={16} /> Nuevo Usuario</button>
      </div>
      <AppListView title="" key={refreshKey} fetcher={fetcher} columns={columns} defaultPageSize={10} allowedPageSizes={[10, 20, 50, 100]} searchPlaceholder="Buscar por email o nombre..." />
      {showCreate && (<div className="modal-backdrop" onClick={() => setShowCreate(false)}><div className="modal animate-fade-in" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>Nuevo Usuario</h3><button onClick={() => setShowCreate(false)} className="btn-close"><X size={18} /></button></div>
        <form onSubmit={handleCreate} className="modal-body form-group">
          {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
          <label>Correo electrónico</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@tenant.com" required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}><div><label>Nombre</label><input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Juan" required /></div><div><label>Apellido</label><input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Pérez" required /></div></div>
          <label>Contraseña temporal</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
          <div className="modal-footer" style={{ marginTop: "1.5rem", padding: 0, border: "none" }}><button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancelar</button><button type="submit" className="btn btn-primary" disabled={creating}>{creating ? "Creando..." : "Crear Usuario"}</button></div>
        </form></div></div>)}
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
    return { items: res.items || [], totalItems: res.totalItems || 0 };
  };

  useEffect(() => { const loadMenus = async () => { try { const res = await api.get<{ items: any[] }>("/menus"); setMenus(res.items || []); } catch (err) { console.error(err); } }; loadMenus(); }, []);

  const handleCreate = async (e: React.FormEvent) => { e.preventDefault(); setCreating(true); setError(""); try { await api.post("/roles", { ...form, menuIds: selectedMenuIds }); setShowCreate(false); setForm({ code: "", name: "", description: "" }); setSelectedMenuIds([]); setRefreshKey((k) => k + 1); } catch (err: any) { setError(err.message); } finally { setCreating(false); } };

  const handleEditClick = async (role: any) => { setError(""); try { const res = await api.get<any>(`/roles/${role.id}`); setEditingId(role.id); setForm({ code: res.code, name: res.name, description: res.description || "" }); setSelectedMenuIds(res.menuIds || []); setShowEdit(true); } catch (err: any) { alert("Error al cargar detalles del rol: " + err.message); } };

  const handleUpdate = async (e: React.FormEvent) => { e.preventDefault(); setCreating(true); setError(""); try { await api.patch(`/roles/${editingId}`, { name: form.name, description: form.description, menuIds: selectedMenuIds }); setShowEdit(false); setEditingId(null); setForm({ code: "", name: "", description: "" }); setSelectedMenuIds([]); setRefreshKey((k) => k + 1); } catch (err: any) { setError(err.message); } finally { setCreating(false); } };

  const handleDeleteClick = async (role: any) => { if (!confirm(`¿Estás seguro de que deseas eliminar el rol "${role.name}"?`)) return; try { await api.delete(`/roles/${role.id}`); setRefreshKey((k) => k + 1); } catch (err: any) { alert("Error al eliminar el rol: " + err.message); } };

  const columns: ColumnDefinition<any>[] = [
    { key: "code", header: "Código", sortable: true, render: (r) => <strong>{r.code}</strong> },
    { key: "name", header: "Nombre", sortable: true },
    { key: "description", header: "Descripción", sortable: false },
    { key: "isDefault", header: "Default", sortable: true, width: "90px", render: (r) => r.isDefault ? <StatusBadge status="Sí" color="success" /> : "—" },
    { key: "actions", header: "Acciones", sortable: false, render: (r) => { const isTenantAdmin = r.code === "TENANT_ADMIN"; return (<div style={{ display: "flex", gap: "0.5rem" }}><button onClick={() => handleEditClick(r)} className="btn btn-secondary btn-sm" disabled={isTenantAdmin} title={isTenantAdmin ? "No se puede editar el rol Administrador del tenant" : "Editar rol"}><Edit size={14} /> Editar</button><button onClick={() => handleDeleteClick(r)} className={`btn btn-sm ${isTenantAdmin ? "btn-secondary" : "btn-danger"}`} disabled={isTenantAdmin} title={isTenantAdmin ? "No se puede eliminar el rol Administrador del tenant" : "Eliminar rol"}><Trash2 size={14} /> Eliminar</button></div>); } },
  ];

  return (
    <div className="view-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div><h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Roles</h1><p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>Roles y permisos de tu organización</p></div>
        <button onClick={() => { setForm({ code: "", name: "", description: "" }); setSelectedMenuIds([]); setShowCreate(true); }} className="btn btn-primary"><Plus size={16} /> Nuevo Rol</button>
      </div>
      <AppListView title="" key={refreshKey} fetcher={fetcher} columns={columns} defaultPageSize={10} allowedPageSizes={[10, 20, 50, 100]} />
      {showCreate && (<div className="modal-backdrop" onClick={() => setShowCreate(false)}><div className="modal animate-fade-in" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>Nuevo Rol</h3><button onClick={() => setShowCreate(false)} className="btn-close"><X size={18} /></button></div>
        <form onSubmit={handleCreate} className="modal-body form-group">
          {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
          <label>Código único</label><input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, "_") })} placeholder="E.g. MANAGER" required />
          <label>Nombre</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="E.g. Manager" required />
          <label>Descripción</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción del rol" rows={3} />
          <label style={{ marginTop: "1rem", display: "block" }}>Menús Asociados</label>
          <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-md)", padding: "0.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {menus.length === 0 ? (<span style={{ fontSize: "0.9rem", color: "hsl(var(--muted-foreground))" }}>No hay menús configurados.</span>) : (menus.map((m) => (<label key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}><input type="checkbox" checked={selectedMenuIds.includes(m.id)} onChange={(e) => { if (e.target.checked) setSelectedMenuIds([...selectedMenuIds, m.id]); else setSelectedMenuIds(selectedMenuIds.filter((id) => id !== m.id)); }} /><div><span style={{ fontWeight: 500 }}>{m.label}</span><span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginLeft: "0.5rem" }}>({m.code})</span></div></label>)))}
          </div>
          <div className="modal-footer" style={{ marginTop: "1.5rem", padding: 0, border: "none" }}><button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancelar</button><button type="submit" className="btn btn-primary" disabled={creating}>{creating ? "Creando..." : "Crear Rol"}</button></div>
        </form></div></div>)}
      {showEdit && (<div className="modal-backdrop" onClick={() => setShowEdit(false)}><div className="modal animate-fade-in" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>Editar Rol</h3><button onClick={() => setShowEdit(false)} className="btn-close"><X size={18} /></button></div>
        <form onSubmit={handleUpdate} className="modal-body form-group">
          {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
          <label>Código único (Solo lectura)</label><input type="text" value={form.code} disabled style={{ opacity: 0.6 }} />
          <label>Nombre</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <label>Descripción</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <div className="modal-footer" style={{ marginTop: "1.5rem", padding: 0, border: "none" }}><button type="button" onClick={() => setShowEdit(false)} className="btn btn-secondary">Cancelar</button><button type="submit" className="btn btn-primary" disabled={creating}>{creating ? "Guardando..." : "Guardar Cambios"}</button></div>
        </form></div></div>)}
    </div>
  );
}

// --- TENANT FILES VIEW ---
function TenantFilesView() {
  const [filesList, setFilesList] = useState<any[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [visibility, setVisibility] = useState<"PRIVATE" | "TENANT" | "PUBLIC">("PRIVATE");
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => { setLoading(true); try { const res = await api.files.list({ page, limit: 10 }); setFilesList(res.data?.items || []); setTotalFiles(res.data?.totalItems || 0); } catch (err: any) { console.error("Error al listar archivos:", err); } finally { setLoading(false); } };
  useEffect(() => { fetchFiles(); }, [page]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); setUploadError(""); try { await api.files.upload(file, file.name, visibility); fetchFiles(); if (fileInputRef.current) fileInputRef.current.value = ""; } catch (err: any) { setUploadError(err.message || "Error al subir archivo."); } finally { setUploading(false); } };

  const handleDelete = async (id: string) => { if (!confirm("¿Estás seguro de que deseas eliminar este archivo?")) return; try { await api.files.delete(id); fetchFiles(); } catch (err: any) { alert(err.message || "Error al eliminar archivo."); } };

  const formatBytes = (bytes: number) => { if (bytes === 0) return "0 Bytes"; const k = 1024; const sizes = ["Bytes", "KB", "MB", "GB"]; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]; };

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div><h1 className="view-title">Almacenamiento de Archivos</h1><p className="view-subtitle">Gestiona y comparte archivos de forma segura con aislamiento completo.</p></div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <select className="settings-field-input" style={{ width: "auto", margin: 0 }} value={visibility} onChange={(e) => setVisibility(e.target.value as any)}><option value="PRIVATE">Privado (Solo Tú)</option><option value="TENANT">Tenant (Todo el Inquilino)</option><option value="PUBLIC">Público (Acceso Directo)</option></select>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><UploadCloud size={16} />{uploading ? "Subiendo..." : "Subir Archivo"}</button>
        </div>
      </div>
      {uploadError && (<div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>{uploadError}</div>)}
      {loading ? (<div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><div className="spinner" /></div>) : filesList.length === 0 ? (<div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--bg-surface)", borderRadius: "8px", border: "1px dashed var(--border-color)" }}><FolderOpen size={48} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} /><h3 style={{ marginBottom: "0.5rem" }}>No hay archivos almacenados</h3><p style={{ color: "var(--text-muted)", maxWidth: "400px", margin: "0 auto 1.5rem" }}>Sube documentos, imágenes o archivos ZIP.</p></div>) : (
        <div className="table-responsive"><table className="table"><thead><tr><th>Nombre Original</th><th>Tipo de Archivo</th><th>Tamaño</th><th>Visibilidad</th><th>Subido el</th><th style={{ textAlign: "right" }}>Acciones</th></tr></thead><tbody>{filesList.map((file) => (<tr key={file.id}><td><div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><FileCode2 size={18} style={{ color: "var(--text-muted)" }} /><span style={{ fontWeight: 500 }}>{file.originalName}</span></div></td><td><span className="badge badge-secondary">{file.mimeType}</span></td><td>{formatBytes(Number(file.sizeBytes))}</td><td><span className={`badge ${file.visibility === "PUBLIC" ? "badge-success" : file.visibility === "TENANT" ? "badge-info" : "badge-warning"}`}>{file.visibility}</span></td><td>{new Date(file.createdAt).toLocaleString()}</td><td style={{ textAlign: "right" }}><div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}><a href={file.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-icon-only" title="Descargar" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.25rem" }}><Download size={14} /></a><button onClick={() => handleDelete(file.id)} className="btn btn-danger btn-icon-only" title="Eliminar" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.25rem" }}><Trash2 size={14} /></button></div></td></tr>))}</tbody></table>
          {totalFiles > 10 && (<div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", gap: "0.5rem" }}><button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</button><button className="btn btn-secondary" disabled={page * 10 >= totalFiles} onClick={() => setPage((p) => p + 1)}>Siguiente</button></div>)}
        </div>
      )}
    </div>
  );
}

// --- TENANT LAYOUT ---
export default function TenantSection() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const menuItems = [
    { path: "/app/dashboard", label: "Dashboard", icon: <Activity size={18} /> },
    { path: "/app/users", label: "Usuarios", icon: <Users size={18} /> },
    { path: "/app/roles", label: "Roles", icon: <ShieldCheck size={18} /> },
    { path: "/app/files", label: "Archivos", icon: <FolderOpen size={18} /> },
    { path: "/app/settings", label: "Configuración", icon: <SlidersHorizontal size={18} /> },
  ];

  return (
    <div className="superadmin-layout-container">
      <div className="superadmin-body">
        {sidebarOpen && (<div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />)}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-brand"><div className="brand-icon">BF</div><span style={{ fontWeight: 800 }}>BaseForge</span></div>
          <nav className="sidebar-nav">{menuItems.map((item) => { const active = location.pathname.startsWith(item.path); return (<Link key={item.path} to={item.path} className={`sidebar-link ${active ? "active" : ""}`}>{item.icon}<span>{item.label}</span></Link>); })}</nav>
          <div className="sidebar-footer"><div className="user-info"><span className="user-email">{user?.email}</span><span className="user-badge">{user?.roles?.join(", ") || "Usuario"}</span></div><div style={{ display: "flex", gap: "0.5rem", width: "100%", marginTop: "1rem" }}><button onClick={() => setTheme((p) => (p === "dark" ? "light" : "dark"))} className="theme-toggle" style={{ width: "100%" }}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button><button onClick={() => { logout(); navigate("/"); }} className="btn btn-secondary btn-icon-only" title="Cerrar Sesión"><LogOut size={16} /></button></div></div>
        </aside>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <header className="topbar"><div className="topbar-left"><button onClick={() => setSidebarOpen(true)} className="sidebar-toggle" style={{ marginRight: "0.25rem" }} title="Abrir Menú"><Menu size={18} /></button><Breadcrumb /></div><div className="topbar-right"><NotificationCenter /><UserMenu /></div></header>
          <main className="workspace">
            <ErrorBoundary>
              <Routes>
                <Route path="dashboard" element={<TenantDashboardView />} />
                <Route path="users" element={<TenantUsersView />} />
                <Route path="roles" element={<TenantRolesView />} />
                <Route path="files" element={<TenantFilesView />} />
                <Route path="settings" element={<TenantSettingsView />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
