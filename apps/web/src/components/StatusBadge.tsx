interface StatusBadgeProps {
  /** Valor del estado */
  status: string;
  /** Mapa de estados a variantes visuales */
  variant?: Record<string, "success" | "danger" | "warning" | "info" | "muted">;
  /** Variante personalizada (opcional, sobreescribe el mapa) */
  color?: "success" | "danger" | "warning" | "info" | "muted";
}

const defaultVariants: Record<string, "success" | "danger" | "warning" | "info" | "muted"> = {
  ACTIVE: "success",
  INACTIVE: "danger",
  SUSPENDED: "warning",
  PENDING: "warning",
  DELETED: "danger",
  SUCCESS: "success",
  FAILURE: "danger",
  DENIED: "warning",
  TRIALING: "info",
  PAST_DUE: "warning",
  GRACE_PERIOD: "info",
  CANCELED: "muted",
  EXPIRED: "danger",
};

const variantClass: Record<string, string> = {
  success: "badge badge-success",
  danger: "badge badge-danger",
  warning: "badge badge-warning",
  info: "badge badge-info",
  muted: "badge badge-muted",
};

/**
 * StatusBadge — Badge visual para mostrar estados.
 * Colorea automáticamente según un mapa de variantes predefinido.
 */
export function StatusBadge({ status, variant, color }: StatusBadgeProps) {
  const resolvedColor = color || variant?.[status] || defaultVariants[status] || "muted";
  const className = variantClass[resolvedColor] || variantClass.muted;
  return <span className={className}>{status}</span>;
}
