import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export function UserMenu() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
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
