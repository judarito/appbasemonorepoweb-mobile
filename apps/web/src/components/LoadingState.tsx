interface LoadingStateProps {
  /** Mensaje opcional */
  message?: string;
  /** Tamaño del spinner */
  size?: "sm" | "md" | "lg";
}

/**
 * LoadingState — Estado de carga con spinner animado.
 */
export function LoadingState({ message = "Cargando...", size = "md" }: LoadingStateProps) {
  const sizeMap = { sm: 20, md: 32, lg: 48 };
  const px = sizeMap[size];
  return (
    <div className="loading-state">
      <div
        className="loading-spinner"
        style={{ width: px, height: px, borderWidth: size === "lg" ? 4 : 3 }}
      />
      {message && <span>{message}</span>}
    </div>
  );
}
