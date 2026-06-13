import { pgSchema, text, varchar, timestamp, boolean, integer, jsonb, uuid, primaryKey, decimal, char } from "drizzle-orm/pg-core";


export const appSchema = pgSchema("app");

// 1. USUARIOS DE PLATAFORMA
export const platformUsers = appSchema.table("platform_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 200 }),
  phone: varchar("phone", { length: 40 }),
  status: varchar("status", { length: 30 }).notNull().default("ACTIVE"),
  locale: varchar("locale", { length: 20 }).notNull().default("es-CO"),
  timezone: varchar("timezone", { length: 100 }).notNull().default("America/Bogota"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }).notNull().defaultNow(),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  tokenVersion: integer("token_version").notNull().default(1),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// 2. TENANTS
export const tenants = appSchema.table("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  slug: text("slug").notNull(),
  legalName: varchar("legal_name", { length: 250 }),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  taxId: varchar("tax_id", { length: 60 }),
  countryCode: varchar("country_code", { length: 2 }).notNull().default("CO"),
  currencyCode: varchar("currency_code", { length: 3 }).notNull().default("COP"),
  timezone: varchar("timezone", { length: 100 }).notNull().default("America/Bogota"),
  locale: varchar("locale", { length: 20 }).notNull().default("es-CO"),
  status: varchar("status", { length: 30 }).notNull().default("ACTIVE"),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 20 }),
  supportEmail: text("support_email"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// 3. MEMBRESÍAS TENANT-USUARIO
export const tenantUsers = appSchema.table("tenant_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => platformUsers.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 30 }).notNull().default("ACTIVE"),
  isOwner: boolean("is_owner").notNull().default(false),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  lastAccessAt: timestamp("last_access_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// 4. PERMISOS
export const permissions = appSchema.table("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  scope: varchar("scope", { length: 20 }).notNull().default("TENANT"),
  isSystem: boolean("is_system").notNull().default(true),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 5. ROLES
export const roles = appSchema.table("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  scope: varchar("scope", { length: 20 }).notNull().default("TENANT"),
  isSystem: boolean("is_system").notNull().default(false),
  isDefault: boolean("is_default").notNull().default(false),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// 6. ROL-PERMISOS
export const rolePermissions = appSchema.table("role_permissions", {
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
}));

// 7. ROLES POR USUARIO
export const userRoles = appSchema.table("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => platformUsers.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

// 8. SESIONES DE USUARIO
export const userSessions = appSchema.table("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => platformUsers.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  accessChannel: varchar("access_channel", { length: 20 }).notNull().default("WEB"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceName: varchar("device_name", { length: 200 }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokeReason: varchar("revoke_reason", { length: 250 }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 9. REFRESH TOKENS
export const refreshTokens = appSchema.table("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => userSessions.id, { onDelete: "cascade" }),
  familyId: uuid("family_id").notNull().defaultRandom(),
  parentTokenId: uuid("parent_token_id"), // Autoreferencia simple
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  reuseDetectedAt: timestamp("reuse_detected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 10. MENÚS DINÁMICOS
export const menus = appSchema.table("menus", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id").references((): any => menus.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  label: varchar("label", { length: 150 }).notNull(),
  description: text("description"),
  route: varchar("route", { length: 300 }),
  icon: varchar("icon", { length: 100 }),
  sortOrder: integer("sort_order").notNull().default(0),
  platform: varchar("platform", { length: 20 }).notNull().default("BOTH"),
  requiredPermissionId: uuid("required_permission_id").references(() => permissions.id, { onDelete: "set null" }),
  requiredFeatureCode: text("required_feature_code"),
  isVisible: boolean("is_visible").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// 11. MENÚS POR ROL
export const roleMenus = appSchema.table("role_menus", {
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  menuId: uuid("menu_id").notNull().references(() => menus.id, { onDelete: "cascade" }),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.menuId] }),
}));

// 12. PLANES
export const plans = appSchema.table("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  billingCycle: varchar("billing_cycle", { length: 20 }).notNull().default("MONTHLY"),
  price: decimal("price", { precision: 14, scale: 2 }).notNull().default("0"),
  currencyCode: char("currency_code", { length: 3 }).notNull().default("COP"),
  trialDays: integer("trial_days").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// 13. CARACTERÍSTICAS (FEATURES)
export const features = appSchema.table("features", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  valueType: varchar("value_type", { length: 20 }).notNull().default("BOOLEAN"),
  defaultValue: jsonb("default_value"),
  isSystem: boolean("is_system").notNull().default(true),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 14. CARACTERÍSTICAS POR INQUILINO (TENANT FEATURES)
export const tenantFeatures = appSchema.table("tenant_features", {
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  featureId: uuid("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  value: jsonb("value"),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.tenantId, t.featureId] }),
}));


