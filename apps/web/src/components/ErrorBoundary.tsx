import React from "react";
import { AlertOctagon, RotateCw, HomeIcon } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
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
