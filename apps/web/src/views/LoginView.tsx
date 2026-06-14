import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";

const MIN_PASSWORD_LENGTH = 8;

interface LocationState {
  from?: { pathname: string };
}

export default function LoginView() {
  const { login, token, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const from = (location.state as LocationState | undefined)?.from?.pathname || "/superadmin/dashboard";

  useEffect(() => {
    if (!token || !user) return;
    if (user.roles.includes("SUPER_ADMIN")) {
      navigate(from, { replace: true });
    } else {
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
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="superadmin@baseforge.local" required />
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" required />
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
            {loading ? "Iniciando Sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link to="/forgot-password" style={{ color: "var(--primary-color, #2563eb)", fontSize: "0.875rem", textDecoration: "none" }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSuccessMsg("Si la dirección de correo existe, se ha enviado un enlace de recuperación de contraseña.");
    } catch (err: any) {
      setErrorMsg(err.message || "Ocurrió un error al procesar tu solicitud.");
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
        <h2 style={{ textAlign: "center", marginBottom: "1rem", fontWeight: 700 }}>Recuperar Contraseña</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted, #64748b)", fontSize: "0.875rem", marginBottom: "2rem" }}>
          Ingresa tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        {errorMsg && (<div className="alert alert-error" style={{ marginBottom: "1.5rem" }}><AlertTriangle size={16} /><span>{errorMsg}</span></div>)}
        {successMsg && (<div className="alert alert-success" style={{ marginBottom: "1.5rem", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}><CheckCircle size={16} /><span>{successMsg}</span></div>)}
        {!successMsg && (
          <form onSubmit={handleSubmit} className="form-group">
            <label>Correo Electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ejemplo.com" required />
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
              {loading ? "Enviando enlace..." : "Enviar Enlace de Recuperación"}
            </button>
          </form>
        )}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link to="/login" style={{ color: "var(--primary-color, #2563eb)", fontSize: "0.875rem", textDecoration: "none" }}>Volver a Iniciar Sesión</Link>
        </div>
      </div>
    </div>
  );
}

export function ResetPasswordView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    if (password.length < MIN_PASSWORD_LENGTH) { setErrorMsg(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`); setLoading(false); return; }
    if (password !== confirmPassword) { setErrorMsg("Las contraseñas no coinciden."); setLoading(false); return; }
    if (!token) { setErrorMsg("Token de recuperación no válido o ausente."); setLoading(false); return; }
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccessMsg("¡Contraseña restablecida con éxito!");
      setTimeout(() => { navigate("/login"); }, 3000);
    } catch (err: any) { setErrorMsg(err.message || "Ocurrió un error al restablecer tu contraseña."); }
    finally { setLoading(false); }
  };

  return (
    <div className="app-container login-page">
      <div className="glow-bg"></div>
      <div className="login-card animate-fade-in">
        <div className="brand" style={{ justifyContent: "center", marginBottom: "1.5rem" }}>
          <div className="brand-icon">BF</div>
          <span>BaseForge SaaS</span>
        </div>
        <h2 style={{ textAlign: "center", marginBottom: "1rem", fontWeight: 700 }}>Nueva Contraseña</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted, #64748b)", fontSize: "0.875rem", marginBottom: "2rem" }}>
          Ingresa y confirma tu nueva contraseña de acceso.
        </p>
        {errorMsg && (<div className="alert alert-error" style={{ marginBottom: "1.5rem" }}><AlertTriangle size={16} /><span>{errorMsg}</span></div>)}
        {successMsg && (<div className="alert alert-success" style={{ marginBottom: "1.5rem", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}><CheckCircle size={16} /><span>{successMsg} Redirigiendo al inicio de sesión...</span></div>)}
        {!successMsg && (
          <form onSubmit={handleSubmit} className="form-group">
            <label>Nueva Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required />
            <label>Confirmar Contraseña</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar contraseña" required />
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
              {loading ? "Restableciendo contraseña..." : "Restablecer Contraseña"}
            </button>
          </form>
        )}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link to="/login" style={{ color: "var(--primary-color, #2563eb)", fontSize: "0.875rem", textDecoration: "none" }}>Volver a Iniciar Sesión</Link>
        </div>
      </div>
    </div>
  );
}
