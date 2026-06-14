import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellDot, CheckCircle, X } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";

export function NotificationCenter() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
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

  const loadNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.get<{ items: any[] }>("/notifications");
      setNotifications(data.items || []);
      setUnreadCount((data.items || []).filter((n: any) => !n.readAt).length);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      loadNotifications();
    } catch { /* silencioso */ }
  };

  return (
    <div className="dropdown-container" ref={ref}>
      <button
        className="topbar-btn"
        onClick={() => { setOpen(!open); if (!open) loadNotifications(); }}
        title="Notificaciones"
        aria-label="Abrir notificaciones"
      >
        {unreadCount > 0 ? <BellDot size={18} /> : <Bell size={18} />}
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notifications-panel animate-fade-in">
          <div className="notifications-header">
            <h4>Notificaciones</h4>
            <button onClick={() => setOpen(false)} className="btn-close"><X size={16} /></button>
          </div>
          <div className="notifications-list">
            {loading && notifications.length === 0 ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "hsl(var(--muted-foreground))" }}>
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "hsl(var(--muted-foreground))" }}>
                No hay notificaciones.
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.readAt ? "unread" : ""}`}
                  onClick={() => handleMarkRead(n.id)}
                >
                  <div className="notification-content">
                    <p>{n.title}</p>
                    {n.body && <span className="notification-body">{n.body}</span>}
                    <span className="notification-time">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {!n.readAt && <CheckCircle size={14} className="notification-read-icon" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
