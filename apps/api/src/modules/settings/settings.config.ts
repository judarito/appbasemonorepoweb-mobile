export interface SettingDefinition {
  key: string;
  groupName: string;
  valueType: "STRING" | "NUMBER" | "BOOLEAN" | "JSON" | "SECRET_REFERENCE";
  isPublic: boolean;
  defaultValue: any;
  description: string;
}

export const SETTINGS_CATALOG: SettingDefinition[] = [
  // general
  {
    key: "general.app_name",
    groupName: "general",
    valueType: "STRING",
    isPublic: true,
    defaultValue: "BaseForge Demo",
    description: "Nombre visible de la aplicación."
  },
  {
    key: "general.company_name",
    groupName: "general",
    valueType: "STRING",
    isPublic: true,
    defaultValue: "BaseForge Demo S.A.S.",
    description: "Nombre de la organización."
  },
  // branding
  {
    key: "branding.primary_color",
    groupName: "branding",
    valueType: "STRING",
    isPublic: true,
    defaultValue: "#2563EB",
    description: "Color principal."
  },
  {
    key: "branding.logo_url",
    groupName: "branding",
    valueType: "STRING",
    isPublic: true,
    defaultValue: null,
    description: "URL del logo."
  },
  // localization
  {
    key: "localization.country",
    groupName: "localization",
    valueType: "STRING",
    isPublic: true,
    defaultValue: "CO",
    description: "Código de país."
  },
  {
    key: "localization.locale",
    groupName: "localization",
    valueType: "STRING",
    isPublic: true,
    defaultValue: "es-CO",
    description: "Locale principal."
  },
  {
    key: "localization.timezone",
    groupName: "localization",
    valueType: "STRING",
    isPublic: true,
    defaultValue: "America/Bogota",
    description: "Zona horaria."
  },
  {
    key: "localization.currency",
    groupName: "localization",
    valueType: "STRING",
    isPublic: true,
    defaultValue: "COP",
    description: "Moneda principal."
  },
  {
    key: "localization.date_format",
    groupName: "localization",
    valueType: "STRING",
    isPublic: true,
    defaultValue: "DD/MM/YYYY",
    description: "Formato visual de fecha."
  },
  // notifications
  {
    key: "notifications.email.enabled",
    groupName: "notifications",
    valueType: "BOOLEAN",
    isPublic: false,
    defaultValue: false,
    description: "Habilita notificaciones por correo."
  },
  {
    key: "notifications.in_app.enabled",
    groupName: "notifications",
    valueType: "BOOLEAN",
    isPublic: true,
    defaultValue: true,
    description: "Habilita notificaciones internas."
  },
  // security
  {
    key: "security.password_expiration_days",
    groupName: "security",
    valueType: "NUMBER",
    isPublic: false,
    defaultValue: 90,
    description: "Días de vigencia de contraseña."
  },
  {
    key: "security.max_login_attempts",
    groupName: "security",
    valueType: "NUMBER",
    isPublic: false,
    defaultValue: 5,
    description: "Intentos fallidos antes de bloqueo."
  },
  {
    key: "security.lockout_minutes",
    groupName: "security",
    valueType: "NUMBER",
    isPublic: false,
    defaultValue: 15,
    description: "Duración del bloqueo temporal."
  },
  // email (secrets references)
  {
    key: "email.smtp_host",
    groupName: "email",
    valueType: "STRING",
    isPublic: false,
    defaultValue: "smtp.mailtrap.io",
    description: "Host del servidor SMTP."
  },
  {
    key: "email.smtp_port",
    groupName: "email",
    valueType: "NUMBER",
    isPublic: false,
    defaultValue: 2525,
    description: "Puerto del servidor SMTP."
  },
  {
    key: "email.smtp_user",
    groupName: "email",
    valueType: "STRING",
    isPublic: false,
    defaultValue: "",
    description: "Usuario del servidor SMTP."
  },
  {
    key: "email.smtp_password",
    groupName: "email",
    valueType: "SECRET_REFERENCE",
    isPublic: false,
    defaultValue: null,
    description: "Contraseña del servidor SMTP."
  },
  // mobile
  {
    key: "mobile.enabled",
    groupName: "mobile",
    valueType: "BOOLEAN",
    isPublic: true,
    defaultValue: true,
    description: "Habilita la experiencia mobile."
  },
  // integrations
  {
    key: "integrations.google_analytics_id",
    groupName: "integrations",
    valueType: "STRING",
    isPublic: true,
    defaultValue: "",
    description: "Google Analytics Tracking ID."
  },
  {
    key: "integrations.stripe_webhook_secret",
    groupName: "integrations",
    valueType: "SECRET_REFERENCE",
    isPublic: false,
    defaultValue: null,
    description: "Secreto de webhook de Stripe."
  }
];

export function getSettingDefinition(key: string): SettingDefinition | undefined {
  return SETTINGS_CATALOG.find((s) => s.key === key);
}
