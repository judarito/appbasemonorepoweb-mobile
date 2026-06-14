export interface NotificationTemplate {
  code: string;
  title: string;
  body: string;
  channels: ("EMAIL" | "PUSH" | "IN_APP")[];
}

export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  USER_WELCOME: {
    code: "USER_WELCOME",
    title: "¡Bienvenido a BaseForge!",
    body: "Hola {{firstName}}, bienvenido a {{tenantName}}. Nos alegra tenerte en nuestro espacio de trabajo.",
    channels: ["IN_APP", "EMAIL"],
  },
  PASSWORD_CHANGED: {
    code: "PASSWORD_CHANGED",
    title: "Contraseña modificada",
    body: "Hola {{firstName}}, te confirmamos que la contraseña de tu cuenta ha sido modificada con éxito.",
    channels: ["IN_APP"],
  },
  TENANT_SUSPENDED: {
    code: "TENANT_SUSPENDED",
    title: "Espacio de trabajo suspendido",
    body: "El espacio de trabajo {{tenantName}} ha sido suspendido temporalmente. Por favor, comunícate con soporte.",
    channels: ["IN_APP", "EMAIL"],
  },
};

export function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  }
  return result;
}
