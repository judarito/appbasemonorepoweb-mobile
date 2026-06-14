export interface MenuItem {
  label: string;
  route: string;
  emoji: string;
  rolesRequired?: string[];
}

export const MENU_ITEMS: MenuItem[] = [
  {
    label: "Dashboard",
    route: "dashboard",
    emoji: "▤",
  },
  {
    label: "Usuarios",
    route: "users", // En el futuro esta ruta se desarrollará
    emoji: "👥",
    rolesRequired: ["SUPER_ADMIN", "TENANT_ADMIN"],
  },
  {
    label: "Roles",
    route: "roles", // En el futuro esta ruta se desarrollará
    emoji: "🛡️",
    rolesRequired: ["SUPER_ADMIN", "TENANT_ADMIN"],
  },
  {
    label: "Perfil",
    route: "profile",
    emoji: "👤",
  },
];
