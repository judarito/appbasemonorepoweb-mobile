import React from "react";
import { useNavigate } from "react-router-dom";
import {
  HomeIcon, RotateCw, LogOut, RefreshCw, Lock,
  Ban, SearchX, ServerCrash,
} from "lucide-react";

export function NotFoundPage() {
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

export function ForbiddenPage() {
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

export function UnauthorizedPage() {
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

export function ServerErrorPage() {
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
